const React = require('react');
const _ = require('lodash');
const h = require('react-hyperscript');

const Popover = require('./popover');
const tippyDefaults = require('../tippy-defaults');

/* Props
Required
- description
Optional
- tippy (an object with tippy.js options)
- popover props (props you want the popover to have, see popover)
*/
class Tooltip extends React.Component {
  componentWillMount(){
    let props = this.props;

    let tippyOptions = _.assign({}, tippyDefaults, {
      html: (() => {
        return h('div.tooltip-content', [h('span.tooltip-description', props.description)]);
      })(),
      trigger: 'mouseenter manual',
      theme: 'dark',
      delay: [ 1000, 0 ]
    }, props.tippy);

    this.popoverOptions = _.assign({}, props, {
      tippy: tippyOptions,
      hide: hideTippy => {
        if(props.hide){
          props.hide(hideTippy); // make sure we don't override the hide() from props
        }

        this.hideTippy = hideTippy;
      },
      onClick: () => {
        this.hideTippy();
      }
    });
  }

  componentWillUnmount(){

  }

  render() {
    let props = this.props;

    return h(Popover, this.popoverOptions, props.children);
  }
}

module.exports = Tooltip;