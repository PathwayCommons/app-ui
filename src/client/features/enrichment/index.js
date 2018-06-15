const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
//const Loader = require('react-loader');
//const queryString = require('query-string');

// const hideTooltips = require('../../common/cy/events/click').hideTooltips;
// const removeStyle= require('../../common/cy/manage-style').removeStyle;
// const make_cytoscape = require('../../common/cy/');
// const interactionsStylesheet= require('../../common/cy/interactions-stylesheet');
const { BaseNetworkView } = require('../../common/components');
//const { getLayoutConfig } = require('../../common/cy/layout');
//const downloadTypes = require('../../common/config').downloadTypes;

const enrichmentConfig={
  //extablish toolbar and declare features to not include
  toolbarButtons: _.differenceBy(BaseNetworkView.config.toolbarButtons,[{'id': 'expandCollapse'}, {'id': 'showInfo'}],'id'),
  menus: BaseNetworkView.config.menus,
  //allow for searching of nodes
  useSearchBar: true
};

//store data from input and validation service as a map
function storeDataAsMap(parsedQuery, unrecognizedRawData, duplicateRawData)
{
  //record all duplicate values in an array
  //use foreach to access values from unknown property names
  let duplicateTokens = [];
  Object.keys(duplicateRawData).forEach((key)=> duplicateTokens = _.concat(duplicateTokens, duplicateRawData[key]));

  //store data in map 'validationData': all values are arrays []
  let validationData = new Map([ ['allTokens', parsedQuery.genes.map(a => a.toUpperCase())],['unrecognizedTokens',unrecognizedRawData], ['duplicateTokens',duplicateTokens], ['invalidTokens', unrecognizedRawData.concat(duplicateTokens)] ]);
  validationData.set('validTokens', _.difference(validationData.get('allTokens') , validationData.get('invalidTokens')));

  return validationData;
}

//if all tokens valid, call analysis API
//else, call to update the text in the input box to reflect invalid tokens
function checkIfValidInput(validationData)
{
  if(validationData.get('invalidTokens').length == 0 ) // all tokens valid
  {
    alert("Thank you for your input. ***Service will continue to analysis***"); //just for trouble shooting purposes
    // ServerAPI.enrichmentAPI(parsedQuery, 'analysis');
  }
  else updateInputStatus(validationData); //some tokens invalid
}

//provide user feedback after gene submission
function updateInputStatus(validationData)
{
  //transform arrays to strings for user feedback
  let duplicateTokens = (validationData.get("duplicateTokens")).join('<br/>'); //string
  let unrecognizedTokens = (validationData.get("unrecognizedTokens")).join('<br/>'); //string
  let validTokens = validationData.get("validTokens").join('<br/>'); //string

  //update contents of input box
  //span styled to identify invalid tokens with red font and underline
  let userFeedback = "";
  validationData.get('allTokens').forEach(function(element) {
    if( _.includes(validationData.get('invalidTokens'), element)) userFeedback += '<span>' + element + '</span> <br/>';
    else userFeedback += element + '<br/>';
  });
  document.getElementById('gene-input-box').innerHTML = userFeedback;
}


class Enrichment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      componentConfig: enrichmentConfig,
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },
      query: '',
      titleContainer: [],
    };
  }

  //update 'query' with text from input box
  handleChange(e) {
    this.setState( {query: document.getElementById('gene-input-box').innerText});
  }

  //parse and clean up user gene query
  //removes lexical duplicates, empty elements, leading and trailing spaces
  parseQuery(query){
    let geneList = query.split(/\n/g); //create array of genes
    geneList = _.uniq(geneList); //remove lexical duplicates
    geneList = geneList.map(a => a.trim()); //remove leading and trailing spaces
    const parsedQuery = {genes: _.pull(geneList,"")}; //set query to object form and remove blank elements
    this.retrieveValidationAPIResult(parsedQuery);
  }

  //call enrichmentAPI validation service and store results in a map
  //pass map to check if input is valid
  retrieveValidationAPIResult(parsedQuery)
  {
    //pass object of genes to validation service
    ServerAPI.enrichmentAPI(parsedQuery, "validation").then(function(result) {
      const duplicateRawData = result.duplicate; //object
      const unrecognizedRawData = result.unrecognized; //array
      let validationData = storeDataAsMap(parsedQuery, unrecognizedRawData, duplicateRawData);
      checkIfValidInput(validationData);
    });
  }


  render() {
    const state = this.state;
    const baseView = h(BaseNetworkView.component, {
      componentConfig: state.componentConfig,
      //titles at top of toolbar
      networkMetadata: {},
      titleContainer: [
        h('h4', [
          h('span', 'Pathway Enrichment   '),]),
          h('img', {
            src: '/img/humanIcon.png'
            }),
          h('div.gene-input-container', [
            h('div.gene-input-box', {
             placeholder: 'Enter one gene per line',
             contentEditable: true,
             id: 'gene-input-box',
             onInput: e => this.handleChange(e)
            })
          ]),
          h('submit-container', {
            onClick: () => {
              this.parseQuery(this.state.query);
            }},
          [
          h('button.submit', 'Submit'),
          ])
      ]
    });
    return h('div.main', [baseView]);
  }
}
module.exports = Enrichment;

//NOTE: CURRENTLY ONLY RENDERS ON PAGE WHEN base-network-view.js function 'componentDidMount(){}'
//      IS COMMENTED OUT