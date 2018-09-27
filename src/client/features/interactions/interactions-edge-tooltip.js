const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');

const { ServerAPI } = require('../../services/');
const INTERACTION_TYPES = require('./types');

class InteractionsEdgeTooltip extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      publications: [],
      parallelEdges: props.edge.parallelEdges()
    };
  }

  getPublications(edge){
    let pubmedIds = edge.data('pubmedIds');

    ServerAPI.getPubmedPublications(pubmedIds).then( publications => {
      this.setState({publications});
    });
  }

  selectEdge(edge){
    this.setState({ selectedEdge: edge });

    this.getPublications(edge);
  }

  deselectEdge(){
    this.setState({ selectedEdge: null });
  }

  renderEdge(edge, publications = []){
    let { parallelEdges } = this.state;

    let title = edge.data('id');
    let datasources = edge.data('datasources');
    let pcIds = edge.data('pcIds');

    let providersList = datasources.map( ds => h('div', ds));

    let publicationList = publications.map( publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div.cy-overflow-content', [
        h('a.plain-link', { href: 'http://identifiers.org/pubmed/' + id, target: '_blank' }, title),
        h('div', firstAuthor +  ' et al. | ' + source + ' - ' + new Date(date).getFullYear().toString())
      ]);
    });

    let detailedViewsList = pcIds.map( (pcId, index)  => {
      return h('a.plain-link', { href: '/pathways?' + queryString.stringify({ uri: pcId }), target: '_blank' }, `[ ${index + 1} ]`);
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
          h('div.cy-tooltip-field-name', 'Pathway Links'),
          h('div.cy-tooltip-links', detailedViewsList)
        ]) : null,
        // h('div.cy-tooltip-section', [
        //   h('div.cy-tooltip-field-name', 'Reactome Links'),
        //   h('div.cy-tooltip-field-value', reactomeIds)
        // ])
      ])
    ]);
  }

  renderEdgeChoice(edges){
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
    let { publications, selectedEdge, parallelEdges } = this.state;

    if( selectedEdge ){
      return this.renderEdge(selectedEdge, publications);
    } else {
      if( parallelEdges.length === 1 ){
        return this.renderEdge(parallelEdges[0], []);
      } else {
        return this.renderEdgeChoice(parallelEdges);
      }
    }
  }
}

module.exports = InteractionsEdgeTooltip;