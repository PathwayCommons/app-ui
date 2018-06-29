const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { ServerAPI } = require('../../services/');
let Textarea = require('react-textarea-autosize').default;


class TokenInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      tokenData: new Map(),
      query: '',
      validTokens: [],
      invalidTokens: []
    };
  }

  //log input for validation onSubmit
  //dynamic input editing, remove tokens from 'tokenData' and validity arrays 'validTokens' and 'invalidTokens' when token is altered or deleted from input box
  handleChange(e) {
    this.state.query = e.target.value;
    this.state.tokenData.forEach( (value, key, mapObj) => {
      if (e.target.value.includes(key) == false ) {
        this.updateValidityArrays(_.pull, key);
        mapObj.delete(key);
      }
    });
  }

  //called onClick 'submit'
  //seperate input into an array
  //send only new tokens to validation
  //****** NOTE: this method will be altered later depending on the type/format of the final input box (slate or some other library)
  parseTokenList() {
    let tokenList = this.state.query.split(/\s/g);
    this.state.tokenData.forEach( (value, key) => {
      if (tokenList.includes(key)) tokenList = _.pull(tokenList, key);
    });
    this.retrieveValidationAPIResult(tokenList);
  }

  //call validation service API to retrieve validation result in the form of []
  //****** NOTE: currently only checking for unrecognized tokens, not duplicates
  retrieveValidationAPIResult(tokensToValidate){
    ServerAPI.enrichmentAPI({genes: _.pull(tokensToValidate,"")}, "validation").then((result) => {
      this.updateMapWithNewTokens(tokensToValidate, result.unrecognized);
      });
  }

  //set new tokens in map 'tokenData' with values 'true' for valid or 'false' for invalid
  updateMapWithNewTokens(tokensToSet, unrecognizedTokens)
  {
    tokensToSet.forEach((element) => {
      if( unrecognizedTokens.includes(element.toUpperCase()) ) this.state.tokenData.set(element, false);
      else this.state.tokenData.set(element, true);
      this.updateValidityArrays(_.union, [element]);
    });
  }

  //store (action == _.union) and remove (action == _.pull) tokens in corresponding arrays, [invalidTokens] or [validTokens]
  updateValidityArrays(action, token)
  {
      if (this.state.tokenData.get(String(token)) == false) this.setState({invalidTokens: action(this.state.invalidTokens, token)});
      else {this.setState({validTokens: action(this.state.validTokens, token)});}
  }


  render() {
    //lift state to index.js /enrichment
    this.props.updateValidTokenList(this.state.validTokens);
    this.props.updateInvalidTokenList(this.state.invalidTokens);

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
          onClick: () => {this.parseTokenList();} },
          [h('button.submit', 'Submit')]
        ),
        h('div.invalid-token-container',[
          h(Textarea, {
            className:'invalid-tokens-feedback',
            value: "InvalidTokens: \n" + this.state.invalidTokens.join("\n"),
            readOnly: true,
            //if invalidTokens is its default value (ie no tokens have been added), feedback box not displayed
            style: {display: _.isEmpty(this.state.invalidTokens) ? 'none' : 'block' }
          })
        ])
    ]);
  }
}

module.exports = TokenInput;


