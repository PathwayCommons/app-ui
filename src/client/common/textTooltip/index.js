const React = require('react');
const _ = require('lodash');
const h = require('react-hyperscript');

const Popover = require('../popover');
const { tippyDefaults } = require('../config');

/* Props
Required
- description - text in tooltip
Optional
- tippy - an object with tippy.js options
- popover props - props you want the popover to have, see popover
*/
class TextTooltip extends React.Component {
  render() {
    let props = this.props;

    let tippyOptions = _.assign({}, tippyDefaults, {
      html: (() => {
        return h('div.tooltip-content', [h('span.tooltip-description', props.description)]);
      })(),
      position: 'bottom',
      trigger: 'mouseenter click',
      animate: 'scale',
      hideOnClick: true,
      interactive: false,
      touchHold: true,
      theme: 'dark',
      arrow: true,
      delay: [500, 0]
    }, props.tippy);

    let popoverOptions = _.assign({}, props, { tippy: tippyOptions });

    return h(Popover, popoverOptions, props.children);
  }
}

module.exports = TextTooltip;