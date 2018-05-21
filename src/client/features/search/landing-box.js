const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const queryString = require('query-string');
const { ServerAPI } = require('../../services');
const databases = require('../../common/config').databases;
const Loader = require('react-loader');
const _ = require('lodash');
//usedDatabases=[['Uniprot lookup name',{configName:,gProfiler:}]]
const usedDatabases=new Map ([
  ['GeneCards',{configName:'Gene Cards',gProfiler:'HGNCSYMBOL'}],
  ['HGNC',{configName:'HGNC',gProfiler:'HGNC'}],
  ['GeneID',{configName:'NCBI Gene',gProfiler:'NCBIGene'}],
  ['Uniprot',{configName:'Uniprot',gProfiler:'Uniprot'}]
]);

const linkBuilder= (source,geneQuery)=>{
  let genes={};
  const geneArray=geneQuery.geneInfo;
  genes.unrecognized=geneQuery.unrecognized;
  const duplicates = new Set();
  geneArray.forEach(gene=>{
    if(!duplicates.has(gene.convertedAlias)){
      genes[gene.initialAlias]={[source]:gene.convertedAlias};
      duplicates.add(gene.convertedAlias);
    }
  });
  return genes;
};

const pcFallback = (unrecognized,genes) => {
 return unrecognized.map(entry=>{
    if(!genes[entry]){
     return ServerAPI.pcQuery('search', {q:entry,type:'entityreference'}).then((search)=>{
        const ids = _.compact(search.searchHit.map(hit=>{
          hit =_.reverse(hit.uri.split('/'));
          return hit[1]==='uniprot' ? hit[0] : false;
        }));
        const duplicateCheck = _.compact(ids.map(id=>_.findKey(genes,{'Uniprot':id})));
        if(!_.isEmpty(ids) && _.isEmpty(duplicateCheck)){
          genes[entry]={'Uniprot': ids[0]};
        }
      });
    }
  });
};

const idToLinkConverter = (ids)  =>{
  const dbSet = databases.filter(databaseValue => ids[databaseValue.database]);
  return _.assign({},
    ...dbSet.map(database=>({[database.database]:database.url+database.search+ids[database.database].replace(/[^a-zA-Z0-9:]/g)}))
  );
};

const getNcbiInfo = (ids,genes) => {
  const ncbiIds=_.map(ids,(search,id)=>id);
  return ServerAPI.getGeneInformation(ncbiIds).then(result=>{
    const geneResults=result.result;
    return geneResults.uids.map(gene=>{
      const originalSearch = ids[gene];
      const links=idToLinkConverter(genes[originalSearch]);
      return {
        databaseID:gene,
        name:geneResults[gene].nomenclaturename,
        function: geneResults[gene].summary,
        hgncSymbol:genes[originalSearch]['Gene Cards'],
        otherNames: geneResults[gene].otheraliases ? geneResults[gene].otheraliases:'',
        showMore:{full:!(geneResults.uids.length>1),function:false,synonyms:false},
        links:links
      };
    });
  });
};

const getUniprotInfo= (ids,genes) => {
  const uniprotIds=_.map(ids,(search,id)=>id);
  return ServerAPI.getUniprotnformation(uniprotIds).then(result=>{
    return result.map(gene=>{
      let links={Uniprot:gene.accession};
      gene.dbReferences.forEach(db=>{
        if(usedDatabases.has(db.type)){
          _.assign(links,{[usedDatabases.get(db.type).configName]:db.id});
        }
      });
      const hgncSymbol = links['Gene Cards'];
      const duplicateCheck = _.findKey(genes,{'Gene Cards':hgncSymbol});
      if(!duplicateCheck || genes[duplicateCheck]['Uniprot']===gene.accession){
      links=idToLinkConverter(links);
        return {
          databaseID:gene.accession,
          name:gene.gene[0].name.value,
          function: gene.comments && gene.comments[0].type==='FUNCTION' ? gene.comments[0].text[0].value:'',
          hgncSymbol:hgncSymbol,
          showMore:{full:true,function:false,synonyms:false},
          links:links
        };
      }
      else{
        return;
      }
    });
  });
};
/*Gets info for a landing box
input: 'TP53'
output: [{
function:"This gene encodes ..."
id:"7157"
links:{Gene Cards:"http://identifiers.org/genecards/TP53"...}
name:"tumor protein p53"
showMore:{full:false,function:false,synonyms:false}
synonyms:"TP53, BCC7, LFS1, P53, TRP53"
}]
*/
const getLandingResult= (query)=> {
  const q=query.trim();
  const promises= [];
  usedDatabases.forEach((database)=>promises.push(
    ServerAPI.geneQuery({genes: q,target: database.gProfiler}).then(result=>linkBuilder(database.configName,result))
  ));
  return Promise.all(promises).then(values=>{
    let genes=values[0];
    _.tail(values).forEach(gene=>_.mergeWith(genes,gene,(objValue, srcValue)=>_.assign(objValue,srcValue)));
    return genes;
  }).then(genes=>Promise.all(pcFallback(genes.unrecognized,genes)).then(()=>genes)).then((genes)=>{
      let ncbiIds={},uniprotIds={};
      _.forEach(genes,(gene,search)=>{
        if(gene['NCBI Gene']){
          ncbiIds[gene['NCBI Gene']]=search;
        }
        else if(gene['Uniprot']){
          uniprotIds[gene['Uniprot']]=search;
        }
      });
      let landingBoxes=[];
       if(!_.isEmpty(ncbiIds)){
        landingBoxes.push(getNcbiInfo(ncbiIds,genes));
       }
       if(!_.isEmpty(uniprotIds)){
        landingBoxes.push(getUniprotInfo(uniprotIds,genes));
       }
      return Promise.all(landingBoxes).then(landingBoxes=> {
        landingBoxes=_.compact(_.flatten(landingBoxes));
        if(landingBoxes.length>1){landingBoxes.forEach(box=>box.showMore.full=false);}
        return landingBoxes;
      });
  });
};

