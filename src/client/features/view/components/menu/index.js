const React = require('react');
const h = require('react-hyperscript');
const Link = require('react-router-dom').Link;
const classNames = require('classnames');
const tippy = require('tippy.js');
const _ = require('lodash');

const { humanLayoutDisplayName } = require('../../../../common/cy/layout');
const { Dropdown, DropdownOption } = require('../../../../common/dropdown');
const apiCaller = require('../../../../services/apiCaller');

const searchNodes = require('./search');

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
    let layout = cy.layout(layoutOpts);
    layout.pon('layoutstop').then(function () {
      if (props.admin && selectedLayoutName !== humanLayoutDisplayName) {
        let posObj = {};
        cy.nodes().forEach(node => {
          posObj[node.id()] = node.position();
        });
        apiCaller.submitLayoutChange(props.uri, 'latest', posObj);
      }
    });
    layout.run();
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
          value: layout.displayName,
          description: layout.description
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
            value: this.state.selectedLayout,
            onChange: value => this.performLayout(value)
          }, layoutItems)
        ])
      ])
    );
  }
}

module.exports = Menu;