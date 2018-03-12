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
        gt: 0,
        lt: 250,
        type: 'Pathway',
        datasource: []
      }, query),
      landing: [],
      landingLoading: false,
      searchResults: [],
      loading: false,
      showFilters: false,
      landingShowMore: [false,false],
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
    if (query.q !== '') {
      this.setState({
        loading: true
      });
      this.getLandingResult();
      ServerAPI.querySearch(query)
        .then(searchResults => {
           this.setState({
             searchResults: searchResults,
             loading: false
           });
        });
    }
  }

  getLandingResult() {
    const state = this.state;
    const query = {
      q: state.query.q.trim(),
      type: 'ProteinReference',
      datasource: state.query.datasource,
      species: '9606'
    };
    if(query.q.includes(' ')){
      this.setState({   
        landingLoading: false,
        landing:[]
      });
      return;
    }
    this.setState({
      landingLoading: true
    },()=>{
      ServerAPI.findUniprotId(query).then(res=>{
        if(!_.isEmpty(res)){
          ServerAPI.getProteinInformation(res[0]).then(result=>{
            this.setState({
            landingLoading: false,
            landing:result,
            landingShowMore: [false,false],
            });
          });
        }
        else{
          this.setState({
            landingLoading: false,
            landing:[]
          });
        }
      });
    });
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
    this.getSearchResult();
  }

  render() {
    const props = this.props;
    const state = this.state;

    let Example = props => h('span.search-example', {
      onClick: () => this.setAndSubmitSearchQuery({q: props.search})
    }, props.search);

    const searchResults = state.searchResults.map(result => {
      const dsInfo =_.isEmpty(state.dataSources)? {iconUrl:null , name:''}: _.find(state.dataSources, ds => {
        return ds.uri === result.dataSource[0];
      });

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

    const landing = (state.landingLoading ) ?
      h('div.search-landing.innner',[h(Loader, { loaded:!state.landingLoading , options: { color: '#16A085',position:'relative', top: '15px' }})]):
      state.landing.map(box=>{

        const name = h('strong.search-landing-title',box.protein.recommendedName.fullName.value);
        let synonyms=null;
        if(_.hasIn(box,'protein.alternativeName')){ 
          const synonymsLength=115;
          const synonymsTextLong= box.protein.alternativeName.map(obj => obj.fullName.value).join(', ');
          const synonymsText= (state.landingShowMore[0]|| synonymsTextLong.length<=synonymsLength)?
            synonymsTextLong+' ': synonymsTextLong.slice(0,synonymsTextLong.lastIndexOf(',',synonymsLength))+' '; 
          synonyms=[h('i.search-landing-small',{key:'text'},synonymsText)];
          if(synonymsTextLong.length>synonymsLength){
            synonyms.push(
              h('i.search-landing-link',{onClick: e => this.setState({ landingShowMore: [!state.landingShowMore[0],state.landingShowMore[1]]}), 
                key:'showMore', className:classNames('search-landing-link','search-landing-small')},state.landingShowMore[0]? '« less': 'more »')
            );
          }
        }

        let functions=null;
        if(_.hasIn(box,'comments[0].text') && box.comments[0].type==='FUNCTION'){
          const functionsLength=280;
          const functionTextLong=box.comments[0].text[0].value;
          const functionText = (state.landingShowMore[1] || functionTextLong.length<=functionsLength)?
            functionTextLong: functionTextLong.slice(0,functionTextLong.lastIndexOf(' ',functionsLength));
          functions=[h('span.search-landing-function',{key:'text'},functionText)];
          if(functionTextLong.length>functionsLength){
            functions.push(
              h('span.search-landing-link',{onClick: e => this.setState({ landingShowMore: [state.landingShowMore[0],!state.landingShowMore[1]]}), key:'showMore'},
                state.landingShowMore[1]? '« less': 'more »')
            );
          }
        } 
        const ids = [box.accession,box.dbReferences.filter(entry =>entry.type=='HGNC')[0],box.dbReferences.filter(entry =>entry.type=='GeneID')[0]];
        let links=[{text:'UniProt', link:`http://www.uniprot.org/uniprot/${ids[0]}`}];
          if(ids[1]) {links.push({text:'HGNC',link:`https://www.genenames.org/cgi-bin/gene_symbol_report?hgnc_id=${ids[1].id}`});} 
          if(ids[2]) {links.push({text:'Entrez Gene',link:`https://www.ncbi.nlm.nih.gov/gene/${ids[2].id}`});}
        links=links.map(link=>{return h('a.search-landing-link',{key: link.text, href: link.link},link.text);});

        return h('div.search-landing.innner',{key: box.accession},[ 
          h('div.search-landing-section',[name]),
          h('div.search-landing-section',[synonyms]),
          h('div.search-landing-section',[functions]),
          h('div.search-landing-section',[links]),
          h(Link, { to: {pathname: '/interactions',search: queryString.stringify({ ID: box.accession })}, target: '_blank',className: 'search-landing-interactions'}, [
            h('button.search-landing-button', 'View Interactions'),
          ]),
        ]);    
      });

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
          h('div.search-landing',[searchResults.length?landing:'']), 
          h('div.search-list', searchResults)
        ])
      ])
    ]);
  }
}

module.exports = Search;
