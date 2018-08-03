
const React = require('react');
const h = require('react-hyperscript');

const IconButton = require('../../common/components/icon-button');

const { fit, expandCollapse, layout, searchNodes } = require('./cy');

class InteractionsToolbar extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      searchValue: ''
    };
  }

  handleNodeSearchChange(searchVal){
    this.setState({ searchValue: searchVal }, () => searchNodes( this.props.cySrv.get(), searchVal));
  }

  render(){
    let { cySrv, controller, activeMenu } = this.props;
    let { searchValue } = this.state;
    let cy = cySrv.get();

    return h('div.pathways-toolbar', [
      h(IconButton, {
        description: 'View Legend',
        onClick: () => controller.changeMenu('interactionsMenu'),
        isActive: activeMenu === 'interactionsMenu',
        icon: 'filter_list'
      }),
      h(IconButton, {
        description: 'Downloads',
        onClick: () => controller.changeMenu('interactionsDownloadMenu'),
        isActive: activeMenu === 'interactionsDownloadMenu',
        icon: 'file_download'
      }),
      h(IconButton, {
        description: 'Fit pathway to screen',
        onClick: () => fit( cy ),
        isActive: false,
        icon: 'fullscreen'
      }),
      h(IconButton, {
        description: 'Reset pathway arrangement',
        onClick: () => layout( cy ),
        isActive: false,
        icon: 'replay'
      }),
      h('div.pathways-search-nodes', {
        onChange: e => this.handleNodeSearchChange(e.target.value)
      }, [
        h('div.pathways-search-bar', [
          h('input.pathways-search-input', {
            value: searchValue,
            type: 'search',
            placeholder: 'Search entities',
          }),
          searchValue !== '' ? h('div.pathways-search-clear', {
            onClick: () => this.handleNodeSearchChange('')}, [
            h('i.material-icons', 'close')
          ]) : null
        ])
      ])
    ]);
  }
}

module.exports = InteractionsToolbar;