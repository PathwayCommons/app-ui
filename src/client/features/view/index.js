const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');

const { Menu, Graph, EditWarning, Sidebar } = require('./components/');

const lo = require('../../common/cy/layout/');
const make_cytoscape = require('./cy/');
const bindMove = require('./cy/events/move');
const hoverStyles = require('./cy/events/hover');

const queryString = require('query-string');
const { CDC } = require('../../services/');

class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(window.location.search);
    this.state = {
      query: query,

      cy: null, // cytoscape mounted after Graph component has mounted
      graphJSON: null,
      layoutJSON: null,
      layout: lo.defaultLayout,
      availableLayouts: [],

      name: '',
      datasource: '',

      activateWarning: this.props.admin || false,
      warningMessage: this.props.admin ? 'Be careful! Your changes are live.' : '',

      activeDisplayedNode: ''
    };

    CDC.getGraphAndLayout(query.uri, 'latest').then(graphJSON => this.setState({
      graphJSON: graphJSON.graph,
      layoutJSON: graphJSON.layout,
      name: graphJSON.graph.pathwayMetadata.title[0] || 'Unknown Network',
      datasource: graphJSON.graph.pathwayMetadata.dataSource[0] || 'Unknown Data Source'
    }));
  }

  componentWillMount() {
    this.setState({
      cy: make_cytoscape({ headless: true }, nodeId => this.setState({ activeDisplayedNode: nodeId }))
    }, () => {
      if (this.props.admin) {
        bindMove(this.state.query.uri, 'latest', this.state.cy);
      }
    });
  }

  // To be called when the graph renders (since this is determined by the Graph class)
  updateRenderStatus(status) {
    if (status) {
      let layout;
      let availableLayouts = lo.layoutNames(this.state.cy.nodes().size());

      if (this.state.layoutJSON) {
        layout = lo.humanLayoutName;
        availableLayouts.splice(0, 0, lo.humanLayoutName);
      } else {
        layout = lo.getDefaultLayout(this.state.cy.nodes().size());
      }

      this.setState(
        {
          availableLayouts: availableLayouts,
          layout: layout
        },
        () => { this.performLayout(this.state.layout); }
      );
    }
  }

  performLayout(layoutName) {
    this.setState({ layout: layoutName });
    const cy = this.state.cy;

    if (layoutName === lo.humanLayoutName) {
      const layoutJSON = this.state.layoutJSON;
      let options = {
        name: 'preset',
        positions: node => layoutJSON[node.id()],
        animate: true,
        animationDuration: 500
      };
      cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
      cy.layout(options).run();
      return;
    }

    cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
    let layout = cy.layout(lo.layoutMap.get(layoutName));
    let that = this;
    layout.pon('layoutstop').then(function () {
      if (that.props.admin && layoutName !== lo.humanLayoutName) {
        let posObj = {};
        cy.nodes().forEach(node => {
          posObj[node.id()] = node.position();
        });
        CDC.submitLayoutChange(that.state.query.uri, 'latest', posObj);
      }
    });
    layout.run();
  }

  //Applying hover styling to a collection of nodes
  updateStyling(style, matched, applyStyle = true){
    const cy = this.state.cy;
    hoverStyles.removeHoverStyle(cy, cy.nodes());
    if(applyStyle) {hoverStyles.applyHoverStyle(cy, cy.nodes(matched), style);}
  }

  //Determine if a regex pattern is valid
validateRegex(pattern) {
    var parts = pattern.split('/'),
        regex = pattern,
        options = "";
    if (parts.length > 1) {
        regex = parts[1];
        options = parts[2];
    }
    try {
        let regexObj = new RegExp(regex, options);
        return regexObj;
    }
    catch(e) {
        return null;
    }
}

  //Search for nodes that match an entered query
  searchNodes(query) {
    const cy = this.state.cy; 
    const searchValue = query.target.value;
    const isBlank = _.isString(searchValue) ? !!_.trim(searchValue) : false;
    const isRegularExp = _.startsWith(searchValue, 'regex:') && this.validateRegex(searchValue.substring(6));
    const isExact = _.startsWith(searchValue, 'exact:');

    let matched; 

    //Search based on regular expression
    if(isRegularExp){
      let regexObject = this.validateRegex(searchValue.substring(6));
      matched = cy.nodes().filter(node => node.data('label').match(regexObject));
    }
    //Search for an exact match
    else if(isExact){
      let trimmedValue = searchValue.substring(6).toUpperCase();
      matched = cy.nodes().filter(node => node.data('label').toUpperCase() == trimmedValue);
    }
    //Search for a partial match
    else {
      let caseInsensitiveValue = searchValue.toUpperCase();
      matched = cy.nodes().filter(node => node.data('label').toUpperCase().includes(caseInsensitiveValue));
    }

    //Define highlighting style
    const searchStyle = {
      'background-color': 'orange',
      'opacity': 1,
      'z-compound-depth': 'top',
      'text-outline-color': 'black'
    };

    //Apply styling
    if (matched.length > 0 && isBlank){
      this.updateStyling(searchStyle, matched);
      cy.fit();
    }
    else {
      this.updateStyling(null, null, false);
      cy.fit();
    }
  }

  render() {
    return (
      h('div.View', [
        h(Menu, {
          name: this.state.name,
          datasource: this.state.datasource,
          layouts: this.state.availableLayouts,
          updateLayout: layout => this.performLayout(layout),
          searchNodes: query => this.searchNodes(query),
          currLayout: this.state.layout
        }),
        h(Graph, {
          updateRenderStatus: status => this.updateRenderStatus(status),
          updateLayout: () => this.performLayout(this.state.layout),
          cy: this.state.cy,
          graphJSON: this.state.graphJSON
        }),
        h(EditWarning, {
          active: this.state.activateWarning,
          deactivate: () => this.setState({ activateWarning: false }),
          dur: 5000
        }, this.state.warningMessage),
        h(Sidebar, {
          cy: this.state.cy,
          uri: this.state.query.uri,
          name: this.state.name,
          datasource: this.state.datasource,
          nodeId: this.state.activeDisplayedNode
        })
      ])
    );
  }
}

module.exports = View;