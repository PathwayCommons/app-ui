const React = require('react');
const h = require('react-hyperscript');
//const queryString = require('query-string');
const _ = require('lodash');
//const Loader = require('react-loader');

// const hideTooltips = require('../../common/cy/events/click').hideTooltips;
// const removeStyle= require('../../common/cy/manage-style').removeStyle;
// const make_cytoscape = require('../../common/cy/');
// const interactionsStylesheet= require('../../common/cy/interactions-stylesheet');
const { ServerAPI } = require('../../services/');
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

function validateInput(array, object)
{
  //recognized input
  if(_.isEmpty(object) && array.length == 0 ) alert("Thank you for your input. ***Service will continue to analysis");
  //unrec gene
  else if(array.length != 0 && _.isEmpty(object) == true)
  {
    let errorMes = "";
    for (let i = 0; i < array.length; i++)
    {
      errorMes += "\n" + array[i] + " is not a gene";
    }
    errorMes += "\nPlease fix your input and submit again";
    alert(errorMes);
    return errorMes;
  }
  //duplicate
  else if(_.isEmpty(object) == false && array.length == 0)
    {
      let errorMes = "";
      for (let i = 0; i < _.keys(object).length; i++ )
      {
        let propertyName = _.keys(object)[i];
        let duplicateVal = object[propertyName];
        errorMes += "\n" + duplicateVal[0] + " and " + duplicateVal[1] + " are duplicates ";
      }
      errorMes += "\nPlease fix your input and submit again";
      alert(errorMes);
      return errorMes;
    }
  //unrec and duplicate
  else
  {
    let errorMes = "";
    for (let i = 0; i < _.keys(object).length; i++ )
      {
        let propertyName = _.keys(object)[i];
        let duplicateVal = object[propertyName];
        errorMes += "\n" + duplicateVal[0] + " and " + duplicateVal[1] + " are duplicates ";
      }
    for (let i = 0; i < array.length; i++)
    {
      errorMes += "\n" + array[i] + " is not a gene";
    }
    errorMes += "\nPlease fix your input and submit again";
    alert(errorMes);
    return errorMes;
  }
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

  geneInputChange(e) {
    this.setState( {query: e.target.value});
  }

  geneInputSubmission(input){
    const geneArray = input.split(/\n/g);
    const inputObject = {genes: _.pull(geneArray,"")};
    console.log(inputObject.genes);

    ServerAPI.enrichmentAPI(inputObject, "validation").then(function(result) {
      //object
      let duplicate = result.duplicate;
      //array of objects
      let geneInfo = result.geneInfo;
      //array
      let unrecognized = result.unrecognized;
      console.log(unrecognized);
      console.log(duplicate);
      validateInput(unrecognized, duplicate);
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
            h('textarea.gene-input-box', {
             placeholder: 'Enter one gene per line',
             onChange: e => this.geneInputChange(e),
             onKeyPress: e => {
               this.geneInputChange(e);
             }
            })]),
          h('submit-container', {
            onClick: () => {
              this.geneInputSubmission(this.state.query);
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