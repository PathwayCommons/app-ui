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
      inputBoxContents: ""
    };
  }
  //store 'gene-input-box' contents on state
  handleChange(e) {
    this.setState({inputBoxContents: e.target.value});
  }

  setExample() {
    let example = ['tyr', 'oca2', 'tyrp1', 'slc45a2'];
    this.setState({ inputBoxContents: example.join(`\n`) });
    //open input box when example is inserted
    document.getElementById('gene-input-box').focus();
  }

  //call validation service API to retrieve validation result in the form of []
  retrieveValidationAPIResult(){
    let { inputBoxContents } = this.state;
    let { controller } = this.props;

    if(!inputBoxContents.replace(/\s/g, "")) {
      this.setState({ inputBoxContents: "" });
      return;
   }

    let tokenList = _.pull(inputBoxContents.split(/\s/g), "");
     ServerAPI.enrichmentAPI({
       query: tokenList,
       targetDb: "HGNCSYMBOL"
      }, "validation")
    .then( result => {
      const aliases = result.geneInfo.map( value => {
        return value.convertedAlias;
      });

      controller.handleGeneQueryResult( {
        genes: aliases,
        unrecognized: result.unrecognized,
      });
    });
  }

  render() {
    let { inputBoxContents } = this.state;

    let exampleLink =  !inputBoxContents ? h('div.enrichment-example-container', {onClick: () => this.setExample()}, [
    h('button.example', 'e.g. ')]) : null;

    return h('div.enrichmentInput', [
        h('div.gene-input-container', [
          h(Textarea, {
            id: 'gene-input-box', // for focus() and blur()
            className: 'gene-input-box', // used for css styling
            placeholder: 'Enter one gene per line',
            value: inputBoxContents,
            spellCheck: false,
            onChange: (e) => this.handleChange(e)
          }
        ),
          exampleLink
        ]),
        h('submit-container', {
          onClick: () => { this.retrieveValidationAPIResult(); }},
          [h('button.submit', 'Submit')]
        )
    ]);
  }
}

module.exports = TokenInput;
