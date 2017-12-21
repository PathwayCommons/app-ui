const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const debug = require('debug')('app-ui:server');
const http = require('http');
const config = require('./config');
const dbConfig = require('./database/config');
const logger = require('./logger');
const stream = require('stream');
const fs = require('fs');
const checkTables = require('./database/createTables');

const app = express();
const server = http.createServer(app);

require('./io').set(server);
require('./routes/sockets');

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

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error');
  });
}

// production error handler
// no stacktraces leaked to user
// error page handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error');
});


let port = normalizePort(config.PORT);

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

// Create database instance if one does not already exist. And start
// the server once that is complete.
checkTables.checkDatabase(dbConfig).then(()=>{
  server.listen(port);
});

module.exports = app;
