const h = require('hyperscript');
const tippy = require('tippy.js');

const config = require('../../config');

const formatContent = require('./format-content');
const collection = require('./collection');
const getPublications = require('./publications');
 

// const pair2Obj = twoValArray => { 
//   let o = {};
//   o[twoValArray[0]] = twoValArray[1]; 
//   return o;
// };

// Node metadata should contain the following fields:
// 'Type', 
// 'Standard Name', 
// 'Display Name', 
// 'Names', 
// 'Database IDs',
// 'Publications'
// Publications are queried via pubmed using a network call

class NodeMetadata {
  constructor(node){
    let nodeMetadata = node.data('parsedMetadata');
    let nodeLabel = node.data('label');
    let nodeClass = node.data('class');
    this.data = new Map(nodeMetadata);
    this.rawData = nodeMetadata;

    if( nodeClass === 'process'){
      this.data.set('Search Link', this.data.get('Display Name'));
    } else {
      this.data.set('Search Link', nodeLabel);
    }

    let aggregatedDbIds = {};
    this.databaseIds().forEach(dbEntry => {
      let [dbName, dbId ] = dbEntry;
      if( Object.keys(aggregatedDbIds).includes(dbName) ){
        aggregatedDbIds[dbName].push(dbId);
      } else {
        aggregatedDbIds[dbName] = [dbId];
      }
    });
    this.data.set('Database IDs', new Map(Object.entries(aggregatedDbIds)));
  }
  isEmpty(){
    return this.data.entries().length === 0;
  }

  type(){
    let type = this.data.get('Type');
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
    return this.data.get('Names') || [];
  }
  databaseIds(){
    return this.data.get('Database IDs') || [];
  }
  databaseLinks(){
    let dbEntries = this.databaseIds().entries();
    let findDbBaseUrl = dbId => {};

    let links = [...dbEntries].forEach(([k, v]) => {
      let dbBaseUrl = findDbBaseUrl(k);
      return dbBaseUrl + v;
    });

    return links;
  }
  publications(){
    return this.data.get('publications') || [];
  }
  searchLink(){
    return this.data.get('Search Link') || '';
  }
}

//Manage the creation and display of metadata HTML content
//Requires a valid name, cytoscape element, and parsedMetadata array
class MetadataTip {

  constructor(node) {
    this.name = name;
    this.node = node;
    this.data = new NodeMetadata(node);
    this.node = node;
    this.db = config.databases;
    this.viewStatus = {};
    this.visible = false;
    this.zoom = node._private.cy.zoom();
  }

  //Show Tippy Tooltip
  show() {
    let cy = this.node._private.cy;
    let tooltip = this.tooltip;
    let zoom = this.zoom;

    if ( !tooltip|| ( zoom != cy.zoom() ) ) {
      let tooltipHTML = this.generateToolTip( cy.zoom() );
      let refObject = this.node.popperRef();

      tooltip = tippy(refObject, { 
        html: tooltipHTML, 
        theme: 'light', 
        interactive: true, 
        trigger: 'manual', 
        hideOnClick: false, 
        arrow: true, 
        placement: 'bottom',
        distance: 10}
      ).tooltips[0];

      this.tooltip = tooltip;
      this.zoom = zoom;
    }

    tooltip.show();
    this.visible = true;
  }

  //Generate HTML Elements for tooltips
  generateToolTip() {
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
      h('div.fake-')


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