const _ = require('lodash');

// basic pathway model to serve the needs of the pathways view
// TODO:
//  - api to get entities,
//  - compose each entity with entity metadata
//  - get entity by id
class Pathway {
  constructor(){
    this.loaded = false;
  }

  load(pathwayJSON, uri){
    this.raw = pathwayJSON,
    this.pcId = uri;
    this.loaded = true;
  }

  uri(){
    return this.pcId || 'Unknown uri';
  }

  cyJson(){
    return this.raw.graph;
  }

  isEmpty(){
    return false;
  }

  name(){
    return _.get(this.raw, 'graph.pathwayMetadata.title.0', 'Unknown title');
  }

  datasource(){
    return _.get(this.raw, 'graph.pathwayMetadata.dataSource.0', 'Unknown datasource');
  }

  comments(){
    return _.get(this.raw, 'graph.pathwayMetadata.comments', []);
  }
}

module.exports = Pathway;