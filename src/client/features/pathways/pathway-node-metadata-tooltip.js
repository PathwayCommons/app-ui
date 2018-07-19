const ReactDom = require('react-dom');
const hh = require('hyperscript');
const h = require('react-hyperscript');
const tippy = require('tippy.js');

const PathwayNodeMetadataView = require('./pathways-node-metadata-view');
const PathwayNodeMetadata = require('../../models/pathway/pathway-node-metadata');
// This metadata tip is only for entities i.e. nodes
// TODO make an edge metadata tip for edges (for the interactions app)
class PathwayNodeMetadataTooltip {

  constructor(node) {
    this.node = node;
    this.metadata = new PathwayNodeMetadata(node);
    this.tooltip = null;
  }

  show() {
    let getContentDiv = component => {
      let div = hh('div');
      ReactDom.render( component, div );
      return div;
    };

    if( this.tooltip != null ){
      this.tooltip.destroy();
      this.tooltip = null;
    }

    // publication data needs to be fetched from pubmed before we can display the tooltip
    this.metadata.getPublicationData().then( () => {
      let refObject = this.node.popperRef();
      let tooltip = tippy(refObject, {
        html: getContentDiv( h(PathwayNodeMetadataView, { metadata: this.metadata, } )),
        theme: 'light',
        interactive: true,
        trigger: 'manual',
        hideOnClick: false,
        arrow: true,
        placement: 'bottom',
        distance: 10}
      ).tooltips[0];

      this.tooltip = tooltip;
      this.tooltip.show();
    });
  }

  hide() {
    if (this.tooltip) {
      this.tooltip.hide();
    }
  } 
}

module.exports = PathwayNodeMetadataTooltip;