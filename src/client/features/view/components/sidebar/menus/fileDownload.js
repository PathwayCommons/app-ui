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
  constructor(props) {
    super(props);
    this.state = {
      extrasActive: false
    };
  }

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
        ]),
        h('div.toggle-extra-downloads', {
          onClick: () => this.setState({extrasActive: !this.state.extrasActive})
        }, [
          h('i.material-icons', this.state.extrasActive ? 'remove_circle_outline' : 'add_circle_outline'),
          h('span', `${this.state.extrasActive ? 'Hide' : 'Show'} more options`)
        ])
      ].concat(this.state.extrasActive ? extraMenuContents : []))
    );
  }
}

module.exports = FileDownloadMenu;