const pc = require('pathway-commons');

const getPcDataSources = async () => {
  const pcDataSources =  await pc.datasources.fetch();

  return pcDataSources;
}

module.exports = getPcDataSources;