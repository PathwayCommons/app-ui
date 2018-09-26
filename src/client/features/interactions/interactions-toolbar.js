
const React = require('react');
const ReactDom = require('react-dom');
const h = require('react-hyperscript');

const Popover = require('../../common/components/popover');
const IconButton = require('../../common/components/icon-button');

const { INTERACTIONS_LAYOUT_OPTS, searchInteractionNodes } = require('./cy');

const InteractionsDownloadMenu = require('./interactions-download-menu');

class InteractionsToolbar extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      searchValue: ''
    };
  }

  handleNodeSearchChange(searchVal){
    this.setState({ searchValue: searchVal }, () => searchInteractionNodes( this.props.cySrv.get(), searchVal));
  }

  focusNodeSearch(){
    ReactDom.findDOMNode(this).querySelector('.element-search-input').focus();
  }

  render(){
    let { cySrv } = this.props;
    let { searchValue } = this.state;
    let cy = cySrv.get();
    let sources = this.props.sources || ['download'];

    return h('div.app-toolbar', [
      h(Popover, {
        tippy: {
          position: 'bottom',
          html: h(InteractionsDownloadMenu, { cySrv, sources })
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
            eles: cy.nodes().filter( n => !n.hasClass('type-hidden') && !n.hasClass('metric-hidden')),
            padding: 25
          },
          easing: 'ease-in-out'
        }),
        isActive: false,
        icon: 'fullscreen'
      }),
      h(IconButton, {
        description: 'Reset arrangement',
        onClick: () => cy.layout(INTERACTIONS_LAYOUT_OPTS).run(),
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

module.exports = InteractionsToolbar;