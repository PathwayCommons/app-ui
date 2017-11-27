const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

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
        h('h2', 'Network Downloads'),
        h('div.file-download-content', [
          h('div.file-download-main', [
            h(DownloadOption, {
              cy: this.props.cy,
              type: 'png',
              uri: this.props.uri,
              name: this.props.name
            }, [
                h(downloadDescriptions.png)
              ])
          ]),
          h('div.toggle-extra-downloads-container', [
            h('div', {
              className: classNames('toggle-extra-downloads', { 'toggle-extra-downloads-active': this.state.extrasActive }),
              onClick: () => this.setState({ extrasActive: !this.state.extrasActive })
            }, [
                h('i.material-icons', this.state.extrasActive ? 'keyboard_arrow_up' : 'keyboard_arrow_down'),
                h('span', `${this.state.extrasActive ? 'Hide' : 'Show'} more options`)
              ])
          ]),
          h('div', {
            className: classNames('file-download-extras', { 'file-download-extras-hide': !this.state.extrasActive })
          }, extraMenuContents)
        ])
      ])
    );
  }
}

module.exports = FileDownloadMenu;