
const React = require('react');
const h = require('react-hyperscript');
const classNames = require('classnames');

const IconButton = require('./icon-button');


// a sidebar for a network view
// props:
//  - controller: parent component that implements changeMenu
//  - activeMenu: a string representing which menu to open
//  - children: each menu should be a child for this sidebar
//              and contain a key that can be used to compare
//              against the current menu
//

// example usage:
// class ParentComponent extends React.Component {
//   constructor(props){
//     this.state = {
//       activeMenu: 'menu1'
//     };
//   }
//   changeMenu(newMenu){
//     this.setState({ activeMenu: newMenu });
//   }
//   render(){
//     let { activeMenu } = this.state;
//     return h(Sidebar, { controller: this, activeMenu }, [
//       h(Menu1, { key: 'menu1' }),
//       h(Menu2, { key: 'menu2' })
//     ])
//   }
// }

class Sidebar extends React.Component {
  render(){
    let { controller, activeMenu, children } = this.props;
    let activeMenuContent = children.find(child => child.key === activeMenu);

    return h('div.sidebar-menu', { className: classNames({'sidebar-menu-open': activeMenu != 'closeMenu' })}, [
      h('div.sidebar-close', [
        h(IconButton, {
          description: 'Close the sidebar',
          onClick: () => controller.changeMenu('closeMenu'),
          isActive: false,
          icon: 'close'
        })
      ]),
      h('div.sidebar-content', [
        h('div.sidebar-text', [activeMenuContent])
      ])
    ]);
  }
}

module.exports = Sidebar;