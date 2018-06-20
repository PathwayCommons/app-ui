//const React = require('react');
//const h = require('react-hyperscript');
const _ = require('lodash');
const { ServerAPI } = require('../../services/');


class TokenInput {

  constructor(state) {
    this.state = state;
  }

  //called onClick 'submit'
  //seperate div text input into an array, remove all elements that have already been validated
  //this method will be altered later depending on the type/format of the final input box (slate or some other library)
  parseTokenList() {
    this.state.query = document.getElementById('gene-input-box').innerText;
    let tokenList = this.state.query.split(/\n/g);
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
    this.state.tokenData.forEach( (value, key, mapObj) => {
      if (document.getElementById('gene-input-box').innerText.includes(key) == false ) mapObj.delete(key);
      this.updateInvalidStatus();
    });
  }

}

module.exports = TokenInput;



