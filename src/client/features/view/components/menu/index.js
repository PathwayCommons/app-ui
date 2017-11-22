const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const tippy = require('tippy.js');
const _ = require('lodash');

const { Dropdown, DropdownOption } = require('../../../../common/dropdown');

const searchNodes = require('./search');

// Buttons for opening the sidebar, along with their descriptions
const toolButtons = {
  file_download: 'Download options',
  help: 'Interpreting the display'
};

/* Props
- name
- datasource
- availableLayouts
- initialLayout
*/
class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false,
      searchOpen: false,
      selectedLayout: props.initialLayout
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedLayout: nextProps.initialLayout
    }, () => {
      this.performLayout(this.state.selectedLayout);
    });
  }

  performLayout(selectedLayoutName) {
    this.setState({ selectedLayout: selectedLayoutName });
    const props = this.props;
    const cy = props.cy;

    const layoutOpts = _.find(props.availableLayouts, (layout) => layout.displayName === selectedLayoutName).options;
    cy.layout(layoutOpts).run();
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

  changeSearchValue(newVal) {
    this.setState({searchValue: newVal});
    searchNodes(newVal, this.props.cy);
  }

  render() {
    const layoutItems = this.props.availableLayouts.map((layout, index) => {
      return (
        h(DropdownOption, {
          key: index,
          value: layout.displayName,
          description: layout.description
        })
      );
    });

    const toolButtonEls = Object.keys(toolButtons).map((button, index) => {
      return (
        h('div', {
          key: index,
          className: classNames('tool-button', this.props.activeMenu === button ? 'tool-button-active' : ''),
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
          ])
        ]),
        h('div.view-toolbar', toolButtonEls.concat([
          h('div', {
            className: classNames('tool-button', this.state.dropdownOpen ? 'tool-button-active' : ''),
            onClick: () => this.setState({ dropdownOpen: !this.state.dropdownOpen }),
            title: 'Rearrange entities'
          }, [h('i.material-icons', 'shuffle')]),
          h('div', {
            className: classNames('layout-dropdown', this.state.dropdownOpen ? 'layout-dropdown-open' : '')
          }, [
            h(Dropdown, {
              value: this.state.selectedLayout,
              onChange: value => this.performLayout(value)
            }, layoutItems)
          ]),
          h('div', {
            className: classNames('tool-button', this.state.searchOpen ? 'tool-button-active' : ''),
            onClick: () => this.setState({ searchOpen: !this.state.searchOpen }),
            title: 'Search entities'
          }, [h('i.material-icons', 'search')]),
          h('div', {
            className: classNames('search-nodes', this.state.searchOpen ? 'search-nodes-open' : ''),
            onChange: e => this.changeSearchValue(e.target.value),
            title: 'Search for Nodes'
          }, [
              h('div.view-search-bar', [
                h('input.view-search', {
                  ref: dom => this.searchField = dom,
                  type: 'search',
                  placeholder: 'Search entities'
                }),
                h('div.view-search-clear', {
                  onClick: () => this.searchField.value = '',
                }, [h('i.material-icons', 'close')])
              ])
            ])
        ]))
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