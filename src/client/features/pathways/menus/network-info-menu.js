const React = require('react');
const h = require('react-hyperscript');


class NetworkInfoMenu extends React.Component {
  render() {
    const { infoList } = this.props;

    const noInfoMessage = [
      h('p', 'No additional information was found for this network!'),
      h('p', 'Additional information about the network is normally found here, but we couldn\'t find any for this one.')
    ];

    const comments = infoList.map(comment => h('p', comment.replace(/<p>/g, ' ')));

    return (
      h('div.info-menu', [
        comments.length > 0 ? comments : noInfoMessage
      ])
    );
  }
}

module.exports = NetworkInfoMenu;