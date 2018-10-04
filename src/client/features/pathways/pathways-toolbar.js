
const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');

const Popover = require('../../common/components/popover');
const InfoMenu = require('./menus/network-info-menu');
const FileDownloadMenu = require('./menus/file-download-menu');
const IconButton = require('../../common/components/icon-button');

const { fit, expandCollapse, layout, searchNodes } = require('./cy');

class PathwaysToolbar extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      searchValue: ''
    };
  }

  handleNodeSearchChange(searchVal){
    this.setState({ searchValue: searchVal }, () => searchNodes( this.props.cySrv.get(), searchVal));
  }

  focusNodeSearch(){
    ReactDom.findDOMNode(this).querySelector('.element-search-input').focus();
  }

  render(){
    let { cySrv, pathway } = this.props;
    let { searchValue } = this.state;
    let cy = cySrv.get();

    return h('div.app-toolbar', [
      h(Popover, {
        tippy: {
          position: 'bottom',
          html: h(InfoMenu, { key: 'infoMenu', infoList: pathway.comments() })
        }
      }, [
        h(IconButton, {
          description: 'Extra Information',
          icon: 'info'
        })
      ]),
      h(Popover, {
        tippy: {
          position: 'bottom',
          html: h(FileDownloadMenu, { key: 'downloadMenu', cySrv, fileName: pathway.name(), uri: pathway.uri() })
        }
      }, [
        h(IconButton, {
          description: 'Downloads',
          icon: 'file_download'
        })
      ]),
      h(IconButton, {
        description: 'Expand/Collapse all complex nodes',
        onClick: () => expandCollapse( cy ),
        icon: 'select_all'
      }),
      h(IconButton, {
        description: 'Fit pathway to screen',
        onClick: () => fit( cy ),
        icon: 'fullscreen'
      }),
      h(IconButton, {
        description: 'Reset pathway arrangement',
        onClick: () => layout( cy ),
        icon: 'replay'
      }),
      h('div.element-search', [
        h('input.element-search-input.input-round.input-joined', {
          value: searchValue,
          onChange: e => this.handleNodeSearchChange(e.target.value),
          type: 'text',
          placeholder: 'Search',
        }),
        h('button.element-search-clear', {
          onClick: () => {
            this.handleNodeSearchChange('');
            this.focusNodeSearch();
          }
        }, [
          h('i.material-icons', 'close')
        ])
      ])
    ]);
  }
}

module.exports = PathwaysToolbar;