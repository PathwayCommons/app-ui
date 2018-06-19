//const React = require('react');
//const h = require('react-hyperscript');
const _ = require('lodash');
//const Loader = require('react-loader');
//const queryString = require('query-string');


const { ServerAPI } = require('../../services/');
//const { BaseNetworkView } = require('../../common/components');


class TokenInput {

  constructor(state) {
    this.state = state;
  }


  //update 'tokenData' map to remove keys that are no longer in the token list (ie deleted or altered token)
  //display these changes in invalid gene box
  handleChange() {
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

}

module.exports = TokenInput;



