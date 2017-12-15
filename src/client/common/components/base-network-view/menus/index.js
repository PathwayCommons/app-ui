const h = require('react-hyperscript');

const FileDownloadMenu = require('./file-download');
const NetworkInfoMenu = require('./network-info');


const menus = {
  '': props => null,
  info: props => h(NetworkInfoMenu, props),
  file_download: props => h(FileDownloadMenu, props)
};
module.exports = menus;