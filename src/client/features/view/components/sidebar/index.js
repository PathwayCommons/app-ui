const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const HelpMenu = require('./menus/help');
const FileDownloadMenu = require('./menus/fileDownload');
const GraphInfoMenu = require('./menus/graphInfoMenu');

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
      activeMenu: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    console.log(this.state.activeMenu, nextProps.activeMenu);
    if (nextProps.activeMenu !== '' && (nextProps.activeMenu !== this.state.activeMenu || !this.state.open)) {
      this.setState({
        open: true,
        activeMenu: nextProps.activeMenu
      });
    } else {
      this.setState({open: false});
    }
  }

  render() {
    const menus = {
      'info': h(GraphInfoMenu, { 'uri': this.props.uri, 'name': this.props.name, 'datasource': this.props.datasource }),
      'file_download': h(FileDownloadMenu, { 'cy': this.props.cy, 'uri': this.props.uri, 'name': this.props.name }),
      'help': h(HelpMenu)
    };

    return (
      h('div', {
        className: classNames('sidebar-menu', this.state.open ? 'open' : ''),
        ref: dom => this.sidebarContainer = dom
      }, [
          h('div', {
            className: classNames('sidebar-select', 'conditional', this.state.open ? 'open' : '')
          }, [
              h('div', {
                className: classNames('sidebar-close-button', this.state.open ? 'open' : 'closed'),
                onClick: () => this.props.changeMenu(''),
                title: 'Close the sidebar'
              }, [
                  h('i.material-icons', 'close')
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
