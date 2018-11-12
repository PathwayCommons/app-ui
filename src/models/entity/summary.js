// Entity summary
const _ = require('lodash');

const DEFAULTS = {
  namespace: '',
  displayName: '',
  localId: '',
  description: '',
  aliases: [],
  aliasIds: [],
  xrefLinks: []
};

class EntitySummary {
  constructor( options ){
    _.assign(this, DEFAULTS, options );
  }
}

module.exports = { EntitySummary };