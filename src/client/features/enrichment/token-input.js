const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { ServerAPI } = require('../../services/');
let Textarea = require('react-textarea-autosize').default;

class TokenInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      inputBoxContents: '',
      submittedTokens: [],
      unrecognizedTokens: []
    };
  }

  //store 'gene-input-box' contents on state
  handleChange(e) {
    this.state.inputBoxContents = e.target.value;
  }

  //call validation service API to retrieve validation result in the form of []
  retrieveValidationAPIResult(){
    let tokenList = _.pull(this.state.inputBoxContents.split(/\s/g), "");
    //send all tokens to validationAPI
    ServerAPI.enrichmentAPI({genes: tokenList}, "validation").then((result) => {
      //set state inside of promise chain to ensure order of operation
      this.setState({submittedTokens: tokenList});
      this.setState({unrecognizedTokens: result.unrecognized});
      this.props.storeSubmittedTokens(this.state.submittedTokens);
      });
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


