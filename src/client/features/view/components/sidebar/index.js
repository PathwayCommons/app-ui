const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const HelpMenu = require('./menus/help');
const FileDownloadMenu = require('./menus/fileDownload');
const GraphInfoMenu = require('./menus/graphInfoMenu');
const MetadataSidebar = require('./menus/metatdataExtension');

const tippy = require('tippy.js');

const toolButtonNames = [
  'info',
  'file_download',
  'bubble_chart',
  'help'
];

const tooltips = [
  'See extra information about this graph',
  'Graph download options',
  'Display node information',
  'Field guide to interpreting the display'        
];

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
      nodeData: false
    };

    this.updateIfOutOfMenu = this.updateIfOutOfMenu.bind(this);
  }

  componentDidMount() {
    this.initTooltips(); // TO BE REMOVED
  }

  // TO BE REMOVED
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
  
  // Used for the panel buttons to set menus in the sidebar and dynamically change the style
  handleIconClick(button) {
    this.setState({
      open: true,
      activeMenu: button
    });
  }

 
  // Checks if a click event occured outside the sidebar or not
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

  this.setState({open: false, activeMenu: ''});
}

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
    if(tooltip) {
      this.setState({open: true, activeMenu: 'bubble_chart' });
    }
  }

  render() {
    const menus = {
      'info': h(GraphInfoMenu, {'uri': this.props.uri, 'name': this.props.name, 'datasource': this.props.datasource}),
      'file_download': h(FileDownloadMenu, {'cy': this.props.cy, 'uri': this.props.uri, 'name': this.props.name}),
      'help': h(HelpMenu),
      'bubble_chart': (
        h(MetadataSidebar, {'cy' : this.props.cy, 'nodeId' : this.props.nodeId})
      )
    };

    // Map tool buttons to actual elements with tooltips
    const toolButtons = toolButtonNames.map((button, index) => {
      return (
        h('div', {
          key: index,
          className: classNames('tool-button', this.state.activeMenu === button ? 'active' : ''),
          onClick: () => this.handleIconClick(button),
          title: tooltips[index]
        }, [
          h('i.material-icons', button)
        ])
      );
    });

    return (
      h('div', {
        className: classNames('sidebar-menu', this.state.open ? 'open' : ''),
        ref: dom => this.sidebarContainer = dom
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
