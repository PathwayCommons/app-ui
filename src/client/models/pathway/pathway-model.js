const _ = require('lodash');
const diceCoefficient = require('dice-coefficient');

let datasourceURLMap = new Map();

datasourceURLMap.set('humancyc','https://humancyc.org'); // HumanCyc
datasourceURLMap.set('inoh','https://www.ncbi.nlm.nih.gov/pubmed/22120663'); //Integrating Network Objects with Hierarchies
datasourceURLMap.set('kegg','https://www.kegg.jp'); // KEGG Pathway
datasourceURLMap.set('pid','https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2686461/'); // NCI Pathway Interaction Database: Pathway
datasourceURLMap.set('netpath','http://www.netpath.org'); // NetPath
datasourceURLMap.set('panther','http://www.pantherdb.org'); // PANTHER Pathway
datasourceURLMap.set('reactome','https://reactome.org'); // Reactome
datasourceURLMap.set('smpdb','http://smpdb.ca'); // Small Molecule pathway Database
datasourceURLMap.set('wikipathways','https://www.wikipathways.org'); // WikiPathways

// basic pathway model to serve the needs of the pathways view
// TODO:
//  - api to get entities,
//  - compose each entity with entity metadata
//  - get entity by id
class Pathway {
  constructor(){
    this.loaded = false;
  }

  load(pathwayJSON){
    this.raw = pathwayJSON,
    this.loaded = true;
  }

  uri(){
    return _.get(this.raw, 'graph.pathwayMetadata.uri', 'Unknown uri');
  }

  cyJson(){
    return this.raw.graph;
  }

  isEmpty(){
    return false;
  }

  name(){
    return _.get(this.raw, 'graph.pathwayMetadata.title.0', '');
  }

  datasource(){
    return _.get(this.raw, 'graph.pathwayMetadata.dataSource.0', 'Unknown datasource');
  }

  datasourceUrl(){
    let datasource = this.datasource();
    let lowercaseName = datasource.toLowerCase();

    let databaseURL = datasourceURLMap.get(lowercaseName);
    if( !databaseURL ){
      let datasourceURLScores = [];
      datasourceURLMap.forEach( (datasourceURL, datasource) => {
        datasourceURLScores.push([datasourceURL,diceCoefficient(datasource,lowercaseName)]);
      });
      datasourceURLScores.sort( (a,b) => { return b[1] - a[1]; } );
      databaseURL = datasourceURLScores[0][0];
    }

    return databaseURL;
  }

  comments(){
    return _.get(this.raw, 'graph.pathwayMetadata.comments', []);
  }

  macromolecules(){
    return _.get(this.raw, 'graph.nodes', []).filter( node => node.data.class === 'macromolecule' );
  }

}

module.exports = Pathway;