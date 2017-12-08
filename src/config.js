const process = require('process');
const baseName = process.env.BASE_NAME;

let config = {
 baseName : baseName ? baseName : ''
};

module.exports = config;