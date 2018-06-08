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
  useSearchBar: true,
  //display custom title and input rather than default metadata (pathway and database names)
  useCustomTitleContainer: true
};

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
      titleContainer: []
    };
  }

  geneInputChange(e) {
    this.setState( {query: e.target.value});
  }

  geneInputSubmission(input){
    const geneArray = input.split(/\n/g);
    console.log(geneArray);
    const inputObject = {genes: _.pull(geneArray,"")};
    console.log(inputObject.genes);
    console.log(ServerAPI.geneQuery(inputObject));
    return inputObject.genes;
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
          h('textarea.gene-input', {
             placeholder: 'Enter one gene per line',
             onChange: e => this.geneInputChange(e),
             onKeyPress: e => this.geneInputChange(e)
          }),
          h('submit-container', {onClick: () => this.geneInputSubmission(this.state.query) },[
          h('button.submit', 'Submit'),
          ])
      ]
    });
    console.log(this.state.query);
    return h('div.main', [baseView]);
  }
}
module.exports = Enrichment;

//NOTE: CURRENTLY ONLY RENDERS ON PAGE WHEN base-network-view.js function 'componentDidMount(){}'
//      IS COMMENTED OUT