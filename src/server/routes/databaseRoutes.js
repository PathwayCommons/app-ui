
/**
    Pathway Commons Central Data Cache

    Database Server Query Routing
    databaseRoutes.js

    Purpose : Provides functions to read from and write to the database.

    Requires : None

    Effects : None

    Note : None

    TODO: 
    - ensure querying via socket.io still works
    - Run proper functionality testing 

    @author Geoff Elder
    @version 1.1 2017/10/10
**/

//Import Depedencies
const auth = require('./auth.js');
const accessDB = require('./../database/accessDB.js')('testLayouts');
const saveDiffs = require('./../database/saveDiffs')('testLayouts');
const lazyLoad = require('./../lazyload');
const btoa = require('btoa');

const express = require('express');
const router = express.Router();

var connPromise = accessDB.connect(); // returns a promise.


var returnRouter = function () {


  // ------------------ Standard API Functions (Sans Socket IO) ----------------
  //Get Layout
  router.get('/Get', function (req, res) {
    //Get the requested layout
    try {
      connPromise.then((connection) => {
        var graph = accessDB.getGraph(
          req.query.uri,
          req.query.version,
          connection
        );
        var layout = accessDB.getLayout(
          req.query.uri,
          req.query.version,
          connection
        );

        return Promise.all([graph, layout]);
      }).catch((e) => {
        throw e;
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
        res.json(e);
        //throw e;
      });
    } catch (e) {
      res.json('ERROR : Layout Request Failed!');
    }
  });

  router.get('/getEditKey', function (req, res) {

    try {
      connPromise.then((connection) => {
        if (auth.checkUser(req)) {
          accessDB.getGraphID(
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
    }
    catch (e) {
      res.json('ERROR: Edit Key Request Failed');
    }
  });

  router.get('/checkEditKey', function (req, res) {
    if (!(req.query.uri && req.query.version)) {
      res.json('ERROR: Required Parameters Not Defined');
      return;
    }

    try {
      connPromise.then((connection) => {
        accessDB.getGraphID(
          req.query.uri,
          req.query.version,
          connection,
          function (result) { res.json(result === req.query.key); }
        );
      }).catch((err) => {
        res.json('ERROR : Edit Priviliges Check Failed');
      });
    } catch (e) {
      res.json('ERROR : Edit Priviliges Check Failed');
    }

  });

  router.post('/Submit', function (req, res) {
    if (!(req.body.layout && req.body.version && req.body.uri)) {
      res.json = ('ERROR : Required Parameters Undefined');
      return;
    }
    //Get the requested layout
    try {
      connPromise.then((connection) => {
        if (auth.checkUser(req)) {
          accessDB.saveLayout(req.body.uri,
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
    }
    catch (e) {
      res.json('ERROR : Layout Update Failed!');
      throw e;
    }
  });

  //Return Confirmation
  router.get('/', function (req, res) {
    res.json('This Server Uses Socket.io!');
  });

  return router;
};

module.exports = returnRouter;