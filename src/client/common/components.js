const React = require('react');
const h = require('react-hyperscript');

module.exports.ErrorMessage = props => h('div', props.message || 'Error');

module.exports.Icon = props => h('i.material-icons', props.icon);

module.exports.SearchFaq = props => h('div', 'faq');

// e.g. h(Icon, { icon: 'done' })
module.exports.SearchBar = class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: this.props.query
    };
  }

  submitSearchQuery(e) {
    // if the user presses enter, submit the query
    if (e.which == 13) {
      this.props.updateSearchQuery(this.state.query);
      e.target.blur();
    }
  }

  componentWillReceiveProps(props) {
    if (props.query) {
      this.state.query = props.query;
    }
  }

  onSearchValueChange(e) {
    const newQueryState = {...this.state.query};
    newQueryState.q = e.target.value;
    this.setState({query: newQueryState});
  }

  render() {
    const props = this.props;
    const state = this.state;

    return (
      h('input', {
        type: 'text',
        placeholder: props.placeholder,
        value: state.query.q,
        onChange: e => this.onSearchValueChange(e),
        onKeyPress: e => this.submitSearchQuery(e)
      }, [
        h(Icon, {icon: props.icon})
      ])
    );
  }
}
