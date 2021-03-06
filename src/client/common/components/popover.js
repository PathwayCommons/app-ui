const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');
const hh = require('hyperscript');
const Tippy = require('tippy.js');
const _ = require('lodash');
const Mousetrap = require('mousetrap');
const EventEmitter = require('eventemitter3');

const tippyEmitter = new EventEmitter();
const tippyDefaults = require('../tippy-defaults');

Mousetrap.bind('escape', () => tippyEmitter.emit('esc'));

class Popover extends React.Component {
  constructor( props ){
    super( props );
  }

  render(){
    let p = this.props;

    return h( 'span.popover-target', {
      ref: el => this.target = el,
      onClick: p.onClick
    }, p.children );
  }

  renderTipContent(){
    let el = this.props.tippy.html;

    if( _.isFunction(el) ){
      el = h(el);
    }

    ReactDom.render( el, this.content );
  }

  componentDidMount(){
    let p = this.props;
    let target = p.target || this.target;
    let options = p.tippy;
    let content = this.content = hh('div', {
      className: ( this.props.className || '' ) + ' popover-content'
    });

    let rawTippyOptions = _.assign( {}, tippyDefaults, options );

    let tippyOptions = _.assign( {}, rawTippyOptions, {
      html: content,
      hideOnClick: false
    } );

    this.renderTipContent();

    let tippy = Tippy( target, tippyOptions ).tooltips[0];

    let show = () => tippy.show();
    let hide = () => tippy.hide();

    if( p.show ){ p.show( show ); }
    if( p.hide ){ p.hide( hide ); }

    this.showTippy = () => tippy.show();
    this.hideTippy = () => tippy.hide();
    this.destroyTippy = () => tippy.destroy();

    tippyEmitter.on('esc', this.hideTippy);

    // the tippy hide on click doesn't work with and nested tippies otherwise
    if( rawTippyOptions.hideOnClick ){
      this.onBodyClick = (e) => {
        let parent = e.target;
        let hide = true;

        while( parent !== document.body ){
          if( parent === content || parent === target ){
            hide = false;
            break;
          }

          parent = parent.parentNode;
        }

        if( hide ){
          this.hideTippy();
        }
      };

      document.body.addEventListener('click', this.onBodyClick);
    }
  }

  componentWillUnmount(){
    tippyEmitter.removeListener('esc', this.hideTippy);

    ReactDom.unmountComponentAtNode( this.content );

    if( this.onBodyClick ){
      document.body.removeEventListener('click', this.onBodyClick);
    }

    this.destroyTippy();
  }

  componentDidUpdate(){
    this.renderTipContent();
  }
}

module.exports = Popover;
