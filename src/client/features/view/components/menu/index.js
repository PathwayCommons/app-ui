const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');

const layoutConf = require('../../../../common/cy/layout');

const { Dropdown, DropdownOption } = require('../../../../common/dropdown');

const searchNodes = require('./search');

const tippy = require('tippy.js');

// Buttons for opening the sidebar, along with their descriptions
const toolButtons = {
  file_download: 'Download options',
  help: 'Interpreting the display'
};

/* Props
- name
- datasource
- layouts
- updateLayout
- currLayout
*/
class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false
    };
  }

  componentDidMount() {
    this.initTooltips();
  }

  initTooltips() {
    tippy('.layout-dropdown-button', {
      delay: [800, 400],
      animation: 'scale',
      theme: 'dark',
      arrow: true,
      touchHold: true
    });
  }

  // Used for the panel buttons to set menus in the sidebar and dynamically change the style
  changeMenu(menu) {
    this.props.changeMenu(menu === this.props.activeMenu ? '' : menu);
  }

  render() {
    const layoutItems = this.props.layouts.map((layout, index) => {
      return (
        h(DropdownOption, {
          key: index,
          value: layout,
          description: layoutConf.layoutDescs[layout]
        })
      );
    });

    const toolButtonEls = Object.keys(toolButtons).map((button, index) => {
      return (
        h('div', {
          key: index,
          className: classNames('tool-button', this.props.activeMenu === button ? 'active' : ''),
          onClick: () => this.changeMenu(button),
          title: toolButtons[button]
        }, [
            h('i.material-icons', button)
          ])
      );
    });

    return (
      h('div.menu-bar', [
        h('div.menu-bar-inner-container', [
          h('div.pc-logo-container', [
            h(Link, { to: { pathname: '/search' } }, [
              h('img', {
                src: '/img/icon.png'
              })
            ])
          ]),
          h('div.title-container', [
            h('h4', `${this.props.name} | ${this.props.datasource}`)
          ]),
          h('div.search-nodes', {
            onChange: e => searchNodes(e.target.value, this.props.cy),
            title: 'Search for Nodes'
          }, [
            h('div.view-search-bar', [h('input.view-search', { type: 'text', placeholder: 'Search entities' })])
          ]),
          h('div.layout-dropdown-button', {
            onClick: () => this.setState({ dropdownOpen: !this.state.dropdownOpen }),
            title: 'Rearrange the entities on screen'
          }, [
              h('i.material-icons', 'shuffle')
            ])
        ]),
        h('div', {
          className: classNames('layout-dropdown', this.state.dropdownOpen ? 'open' : '')
        }, [
          h(Dropdown, {
            value: this.props.currLayout,
            onChange: value => this.props.updateLayout(value)
          }, layoutItems)
        ]),
        h('div.view-toolbar', toolButtonEls)
      ])
    );
  }
}

module.exports = Menu;

    // Map tool buttons to actual elements with tooltips
    // const toolButtons = toolButtonNames.map((button, index) => {
    //   return (
    //     h('div', {
    //       key: index,
    //       className: classNames('tool-button', this.state.activeMenu === button ? 'active' : ''),
    //       onClick: () => this.handleIconClick(button),
    //       title: tooltips[index]
    //     }, [
    //         h('i.material-icons', button)
    //       ])
    //   );
    // });

    // h('div.sidebar-select', toolButtons),