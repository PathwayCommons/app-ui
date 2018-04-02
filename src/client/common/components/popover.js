const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const Tippy = require('tippy.js');
const _ = require('lodash');

const { tippyDefaults } = require('../config');

/* Props
- tippy (tippy options object)
- target (ref to target, defaults to first child)
- show() and/or hide() (functions called on show and hide, are passed in tippy.show()/tippy.hide())
*/
class Popover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  renderTipContent() {
    let el = this.props.tippy.html;

    if (_.isFunction(el)) {
      el = h(el);
    }

    ReactDom.render(el, this.state.content);
  }

  componentDidMount() {
    let props = this.props;
    let target = props.target || ReactDom.findDOMNode(this).children[0];
    let options = props.tippy;
    let content = this.state.content = hh('div', {
      className: (props.className || '') + ' popover-content'
    });

    this.renderTipContent();

    let tippy = new Tippy(target, _.assign({}, tippyDefaults, options, {
      html: content
    }));

    let popper = target._tippy.popper;

    let show = () => tippy.show(popper);
    let hide = () => tippy.hide(popper);

    if (props.show) { props.show(show); }
    if (props.hide) { props.hide(hide); }
  }

  componentDidUpdate() {
    this.renderTipContent();
  }

  render() {
    let props = this.props;

    return h('span.popover-target', [props.children]);
  }
}

module.exports = Popover;