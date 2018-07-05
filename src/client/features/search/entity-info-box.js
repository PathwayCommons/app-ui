const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const queryString = require('query-string');
const _ = require('lodash');

const { ServerAPI } = require('../../services');
const { databases } = require('../../common/config');

const usedDatabases = new Map ([
  ['GeneCards',{configName:'Gene Cards',gProfiler:'HGNCSYMBOL',displayName:'Gene Cards'}],
  ['HGNC Symbol',{configName:'HGNC Symbol',gProfiler:'HGNCSymbol',displayName:'HGNC'}],
  ['GeneID',{configName:'NCBI Gene',gProfiler:'NCBIGene',displayName:'NCBI Gene'}],
  ['Uniprot',{configName:'Uniprot',gProfiler:'Uniprot',displayName:'UniProt'}]
]);


// two types of searches:
// * general searches
// * db specific link in searches

// link in examples
// http://localhost:3000/search?q=uniprot:q99988
// http://localhost:3000/search?q=ncbi:7157
// http://localhost:3000/search?q=hgnc:tp53
// * dont use the validator for these special searches
// * use db specific info for each corresponding link  e.g uniprot uses a uniprot speciifc entity info box

// general searches
// * use validator
// * the validator defaults to ncbi because it is the most general db


/**
 * Get database link and display name based on gene ids
 * @param {string} source Database name
 * @param {JSON} geneQuery User input string and matching gene id.
 * @return {string: {string: string}} e.g.{MDM2: {Uniprot: Q00978}}
 */
const idFormatter = ( source, geneQuery ) => {
  let { geneInfo, unrecognized } = geneQuery;
  let duplicates = new Set();
  let genes = { unrecognized };

  geneInfo.forEach(gene => {
    let { convertedAlias } = gene;
    if( !duplicates.has( convertedAlias ) ){
      genes[ gene.initialAlias ] = { [ source ]: convertedAlias };
      duplicates.add( convertedAlias );
    }
  });

  return genes;
};

/**
 * Get database link and display name based on gene ids
 * @param {{string:string}} ids NCBI id to search, e.g.{GENE CARD:MDM2}
 * @return {[{string:string,string,string}]} Array of database containing link and display name, e.g.{link: URI, displayName: MDM2}
 */
const idToLinkConverter = ids => {
  let dbSet = databases.filter(databaseValue => ids[databaseValue.database]);
  let dbs =  _.assign({},
    ...dbSet.map(database=> ({
        [database.database]: database.url+database.search+ids[database.database]
      })
    )
  );
  let dbConfigValues = [...usedDatabases.values()];

  return dbConfigValues.filter(db => dbs[db.configName] != null).map(db => {
    let link = dbs[ db.configName ];
    let { displayName } = db;
    return { link, displayName };
  });
};

/**
 * Get gene information from NCBI
 * @param {string:string} ids NCBI id to search, e.g.{4193:MDM2}
 * @param {} genes Validated gene id from databse, e.g.{gene:{db1:id,db2:id}}
 * @return {json} JSON of gene information.
 */
const getNcbiInfo = ( ids, genes ) => {
  const ncbiIds = Object.keys( ids );

  return ServerAPI.getGeneInformation( ncbiIds ).then( result => {
    let geneResults = result.result;

    return geneResults.uids.map( gene => {
      let originalSearch = ids[ gene ];
      let links = idToLinkConverter( genes[ originalSearch ] );

      return {
        databaseID: gene,
        name: geneResults[ gene ].nomenclaturename,
        function: geneResults[ gene ].summary,
        officialSymbol: genes[ originalSearch ]['Gene Cards'],
        otherNames: geneResults[ gene ].otheraliases ? geneResults[gene].otheraliases : '',
        showMore: { full: !(geneResults.uids.length > 1) , function: false, synonyms: false },
        links: links
      };
    });
  });
};
/**
 * Get gene information from Uniprot
 * @param {string:string} ids Uniprot accessions to search, e.g.{4193:MDM2}
 * @return {json} JSON of gene information.
 */
