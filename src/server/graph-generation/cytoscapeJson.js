/**
    Pathway Commons Central Data Cache

    Cytoscape JSON 
    cytoscapeJson.js

    Purpose : To generate an enhanced Cytoscape compatible JSON file, 

    Requires : Valid URI's

    Effects : Downloads files asynchronously

    Note : Script may take time to download from pc2, due to uptime issues

    @author Harsh Mistry
    @version 1.1 2017/10/10
**/

const fs = require('fs');
const fileDownloader = require('./fileDownloader.js');
const metadataMapper = require('./metadataMapper.js');
var Multispinner = require('multispinner')

//Get pathway name, description, and datasource
//Requires a valid pathway uri
function getPathwayLevelMetadata(uri) {
  var title, dataSource, comments;

  //Get title
  return fileDownloader.traversePC2(uri, 'Named/displayName').then(function (data) {
    title = data.traverseEntry[0].value;

    //Get data source
    return fileDownloader.traversePC2(uri, 'Entity/dataSource/displayName').then(function (data) {
      dataSource = data.traverseEntry[0].value;

      //Get comments
      return fileDownloader.traversePC2(uri, 'Entity/comment').then(function (data) {
        comments = data.traverseEntry[0].value;

        //Return pathway metadata
        return {
          comments: comments,
          dataSource: dataSource,
          title: title
        };
      });
    });
  });
}

//Get metadata enhanced cytoscape JSON
//Requires a valid pathway uri 
function getMetadataJson(uri) {
  var sbgn, biopax;

  //Get SBGN XML
  return fileDownloader.getPC2(uri, 'sbgn').then(function (data) {
    sbgn = data;

    //Get BioPax XML
    return fileDownloader.getPC2(uri, 'biopax').then(function (data) {
      biopax = data;

      //Map metadata
      return metadataMapper(biopax, sbgn);
    })
  });
}


//Return enhanced cytoscape json 
//Requires a valid pathway uri 
function getCytoscapeJson(uri) {
  var pathwayMetadata;

  //Start Spinner
  const spinner = new Multispinner({'main' : uri });
  //console.log('\x1b[36m%s\x1b[0m', 'Processing ' + uri);

  //Start Generation
  return getPathwayLevelMetadata(uri).then(function (data) {
    pathwayMetadata = data;
    return getMetadataJson(uri).then(function (data) {
      data.pathwayMetadata = pathwayMetadata;
      spinner.success('main');
      return data;
    })
  }).catch(function(e){
    spinner.error('main');
  })
}