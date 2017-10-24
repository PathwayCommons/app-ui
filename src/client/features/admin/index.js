const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const Icon = require('../../common/components').Icon;
const PathwayCommonsService = require('../../services').PathwayCommonsService;
const CDC = require('../../services/index.js').CDC;

class Admin extends React.Component {
  
  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);

    this.state = {
      query: _.assign({q: '', gt: 2, lt: 250, type: 'Pathway'}, query),
      searchResults: [],
      editLinks: [],
      dataSources: []
    };

    PathwayCommonsService.datasources()
    .then(result => this.setState({
      dataSources: result
      })
    );

    this.updateEditLinks = this.updateEditLinks.bind(this);
  }

  updateEditLinks(editURI) {
    const editLinkObj = this.deconstructEditURI(editURI);
    var editLinks = this.state.editLinks;
    editLinks[editLinkObj.uri] = editLinkObj.editkey;
    this.setState({
      editLinks: editLinks
    });
  }

  deconstructEditURI(editURI) {
    const id = '&editkey=';
    const uri = editURI.substring(0, editURI.indexOf(id));
    const editkey = editURI.substring(editURI.indexOf(id) + id.length, editURI.length);
    return {uri: uri, editkey: editkey};
  }
  
  getSearchResult() {
    const state = this.state;
    const query = state.query;

    if (query.q !== '') {
      PathwayCommonsService.querySearch(query)
      .then(searchResults => {
        this.setState({searchResults: searchResults}, () => {
          CDC.initEditLinkSocket(this.updateEditLinks);
          for (var i = 0; i < searchResults.length; i++) {
            CDC.requestEditLink(searchResults[i].uri, 'latest');
          }
        });
      });
    }
  }

  componentDidMount() {
    this.getSearchResult();
  }

  onSearchValueChange(e) {
    // if the user presses enter, submit the query
    if (e.which && e.which ===  13) {
      this.submitSearchQuery(e);
    } else {
      const newQueryState = _.assign({}, this.state.query);
      newQueryState.q = e.target.value;
      this.setState({query: newQueryState});
    }
  }

  setQueryType(e, type) {
    const newQueryState = _.assign({}, this.state.query);
    newQueryState.type = type;
    this.setState({query: newQueryState}, function () { this.submitSearchQuery(); });
  }

  submitSearchQuery() {
    const props = this.props;
    const state = this.state;

    const query = state.query;
    const uriRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;

    if (query.q.match(uriRegex)) {
      CDC.initEditLinkSocket((editLink) => {
        const editLinkObj = this.deconstructEditURI(editLink);
        props.history.push({
          pathname: '/view',
          search: queryString.stringify({uri: editLinkObj.uri, editkey: editLinkObj.editkey}),
          state: {}
        });
      });
      CDC.requestEditLink(query.q, 'latest');
    } else {
      props.history.push({
        pathname: '/admin',
        search: queryString.stringify(query),
        state: {}
      });

      this.getSearchResult();
    }
  }

  render() {
    const props = this.props;
    const state = this.state;

    const searchResults = state.searchResults.map(result => {
      const dsInfo = _.find(state.dataSources, ds => {
        return ds.uri === result.dataSource[0];
      });

      return h('div.search-item', [
        h('div.search-item-icon', [
          h('img', {src: dsInfo.iconUrl})
        ]),
        h('div.search-item-content', [
          h('h3.search-item-content-title .admin-search-item-content-title', result.name  || 'N/A'),
          h('h3.search-item-admin-links', [
            (state.editLinks[result.uri] ? 
              h(Link, {to: {pathname: '/view', search: queryString.stringify({uri: result.uri, editkey: state.editLinks[result.uri]})}, target: '_blank'}, [
                h('h3.search-item-content-title', 'Edit'),
              ])
              :
              'Edit Link Missing'
            ),
            ' | ',
            h(Link, {to: {pathname: '/view', search: queryString.stringify({uri: result.uri})}, target: '_blank'}, [
              h('h3.search-item-content-title', 'Read-only'),
            ])
          ]),
          h('p.search-item-content-datasource', ` ${dsInfo.name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ])
      ]);
    });

    const searchTypes = [
      { name: 'Pathways', value: 'Pathway' },
      { name: 'Catalysis', value: 'Catalysis' },
      { name: 'Molecular Interactions', value: 'MolecularInteraction' },
      { name: 'Transcription/Translation', value: 'TemplateReactionRegulation' }
    ];

    const searchTypeTabs = searchTypes.map(searchType => {
      return h('div', {
        onClick: e => this.setQueryType(e, searchType.value),
        className: classNames('search-option-item', state.query.type === searchType.value ? 'search-option-item-active' : '')
      }, [
        h('a', searchType.name)
      ]);
    });

    return h('div.search', [
      h('div.search-header-container', [
        h('div.search-header', [
          h(Link, { className: 'a.search-pc-link', to: {pathname: '/'} }, [
            h('i.search-logo')
          ]),
          h(Link, { className: 'search-pc-title', to: {pathname: '/'} }, [
            h('h2', 'Pathway'),
            h('h2', 'Commons')
          ]),
          h('div.search-searchbar-container', [
            h('div.search-searchbar', [
              h('input', {
                type: 'text',
                placeholder: 'Enter pathway name or gene names',
                value: state.query.q,
                onChange: e => this.onSearchValueChange(e),
                onKeyPress: e => this.onSearchValueChange(e)
              }),
              h('div.search-search-button', [
                h('button', { onClick: e => this.submitSearchQuery(e) }, [
                  h(Icon, {icon: 'search'})
                ])
              ])
            ]),
            h('div.search-tabs', searchTypeTabs)
          ])
        ])
      ]),
      h('div.search-list-container', [
        h('div.search-hit-counter', `${state.searchResults.length} results. ${Object.keys(state.editLinks).length} edit keys retrieved.`),
        h('div.search-list', searchResults)
      ])
    ]);
  }
}
  
module.exports = Admin;