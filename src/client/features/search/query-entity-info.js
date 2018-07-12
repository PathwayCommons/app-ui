const _ = require('lodash');
const { ServerAPI } = require('../../services');


let isUniprotId = token => {
  return /uniprot:\w+$/i.test(token);
};

let isNcbiId = token => {
  return /ncbi:[0-9]+$/i.test( token );
};

let isHgncId = token => {

};

let dbInfos = {
  'HGNC Symbol': {
    name: 'HGNC Symbol',
    displayName: 'HGNC',
    url: 'http://identifiers.org/hgnc.symbol/',
    gProfiler: 'HGNCSYMBOL'
  },
  'NCBI Gene': {
    name: 'NCBI Gene',
    displayName: 'NCBI Gene',
    url: 'http://identifiers.org/ncbigene/',
    gProfiler: 'NCBIGene'
  },
  'Uniprot': {
    name: 'Uniprot',
    displayName: 'UniProt',
    url: 'http://identifiers.org/uniprot/',
    gProfiler: 'Uniprot'
  }
};



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

  let links = Object.entries(ids).map( ( entry ) => {
    let [ dbName, geneId ] = entry;
    let dbInfo = dbInfos[ dbName ];

    return  {
      link: dbInfo.url + geneId,
      displayName: dbInfo.displayName
    };
  });

  return links;
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
        officialSymbol: genes[ originalSearch ]['HGNC Symbol'],
        otherNames: geneResults[ gene ].otheraliases ? geneResults[gene].otheraliases : '',
        links: links
      };
    });
  });
};

/**
 * Get entity information from Uniprot
 * @param {string:string} ids Uniprot accessions to search, e.g.{ 4193: MDM2 }
 * @return {json} JSON of gene information.
 */
const getUniprotInfo = ids => {

  let uniprotIds = Object.keys( ids );

  return ServerAPI.getUniprotInformation( uniprotIds ).then( uniprotInfos => {

    return uniprotInfos.map( uniprotInfo => {

      let dbIds = { Uniprot: uniprotInfo.accession };
      let hgncSymbol;

      uniprotInfo.dbReferences.forEach( db => {
        let matchedDb = dbInfos[ db.type ];
        if( matchedDb != null ){
          dbIds[ db.type ] = db.id;
        }
        if( db.type === 'GeneID' ){
          dbIds['NCBI Gene'] = db.id;
        }
        if( db.type === 'HGNC' ){
          hgncSymbol = db.properties['gene designation'];
        }
      });

      if( hgncSymbol != null ){
        dbIds['HGNC Symbol'] = hgncSymbol;
      }

      let links = idToLinkConverter( dbIds );

      return {
        databaseID: uniprotInfo.accession,
        name: uniprotInfo.gene[0].name.value,
        function: uniprotInfo.comments && uniprotInfo.comments[0].type === 'FUNCTION' ? uniprotInfo.comments[0].text[0].value : '',
        officialSymbol: dbIds['HGNC Symbol'],
        otherNames: '',
        links: links
      };
    });
  });
};

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

// takes in a string and looks for substrings of the form:
// * uniprot:<uniprot_id>
// * ncbi:<ncbi_id>
// * <hgnc_id>
const queryEntityInfo = query => {
  let tokens = query.trim().split(' ');
  let ncbiIds = {};
  let uniprotIds = {};
  let genes = [];


  // look for special tokens
  tokens.forEach(token => {
    let [ dbId, entityId ] = token.split(':');

    if( isUniprotId( token ) ){
      uniprotIds[ entityId ] = entityId;
    } else if( isNcbiId( token ) ){
      ncbiIds[ entityId ] = entityId;
      genes.push( entityId );
    } else {
      genes.push( dbId );
    }
  });

  let dbsToQuery = Object.entries(dbInfos).map(([k, v]) => v);

  // create entity recognizer queries
  let entityQueries = dbsToQuery.map( db => {
    return ServerAPI.geneQuery({
      genes: genes,
      targetDb: db.gProfiler
    }).then(res => {
      let { geneInfo: entityInfos, unrecognized: unrecognizedEntities } = res;
      let duplicates = new Set();
      let entities = { unrecognizedEntities };

      entityInfos.forEach( entityInfo => {
        let { convertedAlias } = entityInfo;
        if( !duplicates.has( convertedAlias ) ){
          entities[ entityInfo.initialAlias ] = { [db.name]: convertedAlias };
          duplicates.add( convertedAlias );
        }
      });

      return entities;
    });
  });

  // send queries and return entity info
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
      // legacy computation that is hard to understand
      return _.uniqWith( _.flatten( providerInfo ), ( arrVal, othVal ) => {
        return _.intersectionWith(_.values(arrVal.links),_.values(othVal.links),_.isEqual).length;
      });
    });
  });
};

module.exports = queryEntityInfo;