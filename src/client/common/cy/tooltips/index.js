const h = require('hyperscript');
const tippy = require('tippy.js');

const config = require('../../config');

const formatContent = require('./format-content');
const collection = require('./collection');
const getPublications = require('./publications');



class Metadata {
  constructor(node){
    let nodeMetadata = node.data('parsedMetadata');
    let nodeLabel = node.data('label');
    let nodeClass = node.data('class');
    this.data = new Map();
    this.rawData = nodeMetadata;

    nodeMetadata.forEach( datum => {
      this.data.set(datum[0],  datum[1]);
    });

    if( nodeClass === 'process'){
      this.data.set('Search Link', this.data['Display Name']);
    } else {
      this.data.set('Search Link', nodeLabel);
    }
  }
  isEmpty(){
    return this.rawData == null || this.rawData.length === 0;
  }

  type(){
    let type = this.data.get('Type');
    console.log(type);
    if( type ){
      return type.substring(3);
    }
    return '';
  }
  standardName(){
    return this.data.get('Standard Name') || '';
  }
  displayName(){
    return this.data.get('Display Name') || '';
  }
  synonyms(){
    return this.data.get('Names');
  }
  databaseIds(){
    return this.data.get('Database IDs');
  }
  publications(){
    return this.data.get('publications');
  }
  searchLink(){
    return this.data.get('Search Link') || '';
  }
}

//Manage the creation and display of metadata HTML content
//Requires a valid name, cytoscape element, and parsedMetadata array
class MetadataTip {

  constructor(cyElement) {
    this.name = name;
    this.data = new Metadata(cyElement);
    this.cyElement = cyElement;
    this.db = config.databases;
    this.viewStatus = {};
    this.visible = false;
    this.zoom = cyElement._private.cy.zoom();
  }

  //Show Tippy Tooltip
  show() {
    let cy = this.cyElement._private.cy;
    let tooltip = this.tooltip;
    let zoom = this.zoom;
    let isEdge = this.cyElement.isEdge();

    //If no tooltip exists create one
    if ( !tooltip|| ( zoom != cy.zoom() && isEdge ) ) {
      zoom = cy.zoom();
      //Generate HTML
      let tooltipHTML = this.generateToolTip(zoom,isEdge);

      //Create tippy object
      let refObject = this.cyElement.popperRef();
      tooltip = tippy(refObject, { html: tooltipHTML, theme: 'light', interactive: true, trigger: 'manual', hideOnClick: false, arrow: true, placement: 'bottom',distance: isEdge? -25*zoom+7:10}).tooltips[0];

      //Save tooltips
      this.tooltip = tooltip;
      this.zoom = zoom;
    }

    //Show Tooltip
    tooltip.show();
    this.visible = true;
  }

  //Validate the name of object and use Display Name as the fall back option
  validateName() {
    if (!(this.name)) {
      let displayName = this.data.filter(pair => pair[0] === 'Display Name');
      if (displayName.length > 0) { this.name = displayName[0][1].toString(); }
    }
  }

  //Generate HTML Elements for tooltips
  generateToolTip(zoom, isEdge) {
    let data = this.data;
    let name = data.displayName();

    if ( this.data.isEmpty() ) {
      return h('div.tooltip-image', [
        h('div.tooltip-heading', [
          h('a.tooltip-heading-link',{ href:"/search?&q=" + name, target:"_blank"}, name),
          ]),
        h('div.tooltip-internal', h('div.tooltip-warning', 'No Additional Information'))
      ]);
    }
    const tooltipOrder = ['Type', 'Standard Name', 'Display Name', 'Names', 'Database IDs', 'Publications'];

    console.log(data.databaseIds());

    return h('div.tooltip-image', [
      h('div.tooltip-heading', name),
      h('div.tooltip-internal', [
        h('div.tooltip-type', data.type()),
      ]),
      h('div.fake-paragraph', [
        h('div.field-name', 'Name: '),
        h('div.tooltip-value', data.standardName())
      ]),
      h('div.fake-paragraph', [
        h('div.field-name', 'Display Name: '),
        h('div.tooltip-value', data.displayName())
      ]),
      h('div.fake-paragraph', [
        h('div.field-name', 'Synonyms: '),
        h('div.tooltip-value', data.synonyms().slice(0, 3))
      ]),


        // (data).map(item => formatContent.parseMetadata(item, true, null, name)), this))
    ]);
  }

  //Hide Tippy tooltip
  hide() {
    if (this.tooltip) {
      this.tooltip.hide();
    }
    this.visible = false;
  }

  //Destroy Tippy tooltip
  destroy() {
    if (this.tooltip) {
      this.tooltip.destroy(this.tooltip.store[0].popper);
      this.tooltip = null;
    }
  }
}

module.exports = MetadataTip;