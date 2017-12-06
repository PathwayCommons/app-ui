const React = require('react');
const h = require('react-hyperscript');

const Icon = require('../../common/components').Icon;



class OmniBar extends React.Component {
  render() {
    const props = this.props;
    return h('div.paint-omnibar', [
      h('a', { onClick: e => props.onMenuClick(e) }, [
        h(Icon, { icon: 'menu' }, 'click')
      ]),
      h('h5', props.title)
    ]);
  }
}

module.exports = OmniBar;