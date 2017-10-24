const React = require('react');
const DownloadOption = require('./components/downloadOption.js');

class FileDownloadMenu extends React.Component {
  render() {
    return (
      <div className='file-download-menu'>
        <h1>Graph Downloads</h1>
        <DownloadOption
          cy={this.props.cy}
          type='png'
          uri={this.props.uri}
          name={this.props.name}
        >
          <strong>PNG Download</strong>
          <br/>
          Download an image of the entire view.
        </DownloadOption>
        <DownloadOption
          cy={this.props.cy}
          type='gmt'
          uri={this.props.uri}
          name={this.props.name}
        >
          <strong><a target="_blank" href="http://software.broadinstitute.org/cancer/software/gsea/wiki/index.php/Data_formats#GMT:_Gene_Matrix_Transposed_file_format_.28.2A.gmt.29">GMT</a> Download</strong>
          <br/>
          <span>Database of named gene sets (UniProt) useful for performing enrichment analysis using <a target="_blank" href="http://software.broadinstitute.org/gsea/index.jsp">Gene Set Enrichment Analysis (GSEA)</a>.</span>
        </DownloadOption>
        <DownloadOption
          cy={this.props.cy}
          type='sif'
          uri={this.props.uri}
          name={this.props.name}
        >
          <strong><a target="_blank" href="http://wiki.cytoscape.org/Cytoscape_User_Manual/Network_Formats">SIF</a> Download</strong>
          <br/>
          <span>A list of interaction pairs useful for viewing, styling, and editing using <a target="_blank" href="http://cytoscape.org/">Cytoscape desktop software</a>, and for analysis with graph algorithms.</span>
        </DownloadOption>
      </div>
    );
  }
}

module.exports = FileDownloadMenu;