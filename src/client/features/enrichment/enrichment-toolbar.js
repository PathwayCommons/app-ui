
const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');

const { Popover, IconButton } = require('../../common/components/');
const EnrichmentDownloadMenu = require('./enrichment-download-menu');

const { enrichmentLayout, searchEnrichmentNodes } = require('./cy');

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
    let { cySrv } = this.props;
    let { searchValue } = this.state;
    let cy = cySrv.get();

    return h('div.app-toolbar', [
      h(Popover, {
        tippy: {
          position: 'bottom',
          html: h(EnrichmentDownloadMenu, { cySrv })
        }
      }, [
        h(IconButton, {
          description: 'Downloads',
          icon: 'file_download'
        })
      ]),
      h(IconButton, {
        description: 'Fit to screen',
        onClick: () => cy.animate({
          fit: {
            padding: 25
          },
          easing: 'ease-in-out'
        }),
        isActive: false,
        icon: 'fullscreen'
      }),
      h(IconButton, {
        description: 'Reset arrangement',
        onClick: () => enrichmentLayout( cy ),
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