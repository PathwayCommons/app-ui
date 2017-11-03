const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const HelpMenu = require('./menus/help');
const FileDownloadMenu = require('./menus/fileDownload');
const GraphInfoMenu = require('./menus/graphInfoMenu');
const MetadataSidebar = require('./menus/metatdataExtension');

const tippy = require('tippy.js');


/* Props
- cy
- uri
- name
- datasource
*/

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
      ]
    };

    this.updateIfOutOfMenu = this.updateIfOutOfMenu.bind(this);
  }

  componentDidMount() {
    this.initTooltips(); // For icon tooltips
  }

  // Function called to initialize tippy.js tooltips for icons
  initTooltips() {
    tippy('.tool-button', {
      delay: [800, 400],
      animation: 'scale',
      theme: 'dark',
      arrow: true,
      position: 'left',
      touchHold: true,
      popperOptions: {
        modifiers: {
          flip: {
            behavior: ['left', 'top']
          }
        }
      }
    });
  }

  // Utility function to clear all styling on the tool-buttons and return them to the
  // standard colour. Currently that color must be specified here.
  clearToolButtonStyling() {
    let toolButtons = this.toolButtons;
    for (let i = toolButtons.length - 1; i >= 0; i--) {
      toolButtons[i].style.zIndex = 1;
      toolButtons[i].style.backgroundColor = '#ECF0F1';
    }
  }
  
  // Used for the panel buttons to set menus in the sidebar and dynamically change the style
  handleIconClick(button) {
    let toolButtonNames = this.state.toolButtonNames.map(name => {
      if (typeof name === typeof {}) return name[this.state.nodeData.toString()];
      else return name;
    });
    let currButton = this.toolButtons[toolButtonNames.indexOf(button)];
    this.clearToolButtonStyling();
    currButton.style.zIndex = 100;
    currButton.style.backgroundColor = '#16A085';
    this.setState({
      open: true,
      activeMenu: button
    });
  }

  // Checks if a click event occured outside the sidebar or not
  updateIfOutOfMenu(evt) {
    let currentEl = evt.target;
    let loops = 0; // a safety variable
    // Not sure if there's a better way to do this so I loop through the
    // element that is clicked on and its parents, grandparents, etc.
    // until I either reach the View (which I assume covers the whole page)
    // or I reach the sidebar-menu or a toolButton (which I assume are children
    // the View)
    while (currentEl.className !== 'View') {
      let currClassNames = currentEl.className.split(' ');
      if (
        currClassNames.includes('sidebar-menu') ||
        currClassNames.includes('tool-button')
      ) {
        return;
      }
      currentEl = currentEl.parentElement;

      // Catching infinite loops for safety. This code should
      // never run. Doesn't hurt to be safe though?
      loops++;
      if (loops > 100) {return;}
    }

    this.clearToolButtonStyling();
    this.setState({open: false});
  }

  // Every time the state updates we should check if the event listening for a menu close is worth
  // keeping active, since it's a waste of resources to keep it active if the sidebar is closed
  componentWillUpdate(nextProps, nextState) {
    if (nextState.open && !nextState.locked) {
      window.addEventListener('mousedown', this.updateIfOutOfMenu);
      window.addEventListener('touchend', this.updateIfOutOfMenu);
    } else {
      window.removeEventListener('mousedown', this.updateIfOutOfMenu);
      window.removeEventListener('touchend', this.updateIfOutOfMenu);
    }
  }
  
  //Receive updated props and set the state to match the desired result. 
  componentWillReceiveProps(nextProps){
    let node = nextProps.cy.getElementById(nextProps.nodeId);
    let tooltip = node.scratch('tooltip');
    if(tooltip) this.setState({open: true, activeMenu: 'center_focus_strong' });
  }

  render() {
    // Not a great solution, but the icon names from toolButtonNames should be copied here and relate to
    // their specific menu
    const menus = {
      'info': h(GraphInfoMenu, {'uri': this.props.uri, 'name': this.props.name, 'datasource': this.props.datasource}),
      'file_download': h(FileDownloadMenu, {'cy': this.props.cy, 'uri': this.props.uri, 'name': this.props.name}),
      'help': h(HelpMenu),
      'center_focus_strong': (
        h(MetadataSidebar, {'cy' : this.props.cy, 'nodeId' : this.props.nodeId})
      ),
      'center_focus_weak': (
        h('div', [
          h('h1', 'Node Information'),
          h('div', 'No Data Found' )
        ])
      )
    };

    // Take this.state.toolButtonNames and map them to a usable array (since some of them could be objects)
    // Right now there is only code here for the node data menu to toggle, so if any other multi-icon button
    // is added, code to deal with it must be put here
    let toolButtonNames = this.state.toolButtonNames.map(name => {
      if (typeof name === typeof {}) return name[this.state.nodeData.toString()];
      else return name;
    });

    // Map tool buttons to actual elements with tooltips frmo tippy.js
    const tooltips = this.state.tooltips;
    this.toolButtons = new Array(toolButtonNames.length);
    const toolButtons = toolButtonNames.map((button, index) => {
      return (
        h('div.tool-button', {
          key: index,
          onClick: () => this.handleIconClick(button),
          title: tooltips[index],
          ref: dom => this.toolButtons[index] = dom
        }, [
          h('i.material-icons', button)
        ])
      );
    });

    return (
      h('div', {
        className: classNames('sidebar-menu', this.state.open ? 'open' : '')
      }, [
        h('div.sidebar-select', toolButtons),
        h('div', {
          className: classNames('sidebar-select', 'conditional', this.state.open ? 'open' : '')
        }, [
          h('div.tool-button', {
            onClick: () => this.setState({locked: !this.state.locked}),
            title: 'Lock the sidebar'
          }, [
            h('i.material-icons', this.state.locked ? 'lock' : 'lock_open')
          ])
        ]),
        h('div.sidebar-content', [
          h('div.sidebar-text', [
            menus[this.state.activeMenu]
          ])
        ])
      ])
    );
  }
}

module.exports = Sidebar;