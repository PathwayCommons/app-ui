const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');
const classNames = require('classnames');

const config = require('../../../config');
const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services/');

const InteractionsToolbar = require('./interactions-toolbar');
const { Popover, PcLogoLink, CytoscapeNetwork } = require('../../common/components/');

const { interactionsStylesheet, interactionsLayoutOpts, bindEvents } = require('./cy');
const { TimeoutError } = require('../../../util');
const { ErrorMessage } = require('../../common/components/error-message');

const MAX_ELEMENTS_CUTOFF = 3;
const LIST_ELEMENTS_SHOWN = MAX_ELEMENTS_CUTOFF - 1;

const InteractionsMenu = require('./interactions-menu');
const { Contribute } = require('../../common/components/contribute');

class Interactions extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: interactionsStylesheet, onMount: bindEvents }),
      loading: true,
      sources: _.uniq(queryString.parse(props.location.search).source.split(',')),
      networkEmpty: false
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  loadInteractionsNetwork(){
    let { cySrv, sources } = this.state;
    let initializeCytoscape = network => {

      let cy = cySrv.get();
      cy.remove('*');
      cy.add( network );

      if( network.nodes.length === 0 ){
        this.setState({
          networkEmpty: true,
          loading: false,
          error: null
        });
        return;
      }

      cy.layout(_.assign({}, interactionsLayoutOpts( cy ), {
        stop: () => {
          this.setState({
            loading: false,
            error: null
          });
        }
      })).run();
    };

    ServerAPI.getInteractionGraph({ sources: sources })
    .then( result => {
      initializeCytoscape( _.get(result, 'network', { nodes: [], edges: [] } ));
      return null; //http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it
    })
    .catch( e => this.setState({ error: e }));
  }

  componentWillUnmount(){
    this.state.cySrv.destroy();
  }

  render() {
    let { loading, cySrv, activeMenu, sources, networkEmpty, error } = this.state;
    let errorMessage;
    if( networkEmpty ) {
      errorMessage = h(ErrorMessage, { title: 'No interactions to display.', body: 'Try different genes in your search.' , footer: null, logo: true } );
    } else if( error instanceof TimeoutError ) {
      errorMessage = h( ErrorMessage, { title: 'This is taking longer than expected', body: 'Try again later.', logo: true } );
    } else if( error ) {
      errorMessage = h( ErrorMessage, { logo: true } );
    }

    let titleContent = [];
    if( sources.length === 1 ){
      titleContent.push(h('span', `Interactions between ${sources[0]} and ${config.MAX_SIF_NODES} other genes`));
    }
    if( 1 < sources.length && sources.length <= MAX_ELEMENTS_CUTOFF ){
      titleContent.push(h('span', `Interactions between ${ sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`));
    }
    if( sources.length > MAX_ELEMENTS_CUTOFF ){
      titleContent.push(h('span', `Interactions between ${ sources.slice(0, LIST_ELEMENTS_SHOWN).join(', ')} and `));
      titleContent.push(h(Popover, {
        tippy: {
          position: 'bottom',
          html: h('div.enrichment-sources-popover', sources.slice(LIST_ELEMENTS_SHOWN).sort().map( s => h('div', s) ) )
        },
      }, [ h('a.plain-link.enrichment-popover-link', `${sources.length - LIST_ELEMENTS_SHOWN} other gene(s)`) ]
      ));
    }

    let appBar = h('div.app-bar.interactions-bar', [
      h('div.app-bar-branding', [
        h(PcLogoLink),
        h('div.app-bar-title', titleContent)
      ]),
      h(InteractionsToolbar, { cySrv, activeMenu, sources: this.state.sources, controller: this }),
      h(Contribute, { message: 'Add my interactions' })
    ]);

    let interactionsLegend = h('div.interactions-legend', [
      h(InteractionsMenu, { cySrv } )
    ]);

    let content = !errorMessage ? [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [
        appBar,
        interactionsLegend
      ]),
      h(CytoscapeNetwork, {
        cySrv,
        onMount: () => this.loadInteractionsNetwork(),
        className: classNames({
        'network-loading': loading
        })
      })
    ] : [ errorMessage ];


    return h('div.interactions', content);
  }

}


module.exports = Interactions;