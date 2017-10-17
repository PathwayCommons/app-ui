/**
    Pathway Commons Viewer

    Sidebar

    Purpose:  Retractable sidebar for information and utilities. Navigable by
              toggleable access buttons.

    Props:    - cy
              - uri
              - name
              - datasource

    Note: 

    To do:    - Approval
              - Resizability
              - Colour scheme
              - Node metadata dock

    @author Jonah Dlin
    @version 1.1 2017/10/17
**/


const React = require('react');

const HelpMenu = require('./menus/help.js');
const FileDownloadMenu = require('./menus/fileDownload.js');
const GraphInfoMenu = require('./menus/graphInfoMenu.js');

const PathwayCommonsService = require('../../../../services/index.js').PathwayCommonsService;
const tippy = require('tippy.js');

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      locked: false,
      activeMenu: '',
      nodeData: false, // a future field for toggling the node metadata dock
      // these can be changed to edit the icons that appear in the side panel
      // but they also correspond to names in the menus constant in the render
      // function right now.
      // Icons that should change depending on a binary state should be stored
      // in an object under fields 'true' and 'false'
      // Stripe colour will default to false field
      toolButtonNames: [
        'info',
        'file_download',
        {true: 'center_focus_strong', false: 'center_focus_weak'},
        'help'
      ],
      // Tooltips for each icon. Should be the same length and order as toolButtonNames
      tooltips: [
        'See extra information about this graph',
        'Graph download options',
        'Display node information',
        'Field guide to interpreting the display'        
      ],
      // Populated on mount by initStripeColours
      buttonColours: []
    };

    this.updateIfOutOfMenu = this.updateIfOutOfMenu.bind(this);
  }

  componentDidMount() {
    this.initTooltips(); // For icons
    this.initStripeColours(); // For the sidebar stripe
  }

  // Function called to initialize tippy.js tooltips for icons
  initTooltips() {
    tippy('.toolButton', {
      delay: [800, 400],
      animation: 'scale',
      theme: 'dark',
      arrow: true,
      position: 'left'
    });
  }

  // Button colours calculated variably from CSS using the state toolButtonNames
  initStripeColours() {
    const toolButtonNames = this.state.toolButtonNames;
    var colours = {};
    for (var i = 0; i < toolButtonNames.length; i++) {
      var button = toolButtonNames[i];

      // If an object was given, assume it is for a variable icon, and that the initial
      // icon is false. This works right now but should be changed in the future
      if (typeof toolButtonNames[i] === typeof {}) button = toolButtonNames[i].false;

      // Style taken directly from the computed value
      colours[button] = window
        .getComputedStyle(document.getElementsByClassName(button+'MenuButton')[0])
        .getPropertyValue('background-color');
    }
    this.setState({buttonColours: colours});
  }
  
  // Used for the panel buttons to set menus in the sidebar and dynamically change the style
  handleIconClick(button) {
    document.getElementsByClassName('sidebarText')[0].style.borderColor = this.state.buttonColours[button];
    var toolButtons = document.getElementsByClassName('toolButton');
    for (var i = toolButtons.length - 1; i >= 0; i--) {
      toolButtons[i].style.zIndex = 1;
    }
    document.getElementsByClassName(button+'MenuButton')[0].style.zIndex = 100;
    this.setState({
      open: true,
      activeMenu: button
    });
  }

  // Checks if a click event occured outside the sidebar or not
  updateIfOutOfMenu(evt) {
    var currentEl = evt.target;
    var loops = 0; // a safety variable
    // Not sure if there's a betterway to do this so I loop through the
    // element that is clicked on and its parents, grandparents, etc.
    // until I either reach the View (which I assume covers the whole page)
    // or I reach the sidebarMenu or a toolButton (which I assume are children
    // the View)
    while (currentEl.className !== 'View') {
      var currClassNames = currentEl.className.split(' ');
      if (
        currClassNames.includes('sidebarMenu') ||
        currClassNames.includes('toolButton')
      ) {
        return;
      }
      currentEl = currentEl.parentElement;

      // Catching infinite loops for safety. This code should
      // never run. Doesn't hurt to be safe though?
      loops++;
      if (loops > 100) {return;}
    }
    this.setState({open: false});
  }

  // Every time the state updates we should check if the event listening for a menu close is worth
  // keeping active, since it's a waste of resources to keep it active if the sidebar is closed
  componentWillUpdate(nextProps, nextState) {
    if (nextState.open && !nextState.locked) {window.addEventListener('mousedown', this.updateIfOutOfMenu);}
    else {window.removeEventListener('mousedown', this.updateIfOutOfMenu);}
  }

  render() {
    // Not a great solution, but the icon names from toolButtonNames should be copied here and relate to
    // their specific menu
    const menus = {
      'info': <GraphInfoMenu uri={this.props.uri} name={this.props.name} datasource={this.props.datasource}/>,
      'file_download': <FileDownloadMenu cy={this.props.cy} uri={this.props.uri} name={this.props.name} />,
      'help': <HelpMenu />,
      'center_focus_strong': (
        <div className='nodeMenuActive'>
          <span>Harsh's fancy metadata tree goes here.</span>
        </div>
      ),
      'center_focus_weak': (
        <div className='nodeMenuNoNode'>
          <h1>Node Information</h1>
          <div>Right click on any node and click the dock button to see information about it.</div>
        </div>
      )
    };

    // Take this.state.toolButtonNames and map them to a usable array (since some of them could be objects)
    // Right now there is only code here for the node data menu to toggle, so if any other multi-icon button
    // is added, code to deal with it must be put here
    var toolButtonNames = this.state.toolButtonNames.map(name => {
      if (typeof name === typeof {}) return name[this.state.nodeData.toString()];
      else return name;
    });

    // Map tool buttons to actual elements with tooltips frmo tippy.js
    const tooltips = this.state.tooltips;
    const toolButtons = toolButtonNames.map((button, index) => {
      var buttonClassName = button+'MenuButton';
      return (
        <div
          key={index}
          className={'toolButton noSelect flexCenter '+buttonClassName}
          onClick={() => this.handleIconClick(button)}
          title={tooltips[index]}
        >
          <i className='material-icons'>{button}</i>
        </div>
      );
    });

    return (
      <div className={'sidebarMenu'+(this.state.open ? ' open' : '')}>
        <div className='sidebarSelect'>
          {toolButtons}
        </div>
        <div className={'sidebarSelect conditional'+(this.state.open ? ' open' : '')}>
          <div
            className={'toolButton noSelect flexCenter lockMenuButton'}
            onClick={() => this.setState({locked: !this.state.locked})}
            title={'Lock the sidebar (the Shareef don\'t like it)'}
          >
            <i className='material-icons'>{this.state.locked ? 'lock' : 'lock_open'}</i>
          </div>
        </div>
        <div className='sidebarContent'>
          <div className='sidebarText flexCenter'>
            {menus[this.state.activeMenu]}
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Sidebar;