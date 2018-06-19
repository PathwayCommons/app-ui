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
      currentToken: '',
      currentLine: '',
      titleContainer: [],
      invalidTokenContainer: [],
      tokenData: new Map()
    };

  }
  //update 'tokenData' map to remove keys that are no longer in the token list (ie deleted or altered token)
  //display these changes in invalid gene box
  handleChange(e) {
    this.state.tokenData.forEach(function (value, key, mapObj) {
      if (document.getElementById('gene-input-box').innerText.includes(key) == false ) mapObj.delete(key);
    });
    //pass validation results and original token key
    if(document.getElementById('invalid-tokens').innerText != "")this.updateInvalidStatus();
  }

  //update 'currentLine' with every key press to track typed input
  //onkey 'enter' indicates end of token, so set 'currentLine' to 'currentToken'
  //add token to map and then validate token
  keyPress(e)
  {
    if(e.keyCode == 13 && this.state.currentLine != '')
    {
      this.state.currentToken = this.state.currentLine.replace("Enter", "");
      console.log(this.state.currentToken);
      //add token to map
      this.state.tokenData.set(this.state.currentToken, this.state.currentToken);
      this.retrieveValidationAPIResult(this.state.currentToken);
      //reset 'currentLine'
      this.state.currentLine = '';
    }
    //handle onKey 'delete'
    else if(e.keyCode == 8 ) this.state.currentLine = this.state.currentLine.slice(0,-1);
    //add other pressed keys to currentLine to track token input
    else this.state.currentLine += e.key;
  }

  //pass token key to validation services
  //remove all extra spaces
  //put token in object with property 'gene': []
  retrieveValidationAPIResult(tokenToValidate)
  {
    ServerAPI.enrichmentAPI({genes: [_.pull(tokenToValidate,"")]}, "validation").then((result) => {
    //pass validation results and original token key
    this.checkIfValidInput(tokenToValidate, result.unrecognized);
    });
  }

  //update map value for token to true if valid, false if invalid
  //updateInvalidStatus to update div with invalid token list
  checkIfValidInput(tokenOfInterest, unrecognizedTokens)
  {
    if(unrecognizedTokens.length == 0 ) this.state.tokenData.set(String(tokenOfInterest), true);
    else this.state.tokenData.set(String(tokenOfInterest), false);
    this.updateInvalidStatus();
    console.log(this.state.tokenData);
  }

  //provide dynamic user feedback
  //display all invalid tokens in div.invalid-tokens
  updateInvalidStatus()
  {
    let displayStatus = "Invalid Tokens:<br/>";
    this.state.tokenData.forEach(function (value, key, mapObj) {
      if (value == false) displayStatus += key +"<br/>";
    });
    document.getElementById('invalid-tokens').innerHTML = "";
    document.getElementById('invalid-tokens').innerHTML += displayStatus;
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
             onInput: e => this.handleChange(e),
             onKeyDown: e => this.keyPress(e),
            })
          ]),
      ],
      invalidTokenContainer:
        h('div.invalid-token-container', {
          id: 'invalid-tokens'
        })
    });
    return h('div.main', [baseView]);
  }
}
module.exports = Enrichment;

//NOTE: CURRENTLY ONLY RENDERS ON PAGE WHEN base-network-view.js function 'componentDidMount(){}'
//      IS COMMENTED OUT