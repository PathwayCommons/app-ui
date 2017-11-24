const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { getLayouts } = require('../../../../../common/cy/layout/');
const apiCaller = require('../../../../../services/apiCaller');

class HistoryMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      layouts: '',
      loading: true
    };
    apiCaller.getLayouts(props.uri, 'latest').then(res => this.setState({
      layouts: res,
      loading: false
    }));
  }

  applyLayout(id) {
    const layouts = this.state.layouts.layout;
    const layout = layouts.filter(item => item.id === id)[0];
    const positions = layout.positions;
    const layoutConf = getLayouts(positions);
    this.props.changeLayout(layoutConf);
    this.performLayout(layoutConf.layouts, positions);
  }

  //Apply the previous layout to the cytoscape graph
  //Modified the cy object and submits the changes to the server
  performLayout(layouts, positions) {
    const props = this.props;
    const cy = props.cy;

    //Modify positions for each layout entry
    const layoutOpts = _.find(layouts, (layout) => layout.displayName === 'Human-created').options;
    let layout = cy.layout(layoutOpts);

    //Save positions
    layout.pon('layoutstop').then(function () {
      cy.nodes().forEach(element => {
        if (positions[element.id()]) {
          //Save local position
          let position = element.position();

          //Save remote position
          if(props.admin) {
            apiCaller.submitNodeChange(props.uri, 'latest', element.id(),  position);
          }
        }
      });

      //Animate zoom and fit
      cy.animate({
        fit: {
          eles: cy.elements(), padding: 100
        }
      }, { duration: 700 });
    });

    layout.run();
  }

  render() {
    let layouts = this.state.layouts.layout;
    if (layouts) {
      return h('div', [
        h('h1', 'Layout Revisions'),
        h('ul', layouts.map(layout => h('li', { onClick: () => this.applyLayout(layout.id) }, h('a', layout.date_added))))
      ]);
    }
    else {
      return h('h1', 'No Saved Layouts');
    }
  }
}

module.exports = HistoryMenu;