const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');

const layoutConf = require('../../../../common/cy/layout');

const { Dropdown, DropdownOption } = require('../../../../common/dropdown');

const searchNodes = require('./search');

const tippy = require('tippy.js');

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
  render() {
    const layoutItems = this.props.layouts.map((layout, index) => {
      return (
        h(DropdownOption, {
          key: index,
          value: layout,
          description: layoutConf.layoutDescs[layout]
        })
        // h('option', {
        //   key: index,
        //   value: layout
        // }, layout)
      );
    });

    return (
      h('div.menu-bar', [
        h('div.menu-bar-inner-container', [
          h('div.pc-logo-container', [
            h(Link, {to: {pathname: '/search'}}, [
              h('img', {
                src: '/img/icon.png'
              })
            ])
          ]),
          h('div.title-container', [
            h('h4', `${this.props.name} | ${this.props.datasource}`)
          ]),
          h('div.search-nodes', {
            onChange : query => searchNodes(query, this.props.cy),
            title: 'Search for Nodes'
          }, [
            h('input.view-search', {type : 'text', placeholder: 'Entity Search'})
          ]),
          h('div.layout-dropdown-button', {
            onClick: () => this.setState({dropdownOpen: !this.state.dropdownOpen}),
            title: 'Rearrange the entities on screen'
          }, [
            // options include 'transform', 'share', 'call_split'
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
          // h('select', {
          //   value: this.props.currLayout,
          //   onChange: (e) => this.props.updateLayout(e.target.value)
          // }, layoutItems)
        ])
      ])
    );
  }
}

module.exports = Menu;