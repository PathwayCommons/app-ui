const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const _ = require('lodash');

/* Props
Required
- value
- onChange()
- children (should be an array of dropdownOptions or something else with a value field)
Optional
- anchor ('start' - default, 'middle', 'end')
- side ('bottom' - default, 'top', 'left', 'right')
- disabled (false - default, true)
- openByDefault (false - default, true)
- iconButton (material-icon string, by default 'keyboard_arrow_down')
*/
class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: props.openByDefault && !this.props.disabled || false
    };
  }

  changeValFromClickedEl(el) {
    if (el !== this.optionsDom) {
      while (el.parentElement && el.parentElement !== this.optionsDom) {
        el = el.parentElement;
      }
      const val = el.getAttribute('value');
      if (val) {
        this.setState({ open: false, activeOption: val });
        this.props.onChange(val);
      }
    }
  }

  render() {
    const props = this.props;
    
    const defAnchor = 'start';
    const nonDefAnchors = ['middle', 'end'];
    const anchorClass = `common-dropdown-options-anchor-${_.includes(nonDefAnchors, props.anchor) ? props.anchor : defAnchor}`;
    
    const defSide = 'bottom';
    const nonDefSides = ['top', 'left', 'right'];
    const sideClass = `common-dropdown-options-side-${_.includes(nonDefSides, props.side) ? props.side : defSide}`;

    const iconButton = props.iconButton || 'keyboard_arrow_down';

    return (
      h('div.common-dropdown', {
        onClick: () => !props.disabled ? this.setState({ open: !this.state.open }) : {}
      }, [
          h('div', {
            className: classNames('common-dropdown-toggle', { 'common-dropdown-toggle-disabled': props.disabled })
          }, [
            h('div.common-dropdown-current-value', props.value),
            h('i.material-icons', iconButton)
          ]),
          h('div', {
            className: classNames(
              'common-dropdown-options', anchorClass, sideClass, { 'common-dropdown-options-active': this.state.open }
            ),
            onClick: evt => this.changeValFromClickedEl(evt.target),
            ref: dom => this.optionsDom = dom
          }, props.children)
        ])
    );
  }
}

class DropdownOption extends React.Component {
  render() {
    const props = this.props;
    return (
      h('div.common-dropdown-option', {
        value: props.value,
      }, [
          ...(props.header ? [h('h4', props.header)] : []),
          ...(props.description ? [h('span', this.props.description)] : [])
        ])
    );
  }
}

module.exports = { Dropdown, DropdownOption };