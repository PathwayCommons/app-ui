const { updateEnrichment } = require('./routes/enrichment/visualization');

const updateCron = () => {
  updateEnrichment();
};

 module.exports = updateCron;