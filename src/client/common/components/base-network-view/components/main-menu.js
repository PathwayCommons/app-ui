const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const _ = require('lodash');

const searchNodes = require('../../../cy/search');

const IconButton = require('../../icon-button');

const datasourceLinks = require('../../../config').databases;

let debouncedSearchNodes = _.debounce(searchNodes, 300);


/* Props
- name
- datasource
- layoutConfig
- cy
- changeLayout
- changeMenu
*/
class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchOpen: false,
    };
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
    const props = this.props;

    const datasourceLink = this.getDatasourceLink(props.datasource);
    const toolButtonEls = Object.keys(props.menuButtons).map((button, index) => {
      return (
        h(IconButton, {
          icon: button,
          active: props.activeMenu === button,
          onClick: () => this.changeMenu(button),
          desc: props.menuButtons[button]
        })
      );
    });

    const networkButtonEls = Object.keys(props.networkButtons).map(button => {
      const b = props.networkButtons[button];
      return h(IconButton, {
        icon: button,
        onClick: e => b.func(props),
        desc: b.description
      });
    });


    return (
      h('div', {
        className: classNames('menu-bar', { 'menu-bar-margin': props.activeMenu })
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
                h('span', { onClick: () => this.changeMenu('info') }, props.name),
                ' | ',
                h('a', { href: datasourceLink, target: '_blank' }, props.datasource)
              ])
            ])
          ]),
          h('div.view-toolbar', toolButtonEls.concat([...networkButtonEls,
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