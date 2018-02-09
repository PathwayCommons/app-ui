const React = require('react');
const { ServerAPI } = require('../../services');
//const func = require('../../../server/gene-query/validate');
//const validate = func.validate;
//const proceed = func.proceed;

class GeneQuery extends React.Component {

  constructor(props) {
    super(props);
    this.state = { value: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    const result = ServerAPI.geneQuery(this.state.value);
    alert('A name was submitted: ' + result);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Validate:
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

module.exports = GeneQuery;
