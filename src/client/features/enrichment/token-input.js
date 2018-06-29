const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { ServerAPI } = require('../../services/');
let Textarea = require('react-textarea-autosize').default;

class TokenInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      query: '',
      validTokens: [],
      unrecognizedTokens: []
    };
  }

  //store 'gene-input-box' contents on state
  handleChange(e) {
    this.state.query = e.target.value;
  }

  //call validation service API to retrieve validation result in the form of []
  retrieveValidationAPIResult(){
    //reset state values
    this.state.unrecognizedTokens = [];
    this.state.validTokens = [];
    let tokenList = this.state.query.split(/\s/g);
    //send all tokens to validationAPI
    ServerAPI.enrichmentAPI({genes: _.pull(tokenList,"")}, "validation").then((result) => {
      this.interpretValidationResult(tokenList, result.unrecognized);
      });
  }

  //store validation data on state as arrays [validTokens] and [unrecognizedTokens]
  //lift [validTokens] to parent file index.js
  interpretValidationResult(tokenList, unrecognizedTokens){
    tokenList.forEach((element) => {
      if (unrecognizedTokens.includes(element.toUpperCase()) ) this.setState({unrecognizedTokens: _.union(this.state.unrecognizedTokens, [element])});
      else {this.setState({validTokens: _.union(this.state.validTokens, [element])});}
    });
    this.props.updateValidTokenList(this.state.validTokens);
  }

  render() {

    return h('div.enrichmentInput', [
        h('h4', [
          h('span', 'Pathway Enrichment   ')
        ]),
        h('img', {
          src: '/img/humanIcon.png'
        }),
        h('div.gene-input-container', [
          h(Textarea, {
            className: 'gene-input-box',
            placeholder: 'Enter one gene per line',
            onChange: (e) => this.handleChange(e)
          })
        ]),
        h('submit-container', {
          onClick: () => { this.retrieveValidationAPIResult();} },
          [h('button.submit', 'Submit')]
        ),
        h('div.unrecognized-token-container',[
          h(Textarea, {
            className:'unrecognized-tokens-feedback',
            value: "Unrecognized Tokens: \n" + this.state.unrecognizedTokens.join("\n"),
            readOnly: true,
            //if unrecognizedTokens is its default value (ie no tokens have been added), feedback box not displayed
            style: {display: _.isEmpty(this.state.unrecognizedTokens) ? 'none' : 'block' }
          })
        ])
    ]);
  }
}

module.exports = TokenInput;


