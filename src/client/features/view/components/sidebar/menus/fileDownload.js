const React = require('react');
const h = require('react-hyperscript');

const DownloadOption = require('./components/downloadOption');

const downloadDescriptions = require('./components/downloadDescriptions');

const extraOptions = [
  'gmt',
  'sif',
  'txt',
  'biopax',
  'jsonld',
  'sbgn'
];

class FileDownloadMenu extends React.Component {
  render() {
    const extraMenuContents = extraOptions.map(option => {
      return (
        h(DownloadOption, {
          cy: this.props.cy,
          type: option,
          uri: this.props.uri,
          name: this.props.name
        }, [
          h(downloadDescriptions[option])
        ])
      );
    });

    return (
      h('div.file-download-menu', [
        h('h1', 'Graph Downloads'),
        h(DownloadOption, {
          cy: this.props.cy,
          type: 'png',
          uri: this.props.uri,
          name: this.props.name
        }, [
          h(downloadDescriptions.png)
        ])
      ].concat(extraMenuContents))
    );
  }
}

module.exports = FileDownloadMenu;