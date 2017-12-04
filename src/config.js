const process = require('process');
const env = process.env;
const baseName = env.BASE_NAME;

let config = {
  baseName : baseName ? baseName : ''
};

module.exports = config; 