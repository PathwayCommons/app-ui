const React = require('react');
const h = require('react-hyperscript');
const saveAs = require('file-saver').saveAs;
const _ = require('lodash');
const Loader = require('react-loader');

const { ServerAPI } = require('../../../../../services/');

const downloadTypesFull = require('../../../../config').downloadTypes;


class FileDownloadMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      downloadTypes: this.props.download?this.props.download.types :downloadTypesFull,
      loadingOptions: [],
      loading: false
    };
  }

  downloadFromDisplayName(displayName) {
    const optionObj = _.find(this.state.downloadTypes, ['displayName', displayName]);
    const type = optionObj.type;

    if (type === 'png') {
      // The setTimeout triggers a rerender so that the loader appears on screen
      this.setState({ loadingOptions: this.state.loadingOptions.concat('png') }, () => {
        setTimeout(() => {
          saveAs(this.props.cy.png({
            output: 'blob',
            scale: 2,
            bg: 'white',
            full: true
          }), `${this.props.networkMetadata.name}.${optionObj.ext}`);
          this.setState({ loading: false, loadingOptions: _.filter(this.state.loadingOptions, item => item !== 'png') });
        }, 1);
      });
    } else if (type) {
      const pc2Name = optionObj.pc2Name;
      const extension = optionObj.ext;
      this.initiatePCDownload(pc2Name, extension, type);
    }

  }

  initiatePCDownload(format, fileExt, fileType) {
    this.setState({ loadingOptions: this.state.loadingOptions.concat(fileType) });
   
    const downloadFetch=this.props.download? this.props.download.promise():
      ServerAPI.pcQuery('get', { uri: this.props.networkMetadata.uri, format: format }).then(res => res.text());

    downloadFetch.then(content => {
      let fileContent = content;
      if (typeof content === 'object') {
        fileContent = JSON.stringify(content);
      }
      this.saveDownload(fileExt, fileContent);
      this.setState({ loading: false, loadingOptions: _.filter(this.state.loadingOptions, item => item !== fileType) });
    });
  }

  saveDownload(file_ext, content) {
    saveAs(new File([content], this.generatePathwayName() + '.' + file_ext, { type: 'text/plain;charset=utf-8' }));
  }

  generatePathwayName() {
    const FILENAME_CUTOFF = 20;
    let filename = this.props.networkMetadata.name || 'network';
    return filename.substr(0, filename.length < FILENAME_CUTOFF ? filename.length : FILENAME_CUTOFF).replace(/ /g, '_');
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