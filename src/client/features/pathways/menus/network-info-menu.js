const React = require('react');
const h = require('react-hyperscript');


class NetworkInfoMenu extends React.Component {
  render() {
    const { infoList } = this.props;

    const noInfoMessage = [
      h('p', { key: 1 }, 'No additional information was found for this network!'),
      h('p', { key: 2 }, 'Additional information about the network is normally found here, but we couldn\'t find any for this one.')
    ];

    const comments = infoList.map( ( comment, key ) => h('p', { key }, comment.replace(/<p>/g, ' ')));

    return (
      h('div.info-menu', [
        comments.length > 0 ? comments : noInfoMessage
      ])
    );
  }
}

module.exports = NetworkInfoMenu;