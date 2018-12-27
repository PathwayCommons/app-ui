const _ = require('lodash');
const datasources = require('../datasources');

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
    let datasourceURL = '';
    const datasource = this.datasource();
    const databaseInfo = datasources.findByKey(datasource);
    if ( databaseInfo ) datasourceURL = databaseInfo.homepage;
    return datasourceURL;
  }

  comments(){
    return _.get(this.raw, 'graph.pathwayMetadata.comments', []);
  }

  macromolecules(){
    return _.get(this.raw, 'graph.nodes', []).filter( node => node.data.class === 'macromolecule' );
  }

  geneNames(){
    let ms = this.macromolecules();
    let names = _.flatten(ms.map( node => [ ..._.get(node, 'data.metadata.synonyms', []), ...[_.get(node, 'data.label', '')] ] ));
    return _.uniq(names);
  }

}

module.exports = Pathway;