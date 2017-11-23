const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const datasourceLinks = require('../../../../../common/tooltips/config').databases;

class GraphInfoMenu extends React.Component {
  getDatasourceLink(datasource) {
    const link = datasourceLinks.filter(ds => ds[0].toUpperCase() === datasource.toUpperCase());

    return _.get(link, '0.1', '');
  }

  render() {
    const props = this.props;

    const datasourceLink = this.getDatasourceLink(props.datasource);

    const noInfoMessage = h('span', [
      h('p', 'No additional information was found for this network!'),
      h('p', 'Additional information about the network is normally found here, but we couldn\'t find any for this one.')
    ]);

    const comments = props.comments.map(comment => {
      return h('div', [h('p', comment.replace(/<p>/g, ' '))]);
    });

    const additionalInfo = comments.length ?
      [h('div', [
        h('h2', 'Additional Information')
      ].concat(comments))]
      : [noInfoMessage];

    return (
      h('div', [
        h('h1', props.name),
        h('h4', [
          'Sourced from ',
          h('a', { href: datasourceLink, target: '_blank' }, props.datasource)
        ]),
        h('div', additionalInfo)
      ])
    );
  }
}

module.exports = GraphInfoMenu;