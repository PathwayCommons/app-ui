const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { ServerAPI } = require('../../services/');


class TokenInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      tokenData: new Map()
    };
  }

  //called onClick 'submit'
  //seperate div text input into an array, remove all elements that have already been validated
  //this method will be altered later depending on the type/format of the final input box (slate or some other library)
  parseTokenList() {
    let tokenList = this.state.query.split(/\s/g);
    //parse tokenList to remove all elements that have already been processed and logged to map 'tokenData'
    this.state.tokenData.forEach( (value, key) => {
      if (tokenList.includes(key)) tokenList = _.pull(tokenList, key);
    });
    //send only new tokens to validation
    this.retrieveValidationAPIResult(tokenList);
  }

  //call validation service API to retrieve unrecognized tokens as an array
  retrieveValidationAPIResult(tokensToValidate){
    ServerAPI.enrichmentAPI({genes: _.pull(tokensToValidate,"")}, "validation").then((result) => {
      //call checkIfValidInput to determine individual token validity
      this.checkIfValidInput(tokensToValidate, result.unrecognized);
      });
  }

  //store input tokens in state map 'tokenData' with values 'true' for valid or 'false' for invalid
  checkIfValidInput(tokensToValidate, unrecognizedTokens)
  {
    tokensToValidate.forEach((element) => {
      if( unrecognizedTokens.includes(element.toUpperCase()) ) this.state.tokenData.set(element, false);
      else this.state.tokenData.set(element, true);
    });
    //display invalid tokens in 'invalid-token' div
    this.updateInvalidStatus();
    //console.log(this.state.tokenData);
  }

  //display all invalid tokens in div.invalid-tokens
  //the mechanism for providing userFeedback will be iterated upon in the future
  //ideally, tokens will be marked in the input box
  updateInvalidStatus()
  {
    let displayStatus = "Invalid Tokens:<br/>";
    this.state.tokenData.forEach((value, key) => {
      if (value == false) displayStatus += key +"<br/>";
    });
    document.getElementById('invalid-tokens').innerHTML = "";
    document.getElementById('invalid-tokens').innerHTML += displayStatus;
  }

  //called onInput in 'gene-input-box'
  //dynamically update 'tokenData' map to remove any keys that are no longer present in the token list
  //display these changes in 'invalid-tokens' div
  handleChange() {
    this.state.query = document.getElementById('gene-input-box').innerText;
    this.state.tokenData.forEach( (value, key, mapObj) => {
      if (this.state.query.includes(key) == false ) mapObj.delete(key);
      this.updateInvalidStatus();
    });
  }


 render() {

  return (
    //titleContainer: [
      [h('h4', [
        h('span', 'Pathway Enrichment   '),]),
      h('img', {
        src: '/img/humanIcon.png'
        }),
      h('div.gene-input-container', [
        h('div.gene-input-box', {
           placeholder: 'Enter one gene per line',
           contentEditable: true,
           id: 'gene-input-box',
           onInput: () => this.handleChange(),
        })
      ]),
      h('submit-container', {
        onClick: () => {this.parseTokenList(); } },
        [h('button.submit', 'Submit'),]
      )]
  );}


 }
 class InvalidTokenFeedback extends React.Component {
  render(){
    return(
       h('div.invalid-token-container', {
        id: 'invalid-tokens'
       })
    );
  }
}


module.exports = {TokenInput: TokenInput, InvalidTokenFeedback: InvalidTokenFeedback};



