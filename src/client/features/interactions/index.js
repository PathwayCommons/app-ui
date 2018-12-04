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
const { EmptyNetwork, PcLogoLink, CytoscapeNetwork } = require('../../common/components/');

const { interactionsStylesheet, interactionsLayoutOpts, bindEvents } = require('./cy');

const InteractionsMenu = require('./interactions-menu');

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
          loading: false
        });
        return;
      }

      cy.layout(_.assign({}, interactionsLayoutOpts( cy ), {
        stop: () => {
          this.setState({
            loading: false,
          });
        }
      })).run();
    };

    ServerAPI.getInteractionGraph({ sources: sources }).then( result => {
      initializeCytoscape( _.get(result, 'network', { nodes: [], edges: [] } ));
    });
  }

  componentWillUnmount(){
    this.state.cySrv.destroy();
  }

  render() {
    let { loading, cySrv, activeMenu, sources, networkEmpty } = this.state;
    let appBar = h('div.app-bar.interactions-bar', [
      h('div.app-bar-branding', [
        h(PcLogoLink),
        sources.length === 1 ?  h('div.app-bar-title', `Interactions between ${sources[0]} and top ${config.MAX_SIF_NODES} genes`):
        h('div.app-bar-title', `Interactions between ${ sources.slice(0, sources.length - 1).join(', ')} and ${sources.slice(-1)}`)
      ]),
      h(InteractionsToolbar, { cySrv, activeMenu, sources: this.state.sources, controller: this })
    ]);

    let interactionsLegend = h('div.interactions-legend', [
      h(InteractionsMenu, { cySrv } )
    ]);

    let content = !networkEmpty ? [
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
    ] : [ h(EmptyNetwork, { msg: 'No interactions to display', showPcLink: true} ) ];


    return h('div.interactions', content);
  }

}


module.exports = Interactions;