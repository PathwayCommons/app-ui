const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');
const saveAs = require('file-saver').saveAs;
const _ = require('lodash');

const FlatButton = require('../../../../../common/flatButton');
const AsyncButton = require('../../../../../common/asyncButton');
const apiCaller = require('../../../../../services/apiCaller');

/* Specify download details here.
- type is used as a unique identifier internally and is never shown to the user
- displayName is the name displayed as a title in the download card
- pc2Name is the name used in PC2, used here to specify the download type to the server
- ext is the file extension when downloaded
- hidden is a bool, whether or not the button is hidden by default
- description is the text displayed underneath the title in the download card
*/
const downloadTypes = [
  { type: 'png', displayName: 'Image (PNG)', ext: 'png', hidden: false, description: 'Download an image of the entire view.' },
  { type: 'gmt', displayName: 'GMT', pc2Name: 'GSEA', ext: 'gmt', hidden: true, description: 'Gene Matrix Transposed format. The gene database of named gene sets (UniProt) useful for performing enrichment analysis using Gene Set Enrichment Analysis (GSEA)' },
  { type: 'sif', displayName: 'SIF', pc2Name: 'SIF', ext: 'txt', hidden: true, description: 'Simple interaction format (SIF) is a list of interaction pairs useful for viewing, styling, and editing using Cytoscape desktop software, and for analysis with graph algorithms.' },
  { type: 'txt', displayName: 'Extended SIF', pc2Name: 'TXT', ext: 'txt', hidden: true, description: 'Similar to the SIF output, but contains extra information on entities and interactions. See the SIF section on the PC2 formats page for more details.' },
  { type: 'biopax', displayName: 'BioPAX', pc2Name: 'BIOPAX', ext: 'xml', hidden: true, description: 'Biological Pathways Exchange (BioPAX) format includes all details of the biological network stored in Pathway Commons. It is recommended that this format be interpreted using tools like Paxtools or Jena SPARQL.' },
  { type: 'jsonld', displayName: 'JSON-LD', pc2Name: 'JSONLD', ext: 'json', hidden: true, description: 'JSON-LD is a human-readable linked format. This format is ideal for programming environments, REST web services, and unstructured databses.' },
  { type: 'sbgn', displayName: 'SBGN-ML', pc2Name: 'SBGN', ext: 'xml', hidden: true, description: 'Systems Biology Graphical Notation (SBGN) is a standard visual notation for biological networks. This download provides an XML in SBGN markup language (SBGN-ML).' }
];

class FileDownloadMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      extrasActive: false,
      loadingOptions: []
    };
  }

  // Initiates download of a file using displayName, should eventually be changed to type
  downloadFromDisplayName(displayName) {
    const optionObj = _.find(downloadTypes, ['displayName', displayName]);
    const type = optionObj.type;

    // png is the only type generated locally. The rest are retrieved from PC
    if (type === 'png') {
      // The setTimeout triggers a rerender so that the loader appears on screen
      this.setState({ loadingOptions: this.state.loadingOptions.concat('png') }, () => {
        setTimeout(() => {
          saveAs(this.props.cy.png({
            output: 'blob',
            scale: 2,
            bg: 'white',
            full: true
          }), `${this.props.name}.${optionObj.ext}`);
          this.setState({ loadingOptions: _.filter(this.state.loadingOptions, item => item !== 'png') });
        }, 1);
      });
    } else if (type) {
      const pc2Name = optionObj.pc2Name;
      const extension = optionObj.ext;
      this.initiatePCDownload(pc2Name, extension, type);
    }

  }

  // Downloads graph and saves to user's computer. Download type is specified by format (a pc2 name like 'JSONLD'),
  // the extension fileExt the file should have.
  // fileType is a unique identifier (like 'png' or 'txt') that is used to determine what files are loading
  initiatePCDownload(format, fileExt, fileType) {
    this.setState({ loadingOptions: this.state.loadingOptions.concat(fileType) });

    apiCaller.pcQuery('get', { uri: this.props.uri, format: format })
      .then(res => res.text()
        .then(content => {
          let fileContent = content;
          if (typeof content === 'object') {
            fileContent = JSON.stringify(content);
          }
          this.saveDownload(fileExt, fileContent);
          this.setState({ loadingOptions: _.filter(this.state.loadingOptions, item => item !== fileType) });
        }));
  }

  saveDownload(file_ext, content) {
    saveAs(new File([content], this.generatePathwayName() + '.' + file_ext, { type: 'text/plain;charset=utf-8' }));
  }

  // generatePathwayName generates a file name for a download based off of props.name
  generatePathwayName() {
    const FILENAME_CUTOFF = 20;
    let filename = this.props.name || 'network';
    return filename.substr(0, filename.length < FILENAME_CUTOFF ? filename.length : FILENAME_CUTOFF).replace(/ /g, '_');
  }

  render() {
    // Converts the downloadTypes object into an array of AsyncButtons, used for downloads, based off whether or not
    // they are hidden (a bool specified)
    let getMenuContents = hidden => downloadTypes.reduce((result, option) => {
      if (option.hidden === hidden) {
        result.push(
          h(AsyncButton, {
            header: option.displayName,
            onClick: header => this.downloadFromDisplayName(header),
            loading: _.includes(this.state.loadingOptions, option.type)
          }, option.description)
        );
      }
      return result;
    }, []);
    
    return h('div.file-download-menu', [
      h('h2', 'Network Downloads'),
      h('div.file-download-content', [
        h('div.file-download-main', getMenuContents(false)),
        h('div.toggle-extra-downloads-container', [
          h(FlatButton, {
            onClick: () => this.setState({ extrasActive: !this.state.extrasActive }),
            icon: this.state.extrasActive ? 'keyboard_arrow_up' : 'keyboard_arrow_down'
          }, `${this.state.extrasActive ? 'Hide' : 'Show'} more options`)
        ]),
        h('div', {
          className: classNames('file-download-extras', { 'file-download-extras-hide': !this.state.extrasActive })
        }, getMenuContents(true))
      ])
    ]);
  }
}

module.exports = FileDownloadMenu;
