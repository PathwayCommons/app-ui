/**
    Pathway Commons Central Data Cache

    Pathway Commons Server Routing
    index.js

    Purpose : Defines basic routes for the server

    Requires : None

    Effects : None

    Note : None

    TODO: None

    @author Geoff Elder
    @version 1.1 2017/10/10
**/

const express = require('express');
const router = express.Router();

const db = require('../database/accessDB.js');
const queryString = require('query-string');

/* GET home page.
All URLS not specified earlier in server/index.js (e.g. REST URLs) get handled by the React UI */



router.get('*', function(req, res, next) {
  const url = req.originalUrl;

  if (url.substring(0, 6) === '/view?') {
    const query = queryString.parse(url.slice(5));
    if (query.uri) {
      db.connect().then(connection => {
        db.getGraph(query.uri, 'latest', connection).then(graph => {
          const gr = graph.graph;
          if (!gr) {
            console.log('COULD NOT FIND GRAPH');
          } else {
            console.log(gr.pathwayMetadata);
            var title = '',
                ds = '',
                comments = '';
            if (
              typeof gr.pathwayMetadata === typeof {}
              && Object.keys(gr.pathwayMetadata).length > 0
            ) {
              title = gr.pathwayMetadata.title[0];
              ds = gr.pathwayMetadata.dataSource[0];

              const comments_arr = gr.pathwayMetadata.comments;
              for (var i = 0; i < comments_arr.length; i++) {
                comments += comments_arr[i]+(i === comments_arr.length - 1 ? '' : '\n');
              }
            }
            console.log(title);
            console.log(ds);
            console.log(comments);

            if (!title) title = 'Pathway Commons';
            if (!ds) ds = 'Unknown datasource';
            if (!comments) comments = 'An interaction from Pathway Commons';

            const displayTitle = title + ' | '+ds;
            res.render('index', {title: displayTitle, desc: comments});
          }
        });
      });
    }
  }
});

router.post('/paint', function(req, res, next) {
  res.render('paint', {paintData: JSON.stringify(req.body)});
});

module.exports = router;