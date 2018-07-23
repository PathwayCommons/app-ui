
const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classNames');

const Tooltip = require('../../common/components/tooltip');

class PathwaysSidebar extends React.Component {
  render(){
    let { controller, activeMenu } = this.props;

    return h('div.sidebar-menu', {
      className: classNames({'sidebar-menu-open': activeMenu != 'closeMenu' }),
    },
    [
      h('div.sidebar-close', [
        h(Tooltip, { description: 'Close the sidebar' }, [
          h('div.icon-button', {
            key: 'close',
            onClick: () => controller.changeMenu('closeMenu'),
          }, [
            h('i.material-icons', 'close')
          ])
        ])
      ]),
      h('div.sidebar-content', [
        h('div.sidebar-text', [this.props.children])
      ])
  ]);

  }
}

module.exports = PathwaysSidebar;