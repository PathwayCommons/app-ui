//Import Depedencies
const auth = require('./auth.js');
const query = require('./../database/query');
const update = require('./../database/update');
const lazyLoad = require('./../lazyload');

const express = require('express');
const router = express.Router();

var connPromise = query.connect(); // returns a promise.


var returnRouter = function () {


  // ------------------ Standard API Functions (Sans Socket IO) ----------------
  //Get Layout
  router.get('/get', function (req, res) {
    //Get the requested layout

    connPromise.then((connection) => {
      var graph = query.getGraph(
        req.query.uri,
        req.query.version,
        connection
      );
      var layout = query.getLayout(
        req.query.uri,
        req.query.version,
        connection
      );

      return Promise.all([graph, layout]);
    }).then(([graph, layout]) => {
      // Optimal case - everything works.
      if (graph && layout) {
        res.json({ graph: graph.graph, layout: layout.positions });
        // Graph exists but layout not found. Return null to tell front end to a default load precomputed layout
      } else if (graph) {
        res.json({ graph: graph.graph, layout: null });
        // Layout exists without a graph. This should be truly impossible and should throw an error.
      } else if (layout) {
        throw new Error('Error: Case not handled. But this really shouldn\'t happen');
        // No graph or layout. Lazy load everything from pathway commons 
      } else {
        lazyLoad.queryPC(req.query.uri, req.query.version).then((result) => {
          if (result) {
            res.json({ graph: result, layout: null });

          } else {
            res.json(null);
          }
        });
      }

    }).catch((e) => {
      console.log(e);
      res.json('ERROR : Layout Request Failed!');
    });

  });

  router.get('/get-edit-key', function (req, res) {
    connPromise.then((connection) => {
      if (auth.checkUser(req)) {
        query.getGraphID(
          req.query.uri,
          req.query.version,
          connection,
          function (result) {
            if (result) {
              res.json(result);
            } else {
              res.json('ERROR: No edit key could be found');
            }
          });
      } else {
        res.json('ERROR: Non-authenticated user');
      }
    }).catch((e) => {
      res.json('ERROR: Edit Key Request Failed');
    });
  });

  router.get('/check-edit-key', function (req, res) {
    if (!(req.query.uri && req.query.version)) {
      res.json('ERROR: Required Parameters Not Defined');
      return;
    }


    connPromise.then((connection) => {
      query.getGraphID(
        req.query.uri,
        req.query.version,
        connection,
        function (result) { res.json(result === req.query.key); }
      );
    }).catch((err) => {
      res.json('ERROR : Edit Priviliges Check Failed');
    });


  });

  router.post('/submit', function (req, res) {
    if (!(req.body.layout && req.body.version && req.body.uri)) {
      res.json = ('ERROR : Required Parameters Undefined');
      return;
    }
    //Get the requested layout

    connPromise.then((connection) => {
      if (auth.checkUser(req)) {
        update.saveLayout(req.body.uri,
          req.body.layout,
          req.body.version,
          connection,
          function () { res.json('Success: Update Applied!'); });
      }
      else {
        res.json('ERROR : You Do Not Have Valid Permissions!');
      }
    }).catch((e) => {
      res.json('ERROR: Layout Update Failed!');
    });


  });

  //Return Confirmation
  router.get('/', function (req, res) {
    res.json('This Server Uses Socket.io!');
  });

  return router;
};

module.exports = returnRouter;