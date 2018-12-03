const React = require('react');
const h = require('react-hyperscript');
const saveAs = require('file-saver').saveAs;
const Loader = require('react-loader');


class InteractionsDownloadMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  downloadPng(){
    let { cySrv, sources } = this.props;
    let cy = cySrv.get();

    let saveCyPng = () =>{
      setTimeout(() => {
        saveAs(cy.png({
          output: 'blob',
          scale: 2,
          bg: 'white',
          full: true
        }), `${sources.join(',')}_interactions.png`);
        this.setState({ loading: false });
      }, 1);
    };

    this.setState({ loading: true }, () => saveCyPng() );
  }

  downloadSif(){
    let { cySrv, sources } = this.props;
    let edgeIds = cySrv.get().edges().map( edge => edge.data('id') ).sort().join('\n');

    saveAs(new File([edgeIds], `${sources.join(',')}_interactions.sif` , { type: 'text/plain;charset=utf-8' }));
  }

  render() {
    return h('div.file-download-menu.interactions-download-menu', [
      h('h2', 'Download As...'),
      h('div.file-download-content', [
        h('div.download-option', { onClick: () => this.downloadPng() }, [
          h('div.download-option-header', [
            h('h3', 'Image (PNG)'),
          ]),
          h('div.download-option-description', 'Download an image of the entire view')
        ]),
        h('div.download-option', { onClick: () => this.downloadSif() }, [
          h('div.download-option-header', [
            h('h3', 'SIF'),
          ]),
          h('div.download-option-description', 'List of interaction pairs to be used with Cytoscape desktop, analysis, and graph algorithms.')
        ]),

        h(Loader, { loaded: !this.state.loading })
      ])
    ]);
  }
}

module.exports = InteractionsDownloadMenu;