
const React = require('react');
const h = require('react-hyperscript');

const IconButton = require('../../common/components/icon-button');

const { ENRICHMENT_MAP_LAYOUT, searchEnrichmentNodes } = require('./cy');

class EnrichmentToolbar extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      searchValue: ''
    };
  }

  handleNodeSearchChange(searchVal){
    this.setState({ searchValue: searchVal }, () => searchEnrichmentNodes( this.props.cySrv.get(), searchVal));
  }

  render(){
    let { cySrv, controller, activeMenu } = this.props;
    let { searchValue } = this.state;
    let cy = cySrv.get();

    return h('div.app-toolbar', [
      h(IconButton, {
        description: 'View Legend',
        onClick: () => controller.changeMenu('enrichmentMenu'),
        isActive: activeMenu === 'enrichmentMenu',
        icon: 'info'
      }),
      h(IconButton, {
        description: 'Downloads',
        onClick: () => controller.changeMenu('enrichmentDownloadMenu'),
        isActive: activeMenu === 'enrichmentDownloadMenu',
        icon: 'file_download'
      }),
      h(IconButton, {
        description: 'Fit to screen',
        onClick: () => cy.fit(),
        isActive: false,
        icon: 'fullscreen'
      }),
      h(IconButton, {
        description: 'Reset arrangement',
        onClick: () => cy.layout(ENRICHMENT_MAP_LAYOUT).run(),
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

module.exports = EnrichmentToolbar;