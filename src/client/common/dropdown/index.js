const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

// Should take children in addition to a value. Basically an augmented <select>
class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      activeOption: this.props.value
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.activeOption) {
      this.setState({ activeOption: nextProps.value });
    }
  }

  changeValFromClickedEl(el) {
    if (el === this.optionsDom) { return; }
    while (el.parentElement !== this.optionsDom) {
      el = el.parentElement;
    }
    const val = el.getAttribute('value');
    this.setState({ open: false, activeOption: val });
    this.props.onChange(val);
  }

  render() {
    return (
      h('div.dropdown', {
        onClick: () => this.setState({ open: !this.state.open })
      }, [
          h('div.dropdown-toggle', [
            h('div.dropdown-current-value', this.state.activeOption),
            h('i.material-icons', 'keyboard_arrow_down')
          ]),
          h('div', {
            className: classNames('dropdown-options', { 'active': this.state.open }),
            onClick: evt => this.changeValFromClickedEl(evt.target),
            ref: dom => this.optionsDom = dom
          }, this.props.children)
        ])
    );
  }
}

class DropdownOption extends React.Component {
  render() {
    return (
      h('div.dropdown-option', {
        value: this.props.value
      }, [
          h('h4', this.props.value),
          h('span', this.props.description)
        ])
    );
  }
}

module.exports = { Dropdown, DropdownOption };