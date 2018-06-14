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

//process data from validation API service
//if all valid, call analysis API
//else, call to provide UI user feedback
function checkIfValidInput(parsedQuery, unrecognizedRawData, duplicateRawData)
{
  if(_.isEmpty(duplicateRawData) && unrecognizedRawData.length == 0 ) // all tokens valid
  {
    alert("Thank you for your input. ***Service will continue to analysis***");
    // ServerAPI.enrichmentAPI(parsedQuery, 'analysis');
  }
  else provideUIFeedback(parsedQuery, unrecognizedRawData, duplicateRawData); //some tokens invalid
}

//store data from input and validation service as a map
function storeDataAsMap(parsedQuery, unrecognizedRawData, duplicateRawData)
{
  //record the first instance of a duplicate term in an array
  //loop through object to access values from unknown property names
  let duplicateTerms = [];
  for (let i = 0; i < _.keys(duplicateRawData).length; i++ )
      {
        let propertyName = _.keys(duplicateRawData)[i]; //find unknown property name
        let duplicateVal = duplicateRawData[propertyName]; //use name to find the value array
        duplicateTerms.push(duplicateVal[0]); //record first occurance of the duplicate
      }

  //store data in map 'validationData': all values are arrays []
  let validationData = new Map([ ['allInputGenes', parsedQuery.genes.map(a => a.toUpperCase())],['unrecognizedGenes',unrecognizedRawData], ['duplicateGenes',duplicateTerms], ['invalidGenes', unrecognizedRawData.concat(duplicateTerms)] ]);
  let allValid = _.difference(validationData.get('allInputGenes') , validationData.get('invalidGenes'));
  validationData.set('validGenes', allValid);

  return validationData;
}

//extract important data from validation output
//provide user feedback after gene submission
function provideUIFeedback(parsedQuery, unrecognizedRawData, duplicateRawData)
{
  let validationData = storeDataAsMap(parsedQuery, unrecognizedRawData, duplicateRawData);

  //transform arrays to strings for user feedback
  let duplicateTokens = (validationData.get("duplicateGenes")).join('<br/>'); //string
  let unrecognizedTokens = (validationData.get("unrecognizedGenes")).join('<br/>'); //string
  let validTokens = validationData.get("validGenes").join('<br/>'); //string

  //update contents of input box
  //span styled to identify unrecognized tokens with red font and duplicates with blue font, both are underlined
  let userFeedback = "";
  if(duplicateTokens == "") userFeedback = '<span style="color:red">' + unrecognizedTokens + '</span> <br/>' + validTokens;
  else if(unrecognizedTokens == "") userFeedback = '<span style="color:blue">' + duplicateTokens + '</span> <br/>' + validTokens;
  else userFeedback = '<span style="color:red">' + unrecognizedTokens + '</span> <br/> <span style="color:blue">' + duplicateTokens + '</span> <br/>' + validTokens;
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

  //parse user gene query from string to object
  //remove string duplicates, empty elements, spaces
  parseQuery(query){
    let geneInput = query.split(/\n/g); //create array of genes
    geneInput = _.uniq(geneInput); //remove string duplicates
    geneInput = geneInput.map(a => a.trim()); //remove leading and trailing spaces
    const parsedQuery = {genes: _.pull(geneInput,"")}; //set query to object form and remove blank elements
    this.retrieveValidationAPIResult(parsedQuery);
  }

  //call enrichmentAPI validation service
  //record results
  retrieveValidationAPIResult(parsedQuery)
  {
    //pass object of genes to validation service
    ServerAPI.enrichmentAPI(parsedQuery, "validation").then(function(result) {
      const duplicateRawData = result.duplicate; //object
      const unrecognizedRawData = result.unrecognized; //array
      checkIfValidInput(parsedQuery, unrecognizedRawData, duplicateRawData);
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
             //placeholder: 'Enter one gene per line',
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