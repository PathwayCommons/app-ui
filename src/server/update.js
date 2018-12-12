const { updateEnrichment } = require('./routes/enrichment/visualization');

const update = () => {
  updateEnrichment();
};

module.exports = update;