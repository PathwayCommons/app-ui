const h = require('hyperscript');
const classNames = require('classnames');
const tippy = require('tippy.js');


//Manage the creation and display of tooltips
//Requires a valid name, cytoscape element, and parsedMetadata array
class metadataTip {

  constructor(name, data, cyElement) {
    this.name = name;
    this.data = data.parsedMetadata;
    this.cyElement = cyElement;
    this.db = [
      ['BioGrid', 'https://thebiogrid.org/', ''],
      ['DrugBank', 'https://www.drugbank.ca/', ''],
      ['mirtarBase', 'http://mirtarbase.mbc.nctu.edu.tw/', 'php/detail.php?mirtid=MIRT000002'],
      ['NetPath', 'http://www.netpath.org/', 'molecule?molecule_id='],
      ['Panther', null],
      ['PID', null],
      ['PhosphoSitePlus', null],
      ['Reactome', 'https://reactome.org/', 'content/detail/'],
      ['SMPD', null],
      ['Wikipathways', null],
      ['uniprot', 'http://www.uniprot.org/', 'uniprot/'],
      ['HGNC', 'https://www.genenames.org/', 'cgi-bin/search?search_type=all&search='],
      ['ChEBI', 'https://www.ebi.ac.uk/chebi/', 'searchId.do?chebiId='],
      ['Kegg Reaction', 'http://www.genome.jp/', 'dbget-bin/www_bget?rn:'],
      ['Kegg Compound', 'http://www.genome.jp/', 'dbget-bin/www_bget?cpd:'],
      ['Kegg Drug', 'http://www.genome.jp/', 'dbget-bin/www_bget?drg:'],
      ['KEGG', 'http://www.genome.jp/dbget-bin/www_bfind_sub?mode=bfind&max_hit=1000&dbkey=kegg&keywords=', '']
    ];
  }

  //Generate HTML elements for Each Parsed Metadata Field
  parseMetadata(pair) {
    let key = pair[0];

    //Get HTML for current data pair based on key value
    if (key === 'Display Name') {
      return h('p', h('div.field-name', 'Display Name: '), pair[1].toString());
    }
    else if (key === 'Data Source') {
      let source = pair[1].replace('http://pathwaycommons.org/pc2/', '');
      let link = this.generateDataSourceLink(source, 'Data Source: ');
      return h('p', link);
    }
    else if (key === 'Names') {
      //Trim results to first 3 names to avoid overflow
      let shortArray = pair[1].slice(0, 3);
      return h('p', h('div.field-name', 'Synonyms: '), shortArray.toString());
    }
    else if (key === 'Database IDs') {
      //Sort the array by database names
      let sortedArray = this.sortByDatabaseId(pair[1]);
      return h('div.field-name', 'Database Id(s):', h('ul', sortedArray.map(this.generateIdList, this)));
    }

    return;
  }

  //Generate HTML Elements for tooltips
  generateToolTip() {
    return h('div.tooltip-image',
      h('div.tooltip-heading', this.name),
      h('div.tooltip-internal', h('div', (this.data).map(this.parseMetadata, this))),
      h('div.tooltip-buttons',
        h('i', { className: classNames('material-icons', 'tooltip-button-pdf') }, 'open_in_new'),
        h('i', { className: classNames('material-icons', 'tooltip-button-show') }, 'picture_as_pdf'))
    );
  }

  //Show Tippy Tooltip
  show() {
    //Get tooltip object from class
    let tooltip = this.tooltip;

    //If no tooltip exists create one
    if (!tooltip) {
      let tooltipHTML = this.generateToolTip();
      let refObject = this.cyElement.popperRef();
      tooltip = tippy(refObject, { html: tooltipHTML, theme: 'light', interactive: true });
      tooltip.selector.dim = refObject.dim;
      tooltip.selector.cyElement = refObject.cyElement;
      this.tooltip = tooltip;
    }

    //Show Tooltip
    tooltip.show(tooltip.store[0].popper);
  }

  //Generate a database link
  generateDBLink(dbName, dbId) {
    //Get base url for dbid
    let link = this.db.filter(value => dbName.toUpperCase() === value[0].toUpperCase());
    if(!(link)) {
      link = this.db.filter(value => dbName.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
    }

    //Build reference url
    if (link.length === 1 && link[0][1]) {
      let url = link[0][1] + link[0][2] + dbId;
      return h('a', { href: url, target: '_blank' }, dbId);
    }
    else {
      return dbId;
    }
  }



  //Generate list of all given database id's
  //Requires a valid database Id Object
  generateIdList(dbIdObject) {
    //get name and trim ID list to 5 items
    let name = dbIdObject.database;
    let list = dbIdObject.ids.slice(0, 5);
    return h('li', h('div.db-name', name + ": "), list.map(data => this.generateDBLink(name, data), this));
  }

  //Sort Database ID's by database name
  //Requires a valid database ID array
  sortByDatabaseId(dbArray) {
    let databases = {};

    //Group Ids by database
    for (let i = 0; i < dbArray.length; i++) {
      let databaseName = dbArray[i][0];
      if (!databases[databaseName]) {
        databases[databaseName] = [];
      }
      databases[databaseName].push(dbArray[i][1]);
    }

    //Produce final array with group names as the keys
    dbArray = [];
    for (let databaseName in databases) {
      dbArray.push({ database: databaseName, ids: databases[databaseName] });
    }

    //Return result
    return dbArray;
  }

  //Generate a data source link based on database name
  //Requires a valid database name
  //Note : prefix is optional
  generateDataSourceLink(name, prefix = '') {
    let link = this.db.filter(value => name.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
    if (link.length === 1 && link[0][1]) {
      return h('div', h('div.field-name', prefix), h('a', { href: link[0][1], target: '_blank' }, link[0][0]));
    }
    else if (link.length === 1) {
      return link[0][1];
    }
    else {
      return name;
    }
  }


  //Hide Tippy tooltip
  hide() {
    //To do
  }

  //Destroy Tippy tooltip
  destroy() {
    //To do
  }

  //Bind tooltip to sidebar more info view
  displayMore() {
    //To do
  }

  //Get Raw Data
  getRawData() {
  }
}


module.exports = metadataTip;
