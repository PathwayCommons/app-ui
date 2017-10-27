const React = require('react');
const h = require('react-hyperscript');

const DownloadOption = require('./components/downloadOption');

class FileDownloadMenu extends React.Component {
  render() {
    return (
      h('div.file-download-menu', [
        h('h1', 'Graph Downloads'),
        h(DownloadOption, {
          'cy': this.props.cy,
          'type': 'png',
          'uri': this.props.uri,
          'name': this.props.name
        }, [
          h('strong', 'PNG Download'),
          h('br'),
          'Download an image of the entire view.'
        ]),
        h(DownloadOption, {
          'cy': this.props.cy,
          'type': 'gmt',
          'uri': this.props.uri,
          'name': this.props.name
        }, [
          h('strong', [
            h('a', {
              'target': '_blank',
              'href': 'http://software.broadinstitute.org/cancer/software/gsea/wiki/index.php/Data_formats#GMT:_Gene_Matrix_Transposed_file_format_.28.2A.gmt.29'
            }, 'GMT'),
            ' Download'
          ]),
          h('br'),
          h('span', [
            'Database of named gene sets (UniProt) useful for performing enrichment analysis using ',
            h('a', {
              'target': '_blank',
              'href': 'http://software.broadinstitute.org/gsea/index.jsp'
            }, 'Gene Set Enrichment Analysis (GSEA)')
          ])
        ]),
        h(DownloadOption, {
          'cy': this.props.cy,
          'type': 'sif',
          'uri': this.props.uri,
          'name': this.props.name
        }, [
          h('strong', [
            h('a', {
              'target': '_blank',
              'href': 'http://wiki.cytoscape.org/Cytoscape_User_Manual/Network_Formats'
            }, 'SIF'),
            ' Download'
          ]),
          h('br'),
          h('span', [
            'A list of interaction pairs useful for viewing, styling, and editing using ',
            h('a', {
              'target': '_blank',
              'href': 'http://cytoscape.org/'
            }, 'Cytoscape desktop software'),
            ', and for analysis with graph algorithms.'
          ])
        ])
      ])
    );
  }
}

module.exports = FileDownloadMenu;