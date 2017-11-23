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
- comments
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
    if (nextProps.activeMenu === '') {
      this.setState({
        open: false,
        activeMenu: nextProps.activeMenu
      });
    } else {
      this.setState({
        open: true,
        activeMenu: nextProps.activeMenu
      });
    }
  }

  render() {
    const props = this.props;
    const menus = {
      info: h(GraphInfoMenu, { uri: props.uri, name: props.name, datasource: props.datasource, comments: props.comments }),
      file_download: h(FileDownloadMenu, { cy: props.cy, uri: props.uri, name: props.name }),
      help: h(HelpMenu)
    };

    return (
      h('div', {
        className: classNames('sidebar-menu', { 'open': this.state.open }),
        ref: dom => this.sidebarContainer = dom
      }, [
          h('div', {
            className: classNames('sidebar-select', 'conditional', { 'open': this.state.open })
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
