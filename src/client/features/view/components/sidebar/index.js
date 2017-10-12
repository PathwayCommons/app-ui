const React = require('react');

const HelpMenu = require('./menus/help.js');
const FileDownloadMenu = require('./menus/fileDownload.js');
const GraphInfoMenu = require('./menus/graphInfoMenu.js');

const PathwayCommonsService = require('../../../../services/index.js').PathwayCommonsService;

// Currently a really bad solution to a problem I can't seem to solve programatically
const buttonColors = {
  'info': '#d65355',
  'file_download': '#007dc0',
  'help': '#00a887',
  'center_focus_strong': '#ad5fd1',
  'center_focus_weak': '#ad5fd1'
};

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      activeMenu: '',
      nodeData: false,
    };

    this.updateIfOutOfMenu = this.updateIfOutOfMenu.bind(this);

  }

  

  handleIconClick(button) {
    if (!this.state.open) {this.toggleCloseListener(true);}
    // I feel bad using this constant but I can't figure out how to get the right color programatically
    document.getElementsByClassName('sidebarText')[0].style.borderColor = buttonColors[button];
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

  toggleCloseListener(open) {
    if (open) {window.addEventListener('mousedown', this.updateIfOutOfMenu);}
    else {window.removeEventListener('mousedown', this.updateIfOutOfMenu);}
  }

  updateIfOutOfMenu(evt) {
    console.log('click detected.');
    var currentEl = evt.target;
    var loops = 0;
    while (currentEl.className !== 'View') {
      var currClassNames = currentEl.className.split(' ');
      if (
        currClassNames.includes('sidebarMenu') ||
        currClassNames.includes('toolButton')
      ) {
        return;
      }
      currentEl = currentEl.parentElement;

      // Catching infinite loops for safety. We should never have this run more than 100 times
      loops++;
      if (loops > 100) {return;}
    }
    this.toggleCloseListener(false);
    this.setState({open: false});
  }

  render() {
    const menus = {
      'info': <GraphInfoMenu uri={this.props.uri} />,
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

    var toolButtonNames = ['info', 'file_download', 'center_focus', 'help'];
    this.state.nodeData ? toolButtonNames[2] += '_strong' : toolButtonNames[2] += '_weak';
    const tooltips = [
      'See extra information about this graph',
      'Graph download options',
      'Field guide to interpreting the display',
      'Display node information'
    ];
    const toolButtons = toolButtonNames.map((button, index) => {
      var buttonClassName = button+'MenuButton';
      return (
        <div
          key={index}
          className={'toolButton noSelect flexCenter '+buttonClassName}
          onClick={() => this.handleIconClick(button)}
          title={tooltips[index]}
        >
          <i className={'material-icons '+buttonClassName}>{button}</i>
        </div>
      );
    });

    return (
      <div className={'sidebarMenu'+(this.state.open ? ' open' : '')}>
        <div className='sidebarSelect'>
          {toolButtons}
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