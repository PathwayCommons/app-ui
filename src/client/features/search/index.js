const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const Loader = require('react-loader');

const queryString = require('query-string');
const _ = require('lodash');

const { ServerAPI } = require('../../services');

const PcLogoLink = require('../../common/components/pc-logo-link');

const { PathwayResultsView } = require('./pathway-results-view');
const { GeneResultsView } = require('./gene-results-view');
const { TimeoutError } = require('../../../util');
const { ErrorMessage } = require('../../common/components/error-message');

class Search extends React.Component {

  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);

    this.state = {
      query: _.assign({
        q: '',
        type: 'Pathway',
        datasource: []
      }, query),
      geneResults: null,
      searchHits: null,
      dataSources: [],
      loading: false,
      error: null
    };
  }

  getSearchResult() {
    const state = this.state;
    const query = state.query;

    if (query.q !== '') {
      this.setState({
        loading: true,
      });
      ServerAPI.search( query ).then( res => {
        let { genes, searchHits, dataSources } = res;
        this.setState({
          geneResults: genes,
          searchHits,
          dataSources,
          loading: false
         });
        return null; // Bluebird warning
      })
      .catch( e => this.setState({ error: e, loading: false }));
    }
  }

  componentDidMount() {
    this.getSearchResult();
  }

  onSearchValueChange(e) {
    // if the user presses enter, submit the query
    if (e.which && e.which === 13) {
      this.submitSearchQuery(e);
    } else {
      const newQueryState = _.assign({}, this.state.query);
      newQueryState.q = e.target.value;
      this.setState({ query: newQueryState });
    }
  }

  setAndSubmitSearchQuery(query) {
    const state = this.state;
    if (!state.searchLoading) {
      const newQueryState = _.assign({}, state.query, query);
      this.setState({ query: newQueryState }, () => this.submitSearchQuery());
    }
  }

  submitSearchQuery() {
    const props = this.props;
    const state = this.state;
    const query = state.query;

    props.history.push({
      pathname: '/search',
      search: queryString.stringify(query),
      state: {}
    });
    this.getSearchResult();
  }

  componentWillReceiveProps (nextProps) {
    const nextSearch = nextProps.location.search;
    if( this.props.location.search !==  nextSearch){
      this.setState({
        query: _.assign({
          q: '',
          gt: 0,
          lt: 250,
          type: 'Pathway',
          datasource: []
          }, queryString.parse(nextSearch))} , ()=>{
            this.getSearchResult();
          });
    }
  }

  render() {
    let { geneResults, searchHits, query, loading, dataSources } = this.state;

    const searchListing = h(Loader, { loaded: !loading, options: { left: '50%', color: '#16A085' } }, [
      h('div', [
        h(GeneResultsView, { geneResults } ),
        h(PathwayResultsView, { searchHits, query, controller: this, dataSources})
      ])
    ]);

    let errorMessage;
    if( this.props.notFoundError ) {
      errorMessage = h( ErrorMessage, { title: 'We couldn\'t find the resource you are looking for', body: 'Check the location and try again.' } );
    } else if( this.state.error instanceof TimeoutError ) {
      errorMessage = h( ErrorMessage, { title: 'This is taking longer than expected', body: 'Try again later.' }  );
    } else if( this.state.error ) {
      errorMessage = h( ErrorMessage );
    }
    let searchBody = errorMessage ? errorMessage : searchListing;

    return h('div.search', [
      h('div.search-header', [
        h('div.search-branding', [
          h(PcLogoLink, { className: 'search-logo'} ),
          h('div.search-branding-descriptor', [
            h('h2.search-subtitle', 'Pathway Commons'),
            h('h1.search-title', 'Search')
          ])
        ]),
        h('div.search-searchbar-container', {
          ref: dom => this.searchBar = dom
        }, [
          h('div.search-searchbar', [
            h('input', {
              type: 'text',
              placeholder: 'Enter pathway name or gene names',
              value: query.q,
              maxLength: 250, // 250 chars max of user input
              onChange: e => this.onSearchValueChange(e),
              onKeyPress: e => this.onSearchValueChange(e)
            }),
            h(Link, { to: { pathname: '/search', search: queryString.stringify(query)},className:"search-search-button"}, [
              h('i.material-icons', 'search')
            ])
          ]),
          h('div.search-suggestions', [
            'e.g. ',
            h(Link, { to: { pathname: '/search', search: queryString.stringify(_.assign({}, query, {q: 'cell cycle'})) }}, 'cell cycle, '),
            h(Link, { to: { pathname: '/search', search: queryString.stringify(_.assign({}, query, {q: 'pcna xrcc2 xrcc3 rad50 rad51'})) }}, 'pcna xrcc2 xrcc3 rad50 rad51, '),
            h(Link, { to: { pathname: '/search', search: queryString.stringify(_.assign({}, query, {q: 'P12004'})) }}, 'P12004')
          ])
        ])
      ]),
      h('div.search-body', [searchBody])
    ]);
  }
}

module.exports = Search;
