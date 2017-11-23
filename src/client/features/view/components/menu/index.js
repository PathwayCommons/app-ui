const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const tippy = require('tippy.js');
const _ = require('lodash');

const { humanLayoutDisplayName } = require('../../../../common/cy/layout');
const { Dropdown, DropdownOption } = require('../../../../common/dropdown');
const CDC = require('../../../../services/cdc');

const searchNodes = require('./search');
let debouncedSearchNodes = _.debounce(searchNodes, 300);

// Buttons for opening the sidebar, along with their descriptions
const toolButtons = {
  info: 'Extra information',
  file_download: 'Download options',
  //help: 'Interpreting the display' // re-add to access help menu
};

/* Props
- name
- datasource
- availableLayouts
- currLayout
*/
class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false,
      searchOpen: false,
      complexesExpanded: true,
      selectedLayout: props.currLayout,
      initialLayoutSet: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.initialLayoutSet) {
      this.setState({
        selectedLayout: nextProps.currLayout,
        initialLayoutSet: true
      }, () => {
        this.performLayout(this.state.selectedLayout);
      });
    }
  }

  performLayout(selectedLayoutName) {
    this.setState({ selectedLayout: selectedLayoutName });
    const props = this.props;
    const cy = props.cy;

    const layoutOpts = _.find(props.availableLayouts, (layout) => layout.displayName === selectedLayoutName).options;
    let layout = cy.layout(layoutOpts);
    layout.pon('layoutstop').then(function () {
      if (props.admin && selectedLayoutName !== humanLayoutDisplayName) {
        let posObj = {};
        cy.nodes().forEach(node => {
          posObj[node.id()] = node.position();
        });
        CDC.submitLayoutChange(props.uri, 'latest', posObj);
      }
    });
    layout.run();
  }


  componentDidMount() {
    this.initTooltips();
  }

  toggleExpansion() {
    if (this.state.complexesExpanded) {
      this.props.cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
    } else {
      this.props.cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isCollapsed()).expand();
    }
    this.setState({ complexesExpanded: !this.state.complexesExpanded });
  }

  initTooltips() {
    tippy('.tool-button', {
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
    let cy = this.props.cy;
    debouncedSearchNodes(newVal, cy);
  }

  clearSearchBox() {
    this.searchField.value = '';
    this.changeSearchValue('');
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
          className: classNames('tool-button', 'tool-button-sidebar', { 'tool-button-active': this.props.activeMenu === button }),
          onClick: () => this.changeMenu(button),
          title: toolButtons[button]
        }, [
            h('i.material-icons', button)
          ])
      );
    });

    return (
      h('div', {
        className: classNames('menu-bar', { 'menu-bar-margin': this.props.activeMenu })
      }, [
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
            h('div.tool-button', {
              onClick: () => this.toggleExpansion(),
              title: 'Expand/collapse complexes'//`${this.state.complexesExpanded ? 'Collapse' : 'Expand'} complexes`
            }, [h('i.material-icons', this.state.complexesExpanded ? 'select_all' : 'settings_overscan')]),
            h('div', {
              className: classNames('tool-button', { 'tool-button-active': this.state.dropdownOpen }),
              onClick: () => this.setState({ dropdownOpen: !this.state.dropdownOpen }),
              title: 'Rearrange entities'
            }, [h('i.material-icons', 'shuffle')]),
            h('div', {
              className: classNames('layout-dropdown', { 'layout-dropdown-open': this.state.dropdownOpen })
            }, [
                h(Dropdown, {
                  value: this.state.selectedLayout,
                  onChange: value => this.performLayout(value)
                }, layoutItems)
              ]),
            h('div', {
              className: classNames('tool-button', { 'tool-button-active': this.state.searchOpen }),
              onClick: () => {
                !this.state.searchOpen || this.clearSearchBox();
                this.setState({ searchOpen: !this.state.searchOpen });
              },
              title: 'Search entities'
            }, [h('i.material-icons', 'search')]),
            h('div', {
              className: classNames('search-nodes', { 'search-nodes-open': this.state.searchOpen }),
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
                    onClick: () => this.clearSearchBox(),
                  }, [h('i.material-icons', 'close')])
                ])
              ])
          ]))
        ])
    );
  }
}

module.exports = Menu;