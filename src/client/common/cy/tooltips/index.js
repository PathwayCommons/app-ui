const h = require('react-hyperscript');
const hh = require('hyperscript');
const ReactDom = require('react-dom');
const React = require('react');
const tippy = require('tippy.js');
const _ = require('lodash');

const {databases} = require('../../config');
const getPublications = require('./publications');

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
    console.log(this.data);
    this.rawData = nodeMetadata;

    let determineSearchLinkQuery = (node, displayName) => {
      let nodeLabel = node.data('label') ? node.data('label'): node.data('description');
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
    console.log(node);
    this.data.set('Label', node.data('label'));

    this.data.set('Description', node.data('description'));

    this.data.set('Intersection', _.join(node.data('intersection'), ", "));

    this.data.set('Genes in Pathway', _.join(node.data('intersection'), ", ")); //get geneSet

    this.data.set('Publications', []);

    this.data.set('Search Link', determineSearchLinkQuery( node, this.data.get('Display Name')));

    this.data.set('Database IDs', new Map(Object.entries(processDbIds(this.databaseIds()))));

  }
  isEmpty(){
    return this.data.entries().length === 0;
  }
  type(){
    let type = this.data.get('Type');
    if( type ){
      return type.substring(3).replace(/([A-Z])/g, ' $1').trim();
    }
    return '';
  }
  label(){
    return this.data.get('Label') || '';
  }
  description(){
    return this.data.get('Description')|| '';
   }
  standardName(){
    return this.data.get('Standard Name') || '';
  }
  displayName(){
    return this.data.get('Display Name') || '';
  }
  synonyms(){
    let s = this.data.get('Names');
    if( typeof s === 'string' ){
      return [ s ];
    }
    if( Array.isArray(s) ){
      return s;
    }

    return [];
  }
  pathwayOverview(){
    return this.data.get('Pathway Overview') || '';
  }
  intersection(){
    return this.data.get('Intersection') || '';
  }
  genesInPathway(){
    return this.data.get('Genes in Pathway') || '';
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
        if( Array.isArray(v) ){
          v.forEach( entityId => formattedUrls.push({ name: matchedDb.database, url: matchedDb.url + entityId } ));
        } else {
          formattedUrls.push({ name: matchedDb.database, url: matchedDb.url + v});
        }
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
      if( pubs != null ){
        return pubs[1];
      } else {
        return [];
      }
    };

    return getRawPublications(this.rawData).then( rawPubs => {
      this.data.set('Publications', rawPubs);
    });
  }
  searchLink(){
    return this.data.get('Search Link') || '';
  }
}


let DEFAULT_NUM_LINKS = 3;
let DEFAULT_NUM_NAMES = 3;
class EntityMetaDataView extends React.Component {
  constructor(props){
    super(props);
  }

  render(){
    let { metadata } = this.props;

    if ( metadata.isEmpty() ) {
      return h('div.metadata-tooltip', [
        h('div.tooltip-heading', [
          h('a.tooltip-heading-link', {
            target: '_blank',
            href: '/search?q=' + metadata.searchLink(),
          }, metadata.label() || metadata.displayName()),
        ]),
        h('div.tooltip-internal', h('div.metadata-tooltip-warning', 'No Additional Information'))
      ]);
    }

    let isChemicalFormula = name => !name.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-[\]()\\=#$]{6,})$/ig);

    let synonyms = metadata.synonyms().filter(isChemicalFormula) .slice(0, DEFAULT_NUM_NAMES).join(', ');

    let publications = metadata.publications().map(publication => {
      let { id, title, firstAuthor, date, source } = publication;
      return h('div.metadata-publication', [
        h('a', { href: 'http://identifiers.org/pubmed/' + id }, title),
        h('div', firstAuthor +  ' et al. | ' + source + ' - ' + new Date(date).getFullYear().toString())
      ]);
    });

    let showType = metadata.type() !== '';
    console.log(metadata);
    let showStdName = metadata.standardName() !== '';
    let showDispName = metadata.displayName() !== '' && metadata.displayName() !== metadata.label();
    let showSynonyms = synonyms.length > 0;
    let showPubs = publications.length > 0;
    let showPathwayOverview = metadata.pathwayOverview() !== '';
    let showIntersection = metadata.intersection() !== '';
    let showGenesInPathway = metadata.genesInPathway() !== '';

    let showBody = showStdName || showDispName || showSynonyms || showPubs || showPathwayOverview || showIntersection || showGenesInPathway; //update
    let showLinks = metadata.databaseLinks().length > 0;

    return h('div.metadata-tooltip', [
      h('div.metadata-tooltip-content', [
        h('div.metadata-tooltip-header', [
          h('h2',  `${metadata.label() || metadata.displayName() || metadata.description() || 'Unknown Entity'}`),
          showType ? h('div.metadata-tooltip-type-chip', metadata.type()) : null,
        ]),
        showBody ? h('div.metadata-tooltip-body', [
          showStdName ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', 'Name'),
            h('div.metadata-field-value', metadata.standardName())
          ]) : null,
          showDispName ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', 'Display Name'),
            h('div.metadata-field-value', metadata.displayName())
          ]) : null,
          showSynonyms ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Synonyms',
              // h('i.material-icons', 'expand_more')
            ]),
            h('div.metadata-field-value', synonyms)
          ]) : null,
          showPubs ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Publications',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div', publications)
          ]) : null,
          showPathwayOverview ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Pathway Overview'
            ]),
            h('div.metadata-field-value', metadata.pathwayOverview())
          ]) : null,
          showIntersection ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Shared Genes In Pathway and Entered List'
            ]),
            h('div.metadata-field-value', metadata.intersection())
          ]) : null,
          showGenesInPathway? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Genes In Pathway'
            ]),
            h('div.metadata-field-value', metadata.genesInPathway())
          ]) : null
        ]): null,
        h('div.metadata-tooltip-footer', [
          showLinks ? h('div.metadata-tooltip-section', [
            h('div.metadata-field-name', [
              'Links',
              // h('i.material-icons', 'keyboard_arrow_right')
            ]),
            h('div.metadata-links', metadata.databaseLinks().slice(0, DEFAULT_NUM_LINKS).map(link => {
              return h('a.plain-link', { href: link.url}, link.name);
            }))
          ]) : null
        ]),
        h('div.metadata-search-call-to-action', [
          h('a.metadata-find-pathways', {
            target: '_blank',
            href: '/search?q=' + metadata.searchLink()
            },
            `FIND RELATED PATHWAYS`
          )
        ])
      ])
    ]);
  }
}

// This metadata tip is only for entities i.e. nodes
// TODO make an edge metadata tip for edges (for the interactions app)
class EntityMetadataTooltip {

  constructor(node) {
    this.node = node;
    this.metadata = new EntityMetadata(node);
    this.tooltip = null;
  }

  show() {
    let getContentDiv = component => {
      let div = hh('div');
      ReactDom.render( component, div );
      return div;
    };

    if( this.tooltip == null ){
      // publication data needs to be fetched from pubmed before we can display the tooltip
      this.metadata.getPublicationData().then( () => {
        let refObject = this.node.popperRef();
        let tooltip = tippy(refObject, {
          html: getContentDiv( h(EntityMetaDataView, { metadata: this.metadata, } )),
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
    } else {
      this.tooltip.show();
    }
  }

  hide() {
    if (this.tooltip) {
      this.tooltip.hide();
    }
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.destroy(this.tooltip.store[0].popper);
      this.tooltip = null;
    }
  }
}

module.exports = EntityMetadataTooltip;