
const React = require('react');
const ReactDom = require('react-dom');
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

  focusNodeSearch(){
    ReactDom.findDOMNode(this).querySelector('.element-search-input').focus();
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

module.exports = EnrichmentToolbar;