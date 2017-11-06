const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const saveAs = require('file-saver').saveAs;
const PathwayCommonsService = require('../../../../../../services/').PathwayCommonsService;

const downloadTypes = {
  png: 'PNG',
  gmt: 'GMT',
  sif: 'SIF',
  txt: 'Extended SIF',
  biopax: 'BioPax',
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

  handleDownloadClick(type) {
    switch(type) {
      case 'png':
        saveAs(this.props.cy.png({
          output: 'blob',
          scale: 5,
          bg: 'white',
          full: true
        }), this.props.name + '.png');
        break;
      case 'gmt':
        this.initiatePCDownload('GSEA', 'gmt');
        break;
      case 'sif':
        this.initiatePCDownload('BINARY_SIF', 'sif');
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
    this.setState({loading: !this.state.loading});

    PathwayCommonsService.query(this.props.uri, format)
      .then(content => {
        let fileContent = content;
        if (typeof content === 'object') {
          fileContent = JSON.stringify(content);
        }
        this.saveDownload(file_ext, fileContent);
      })
      .then(() => this.setState({loading: !this.state.loading}));
  }

  saveDownload(file_ext, content) {
    saveAs(new File([content], this.generatePathwayName() + '.' + file_ext, {type: 'text/plain;charset=utf-8'}));
  }

  generatePathwayName() {
    const FILENAME_CUTOFF = 20;
    let filename = this.props.name || 'pathway';
    return filename.substr(0, filename.length < FILENAME_CUTOFF ? filename.length : FILENAME_CUTOFF).replace(/ /g, '_');
  }

  render() {
    return (
      h('div', {
        // for the sake of a quick fix, only one download option can be pre-shown. I'll fix this later
        className: classNames('download-option', this.props.type === 'png' ? 'pre-shown' : '')
      }, [
        h('div.download-option-header', [
          h('h3', {
            'onClick': () => this.handleDownloadClick(this.props.type)
          }, downloadTypes[this.props.type]),
          h('div.download-button', {
            'onClick': () => this.handleDownloadClick(this.props.type)
          }, [
            h('i.material-icons', 'file_download')
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