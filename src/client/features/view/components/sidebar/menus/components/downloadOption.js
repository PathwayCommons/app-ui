const React = require('react');
const h = require('react-hyperscript');
const Loader = require('react-loader');
const classNames = require('classnames');

const saveAs = require('file-saver').saveAs;
const apiCaller = require('../../../../../../services/apiCaller');

const downloadTypes = {
  png: 'Image (PNG)',
  gmt: 'GMT',
  sif: 'SIF',
  txt: 'Extended SIF',
  biopax: 'BioPAX',
  jsonld: 'JSON-LD',
  sbgn: 'SBGM-ML'
};

class DownloadOption extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  handleDownloadClick(evt, type) {
    // Don't do anything when a link is clicked. Should not download just because
    // user clicks a link
    if (evt.target.tagName === 'A') return;

    switch (type) {
      case 'png':
      // The setTimeout triggers a rerender so that the loader appears on screen
        this.setState({ loading: true }, () => {
          setTimeout(() => {
            saveAs(this.props.cy.png({
              output: 'blob',
              scale: 2,
              bg: 'white',
              full: true
            }), this.props.name + '.png');
            this.setState({ loading: false });
          }, 1);
        });
        break;
      case 'gmt':
        this.initiatePCDownload('GSEA', 'gmt');
        break;
      case 'sif':
        this.initiatePCDownload('BINARY_SIF', 'txt');
        break;
      case 'txt':
        this.initiatePCDownload('TXT', 'txt');
        break;
      case 'biopax':
        this.initiatePCDownload('BIOPAX', 'xml');
        break;
      case 'sbgn':
        this.initiatePCDownload('SBGN', 'xml');
        break;
      case 'jsonld':
        this.initiatePCDownload('JSONLD', 'json');
        break;
      default:
        // shouldn't be reached unless there's a programming error
        console.log('Unrecognized file format.');
    }
  }

  initiatePCDownload(format, file_ext) {
    this.setState({ loading: true });

    apiCaller.pcQuery(this.props.uri, format)
      .then(content => {
        let fileContent = content;
        if (typeof content === 'object') {
          fileContent = JSON.stringify(content);
        }
        this.saveDownload(file_ext, fileContent);
      })
      .then(() => this.setState({ loading: false }));
  }

  saveDownload(file_ext, content) {
    saveAs(new File([content], this.generatePathwayName() + '.' + file_ext, { type: 'text/plain;charset=utf-8' }));
  }

  generatePathwayName() {
    const FILENAME_CUTOFF = 20;
    let filename = this.props.name || 'pathway';
    return filename.substr(0, filename.length < FILENAME_CUTOFF ? filename.length : FILENAME_CUTOFF).replace(/ /g, '_');
  }

  render() {
    return (
      h('div.download-option', {
        onClick: (evt) => this.handleDownloadClick(evt, this.props.type)
      }, [
          h('div.download-option-header', [
            h('h3', downloadTypes[this.props.type]),
            h('div.download-loader-container', [
              h(Loader, {
                loaded: !this.state.loading, options: {
                  scale: 0.5,
                  width: 3
                }
              })
            ])
          ]),
          h('div.download-option-description', [
            this.props.children
          ])
        ])
    );
  }
}

module.exports = DownloadOption;