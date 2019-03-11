const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const Loader = require('react-loader');
const classNames = require('classnames');
const queryString = require('query-string');

const EnrichmentToolbar = require('./enrichment-toolbar');
const { PcLogoLink, CytoscapeNetwork, Popover } = require('../../common/components/');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services');

const { enrichmentLayout, enrichmentStylesheet, bindEvents } = require('./cy');
const { TimeoutError } = require('../../../util');
const { ErrorMessage } = require('../../common/components/error-message');

const MAX_ELEMENTS_CUTOFF = 3;
const LIST_ELEMENTS_SHOWN = MAX_ELEMENTS_CUTOFF - 1;

class Enrichment extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: enrichmentStylesheet, onMount: bindEvents }),
      sources: _.uniq(queryString.parse(props.location.search).source.split(',')),
      error: null,
      loading: true,
      networkEmpty: false
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  componentDidMount(){
    this.loadEnrichment();
  }

  loadEnrichment(){
    let { sources, cySrv } = this.state;
    let cy = cySrv.get();

    let getNetworkJson = async () => {
      try {
        let { pathways } = await ServerAPI.enrichmentAPI({ query: sources}, 'analysis');
        let enrichmentNetwork = await ServerAPI.enrichmentAPI({ pathways }, 'visualization');
        let networkHasZeroNodes = enrichmentNetwork.graph.elements.nodes.length === 0;

        cy.remove('*');
        cy.add({
          edges: enrichmentNetwork.graph.elements.edges,
          nodes: enrichmentNetwork.graph.elements.nodes
        });

        enrichmentLayout( cy ).then ( () => {
          this.setState({
            loading: false,
            networkEmpty: networkHasZeroNodes
          });
        });
      } catch( e ){
        this.setState({
          error: e,
          loading: false
        });
      }
    };

    this.setState({ loading: true, networkEmpty: false }, () => getNetworkJson());
  }

  render(){
    let { loading, cySrv, networkEmpty, sources, error } = this.state;
    let titleContent = [];

    let errorMessage;
    if( networkEmpty ) {
      errorMessage = h(ErrorMessage, { title: 'No results to display.', body: 'Try different genes in your search.' , footer: null, logo: true } );
    } else if( error instanceof TimeoutError ) {
      errorMessage = h( ErrorMessage, { title: 'This is taking longer than expected', body: 'Try again later.', logo: true } );
    } else if( error ) {
      errorMessage = h( ErrorMessage, { logo: true } );
    }

    if( sources.length === 1 ){
      titleContent.push(h('span', `Pathways enriched for ${sources[0]}`));
    }
    if( 1 < sources.length && sources.length <= MAX_ELEMENTS_CUTOFF ){
      titleContent.push(h('span', `Pathways enriched for ${ sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`));
    }
    if( sources.length > MAX_ELEMENTS_CUTOFF ){
      titleContent.push(h('span', `Pathways enriched for ${ sources.slice(0, LIST_ELEMENTS_SHOWN).join(', ')} and `));
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
      h(EnrichmentToolbar, { cySrv, sources: this.state.sources, controller: this })
    ]);

    return !errorMessage ? h('div.enrichment', [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [
        appBar
       ]),
      h(CytoscapeNetwork, {
        cySrv,
        className: classNames({'network-loading': loading})
      })
    ]) : errorMessage;
  }
}

module.exports = Enrichment;