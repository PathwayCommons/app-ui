const React = require('react');
const h = require('react-hyperscript');

const datasourceLinks = require('../../../config').databases;

class GraphInfoMenu extends React.Component {
  getDatasourceLink(datasource) {
    let link = datasourceLinks.filter(value => datasource.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
    if (link.length === 1 && link[0][1]) {
      return link[0][1];
    }
    else {
      return '';
    }
  }

  render() {
    const datasourceLink = this.getDatasourceLink(this.props.datasource);

    const noInfoMessage = h('span', [
      'No additional information was found for this network!',
      h('br'),
      h('br'),
      'Additional information about the network is normally found here, but we couldn\'t find any for this one.'
    ]);

    return (
      h('div', [
        h('h1', this.props.name),
        h('h4', [
          'Sourced from ',
          ...(datasourceLink.length > 0 ?
            h('a', {
              href: this.getDatasourceLink(this.props.datasource),
              target: '_blank'
            }, this.props.datasource) : [this.props.datasource]
          )
        ]),
        ...(this.props.comments.length ?
          [h('h2', 'Additional Information')].concat(
            this.props.comments.map((comment, index) => {
              return (
                h('div', {
                  'key': index
                }, [
                    comment.replace(/<p>/g, ' '),
                    h('br'),
                    h('br')
                  ])
              );
            })
          ) : [noInfoMessage]
        )
      ])
    );
  }
}

module.exports = GraphInfoMenu;