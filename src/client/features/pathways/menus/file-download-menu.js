const React = require('react');
const h = require('react-hyperscript');
const saveAs = require('file-saver').saveAs;
const _ = require('lodash');
const Loader = require('react-loader');

const { ServerAPI } = require('../../../services');

const pcDownloadTypes = require('../../../common/pc-download-types');


class FileDownloadMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      downloadTypes: pcDownloadTypes,
      loading: false,
      error: null
    };
  }

  downloadFromDisplayName(displayName) {
    let { cySrv, fileName } = this.props;
    let { downloadTypes } = this.state;
    let option = _.find(downloadTypes, ['displayName', displayName]);
    let { pc2Name, ext, type } = option;

    if (type === 'png') {
      // The setTimeout triggers a rerender so that the loader appears on screen
      this.setState( { loading: true } , () => {
        setTimeout(() => {
          saveAs(cySrv.get().png({
            output: 'blob',
            scale: 2,
            bg: 'white',
            full: true
          }), `${fileName}.${ext}`);
          this.setState({ loading: false });
        }, 1);
      });
    } else {
      this.downloadFileFromPC(pc2Name, ext);
    }
  }

  downloadFileFromPC(format, fileExt) {
    const FILENAME_CUTOFF = 20;
    let { fileName, uri }  =  this.props;
    fileName = fileName.substr(0, fileName.length < FILENAME_CUTOFF ? fileName.length : FILENAME_CUTOFF).replace(/ /g, '_');

    this.setState({ loading: true }, () => {
      ServerAPI.downloadFileFromPathwayCommons(uri, format).then(res => res.text())
        .then(content => {
          content = typeof content === 'object' ? JSON.stringify(content) : content;
          let fileContent = new File([content], `${fileName}.${fileExt}`, { type:'text/plain;charset=utf-8' });
          saveAs( fileContent );
          this.setState({ loading: false });
        })
        .catch( e => this.setState({ error: e, loading: false }) );
    });
  }

  render() {
    const { downloadOpts } = this.props;
    const opts = _.assign( { downloadTypes: [ 'png' ] }, downloadOpts );
    let menuContents = this.state.downloadTypes
      .filter( dt => opts.downloadTypes.indexOf( dt.type ) >= 0 )
      .map( dt => {
        let dlOption = h('div.download-option', { onClick: () => this.downloadFromDisplayName( dt.displayName ) }, [
            h('div.download-option-header', [
              h('h3', dt.displayName),
            ]),
            h('div.download-option-description', dt.description)
        ]);

        return dlOption;
      } );
    let errorMessage = this.state.error ? h('div.file-download-error', 'An error occurred - Please try again later.'): null;

    return h('div.file-download-menu', [
      h('h2', 'Download As...'),
      h('div.file-download-content', [
        ...menuContents,
        h(Loader, { loaded: !this.state.loading })
      ]),
      errorMessage
    ]);
  }
}

module.exports = FileDownloadMenu;