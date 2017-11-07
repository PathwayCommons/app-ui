const h = require('hyperscript');
const classNames = require('classnames');
const tippy = require('tippy.js');
const config = require('../../config');


//Manage the creation and display of metadata HTML content
//Requires a valid name, cytoscape element, and parsedMetadata array
class MetadataTip {

  constructor(name, data, cyElement) {
    this.name = name;
    this.data = data.parsedMetadata;
    this.cyElement = cyElement;
    this.db = config.databases;
  }

  //Generate HTML elements for Each Parsed Metadata Field
  //Optional trim parameter indicates if the data presented should be trimmed to a reasonable length
  parseMetadata(pair, trim = true) {
    let key = pair[0];

    //Get HTML for current data pair based on key value
    if (key === 'Standard Name') {
      return this.makeTooltipItem(pair[1], 'Approved Name: ');
    }
    if (key === 'Display Name') {
      return this.makeTooltipItem(pair[1], 'Display Name: ');
    }
    else if (key === 'Data Source') {
      let source = pair[1].replace('http://pathwaycommons.org/pc2/', '');
      let link = this.generateDataSourceLink(source, 'Data Source: ');
      return h('div.fake-paragraph', link);
    }
    else if (key === 'Type' && !trim) {
      let type = pair[1].toString().substring(3);
      let formattedType = type.replace(/([A-Z])/g, ' $1').trim();
      return h('div.fake-paragraph', [h('div.field-name', key + ': '), formattedType]);
    }
    else if (key === 'Names') {
      //Trim results to first 3 names to avoid overflow
      let shortArray = pair[1];
      if (trim) { shortArray = pair[1].slice(0, 3); }

      //Filter out Chemical formulas
      if (shortArray instanceof Array) shortArray = shortArray.filter(name => (!name.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-\[\]\(\)\\=#$]{6,})$/ig)));

      //Determine render value
      let renderValue = h('div.tooltip-value', shortArray.toString());
      if (!(trim)) {
        renderValue = this.makeList(shortArray);
      }

      return h('div.fake-paragraph', [h('div.field-name', 'Synonyms: '), renderValue]);
    }
    else if (key === 'Database IDs') {
      //Sort the array by database names
      let sortedArray = this.sortByDatabaseId(pair[1]);
      if (sortedArray.length < 1) { return; }
      return h('div.fake-paragraph',
        [
          h('div.field-name', 'Database References:'),
          h('div.wrap-text', h('ul.db-list', sortedArray.map(item => this.generateIdList(item, trim), this)))
        ]);
    }
    else if (key === 'Comment' && !(trim)) {
      //Get comments
      let comments = pair[1];

      //Remove any strings with replaced
      if (comments instanceof Array) {
        comments = comments.filter(value => value.toUpperCase().indexOf('REPLACED') === -1);
        comments = comments.filter(value => value.toUpperCase().indexOf('DB_ID') === -1);
      }
      else if (typeof comments === 'string'
        && comments.toUpperCase().indexOf('REPLACED') === -1
        && comments.toUpperCase().indexOf('DB_ID') === -1) {
        comments = [comments];
      }
      else {
        comments = [];
      }

      //Generate HTML
      if (comments.length > 0) {
        return h('div.fake-paragraph', [
          h('div.field-name', 'Comments' + ': '),
          this.makeList(comments, 'ul.comment-list', 'ul.comment-list-item')
        ]);
      }

    }
    else if (!(trim)) {
      return h('div.fake-paragraph', [
        h('div.field-name', key + ': '),
        this.makeList(pair[1])
      ]);
    }

    return;
  }

  //Validate the name of object and use Display Name as the fall back option
  validateName() {
    if (!(this.name)) {
      let displayName = this.data.filter(pair => pair[0] === 'Display Name');
      if (displayName.length > 0) { this.name = displayName[0][1].toString(); }
    }
  }

  //Convert a generic array or string to an html list
  makeList(items, ulClass = 'ul.value-list', liClass = 'li.value-list-item') {
    //Delete duplicates
    items = this.deleteDuplicatesWithoutCase(items);

    //Resolve possible errors
    if (typeof items === 'string') {
      return h('div.tooltip-value', items);
    }
    else if (items.length === 1) {
      return h('div.tooltip-value', items[0]);
    }
    else if (!(items)){
      return '-';
    }

    //Render List
    return h(ulClass, items.map(item => h(liClass, item)));
  }

  //Render a standard tooltip item
  makeTooltipItem(value, field){
    return h('div.fake-paragraph', [h('div.field-name', field), h('div.tooltip-value', value.toString())]);
  }

  //Delete duplicates and ignore case
  //Requires a valid array
  deleteDuplicatesWithoutCase(list) {
    if (!(list instanceof Array)) {
      return list;
    }
    return list.reduce((result, element) => {
      var normalize = function (x) { return typeof x === 'string' ? x.toLowerCase() : x; };
      var normalizedElement = normalize(element);
      if (result.every(otherElement => normalize(otherElement) !== normalizedElement)) {
        result.push(element);
      }
      return result;
    }, []);
  }


  //Generate HTML Elements for tooltips
  generateToolTip(callback) {

    //Order the data array
    let data = this.orderArray(this.data);
    if (!(data)) data = [];

    //Ensure name is not blank
    this.validateName();

    if (!(this.data)) { this.data = []; }
    return h('div.tooltip-image',
      h('div.tooltip-heading', this.name),
      h('div.tooltip-internal', h('div', (data).map(item => this.parseMetadata(item, true), this))),
      h('div.tooltip-buttons',
        [
          h('div.tooltip-button-container',
            [
              h('div.tooltip-button', { onclick: this.displayMore(callback) }, [
                h('i', { className: classNames('material-icons', 'tooltip-button-show') }, 'bubble_chart'),
                h('div.describe-button', 'Open in Sidebar')
              ])
            ])
        ])
    );
  }

  //Generate HTML Elements for the side bar
  generateSideBar() {
    //Order the data array
    let data = this.orderArray(this.data);
    if (!(data)) data = [];

    //Ensure name is not blank
    this.validateName();


    if (!(this.data)) { this.data = []; }
    return h('div.sidebar-body',
      h('h1', this.name),
      h('div.sidebar-internal', h('div', (data).map(item => this.parseMetadata(item, false), this))));
  }

  //Show Tippy Tooltip
  show(cy, callback) {
    //Get tooltip object from class
    let tooltip = this.tooltip;

    //Hide all other tooltips
    this.hideAll(cy);

    //If no tooltip exists create one
    if (!tooltip) {
      let tooltipHTML = this.generateToolTip(callback);
      let refObject = this.cyElement.popperRef();
      tooltip = tippy(refObject, { html: tooltipHTML, theme: 'light', interactive: true });
      tooltip.selector.dim = refObject.dim;
      tooltip.selector.cyElement = refObject.cyElement;
      this.tooltip = tooltip;
    }

    //Show Tooltip
    tooltip.show(tooltip.store[0].popper);
    this.visible = true;
  }

  //Generate a database link
  generateDBLink(dbName, dbId) {
    //Get base url for dbid
    let link = this.db.filter(value => dbName.toUpperCase() === value[0].toUpperCase());
    if (!link || link.length !== 1) {
      link = this.db.filter(value => dbName.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
    }

    //Build reference url
    if (link.length === 1 && link[0][1]) {
      let url = link[0][1] + link[0][2] + dbId;
      return h('a.db-link', { href: url, target: '_blank' }, dbId);
    }
    else {
      return h('div.db-no-link', dbId);
    }
  }

  //Generate list of all given database id's
  //Requires a valid database Id Object
  generateIdList(dbIdObject, trim) {
    //get name and trim ID list to 5 items
    let name = dbIdObject.database;
    let list = dbIdObject.ids;

    //Format names
    let dbScan = this.db.filter(data => name.toUpperCase().indexOf(data[0].toUpperCase()) !== -1);
    if (dbScan.length > 0) { name = dbScan[0][0]; }

    if (trim) { list = dbIdObject.ids.slice(0, 5); }
    return h('li.db-item', h('div.db-name', name + ": "), list.map(data => this.generateDBLink(name, data), this));
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
      return h('div', h('div.field-name', prefix), h('a.plain-link', { href: link[0][1], target: '_blank' }, link[0][0]));
    }
    else if (link.length === 1) {
      return link[0][1];
    }
    else {
      return name;
    }
  }

  //Hide all tooltip objects
  hideAll(cy) {
    cy.elements().each(function (element) {
      var tempElement = element.scratch('tooltip');
      if (tempElement && tempElement.isVisible()) { tempElement.hide(); }
    });
  }


  //Hide Tippy tooltip
  hide() {
    if (this.tooltip) {
      this.tooltip.hide(this.tooltip.store[0].popper);
    }
    this.visible = false;
  }

  //Destroy Tippy tooltip
  destroy() {
    if (this.tooltip) {
      this.tooltip.destory(this.tooltip.store[0].popper);
      this.tooltip = null;
    }
  }

  //Get display status of tooltip
  isVisible() {
    return this.visible;
  }


  //Return a function that binds a tooltip to the sidebar more info view
  displayMore(callback) {
    //Get id from state
    let id = this.cyElement.id();
    return () => callback(id);
  }

  //Order a given metadata data array
  orderArray(data) {
    for (var x in data) {
      data[x][0] == "Database IDs" ? data.push(data.splice(x, 1)[0]) : 0;
    }
    return data;
  }

}


module.exports = MetadataTip;