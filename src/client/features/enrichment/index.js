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

//extract important data from validation output
//provide user feedback after gene submission
function validationFeedBack(parsedQuery, unrecognizedRawData, duplicateRawData)
{
  // all tokens recognized
  if(_.isEmpty(duplicateRawData) && unrecognizedRawData.length == 0 )
  {
    alert("Thank you for your input. ***Service will continue to analysis***");

    // ServerAPI.enrichmentAPI(parsedQuery, 'analysis');
    // console.log(ServerAPI.enrichmentAPI(parsedQuery, 'validation'));
    // console.log(ServerAPI.enrichmentAPI(parsedQuery, 'analysis'));

    return;
  }

  //record the first instance of a duplicate term as an array
  //loop through object to access values from unknown property names
  let duplicateTerms = [];
  for (let i = 0; i < _.keys(duplicateRawData).length; i++ )
      {
        let propertyName = _.keys(duplicateRawData)[i];
        let duplicateVal = duplicateRawData[propertyName];
        duplicateTerms.push(duplicateVal[0]);
      }

  //store data in map 'validationData': parsed query, unrecognized tokens, first instance of duplicate tokens, array of all invalid terms
  let validationData = new Map([ [1, parsedQuery.genes],[2,unrecognizedRawData], [3,duplicateTerms], [4, unrecognizedRawData.concat(duplicateTerms)] ]);

  //return input with userfeedback
  let duplicateTokens = (validationData.get(3)).join('<br/>'); //string
  let unrecognizedTokens = (validationData.get(2)).join('<br/>'); //string

  //process so valid tokens match style of 'duplicateTokens' and 'unrecognizedTokens' results
  let validTokensArray = (validationData.get(1).map(a => a.toUpperCase()));  //array
  validTokensArray = _.difference(validTokensArray , validationData.get(4));
  let validTokensString = validTokensArray.join('<br/>'); //string

  //update contents of input box
  //span styled to identify invalid tokens with red font and underline
  document.getElementById('gene-input-box').innerHTML = '<span>' +unrecognizedTokens + '</span> <br/> <span>' + duplicateTokens + '</span> <br/>' + validTokensString;
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

  //parse gene input and send to validation service onClick 'submit'
  //recieves raw data from service and sends data to validationFeedBack
  parseQuery(query){
    //string to array
    let geneInput = query.split(/\n/g);
    //remove duplicates of same string
    geneInput = _.uniq(geneInput);

    //put array of genes in object format for validation service
    const parsedQuery = {genes: _.pull(geneInput,"")};

    //pass object of genes to validation service
    ServerAPI.enrichmentAPI(parsedQuery, "validation").then(function(result) {

      const duplicateRawData = result.duplicate; //object
      //const geneInfo = result.geneInfo; //array of objects
      const unrecognizedRawData = result.unrecognized; //array
      console.log(unrecognizedRawData);
      //call function to provide user feedback
      validationFeedBack(parsedQuery, unrecognizedRawData, duplicateRawData);
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
            //  placeholder: 'Enter one gene per line',
             contentEditable: true,
             id: 'gene-input-box',
             onInput: e => this.handleChange(e)
            },
          )]),
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