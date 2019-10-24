const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const debug = require('debug')('app-ui:server');
const http = require('http');
const stream = require('stream');
const fs = require('fs');
const Promise = require('bluebird');
const cron = require('node-cron');

const updateCron = require('./update-cron');

const { METADATA_CRON_SCHEDULE, PORT } = require('../config');

cron.schedule(METADATA_CRON_SCHEDULE, () => {
  updateCron();
});

// make fetch() available as a global just like it is on the client side
global.fetch = require('node-fetch');

// const db = require('./db'); // for now disable db
const logger = require('./logger');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// view engine setup
app.set('views', path.join(__dirname, '../', 'views'));

app.engine('html', function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
    if (err) { return callback(err);}

    return callback(null, content.toString());
  });
});
app.set('view engine', 'html');


app.use(favicon(path.join(__dirname, '../..', 'public', 'favicon.png')));
app.use(morgan('dev', {
  stream: new stream.Writable({
    write(chunk, encoding, next) {
      logger.info(chunk.toString('utf8').trim());

      next();
    }
  })
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../..', 'public')));

app.use('/', require('./routes/'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;

  next(err);
});

// on thrown error in route, send http 500 and send just the error text message
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);

  next(err);
});


let port = normalizePort(PORT);

app.set('port', port);

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

const { getPathwayInfoTable } = require('./routes/enrichment/visualization/pathway-table');
let initEnrichment = async () => {
  await getPathwayInfoTable();
};

let initRoutes = async () => Promise.all([
    initEnrichment()
  ]); 

// set up routes 
Promise.try( initRoutes ).then( () => {
  server.listen(port);
} );

module.exports = app;
