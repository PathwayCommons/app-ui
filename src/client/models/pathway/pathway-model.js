const _ = require('lodash');


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