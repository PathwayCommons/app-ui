const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const Loader = require('react-loader');

const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const Icon = require('../../common/components').Icon;
const { ServerAPI } = require('../../services');

class Search extends React.Component {

  constructor(props) {
    super(props);

    const query = queryString.parse(props.location.search);

    this.state = {
      query: _.assign({
        q: '',
        gt: 1,
        lt: 250,
        type: 'Pathway',
        datasource: []
      }, query),
      landing: {
        name:'',
        fullName:'',
        synonyms:'',
        links:'',
        species:'',
        functions:'',
      },
      searchResults: [],
      loading: false,
      showFilters: false,
      dataSources: []
    };

    ServerAPI.datasources()
      .then(result => {
        this.setState({
          dataSources: Object.values(result)
        });
      });
  }

  getSearchResult() {
    const state = this.state;
    const query = state.query;
    query.type='Pathway';
    query.gt=1;
    if (query.q !== '') {
      this.setState({
        loading: true
      });
      ServerAPI.querySearch(query)
        .then(searchResults => {
          console.log(searchResults);
           this.setState({
             searchResults: searchResults,
             loading: false
           });
        });
    }
  }

  getLandingResult() {
    const state = this.state;
    console.log('hi3');
    const query = state.query;
    query.type='PhysicalEntity';
    query.gt=0;
    if (query.q !== '') {
      this.setState({
        loading: true
      });
      ServerAPI.querySearch(query)
        .then(searchResults => {
          console.log(searchResults);
           this.setState({
             landing:{
            name:searchResults[0].name,
            fullName:searchResults[0].name,
            synonyms:searchResults[0].name,
            links:searchResults[0].dataSource[0],
            species:searchResults[0].organism,
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
    if (!state.loading) {
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
    this.getLandingResult();
    console.log('hi');
    this.getSearchResult();
    console.log('hi2');
  }

  render() {
    const props = this.props;
    const state = this.state;
    
    let Example = props => h('span.search-example', {
      onClick: () => this.setAndSubmitSearchQuery({q: props.search})
    }, props.search);

    const searchResults = state.searchResults.map(result => {
      const dsInfo = _.find(state.dataSources, ds => {
        return ds.uri === result.dataSource[0];
      });
      console.log(dsInfo);
      return h('div.search-item', [
        h('div.search-item-icon',[
          h('img', {src: dsInfo.iconUrl})
        ]),
        h('div.search-item-content', [
          h(Link, { to: { pathname: '/view', search: queryString.stringify({ uri: result.uri }) }, target: '_blank' }, [
            h('h3.search-item-content-title', result.name || 'N/A'),
          ]),
          h('p.search-item-content-datasource', ` ${dsInfo.name}`),
          h('p.search-item-content-participants', `${result.numParticipants} Participants`)
        ])
      ]);
    });

    const searchTypeTabs = [
      { name: 'Pathways', value: 'Pathway' },
      // { name: 'Molecular Interactions', value: 'MolecularInteraction' },
      // { name: 'Reactions', value: 'Control' },
      // { name: 'Transcription/Translation', value: 'TemplateReactionRegulation' }
    ].map(searchType => {
      return h('div.search-option-item-container', [
        h('div', {
          onClick: e => this.setAndSubmitSearchQuery({ type: searchType.value }),
          className: classNames('search-option-item', { 'search-option-item-disabled': state.loading }, { 'search-option-item-active': state.query.type === searchType.value })
        }, [
            h('a', searchType.name)
          ])
      ]);
    });

    const searchResultInfo = state.showFilters ? h('div.search-filters', [
      h('select.search-datasource-filter', {
        value: state.query.datasource,
        onChange: e => this.setAndSubmitSearchQuery({ datasource: e.target.value })
      }, [
        h('option', { value: [] }, 'Any datasource')].concat(
          _.sortBy(state.dataSources, 'name').map(ds => h('option', { value: [ds.id] }, ds.name))
          )),
    ]) :
      h('div.search-hit-counter', `${state.searchResults.length} result${state.searchResults.length === 1 ? '' : 's'}`);

    const realaventInfo = ()=>{
      if(state.landing.name===''){
        return h('div');
      }
        return h('div.search-landing',[
            h('h1.search-landing-title',state.landing.name),
            h('ul.search-landing-list', [
              h('li.search-landing-item',[
                h('strong',state.landing.fullName)]),
              h('li.search-landing-item',[
                h('strong','Synonyms'),
                h('a',': ' + state.landing.synonyms)]),
              h('li.search-landing-item',{href: state.landing.links},[
                h('strong','Links'),
                h('a',{src:': ' + state.landing.links.slice(state.landing.links.lastIndexOf('/')+1),href: state.landing.links})
              ]), 
              h('li.search-landing-item',[
                h('strong','Species'),
                h('a',': ' + state.landing.species)]),
              h('li.search-landing-item',[
                h('strong','Functions'),
                h('a',': ' + state.landing.functions)])
            ])
        ]);
    };

    return h('div.search', [
      h('div.search-header-container', [
        h('div.search-header', [
          h('div.search-branding', [
            h('div.search-title', [
              h('a', { className: 'search-pc-link', href: 'http://www.pathwaycommons.org/' } , [
                h('i.search-logo')
              ]),
            ]),
            h('div.search-branding-descriptor', [
              h('h2.search-pc-title', 'Pathway Commons'),
              h('h1.search-search-title', 'Search')
            ])
          ]),
          h('div.search-searchbar-container', {
            ref: dom => this.searchBar = dom
          }, [
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
                    h(Icon, { icon: 'search' })
                  ])
                ])
              ]),
              h('div.search-suggestions', [
                'e.g. ',
                h(Example, {search: 'cell cycle'}), ', ',
                h(Example, {search: 'p53 MDM2'}), ', ',
                h(Example, {search: 'P04637'})
              ]),
              h('div.search-tabs', searchTypeTabs.concat([
                h('div', {
                  className: classNames('search-option-item', 'search-option-item-tools', { 'search-option-item-tools-active': state.showFilters }),
                  onClick: e => this.setState({ showFilters: !state.showFilters })
                }, [
                    h('a', 'Tools')
                  ])
              ]))
            ])
        ])
      ]),
      h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' } }, [
        h('div.search-list-container', [
          h('div.search-result-info', [searchResultInfo]),
          h(realaventInfo), 
          h('div.search-list', searchResults)
        ])
      ])
    ]);
  }
}

module.exports = Search;
