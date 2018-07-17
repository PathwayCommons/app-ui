const React = require('react');
const h = require('react-hyperscript');
const saveAs = require('file-saver').saveAs;
const _ = require('lodash');
const Loader = require('react-loader');

const { ServerAPI } = require('../../../services');

const downloadTypesFull = require('../../../common/config').downloadTypes;


class FileDownloadMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      downloadTypes: downloadTypesFull,
      loadingOptions: [],
      loading: false
    };
  }

  downloadFromDisplayName(displayName) {
    let { cySrv, fileName } = this.props;
    let { downloadTypes, loadingOptions, } = this.state;
    let option = _.find(downloadTypes, ['displayName', displayName]);
    let { type, pc2Name, ext } = option;

    if (type === 'png') {
      // The setTimeout triggers a rerender so that the loader appears on screen
      this.setState({ loadingOptions: loadingOptions.concat('png') }, () => {
        setTimeout(() => {
          saveAs(cySrv.get().png({
            output: 'blob',
            scale: 2,
            bg: 'white',
            full: true
          }), `${fileName}.${ext}`);
          this.setState({ loading: false, loadingOptions: _.filter(loadingOptions, item => item !== 'png') });
        }, 1);
      });
    } else if (type) {
      this.initiatePCDownload(pc2Name, ext, type);
    }

  }

  initiatePCDownload(format, fileExt, fileType) {
    let {  uri } = this.props;
    let { loadingOptions } = this.state;
    this.setState({ loadingOptions: loadingOptions.concat(fileType) });
   
    let downloadFetch = ServerAPI.pcQuery('get', { uri: uri, format: format }).then(res => res.text());

    downloadFetch.then(content => {
      this.saveDownload(fileExt, typeof content === 'object' ? JSON.stringify(content) : content);
      this.setState({ loading: false, loadingOptions: _.filter(loadingOptions, item => item !== fileType) });
    });
  }

  saveDownload(file_ext, content) {
    saveAs(new File([content], this.generatePathwayName() + '.' + file_ext, { type: 'text/plain;charset=utf-8' }));
  }

  generatePathwayName() {
    const FILENAME_CUTOFF = 20;
    let { fileName }  =  this.props;
    return fileName.substr(0, fileName.length < FILENAME_CUTOFF ? fileName.length : FILENAME_CUTOFF).replace(/ /g, '_');
  }

  render() {
    let menuContents = this.state.downloadTypes.map( dt => {
      let dlOption = h('div.download-option', 
        { 
          onClick: () => { this.setState({loading: true}, () => this.downloadFromDisplayName( dt.displayName )); } 
        }, [
          h('div.download-option-header', [
            h('h3', dt.displayName),
          ]),
          h('div.download-option-description', dt.description)
      ]);

      return dlOption;
    } );

    return h('div.file-download-menu', [
      h('h2', 'Network Downloads'),
      h('div.file-download-content', [
        ...menuContents,
        h(Loader, { loaded: !this.state.loading })
      ])
    ]);
  }
}

module.exports = FileDownloadMenu;