
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
const accessDB = require('./../database/accessDB.js');
const fetch = require('node-fetch');
const lazyLoad = require('./../lazyload');
const btoa = require('btoa');

const express = require('express');
const router = express.Router();

var connPromise = accessDB.connect(); // returns a promise.



// Get a layout and respond using socket.io
function getLayout(io, socket, ioPackage) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
      accessDB.getGraphAndLayout(
        ioPackage.uri,
        ioPackage.version,
        connection,
        function (layout) {

          io.emit('LayoutPackage', btoa(JSON.stringify(layout)));
        });
    });
  }
  catch (e) {
    console.log(e);
    io.emit('error', 'error');
  }
}

// Submit a layout and respond using socket.io
function submitLayout(io, socket, ioPackage) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
      if (hasRightKey(ioPackage.uri, ioPackage.version, ioPackage.key)) {
        accessDB.saveLayout(ioPackage.uri,
          ioPackage.layout,
          ioPackage.version,
          connection,
          function () { io.emit('Updated'); });
      }
      else {
        io.emit('error', 'ERROR');
      }
    }).catch((e) => {
      throw e;
    });
  }
  catch (e) {
    io.emit('error', 'ERROR');
  }
}

function getEditKey(io, socket, ioPackage) {

  try {
    connPromise.then((connection) => {
      if (auth.checkUser(socket.request.connection.remoteAddress, true)) {
        accessDB.getGraphID(
          ioPackage.uri,
          ioPackage.version,
          connection,
          function (result) {
            if (result) {
              io.emit('EditKey', ioPackage.uri + '&editkey=' + result);
            } else {
              io.emit('error', 'ERROR: No edit key could be found');
            }
          });
      } else {
        io.emit('error', 'ERROR: Non-authenticated user');
      }
    });
  }
  catch (e) {
    io.emit('error', 'ERROR: Edit Key Request Failed');
    throw e;
  }
}

function hasRightKey(pc_id, release_id, key) {
  return connPromise.then((connection) => {
    return accessDB.getGraphID(
      pc_id,
      release_id,
      connection
    );
  }).then((result)=>{
    return result === key;
  });
}

function checkEditKey(io, socket, ioPackage) {
  try {
    hasRightKey(ioPackage.uri, ioPackage.version, ioPackage.key).then((result)=>{
      io.emit('EditPermissions',result);
    }).catch(()=>{
      io.emit('error', 'ERROR : Edit Priviliges Check Failed');
    });
  } catch (e) {
    io.emit('error', 'ERROR : Edit Priviliges Check Failed');
    throw e;
  }
}

var returnRouter = function (io) {
  io.on('connection', function (socket) {
    console.log('I hear voices');
    //Get Layout
    socket.on('getlayout', function (ioPackage) {
      getLayout(io, socket, ioPackage);
    });

    //Submit Layout
    socket.on('submitlayout', function (ioPackage) {
      submitLayout(io, socket, ioPackage);
    });

    socket.on('getEditKey', function (ioPackage) {
      getEditKey(io, socket, ioPackage);
    });

    socket.on('checkEditKey', function (ioPackage) {
      checkEditKey(io, socket, ioPackage);
    });

  });


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

  router.get('/GetEditKey', function (req, res) {

    try {
      connPromise.then((connection) => {
        if (auth.checkUser(req)) {
          accessDB.getGraphID(
            req.query.uri,
            req.query.version,
            connection,
            function (result) {
              if (result) {
                res.json(req.query.uri + '&editkey=' + result);
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

  router.get('/CheckEditKey', function (req, res) {
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

  //Return if a user can edit
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