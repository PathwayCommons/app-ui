const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const _ = require('lodash');

const { humanLayoutDisplayName } = require('../../../../common/cy/layout');
const searchNodes = require('../../../../common/cy/search');

const { Dropdown, DropdownOption } = require('../../../../common/dropdown');
const IconButton = require('../../../../common/iconButton');
const apiCaller = require('../../../../services/apiCaller');
const datasourceLinks = require('../../../../common/config').databases;
const TextField = require('../../../../common/textField/');
const Popup = require('../../../../common/popup/');
const getShareLink = require('./share');
const rearrangeGraph = require('../../../../common/cy/revisions/rearrangeGraph');
const datasourceHomes = require('../../../../common/config').databasesHomePages;
const globalConfig = require('../../../../../config');


let debouncedSearchNodes = _.debounce(searchNodes, 300);

// Buttons for opening the sidebar, along with their descriptions
const toolButtons = {
  info: 'Extra information',
  file_download: 'Download options',
  history: 'Layout Revisions'
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
      showPopup: false,
      searchOpen: false,
      complexesExpanded: true,
      selectedLayout: props.currLayout,
      initialLayoutSet: false,
      renderedSnap: false,
      snapshotURL: '',
      linkCopiedActive: false
    };
  }

  componentWillReceiveProps(nextProps) {
    // To stop the layout from being reset every time this component receives props,
    // a state variable is set
    if (!this.state.initialLayoutSet) {
      this.setState({
        selectedLayout: nextProps.currLayout,
        initialLayoutSet: true
      }, () => {
        this.performLayout(this.state.selectedLayout);
      });
    }
  }

  // - Takes a layout name (a display name) and performs the layout associated with it on props.cy
  // - Submits layout changes if the user is in edit mode
  // - Performs a pan and zoom if a snapshot ID is specified, if it hasn't yet done this
  performLayout(selectedLayoutName) {
    this.setState({ selectedLayout: selectedLayoutName });
    const props = this.props;
    const cy = props.cy;
    const layoutOpts = _.find(props.availableLayouts, (layout) => layout.displayName === selectedLayoutName).options;
    let layout = cy.layout(layoutOpts);

    let snapshotId = this.props.snapshotId;
    let renderedSnap = this.state.renderedSnap;
    let that = this;
    //let changeState = () => this.setState({renderedSnap : true});

    layout.pon('layoutstop').then(function () {
      //Render Snapshot
      if (!renderedSnap && snapshotId) {
        apiCaller.getSnapshot(snapshotId).then(res => {
          that.setState({ renderedSnap: true });
          rearrangeGraph(res.positions, cy, {}, res.zoom, res.pan);
        });
        return;
      }

      if (props.admin && selectedLayoutName !== humanLayoutDisplayName) {
        let posObj = {};
        cy.nodes().forEach(node => {
          posObj[node.id()] = node.position();
        });
        apiCaller.submitLayoutChange(props.uri, 'latest', posObj);
        cy.fit(100);
      }
    });
    layout.run();
  }

  // Toggles complex expansion/collapsing based off of the current state
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

  // Changes the node search value to newVal, a string (with a debounce)
  changeSearchValue(newVal) {
    let cy = this.props.cy;
    debouncedSearchNodes(newVal, cy, true);
  }

  // Clears the node search box, and the current search
  clearSearchBox() {
    this.searchField.value = '';
    this.changeSearchValue('');
  }

  // Gets link to current datasource page for current pathway/interaction
  getDatasourceLink(datasource) {
    const link = datasourceLinks.filter(ds => ds[0].toUpperCase() === datasource.toUpperCase());

    return _.get(link, '0.1', '');
  }

  // Gets link to current datasource home page
  getDatasourceHome(datasource) {
    const link = datasourceHomes.filter(ds => ds[0].toUpperCase() === datasource.toUpperCase());

    return _.get(link, '0.1', '');
  }

  // Get the current snapshot link to send and toggles the window open or closed (TO BE REPLACED)
  getShareLinkAndToggle() {
    const props = this.props;
    const state = this.state;
    const snapshotOpen = state.snapshotOpen;
    if (snapshotOpen) { this.setState({ snapshotOpen: false }); }
    else { getShareLink(props.cy, props.uri).then(res => this.setState({ snapshotURL: res, snapshotOpen: true })); }
  }

  render() {
    const datasourceLink = this.getDatasourceLink(this.props.datasource);
    const datasourceHome = this.getDatasourceHome(this.props.datasource);
    const isAdmin = this.props.admin;

    // Sets options in dropdown menu, used in edit mode
    const layoutItems = this.props.availableLayouts.map((layout, index) => {
      return (
        h(DropdownOption, {
          key: index,
          value: layout.displayName,
          header: layout.displayName,
          description: layout.description
        })
      );
    });

    // Sets the tool buttons in the toolbar that toggle the sidebar
    const toolButtonEls = Object.keys(toolButtons).map((button, index) => {
      if (button === 'history' && !isAdmin) {
        return;
      }

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
                  src: globalConfig.baseName + '/img/icon.png'
                })
              ])
            ]),
            h('div.title-container', [
              h('h4', [
                h('a', { href: datasourceLink, target: '_blank' }, this.props.name),
                ' | ',
                h('a', { href: datasourceHome, target: '_blank' }, this.props.datasource)
              ])
            ])
          ]),
          h('div.view-toolbar', toolButtonEls.concat([
            // Collapse/Expand button
            h(IconButton, {
              icon: this.state.complexesExpanded ? 'select_all' : 'settings_overscan',
              onClick: () => this.toggleExpansion(),
              desc: `${this.state.complexesExpanded ? 'Collapse' : 'Expand'} complexes`
            }),

            // Snapshot slide (TO BE CHANGED)
            h(IconButton, {
              icon: 'link',
              active: this.state.snapshotOpen,
              onClick: () => this.getShareLinkAndToggle(),
              desc: 'Get shareable link'
            }),
            h('div', {
              className: classNames('snapshot-container', { 'snapshot-container-open': this.state.snapshotOpen })
            }, [h(TextField, { text: this.state.snapshotURL, copy: true, copyCallback: () => this.setState({ linkCopiedActive: true, snapshotOpen: false }) })]),
            h(Popup, {
              active: this.state.linkCopiedActive,
              deactivate: () => this.setState({ linkCopiedActive: false }),
              dur: 2000
            }, 'Link copied'),

            // Dropdown layout menu (in edit mode), or reset arrangement button (in view mode)
            h(IconButton, {
              active: this.state.dropdownOpen,
              icon: this.props.admin ? 'shuffle' : 'replay',
              onClick: () => this.props.admin ? this.setState({ dropdownOpen: !this.state.dropdownOpen }) : this.performLayout(this.state.selectedLayout),
              desc: this.props.admin ? 'Arrange display' : 'Reset arrangement'
            }),
            h('div', {
              className: classNames('layout-dropdown', { 'layout-dropdown-open': this.state.dropdownOpen })
            }, [h(Dropdown, {
              value: this.state.selectedLayout,
              onChange: value => this.performLayout(value)
            }, layoutItems)]),

            // Node search
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
            }, [h('div.view-search-bar', [
              h('input.view-search', {
                ref: dom => this.searchField = dom,
                type: 'search',
                placeholder: 'Search entities'
              }),
              h('div.view-search-clear', {
                onClick: () => this.clearSearchBox(),
              }, [h('i.material-icons', 'close')])
            ])])
          ]))
        ])
    );
  }
}

module.exports = Menu;