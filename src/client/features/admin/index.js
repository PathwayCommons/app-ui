const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const queryString = require('query-string');
const _ = require('lodash');

const Icon = require('../../common/components').Icon;
const PathwayCommonsService = require('../../services').PathwayCommonsService;
const CDC = require('../../services/index.js').CDC;

class Admin extends React.Component {
  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);

    this.state = {
      query: _.assign({q: '', gt: 3, lt: 250, type: 'Pathway'}, query),
      searchResults: [],
      editLinks: [],
      dataSources: PathwayCommonsService.datasources()
    };

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
    console.log(e.target.value);
    // if the user presses enter, submit the query
    if (e.which && e.which ===  13) {
      this.submitSearchQuery(e);
    } else {
      const newQueryState = _.assign({}, this.state.query);
      newQueryState.q = e.target.value;
      this.setState({query: newQueryState});
    }
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

      const editkey = state.editLinks[result.uri];

      var searchItemContent = [];
      if (editkey) {
        searchItemContent = [
          h('p.search-item-content-name', result.name),
          h(Link, {to: {pathname: '/view', search: queryString.stringify({uri: result.uri, editkey: editkey})}, target: '_blank'}, [
            h('h3.search-item-content-title', 'Edit'),
          ]),
          h(Link, {to: {pathname: '/view', search: queryString.stringify({uri: result.uri})}, target: '_blank'}, [
            h('h3.search-item-content-title', 'Read-only'),
          ]),
          h('p.search-item-content-datasource', ` ${dsInfo.name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ];
      } else {
        searchItemContent = [
          h('p.search-item-content-name', result.name),
          h(Link, {to: {pathname: '/view', search: queryString.stringify({uri: result.uri})}, target: '_blank'}, [
            h('h3.search-item-content-title', 'Read-only'),
          ]),
          h('p.search-item-content-datasource', ` ${dsInfo.name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ];
      }

      return h('div.search-item', [
        h('img.search-item-icon', {src: dsInfo.iconUrl}),
        h('div.search-item-content', searchItemContent)
      ]);
    });

    return h('div.search', [
      h('div.search-header-container', [
        h('div.search-header', [
          h(Link, { className: 'a.search-pc-link', to: {pathname: '/'} }, [
            h('i.search-logo')
          ]),
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
          ])
        ])
      ]),
      h('div.search-list-container', [
        h('div.search-options', [
          h('div.search-hit-counter', `${state.searchResults.length} results. ${Object.keys(state.editLinks).length} have edit links.`)
        ]),
        h('div.search-list', searchResults)
      ])
    ]);
  }
}

module.exports = Admin;