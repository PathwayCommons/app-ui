const ReactDom = require('react-dom');
const hh = require('hyperscript');
const tippy = require('tippy.js');
const _ = require('lodash');

class CytoscapeTooltip {
  constructor(tippyRef, tippyOpts) {
    this.tooltip = null;
    this.opts = tippyOpts;
    this.tippyRef = tippyRef;


    this.onBodyClick = ( e ) => {
      let parent = e.target;
      let target = document.getElementById('cy');
      let hide = true;

      while( parent !== document.body ){
        if( parent === this.container || parent === target ){
          hide = false;
          break;
        }

        parent = parent.parentNode;
      }

      if( hide ){
        this.hide();
      }
    };

    document.body.addEventListener('click', this.onBodyClick);
  }

  isSmallScreen(){
    return window.innerWidth <= 600;
  }

  reactRender(html){
    let div = hh('div');
    ReactDom.render( html, div );

    this.container = div;

    return div;
  }

  show() {
    let { tooltip, tippyRef, opts } = this;
    let { html } = opts;

    let isSmallScreen = this.isSmallScreen();

    if( tooltip != null ){
      tooltip.destroy();
      tooltip = null;
    }

    if( isSmallScreen ){
      tippyRef = {
        clientWidth: 1,
        clientHeight: 1,
        focus: () => {}, // TODO file bug with tippy expecting focus method on ref obj
        getBoundingClientRect: () => {
          let w = window.innerWidth;
          let h = window.innerHeight;

          return {
            top: h,
            bottom: 0,
            left: w / 2,
            right: w / 2,
            width: 1,
            height: 1
          };
        }
      };
    }


    tooltip = tippy(tippyRef, _.assign({}, {
      theme: 'light',
      interactive: true,
      trigger: 'manual',
      animation: 'fade',
      animateFill: false,
      duration: [ 250, 0 ],
      hideOnClick: false,
      arrow: !isSmallScreen,
      placement: isSmallScreen ? 'top' : 'right',
      flip: isSmallScreen ? false : true,
      distance: 10
      },
      opts, { html: this.reactRender(html) }
    )).tooltips[0];

    this.tooltip = tooltip;
    tooltip.show();
  }

  hide() {
    if (this.tooltip) {
      this.tooltip.hide();
      document.body.removeEventListener('click', this.onBodyClick);
    }
  }
}

module.exports = CytoscapeTooltip;