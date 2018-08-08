const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const { ServerAPI } = require('../../services/');
let Textarea = require('react-textarea-autosize').default;

class TokenInput extends React.Component {

  constructor(props) {
    super(props);
    // Note on input contents: Set the initial value here from parent
    // in order to maintain contents on re-render.
    this.state = {
      inputBoxContents: this.props.inputs
    };
  }
  //store 'gene-input-box' contents on state
  handleChange(e) {
    this.setState({inputBoxContents: e.target.value});
  }

  //call validation service API to retrieve validation result in the form of []
  retrieveValidationAPIResult(){
    let tokenList = _.pull(this.state.inputBoxContents.split(/\s/g), "");
     ServerAPI.enrichmentAPI({
       genes: tokenList,
       targetDb: "HGNCSYMBOL"
      }, "validation")
    .then( result => {
      const aliases = result.geneInfo.map( value => {
        return value.convertedAlias;
      });
      this.props.handleGenes( aliases );
      this.props.handleUnrecognized( result.unrecognized );
      this.props.handleInputs( this.state.inputBoxContents );
    });
  }

  render() {

    const state = this.state;

    return h('div.enrichmentInput', [
        h('h4', [
          h('span', 'Pathway Enrichment   ')
        ]),
        h('img', {
          src: '/img/humanIcon.png'
        }),
        h('div.gene-input-container', [
          h(Textarea, {
            id: 'gene-input-box', // for focus() and blur()
            className: 'gene-input-box', // used for css styling
            placeholder: 'Enter one gene per line',
            value: state.inputBoxContents,
            spellCheck: false,
            onChange: (e) => this.handleChange(e)
          })
        ]),
        h('submit-container', {
          onClick: () => { this.retrieveValidationAPIResult();} },
          [h('button.submit', 'Submit')]
        )
    ]);
  }
}

module.exports = TokenInput;
