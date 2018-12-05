let winston = require('winston');
let { NODE_ENV, LOG_LEVEL } = require('../config');


let transports = [
  new (winston.transports.File)({ name: 'error', filename: 'error.log', level: 'error' })
];

if( NODE_ENV !== 'production' ){
  transports = transports.concat([
    new (winston.transports.Console)({ level: LOG_LEVEL }),
    new (winston.transports.File)({ name: 'debug', filename: 'debug.log', level: 'debug' }),
    new (winston.transports.File)({ name: 'warn', filename: 'warn.log', level: 'warn' })
  ]);
}

let logger = new (winston.Logger)({
  transports
});

logger.cli();

module.exports = logger;
