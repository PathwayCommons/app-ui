const logger = require('../../../logger');

const updateEnrichmentGmt = () => {
  logger.info('Triggered cron job');
};

module.exports = { updateEnrichmentGmt };