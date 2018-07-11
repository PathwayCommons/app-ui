const h = require('hyperscript');
const tippy = require('tippy.js');

const {databases} = require('../../config');

const formatContent = require('./format-content');
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

class EntityMetadata {
  constructor(node){
    let nodeMetadata = node.data('parsedMetadata');
    this.data = new Map(nodeMetadata);
    this.rawData = nodeMetadata;

    let determineSearchLinkQuery = (node, displayName) => {
      let nodeLabel = node.data('label');
      let nodeClass = node.data('class');
      return nodeClass === 'process' ? displayName : nodeLabel;
    };

    let processDbIds = rawDbIds => {
      let aggregatedDbIds = {};
      rawDbIds.forEach(dbEntry => {
        let [dbName, dbId ] = dbEntry;
        if( Object.keys(aggregatedDbIds).includes(dbName) ){
          aggregatedDbIds[dbName].push(dbId);
        } else {
          aggregatedDbIds[dbName] = [dbId];
        }
      });
      return aggregatedDbIds;
    };

    this.data.set('Publications', []);

    this.data.set('Search Link', determineSearchLinkQuery( node, this.data.get('DisplayName')));

    this.data.set('Database IDs', new Map(Object.entries(processDbIds(this.databaseIds()))));
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
  // for each database present in the metadata, reconstruct a link to that database
  // e.g { 'reactome', 'HSA-123' } => identifiers.org/reactome/HSA-123
  databaseLinks(){
    let dbEntries = this.databaseIds().entries();
    let findMatchingDb = dbId => {
      // Very bad hack, needs to be fixed from metadata generated from the server side
      let db =  databases.filter(db => db.database !== 'PubMed').find( entry => {
        return(
          entry.database.toUpperCase().includes(dbId.toUpperCase()) ||
          dbId.toUpperCase().includes(entry.database.toUpperCase())
        );
      });

      if( db ){
        return db;
      }

      return null;
    };

    let formattedUrls = [];
    [...dbEntries].forEach(([k, v]) => {
      let matchedDb = findMatchingDb(k);
      if( matchedDb != null ){
        formattedUrls.push({ name: matchedDb.database, url: matchedDb.url + v});
      }
    });

    return formattedUrls;
  }
  publications(){
    return this.data.get('Publications') || [];
  }
  getPublicationData(){
    // append publications to the metadata model
    // todo why does this need to be fetched here, why can't it be done
    // at the time that the metadata is processed?
    let getRawPublications = async rawMetadata => {
      let pubs = await getPublications(rawMetadata);
      console.log(pubs);
      if( pubs != null ){
        return pubs[1];
      } else {
        return [];
      }
    };

    return getRawPublications(this.rawData).then( rawPubs => {
      this.data.set('Publications', rawPubs);
      return rawPubs;
    });
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
    this.metadata = new EntityMetadata(node);
    this.node = node;
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

      // publication data needs to be fetched from pubmed before we can display the tooltip
      this.metadata.getPublicationData().then(publicationData => {
        let tooltipHTML = this.generateToolTip( publicationData );
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

        tooltip.show();
        this.visible = true;

      });
    }
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

  //Generate HTML Elements for tooltips
  generateToolTip(publicationData) {
    let metadata = this.metadata;
    let name = metadata.displayName();

    if ( metadata.isEmpty() ) {
      return h('div.tooltip-image', [
        h('div.tooltip-heading', [
          h('a.tooltip-heading-link',{ href:"/search?&q=" + name, target:"_blank"}, name),
          ]),
        h('div.tooltip-internal', h('div.tooltip-warning', 'No Additional Information'))
      ]);
    }

    let publications = publicationData.map(publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div', [
        h('a.plain-link', { href: 'http://identifiers.org/pubmed/' + id }, title),
        h('div', firstAuthor +  'et al.'),
        h('div', source),
        h('div', date.split('/')[0])
      ]);
    });

    return h('div.tooltip-image', [
      h('div.tooltip-heading', name),
      h('div.tooltip-internal', [
        h('div.tooltip-type', metadata.type()),
      ]),
      h('div.fake-paragraph', [
        h('div.field-name', 'Name: '),
        h('div.tooltip-value', metadata.standardName())
      ]),
      h('div.fake-paragraph', [
        h('div.field-name', 'Display Name: '),
        h('div.tooltip-value', metadata.displayName())
      ]),
      h('div.fake-paragraph', [
        h('div.field-name', 'Synonyms: '),
        h('div.tooltip-value', metadata.synonyms().slice(0, 3))
      ]),
      h('div.fake-paragraph', [
        h('div.field-name', 'Links: '),
        h('div.tooltip-value', metadata.databaseLinks().map(link => {
          return h('a.plain-link', { href: link.url}, link.name);
        }))
      ]),
      h('div.fake-paragraph', publications),
      h('div.fake-paragraph', [
        h('a.plain-link', { href: '/search?q=' + metadata.searchLink(), target: '_blank'}, 'Find Pathways')
      ])
    ]);
  }
}

module.exports = MetadataTip;