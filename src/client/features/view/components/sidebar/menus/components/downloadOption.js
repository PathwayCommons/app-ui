const React = require('react');
const h = require('react-hyperscript');

const saveAs = require('file-saver').saveAs;
const PathwayCommonsService = require('../../../../../../../service/').PathwayCommonsService;

class DownloadOption extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    }
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
      default:
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
      h('div.download-option', [
        h('div.download-icon-container', [
          h('div.download-icon-inner-container', {
            'onClick': () => this.handleDownloadClick(this.props.type)
          }, [
            h('i.material-icons', 'file_download')
          ])
        ]),
        h('div.download-option-description', this.props.children)
      ])
    );
  }
}

module.exports = DownloadOption;