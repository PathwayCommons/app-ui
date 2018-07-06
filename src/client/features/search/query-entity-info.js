const _ = require('lodash');

const { ServerAPI } = require('../../services');
const { databases } = require('../../common/config');

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

let isUniprotId = token => {
  return /uniprot:\w+$/i.test(token);
};

let isNcbiId = token => {
  return /ncbi:[0-9]+$/i.test( token );
};

let isHgncId = token => {

};

// databases that have special link ins for the search
const linkInDbs = [
  {configName:'Gene Cards',gProfiler:'HGNCSYMBOL',displayName:'Gene Cards'},
  {configName:'HGNC Symbol',gProfiler:'HGNCSymbol',displayName:'HGNC'},
  {configName:'NCBI Gene',gProfiler:'NCBIGene',displayName:'NCBI Gene'},
  {configName:'Uniprot',gProfiler:'Uniprot',displayName:'UniProt'}
];



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
  let dbConfigValues = [...linkInDbs.values()];

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
        if( linkInDbs.map(db => db.config).includes( db.type ) ){
          _.assign( dbIds, { [ linkInDbs.get( db.type ).configName ]: db.id } );
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
        otherNames: '',
        showMore: { full: true, function: false, synonyms: false },
        links: links
      };
    });
  });
};

// Expects strings of the form
const queryEntityInfo = query => {
  let tokens = query.trim().split(' ');
  let ncbiIds = {};
  let uniprotIds = {};
  let genes = [];


  tokens.forEach(token => {
    let [ dbId, entityId ] = token.split(':');

    if( isUniprotId( token ) ){
      uniprotIds[ entityId ] = entityId;
    } else if( isNcbiId( token ) ){
      genes.push( entityId );           
    } else {
      genes.push( dbId );
    }
  });

  let entityQueries = linkInDbs.map( db => {
    return ServerAPI.geneQuery({
      genes: genes,
      targetDb: db.gProfiler
    }).then(res => idFormatter( db.configName, res ));
  });

  return Promise.all( entityQueries ).then( results => {
    let entityInfos = {};
    results.forEach( dbResult => _.merge( entityInfos, dbResult ) ); //Merge the array of result into one json

    Object.entries(entityInfos).forEach(entityInfo => {
      let [ originalSearchTerm, mappedGene ] = entityInfo;

      if( mappedGene['NCBI Gene'] ){
        ncbiIds[ mappedGene['NCBI Gene'] ] = originalSearchTerm;
      }
      else if( mappedGene['Uniprot'] ){
        uniprotIds[ mappedGene['Uniprot'] ] = originalSearchTerm;
      }
    });

      let providerSpecificEntityInfo = [];
      if( Object.keys(ncbiIds).length > 0 ){
        providerSpecificEntityInfo.push( getNcbiInfo( ncbiIds, entityInfos ) );
      }
      if( Object.keys(uniprotIds).length > 0 ){
        providerSpecificEntityInfo.push( getUniprotInfo( uniprotIds ) );
      }
      return Promise.all(providerSpecificEntityInfo).then( providerInfo => {
        return _.uniqWith( _.flatten( providerInfo ), ( arrVal, othVal ) => {
          return _.intersectionWith(_.values(arrVal.links),_.values(othVal.links),_.isEqual).length;
        });
      });
  });
};

module.exports = queryEntityInfo;