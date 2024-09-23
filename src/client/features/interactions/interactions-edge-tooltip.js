const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');

const { ServerAPI } = require('../../services/');
const INTERACTION_TYPES = require('./types');

class InteractionsEdgeTooltip extends React.Component {
  constructor(props){
    super(props);

    const edges = props.edge.parallelEdges();

    this.state = {
      publications: [],
      publicationsLoaded: false,
      parallelEdges: edges,
      selectedEdge: edges.length === 1 ? edges[0]: null
    };
  }

  componentDidMount() {
    if( this.state.selectedEdge ){
      this.getPublications( this.state.selectedEdge );
    }
  }

  getPublications(edge){
    let pubmedIds = edge.data('pubmedIds');

    this.setState({ publicationsLoaded: false }, () => {
      ServerAPI.getPubmedPublications(pubmedIds).then( publications => {
        this.setState({publications, publicationsLoaded: true});
      })
      .catch( () => this.setState({ publicationsLoaded: true }) ); // swallow;
    });
  }

  selectEdge(edge){
    this.setState({ selectedEdge: edge });

    this.getPublications(edge);
  }

  deselectEdge(){
    this.setState({ selectedEdge: null });
  }

  renderEdge(){
    let { selectedEdge: edge, parallelEdges, publicationsLoaded, publications } = this.state;

    let title = edge.data('id');
    let datasources = edge.data('datasources');
    let pcIds = edge.data('pcIds');

    if( !publicationsLoaded ){
      return h('div.cy-tooltip', [
        h('div.cy-tooltip-content', [
          h('div.cy-tooltip-header',[
            h('h2.cy-tooltip-title', 'Loading...')
          ]),
          h('div.cy-tooltip-body', [
            h('div.cy-tooltip-loading-section', [
              h('i.icon.icon-spinner')
            ])
          ])
        ])
      ]);
    }

    let providersList = datasources.map( ds => h('div', ds));

    let publicationList = publications.map( publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div.cy-overflow-content', [
        h('a.plain-link', { href: 'http://bioregistry.io/pubmed:' + id, target: '_blank' }, title),
        h('div', firstAuthor +  ' et al. | ' + source + ' - ' + new Date(date).getFullYear().toString())
      ]);
    });

    let detailedViewsList = pcIds.map( (pcId, index)  => {
      return h('a.plain-link.cy-tooltip-number-link', { href: '/pathways?' + queryString.stringify({ uri: pcId }), target: '_blank' }, ` ${index + 1} `);
    } );

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header', [
        parallelEdges.length > 1 ? h('button.plain-button.cy-tooltip-back', {
          onClick: () => this.deselectEdge()
        }, [
          //  h('i.material-icons', 'arrow_back') // does not work for some reason
          h('span', '<')
        ]) : null,
        h('h2.cy-tooltip-title', title)
      ].filter(el => el != null)),
      h('div.cy-tooltip-body', [
        providersList.length > 0 ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Data Sources'),
          h('div', providersList)
        ]) : null,
        publicationList.length > 0 ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Publications'),
          h('div', publicationList)
        ]) : null,
        detailedViewsList.length > 0 ? h('div.cy-tooltip-section', [
          h('div.cy-tooltip-field-name', 'Open a detailed view of this interaction'),
          h('div.cy-tooltip-links', detailedViewsList)
        ]) : null,
        // h('div.cy-tooltip-section', [
        //   h('div.cy-tooltip-field-name', 'Reactome Links'),
        //   h('div.cy-tooltip-field-value', reactomeIds)
        // ])
      ])
    ]);
  }

  renderEdgeChoice(){
    const { parallelEdges: edges } = this.state;
    let interactionTypeValues = Object.keys(INTERACTION_TYPES).map(k => INTERACTION_TYPES[k]);

    return h('div.cy-tooltip', [
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', 'Choose an interaction')
      ]),
      h('div.cy-tooltip-body', [
        h('div.cy-tooltip-edge-entries', edges.map(edge => h('div.cy-tooltip-edge-entry', [
          h('a.plain-link.cy-tooltip-edge-link', {
            onClick: () => this.selectEdge(edge)
          }, [
            h('span.cy-tooltip-edge-color', {
              className: 'interactions-color-' + interactionTypeValues.find(type => edge.hasClass(type)).toLowerCase()
            }),
            h('span.cy-tooltip-edge-name', edge.id())
          ])
        ])))
      ])
    ]);
  }

  render(){
    let { selectedEdge } = this.state;

    if( selectedEdge ){
      return this.renderEdge();
    } else {
      return this.renderEdgeChoice();
    }
  }
}

module.exports = InteractionsEdgeTooltip;