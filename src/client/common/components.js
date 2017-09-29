const React = require('react');
const h = require('react-hyperscript');
const _ =  require('lodash');

const ErrorMessage = props => h('div', props.message || 'Error');

const Icon = props => h('i.material-icons', props.icon);

const SearchFaq = props => h('div', 'faq');

// e.g. h(Icon, { icon: 'done' })
class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: _.assign({q: ''},this.props.query)
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
    const newQueryState = _.assign({}, this.state.query);
    newQueryState.q = e.target.value;
    this.setState({query: newQueryState});
  }

  render() {
    const props = this.props;
    const state = this.state;

    return (
      h('div', [
        h('input', {
          type: 'text',
          placeholder: props.placeholder,
          value: state.query.q,
          onChange: e => this.onSearchValueChange(e),
          onKeyPress: e => this.submitSearchQuery(e)
        }),
        h('a', [
          h(Icon, {icon: props.icon})
        ])
      ])
    );
  }
}


module.exports = {
  Icon: Icon,
  SearchBar: SearchBar,
  SearchFaq: SearchFaq,
  ErrorMessage: ErrorMessage
};