const getUniprotInfo = ids => {

  let uniprotIds = Object.keys( ids );

  return ServerAPI.getUniprotInformation( uniprotIds ).then( result => {

    return result.map( gene => {

      let dbIds = { Uniprot: gene.accession };
      let hgncSymbol;

      gene.dbReferences.forEach( db => {
        if( usedDatabases.has( db.type ) ){
          _.assign( dbIds, { [ usedDatabases.get( db.type ).configName ]: db.id } );
        }
        if( db.type === 'HGNC' ){
          hgncSymbol = db.properties['gene designation'];
        }
      });

      if( hgncSymbol != null ){
        dbIds['HGNC Symbol'] = hgncSymbol;
      }

      const links = idToLinkConverter( dbIds );

      return {
        databaseID:gene.accession,
        name:gene.gene[0].name.value,
        function: gene.comments && gene.comments[0].type === 'FUNCTION' ? gene.comments[0].text[0].value : '',
        officialSymbol: dbIds['Gene Cards'],
        showMore: { full: true, function: false, synonyms: false },
        links: links
      };
    });
  });
};

// Expects strings of the form
const queryEntityInfo = query => {
  let rawEntitiyValues = query.trim().split(' ');
  let ncbiIds = {};
  let uniprotIds = {};
  let labeledId = {};
  const genesToSearch = [];


  let entities = rawEntitiyValues.map(entity => {
    let idParts = entity.split(':');

    if( /uniprot:\w+$/i.test(entity) ){
      uniprotIds[ idParts[ 1 ] ] = idParts[ 1 ];
    } else if( /(ncbi:[0-9]+|hgnc:\w+)$/i.test( entity ) ){
      labeledId[ idParts[ 1 ] ] = idParts[ 1 ];
      genesToSearch.push( idParts[ 1 ] );
    } else {
      genesToSearch.push( idParts[ 0 ] );
    }
  });

  //Validate search query in g:Converter
  //Return gene IDs of each database
  const promises = [];
  usedDatabases.forEach( database => promises.push(
    ServerAPI.geneQuery({
      genes: genesToSearch,
      targetDb: database.gProfiler
    }).then(result => idFormatter( database.configName, result ) )
  ));

  return (
    Promise.all( promises ).then( databaseResults => {
      let genes={};
      databaseResults.forEach( databaseResult => _.merge( genes, databaseResult ) ); //Merge the array of result into one json
      return genes;
    })
    .then( genes => {
      _.forEach( genes, ( gene, search ) => {
        if( gene['NCBI Gene'] ){
          ncbiIds[ gene['NCBI Gene'] ] = search;
        }
        else if( gene['Uniprot'] ){
          uniprotIds[ gene['Uniprot'] ] = search;
        }
      });

      let landingBoxes = [];
      if( !_.isEmpty(ncbiIds) ){
        landingBoxes.push( getNcbiInfo( ncbiIds, genes ) );
      }
      if( !_.isEmpty( uniprotIds ) ){
        landingBoxes.push( getUniprotInfo( uniprotIds ) );
      }
      return Promise.all(landingBoxes).then( landingBoxes => {
        landingBoxes = _.uniqWith( _.flatten( landingBoxes ), ( arrVal, othVal ) => {
          return _.intersectionWith(_.values(arrVal.links),_.values(othVal.links),_.isEqual).length;
        });

        if( landingBoxes.length > 1 ){
          landingBoxes.forEach( box => box.showMore.full = false);
        }

        return landingBoxes;
      });
  })
  );
};

class EntityInfoBox extends React.Component {
  render(){
    let { entity } = this.props;
    let { name, databaseID, officialSymbol, otherNames, links, function: description } = entity;

    return (
      h('div.entity-info-box', [
        h('div.entity-info-title', [
          h('h2.entity-title', name)
        ]),
        h('div.entity-info-extra-info', { key: databaseID },[
          h('div', [ officialSymbol, otherNames ]),
          h('div', [ description ]),
          h('div', links.map( link => h('a.entity-info-link', { href: link.link, target:'_blank' }, link.displayName)))

        ])
      ])
    );

  }
}

// props:
//  - entityQuery (List of strings representing genes)
class EntityInfoBoxList extends React.Component {

  render(){
    let { entityInfoList } = this.props;

    let interactionsLinkQuery = ents => queryString.stringify({source: ents.map( ent => ent.officalSymbol )});
    let viewMultipleInteractionsLink = (
      h(Link, {
          to: { pathname: '/interactions', search: interactionsLinkQuery },
          target: '_blank',
        }, [
        h('button.search-landing-button', 'View Interactions Between Entities')
      ])
    );

    let entityInfoBoxes = [
      ...entityInfoList.map( entity => h(EntityInfoBox, { entity })),
      // entityInfoList.length > 1 ? viewMultipleInteractionsLink : null
    ];

    let content = entityInfoBoxes;

    return h('div.entity-info-list', [
      h('div.entity-info-list-entries', content)
    ]);
  }
}

module.exports = { queryEntityInfo, EntityInfoBoxList };
