const React = require('react');
const h = require('react-hyperscript');
const queryString = require('query-string');


const { ServerAPI } = require('../../services');

class InteractionsEdgeTooltip extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      publications: []
    };
  }

  componentDidMount(){
    let { edge } = this.props;
    let pubmedIds = edge.data('pubmedIds');

    ServerAPI.getPubmedPublications(pubmedIds).then( publications => {
      this.setState({publications});
    });
  }

  render(){
    let { edge } = this.props;
    let { publications } = this.state;
    let title = edge.data('id');
    let pcIds = edge.data('pcIds');

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
      h('div.cy-tooltip-header',[
        h('h2.cy-tooltip-title', title)
      ]),
      h('div.cy-tooltip-body', [
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
}

module.exports = InteractionsEdgeTooltip;