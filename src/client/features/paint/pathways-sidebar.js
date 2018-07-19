
const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classNames');

const Tooltip = require('../../common/components/tooltip');


// a sidebar for a network view
// props:
//  - controller: parent component that implements changeMenu
//  - activeMenu: a string representing which menu to open
//  - children: each menu should be a child for this sidebar 
//              and contain a key that can be used to compare 
//              against the current menu
//  
class PathwaysSidebar extends React.Component {
  render(){
    let { controller, activeMenu } = this.props;
    let activeMenuContent = this.props.children.find(child => child.key === activeMenu);

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
        h('div.sidebar-text', [activeMenuContent])
      ])
  ]);

  }
}

module.exports = PathwaysSidebar;