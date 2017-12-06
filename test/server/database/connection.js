const r = require('rethinkdb');

module.exports = {
  connection: r.connect({ host: 'localhost', port: 28015 }),
  get: function () {
    return this.connection;
  },
  set: function (config) {
    return this.connection = r.connect(config);
  }
};