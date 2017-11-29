const React = require('react');
const h = require('react-hyperscript');

class GraphInfoMenu extends React.Component {
  render() {
    const props = this.props;

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
        h('div', additionalInfo)
      ])
    );
  }
}

module.exports = GraphInfoMenu;