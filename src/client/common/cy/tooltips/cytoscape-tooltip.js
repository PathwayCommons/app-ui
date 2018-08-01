const ReactDom = require('react-dom');
const hh = require('hyperscript');
const tippy = require('tippy.js');
const _ = require('lodash');

class CytoscapeTooltip {
  constructor(tippyRef, tippyOpts) {
    this.tooltip = null;
    this.opts = tippyOpts;
    this.tippyRef = tippyRef;
  }

  reactRender(html){
    let div = hh('div');
    ReactDom.render( html, div );

    return div;
  }

  show() {
    let { tooltip, tippyRef, opts } = this;
    let { html } = opts;

    if( tooltip != null ){
      tooltip.destroy();
      tooltip = null;
    }

    tooltip = tippy(tippyRef, _.assign({}, opts, {
      html: this.reactRender(html)
    })).tooltips[0];

    this.tooltip = tooltip;
    tooltip.show();
  }

  hide() {
    if (this.tooltip) {
      this.tooltip.hide();
    }
  }
}

module.exports = CytoscapeTooltip;