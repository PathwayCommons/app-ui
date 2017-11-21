const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const tippy = require('tippy.js');
const _ = require('lodash');

const layoutConf = require('../../../../common/cy/layout');
const { Dropdown, DropdownOption } = require('../../../../common/dropdown');

const searchNodes = require('./search');

/* Props
- name
- datasource
- availableLayouts
- currLayout
- layoutJSON
*/
class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false
    };
  }

  performLayout(layoutName) {
    this.setState({ layout: layoutName });

    const props = this.props;
    const cy = props.cy;
    const layoutJSON = props.layoutJSON;

    let options;
    if (!_.isEmpty(layoutJSON)) {
      options = {
        name: 'preset',
        positions: node => layoutJSON[node.id()],
        animate: true,
        animationDuration: 500
      };
      cy.layout(options).run();

    } else {
      options = layoutConf.layoutMap.get(layoutName);
    }

    cy.layout(options).run();
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
    const layoutItems = this.props.availableLayouts.map((layout, index) => {
      return (
        h(DropdownOption, {
          key: index,
          value: layout,
          description: layoutConf.layoutDescs[layout]
        })
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
            onChange : e => searchNodes(e.target.value, this.props.cy),
            title: 'Search for Nodes'
          }, [
            h('div.view-search-bar', [h('input.view-search', {type : 'text', placeholder: 'Entity Search'})])
          ]),
          h('div.layout-dropdown-button', {
            onClick: () => this.setState({dropdownOpen: !this.state.dropdownOpen}),
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
            onChange: value => this.performLayout(value)
          }, layoutItems)
        ])
      ])
    );
  }
}

module.exports = Menu;