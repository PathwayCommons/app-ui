const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const Loader = require('react-loader');

const queryString = require('query-string');
const _ = require('lodash');
const classNames = require('classnames');

const Icon = require('../../common/components').Icon;
const { ServerAPI } = require('../../services');
const databases = require('../../common/config').databases;

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
      genes: state.query.q.trim(),
      target: 'UNIPROT',
    };
    this.setState({
      landingLoading: true
    });
      ServerAPI.geneQuery(query).then(res=>{
        res=res.geneInfo;
        if(!_.isEmpty(res)){
          const ids=res.map(gene=>gene.convertedAlias).join(',');
          ServerAPI.getProteinInformation(ids).then(result=>{
            const landing=result.map(gene=>{ 
              let links=_.mapValues( _.pickBy({'Uniprot':{id:gene.accession},//to match the format the other 2 links are in
              'HGNC':gene.dbReferences.filter(entry =>entry.type=='HGNC')[0],
              'NCBI Gene':gene.dbReferences.filter(entry =>entry.type=='GeneID')[0],
              'Gene Cards':gene.dbReferences.filter(entry =>entry.type=='GeneCards')[0]}),
              (value,key)=>{
                let link = databases.filter(databaseValue => key.toUpperCase() === databaseValue[0].toUpperCase());
                  return link[0][1] + link[0][2] + value.id;
                });

              return {
                accession:gene.accession,
                name:gene.protein.recommendedName.fullName.value,
                function: gene.comments[0].type==='FUNCTION' && gene.comments[0].text[0].value,
                synonyms: _.hasIn(gene,'protein.alternativeName') && gene.protein.alternativeName.map(obj => obj.fullName.value).join(', '),
                showMore:{full:!(result.length>1),function:false,synonyms:false},
                links:links
              };});

            this.setState({
            landingLoading: false,
            landing:landing,
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

    const handelShowMoreClick= (varToToggle,index) => {
      const landing=state.landing;
      landing[index].showMore[varToToggle]=!landing[index].showMore[varToToggle];
      this.setState({ landing:landing }); 
    };

    const expandableText = (length,text,charToCutOn,type,cssClass,toggleVar,index)=>{
      let result = null;
      const varToToggle= state.landing[index].showMore[toggleVar];
      const textToUse= (varToToggle|| text.length<=length)?
        text+' ': text.slice(0,text.lastIndexOf(charToCutOn,length))+' '; 
        result=[h(`${type}`,{className:cssClass,key:'text'},textToUse)];
      if(text.length>length){
        result.push(h(`${type}.search-landing-link`,{onClick: ()=> handelShowMoreClick(toggleVar,index),key:'showMore'},
        varToToggle ? '« less': 'more »'));
      }
      return result;
    };
    
    const landing = (state.landingLoading ) ?
      h('div.search-landing-innner',[h(Loader, { loaded:false , options: { color: '#16A085',position:'relative', top: '15px' }})]):
      state.landing.map((box,index)=>{
        const multipleBoxes = state.landing.length>1;
        const title = [h('strong',{key:'name'},box.name),];
        if(multipleBoxes){
          title.push(h('strong.material-icons',{key:'arrow'},state.landing[index].showMore.full? 'expand_less': 'expand_more'));
        }

        let synonyms=[];
        if(box.synonyms){ 
          synonyms=expandableText(112, box.synonyms,',','i','search-landing-small','synonyms',index);
        }

        let functions=[];
        if(box.function){
          functions=expandableText(270, box.function,' ','span','search-landing-function','function',index);
        } 

        let links=[];
        _.forIn((box.links),(value,key)=>{
          links.push(h('a.search-landing-link',{key: key, href: value},key));
        });

        return [ 
          h('div.search-landing-title',{key:'title',
            onClick: () => {if(multipleBoxes){handelShowMoreClick('full',index);}},
            className:classNames('search-landing-title',{'search-landing-title-multiple':multipleBoxes}),
            },[title]),  
          box.showMore.full && 
          h('div.search-landing-innner',{key: box.accession},[ 
          h('div.search-landing-section',{key: 'synonyms'},[synonyms]),
          h('div.search-landing-section',{key: 'functions'},[functions]),
          h('div.search-landing-section',{key: 'links'},[links]),
          h(Link, { to: { pathname: '/interactions',search: queryString.stringify({ id: box.accession, kind:'NEIGHBORHOOD' })}, 
            target: '_blank',className: 'search-landing-interactions', key:'interactions' }, [
            h('button.search-landing-button', `View Interactions With ${box.name}`),
          ])])
        ];    
      });
      if(state.landing.length>1 && !state.landingLoading){
        landing.push(h(Link, { to: { pathname: '/interactions',search: queryString.stringify({ id: state.landing.map(entry=>entry.accession), kind:'PATHSBETWEEN' })}, 
        target: '_blank',className: 'search-landing-interactions', key:'interactions' }, [
        h('button.search-landing-button', 'View Interactions Between Entities'),
      ]));
      }

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
