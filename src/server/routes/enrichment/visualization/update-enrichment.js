const path = require('path');

const { writeArchiveFiles } = require('../../../source-files');
const { GMT_ARCHIVE_URL } = require('../../../../config.js');
const { GMT_SOURCE_FILENAME } = require('../../../../config');

const GMT_SOURCE_PATH = path.resolve(__dirname, GMT_SOURCE_FILENAME);

 const GMT_ARCHIVE_FILENAMES = [
  'hsapiens.GO/BP.name.gmt',
  'hsapiens.REAC.name.gmt'
];

const updateEnrichment = () => writeArchiveFiles( GMT_ARCHIVE_URL, GMT_ARCHIVE_FILENAMES, GMT_SOURCE_PATH );

module.exports = { updateEnrichment };