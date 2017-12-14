const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const _ = require('lodash');

const searchNodes = require('../../../cy/search');

const IconButton = require('../../icon-button');

const datasourceLinks = require('../../../config').databases;

let debouncedSearchNodes = _.debounce(searchNodes, 300);

// Buttons for opening the sidebar, along with their descriptions
const toolButtons = {
  info: 'Extra information',
  file_download: 'Download options',
  // history: 'Layout Revisions'
  //help: 'Interpreting the display' // re-add to access help menu
};

/* Props
- name
- datasource
- availableLayouts
- currentLayout
- cy
- changeLayout
- changeMenu
*/
class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchOpen: false,
      complexesExpanded: true,
      selectedLayout: props.currentLayout,
      initialLayoutSet: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.initialLayoutSet) {
      this.setState({
        selectedLayout: nextProps.currentLayout,
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
        // cy.fit(100);
    });
    layout.run();
  }

  toggleExpansion() {
    if (this.state.complexesExpanded) {
      this.props.cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
    } else {
      this.props.cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isCollapsed()).expand();
    }
    this.setState({ complexesExpanded: !this.state.complexesExpanded });
  }

  // Used for the panel buttons to set menus in the sidebar and dynamically change the style
  changeMenu(menu) {
    this.props.changeMenu(menu === this.props.activeMenu ? '' : menu);
  }

  changeSearchValue(newVal) {
    let cy = this.props.cy;
    debouncedSearchNodes(newVal, cy, true);
  }

  clearSearchBox() {
    this.searchField.value = '';
    this.changeSearchValue('');
  }

  getDatasourceLink(datasource) {
    const link = datasourceLinks.filter(ds => ds[0].toUpperCase() === datasource.toUpperCase());

    return _.get(link, '0.1', '');
  }

  render() {
    const datasourceLink = this.getDatasourceLink(this.props.datasource);

    const toolButtonEls = Object.keys(toolButtons).map((button, index) => {
      return (
        h(IconButton, {
          icon: button,
          active: this.props.activeMenu === button,
          onClick: () => this.changeMenu(button),
          desc: toolButtons[button]
        })
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
              h('h4', [
                h('span', { onClick: () => this.changeMenu('info') }, this.props.name),
                ' | ',
                h('a', { href: datasourceLink, target: '_blank' }, this.props.datasource)
              ])
            ])
          ]),
          h('div.view-toolbar', toolButtonEls.concat([
            h(IconButton, {
              icon: this.state.complexesExpanded ? 'select_all' : 'settings_overscan',
              onClick: () => this.toggleExpansion(),
              desc: `${this.state.complexesExpanded ? 'Collapse' : 'Expand'} complexes`
            }),
            h(IconButton, {
              icon: 'replay',
              onClick: () => this.performLayout(this.state.selectedLayout),
              desc: 'Reset arrangement'
            }),
            h(IconButton, {
              icon: 'search',
              active: this.state.searchOpen,
              onClick: () => {
                !this.state.searchOpen || this.clearSearchBox();
                this.setState({ searchOpen: !this.state.searchOpen });
              },
              desc: 'Search entities'
            }),
            h('div', {
              className: classNames('search-nodes', { 'search-nodes-open': this.state.searchOpen }),
              onChange: e => this.changeSearchValue(e.target.value)
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