const handelShowMoreClick= (controller,landing,varToToggle,index) => {
  landing[index].showMore[varToToggle]=!landing[index].showMore[varToToggle];
  controller.setState({ landing:landing });
};

const expandableText = (controller,landing,length,text,separator,type,cssClass,toggleVar,index)=>{
  let result = null;
  const varToToggle= landing[index].showMore[toggleVar];
  const textToUse= (varToToggle || text.length<=length)?
    text+' ': _.truncate(text,{length:length,separator:separator});
    result=[h(`${type}`,{className:cssClass,key:'text'},textToUse)];
  if(text.length>length){
    result.push(h(`${type}.search-landing-link`,{onClick: ()=> handelShowMoreClick(controller, landing, toggleVar, index),key:'showMore'},
    varToToggle ? '« less': 'more »'));
  }
  return result;
};

const interactionsLink = (source,text)=>
  h(Link, {to: { pathname: '/interactions',search: queryString.stringify({source: source})},
    target: '_blank', className: 'search-landing-interactions', key:'interactions'
  }, [h('button.search-landing-button', text)]);

/*Generates a landing box
input: {controller,[{
function:"This gene encodes ..."
databaseID:"7157"
hgncSymbol:TP53
otherNames:'...,...'
links:{Gene Cards:"http://identifiers.org/genecards/TP53"...}
name:"tumor protein p53"
showMore:{full:false,function:false,synonyms:false}
synonyms:"TP53, BCC7, LFS1, P53, TRP53"
}]}
output: html for a landing box
*/
const landingBox = (props) => {
  const landing=props.landing;
  const controller=props.controller;
  if (controller.state.landingLoading ) {
    return h('div.search-landing', [
      h('div.search-landing-innner',[
        h(Loader, { loaded:false , options: { color: '#16A085', position:'relative', top: '15px' }})]
      )]
    );
  }
  const landingHTML= landing.map((box,index)=>{
    const multipleBoxes = landing.length>1;
    const title = [h('strong.search-landing-title-text',{key:'name'},box.name),];
    if(multipleBoxes){
      title.push(h('strong.material-icons',{key:'arrow'},landing[index].showMore.full? 'expand_less': 'expand_more'));
    }
    let hgncSymbol='';
    if(box.hgncSymbol){
      hgncSymbol=h('i.search-landing-small','Official Symbol: '+box.hgncSymbol);
    }
    let otherNames=[];
    if(box.otherNames){
      otherNames=expandableText(controller,landing,16,'Other Names: '+box.otherNames,',','i','search-landing-small','synonyms',index);
    }
    let functions=[];
    if(box.function){
      functions=expandableText(controller,landing,360, box.function,".",'span','search-landing-function','function',index);
    }
    let links=[];
    _.forIn((box.links),(value,key)=>{
      links.push(h('a.search-landing-link',{key: key, href: value},key));
    });
    return [
      h('div.search-landing-title',{key:'title',
        onClick: () => {if(multipleBoxes){handelShowMoreClick(controller,landing, 'full', index);}},
        className:classNames('search-landing-title',{'search-landing-title-multiple':multipleBoxes}),
      },[title]),
      box.showMore.full &&
      h('div.search-landing-innner',{key: box.databaseID},[
        h('div.search-landing-section',{key: 'ids'},[hgncSymbol,otherNames]),
        h('div.search-landing-section',{key: 'functions'},[functions]),
        h('div.search-landing-section',{key: 'links'},[links]),
        interactionsLink(box.databaseID,'View Interactions')
      ])
    ];
  });
  if(landing.length>1){
    landingHTML.push(interactionsLink(landing.map(entry=>entry.databaseID),'View Interactions Between Entities'));
  }

  return h('div.search-landing',landingHTML);
};

module.exports = {getLandingResult,landingBox};
