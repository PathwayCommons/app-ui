const _ = require('lodash');

// basic pathway model to serve the needs of the pathways view
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
    return _.get(this.raw, 'graph.pathwayMetadata.title', '');
  }

  datasource(){
    return _.get(this.raw, 'graph.pathwayMetadata.dataSource', 'Unknown datasource');
  }

  datasourceUrl(){
    return _.get(this.raw, 'graph.pathwayMetadata.urlToHomepage' );
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

  publicationXrefs(){
    return _.get( this.raw, 'graph.pathwayMetadata.pubXrefs' );
  }

}

module.exports = Pathway;