const React = require('react');
const h = require('react-hyperscript');
const Loader = require('react-loader');
const classNames = require('classnames');

const CytoscapeService = require('../../common/cy/');
const { ServerAPI } = require('../../services/');

const PathwaysToolbar = require('./pathways-toolbar');
const { PcLogoLink, EmptyNetwork, CytoscapeNetwork } = require('../../common/components/');

const Pathway = require('../../../models/pathway/pathway-model');

const { stylesheet, bindCyEvents, PATHWAYS_LAYOUT_OPTS } = require('./cy');

const { TimeoutError } = require('../../../util');
const { ErrorMessage } = require('../../common/components/error-message');

class Pathways extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cySrv: new CytoscapeService({ style: stylesheet, onMount: bindCyEvents }),
      pathway: new Pathway(),
      activeMenu: 'closeMenu',
      loading: true,
      networkEmpty: false
    };

    if( process.env.NODE_ENV !== 'production' ){
      this.state.cySrv.getPromise().then(cy => window.cy = cy);
    }
  }

  // onMount prop passed to CytoscapeNetwork
  // called after CytoscapeNetwork has mounted
  loadPathway(){
    let { pathway, cySrv} = this.state;
    let { apiOpts } = this.props;

    let initializeCytoscape = pathway => {

      let cy = cySrv.get();
      cy.remove('*');
      cy.add( pathway.cyJson() );

      let layout = cy.layout(PATHWAYS_LAYOUT_OPTS);
      layout.on('layoutstop', () => {
        this.setState({
          loading: false,
          pathway: pathway
        });
      });
      layout.run();
    };

    ServerAPI.getAPIResource( apiOpts ).then( pathwayJSON => {
      if( pathwayJSON.graph.nodes.length === 0 ){
        this.setState({
          networkEmpty: true,
          loading: true
        });
        return;
      }
      pathway.load( pathwayJSON );
      initializeCytoscape( pathway );
    })
    .catch( e => this.setState({ error: e }))
    // .finally( this.setState({ loading: false }))
    ;
  }

  render() {
    let { loading, pathway, cySrv, networkEmpty, error } = this.state;

    let errorMessage;
    if( networkEmpty ) {
      errorMessage = h(ErrorMessage, { title: 'No pathway data available. Please view another result', footer: null } );
    } else if( error instanceof TimeoutError ) {
      errorMessage = h( ErrorMessage, { title: 'This is taking longer that we expected', body: 'Try again later.', logo: true } );
    } else if( error ) {
      errorMessage = h( ErrorMessage, { logo: true } );
    }

    let appBar = h('div.app-bar', [
      h('div.app-bar-branding', [
        h(PcLogoLink),
        h('div.app-bar-title', [
          h('span', pathway.name() + ' | '),
          h('a.plain-link', { href: pathway.datasourceUrl(), target: '_blank' }, ' ' + pathway.datasource())
        ])
      ]),
      h(PathwaysToolbar, { cySrv, pathway })
    ]);

    let content = !errorMessage ? [
      h(Loader, { loaded: !loading, options: { left: '50%', color: '#16a085' }}, [ appBar ]),
      h(CytoscapeNetwork, {
        cySrv,
        onMount: () => this.loadPathway(),
        className: classNames({
        'network-loading': loading
        })
      })
    ] : [ errorMessage ];

    return h('div.pathways', content);
  }

}


module.exports = Pathways;