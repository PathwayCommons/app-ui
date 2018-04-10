const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const queryString = require('query-string');
const { ServerAPI } = require('../../services');
const databases = require('../../common/config').databases;
const Loader = require('react-loader');
const _ = require('lodash');

const linkBuilder= (source,array)=>{
  let genes={};
  array.forEach(gene=>{
    genes[gene.initialAlias]={[source]:gene.convertedAlias};
  });
  return genes;
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
  return Promise.all([
    ServerAPI.geneQuery({genes: q,target: 'ENTREZGENE_ACC'}).then(result=>linkBuilder('NCBI Gene',result.geneInfo)),
    ServerAPI.geneQuery({genes: q,target: 'UNIPROT'}).then(result=>linkBuilder('Uniprot',result.geneInfo)),
    ServerAPI.geneQuery({genes: q,target: 'HGNC'}).then(result=>linkBuilder('HGNC',result.geneInfo)),
    ServerAPI.geneQuery({genes: q,target: 'HGNCSYMBOL'}).then(result=>linkBuilder('Gene Cards',result.geneInfo)),
  ]).then(values=>{let genes=values[0];
    _.tail(values).forEach(gene=>_.mergeWith(genes,gene,(objValue, srcValue)=>_.assign(objValue,srcValue)));
      let ids=[];
      _.forEach(genes,gene=>{
        ids.push(gene['NCBI Gene']);
      });
       if(!_.isEmpty(ids)){
         return ServerAPI.getGeneInformation(ids,'gene').then(result=>{
          const geneResults=result.result;
          return geneResults.uids.map(gene=>{
            const originalSearch = _.findKey(genes,entry=> entry['NCBI Gene']===gene);
            const links=_.mapValues(genes[originalSearch],(value,key)=>{
              let link = databases.filter(databaseValue => key.toUpperCase() === databaseValue[0].toUpperCase());
              return link[0][1] + link[0][2] + value;
            });
            return {
              id:gene,
              name:geneResults[gene].nomenclaturename,
              function: geneResults[gene].summary,
              synonyms: geneResults[gene].name + (geneResults[gene].otheraliases ? ', '+geneResults[gene].otheraliases:''),
              showMore:{full:!(geneResults.uids.length>1),function:false,synonyms:false},
              links:links
            };
          });
        });
       }
       else{
        return [];
      }
  });
};

const handelShowMoreClick= (controller,landing,varToToggle,index) => {
  landing[index].showMore[varToToggle]=!landing[index].showMore[varToToggle];
  controller.setState({ landing:landing }); 
};

const expandableText = (controller,landing,length,text,charToCutOn,type,cssClass,toggleVar,index)=>{
  let result = null;
  const varToToggle= landing[index].showMore[toggleVar];
  const textToUse= (varToToggle|| text.length<=length)?
    text+' ': text.slice(0,text.lastIndexOf(charToCutOn,length))+' '; 
    result=[h(`${type}`,{className:cssClass,key:'text'},textToUse)];
  if(text.length>length){
    result.push(h(`${type}.search-landing-link`,{onClick: ()=> handelShowMoreClick(controller, landing, toggleVar, index),key:'showMore'},
    varToToggle ? '« less': 'more »'));
  }
  return result;
};

/*Generates a landing box
input: {controller,[{
function:"This gene encodes ..."
id:"7157"
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
    return h('div.search-landing', 
      h('div.search-landing-innner',
        h(Loader, { loaded:false , options: { color: '#16A085', position:'relative', top: '15px' }})
      )
    );
  }
  const landingHTML= landing.map((box,index)=>{
    const multipleBoxes = landing.length>1;
    const title = [h('strong.search-landing-title-text',{key:'name'},box.name),];
    if(multipleBoxes){
      title.push(h('strong.material-icons',{key:'arrow'},landing[index].showMore.full? 'expand_less': 'expand_more'));
    }
    let synonyms=[];
    if(box.synonyms){ 
      synonyms=expandableText(controller,landing,112, box.synonyms,',','i','search-landing-small','synonyms',index);
    }
    let functions=[];
    if(box.function){
      functions=expandableText(controller,landing,260, box.function,' ','span','search-landing-function','function',index);
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
      h('div.search-landing-innner',{key: box.id},[ 
        h('div.search-landing-section',{key: 'synonyms'},[synonyms]),
        h('div.search-landing-section',{key: 'functions'},[functions]),
        h('div.search-landing-section',{key: 'links'},[links]),
        h(Link, { 
          to: { pathname: '/interactions',search: queryString.stringify({ id: box.id, kind:'NEIGHBORHOOD' })}, 
          target: '_blank', className: 'search-landing-interactions', key:'interactions' 
        }, [h('button.search-landing-button', `View Interactions`)])
      ])
    ];    
  });
  if(landing.length>1){
    landingHTML.push(
      h(Link, { 
        to: { pathname: '/interactions',search: queryString.stringify({ id:landing.map(entry=>entry.id), kind:'PATHSBETWEEN' })}, 
        target: '_blank', className: 'search-landing-interactions', key:'interactions' 
      }, [h('button.search-landing-button', 'View Interactions Between Entities')])
    );
  }
  return h('div.search-landing',landingHTML);
};

module.exports = {getLandingResult,landingBox};
