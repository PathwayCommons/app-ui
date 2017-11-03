const React = require('react');
const HtmlToReactParser = require('html-to-react').Parser;

class MetadataSidebar extends React.Component {
  constructor(props) {
    super(props);
  }

  //Generate the HTML content for the sidebar
  //Everytime the state updates, the sidebar content is regenerated based on the new provided node id
  sidebarHTML() {
    //Validate Cytoscape Object
    if (!(this.props.cy)) { return 'Error : Cytoscape Object Not Found'; }

    //Get node and tooltip
    let node = this.props.cy.getElementById(this.props.nodeId);
    let tooltip = node.scratch('tooltip');

    //Open Side Bar
    if (tooltip) {
      return tooltip.generateSideBar(() => '');
    }
    else {
      return 'No Data Found';
    }
  }

  render() {
    //Get Sidebar metadata html
    let sidebarMetadata = this.sidebarHTML().innerHTML;
    let htmlToReactParser = new HtmlToReactParser();
    let reactElement = htmlToReactParser.parse(sidebarMetadata);
    return reactElement;
  }
}

module.exports = MetadataSidebar;