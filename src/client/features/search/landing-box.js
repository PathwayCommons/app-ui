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
  ['GeneCards',{configName:'Gene Cards',gProfiler:'HGNCSYMBOL',displayName:'Gene Cards'}],
  ['HGNC Symbol',{configName:'HGNC Symbol',gProfiler:'HGNCSymbol',displayName:'HGNC'}],
  ['GeneID',{configName:'NCBI Gene',gProfiler:'NCBIGene',displayName:'NCBI Gene'}],
  ['Uniprot',{configName:'Uniprot',gProfiler:'Uniprot',displayName:'Uniprot'}]
]);

const idFormatter= (source,geneQuery)=>{
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

const idToLinkConverter = (ids)  =>{
  const dbSet = databases.filter(databaseValue => ids[databaseValue.database]);
  let dbs =  _.assign({},
    ...dbSet.map(database=>({[database.database]:database.url+database.search+ids[database.database].replace(/[^a-zA-Z0-9:]/g)}))
  );

  let links = [];
  usedDatabases.forEach((usedDatabase)=>{
    let dbLink = dbs[usedDatabase.configName];
    if (dbLink != null) {
      links.push({link:dbLink,displayName:usedDatabase.displayName});
    }
  });
  return links;
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

const getUniprotInfo= (ids) => {
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
      links=idToLinkConverter(links);
      return {
        databaseID:gene.accession,
        name:gene.gene[0].name.value,
        function: gene.comments && gene.comments[0].type==='FUNCTION' ? gene.comments[0].text[0].value:'',
        hgncSymbol:hgncSymbol,
        showMore:{full:true,function:false,synonyms:false},
        links:links
      };
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
  let q=query.trim().split(' ');
  let ncbiIds={},uniprotIds={},labeledId={};
  const genesToSearch = [];
  q.forEach ((id)=> {
    const splitId=id.split(':');

    //Evaluate the query based on the format
    if(/uniprot:\w+$/.test(id)) {
      uniprotIds[splitId[1]]=splitId[1];
    } else if(/(ncbi:[0-9]+|hgnc:\w+)$/.test(id)) {
      labeledId[splitId[1]]=splitId[1];
      genesToSearch.push(splitId[1]);
    } else {
      genesToSearch.push(splitId[0]);
    }
  });

  //Populate gene IDs from each database
  const promises= [];
  usedDatabases.forEach((database)=>promises.push(
    ServerAPI.geneQuery({
      genes: genesToSearch,
      target: database.gProfiler
    }).then(result=>idFormatter(database.configName,result))
  ));

  return Promise.all(promises).then(databaseResults=>{
    let genes={};
    databaseResults.forEach(databaseResult=>_.merge(genes,databaseResult)); //Merge the array of result into one json
    return genes;
  }).then(genes=> {
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
      landingBoxes.push(getUniprotInfo(uniprotIds));
     }
    return Promise.all(landingBoxes).then(landingBoxes=> {
      landingBoxes=_.uniqWith(_.flatten(landingBoxes),(arrVal, othVal)=>
        _.intersectionWith(_.values(arrVal.links),_.values(othVal.links),_.isEqual).length
      );
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

const expandableFunctionText = (controller,landing,text,toggleVar,index)=>{
  let result = null;
  const varToToggle= landing[index].showMore[toggleVar];
  const cssClass = varToToggle ? 'search-landing-function-more' : 'search-landing-function-less';
  result=[h('div', {key:'text', className:cssClass}, [h('span',text)])];
  result.push(h('span.search-landing-link',{onClick: ()=> handelShowMoreClick(controller, landing, toggleVar, index),key:'showMore'}, varToToggle ? '« less': 'more »'));
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
      functions=expandableFunctionText(controller,landing,box.function,'function',index);
    }
    let links=[];
    box.links.forEach((link)=>{
      links.push(h('a.search-landing-link',{key: link.displayName, href: link.link},link.displayName));
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
