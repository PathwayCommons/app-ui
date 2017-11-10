const h = require('hyperscript');
const config = require('../../config');


//Handle name related metadata fields
const standardNameHandler = (pair) => makeTooltipItem(pair[1], 'Approved Name: ');
const displayNameHandler = (pair) => makeTooltipItem(pair[1], 'Display Name: ');
const nameHandler = (pair, trim) => {
  //Trim results to first 3 names to avoid overflow
  let shortArray = pair[1];
  if (trim) { shortArray = pair[1].slice(0, 3); }

  //Filter out Chemical formulas
  if (shortArray instanceof Array) shortArray = shortArray.filter(name => (!name.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-\[\]\(\)\\=#$]{6,})$/ig)));

  //Determine render value
  let renderValue = h('div.tooltip-value', shortArray.toString());
  if (!(trim)) {
    renderValue = makeList(shortArray);
  }

  return h('div.fake-paragraph', [h('div.field-name', 'Synonyms: '), renderValue]);
};

//Handle database related fields
const dataSourceHandler = (pair) => {
  let source = pair[1].replace('http://pathwaycommons.org/pc2/', '');
  let link = generateDataSourceLink(source, 'Data Source: ');
  return h('div.fake-paragraph', link);
};
const databaseHandler = (pair, trim) => {
  //Sort the array by database names
  let sortedArray = sortByDatabaseId(pair[1]);
  if (sortedArray.length < 1) { return; }
  return h('div.fake-paragraph',
    [
      h('div.field-name', 'Database References:'),
      h('div.wrap-text', h('ul.db-list', sortedArray.map(item => generateIdList(item, trim), this)))
    ]);
};

//Handle type related fields
const typeHandler = (pair, trim, key) => {
  if (!(trim)) {
    let type = pair[1].toString().substring(3);
    let formattedType = type.replace(/([A-Z])/g, ' $1').trim();
    return h('div.fake-paragraph', [h('div.field-name', key + ': '), formattedType]);
  }
};

//Default to generating a list of all items
const defaultHandler = (pair, trim, key) => {
  if (trim) { return; }
  if (key === 'Comment') { key = 'Comments'; }
  return h('div.fake-paragraph', [
    h('div.field-name', key + ': '),
    makeList(pair[1])
  ]);
};

const metaDataKeyMap = new Map()
  .set('Standard Name', standardNameHandler)
  .set('Display Name', displayNameHandler)
  .set('Data Source', dataSourceHandler)
  .set('Type', typeHandler)
  .set('Names', nameHandler)
  .set('Database IDs', databaseHandler);


//Generate HTML elements for a Parsed Metadata Field
//Optional trim parameter indicates if the data presented should be trimmed to a reasonable length
//Data Pair -> HTML
function parseMetadata(pair, trim = true) {
  let key = pair[0];
  let handler = metaDataKeyMap.get(key);
  if (handler) {
    return handler(pair, trim, key);
  }
  else {
    return defaultHandler(pair, trim, key);
  }
}

//Convert a generic array or string to an html list
//Array -> HTML 
function makeList(items, ulClass = 'ul.value-list', liClass = 'li.value-list-item') {
  //Delete duplicates
  items = deleteDuplicatesWithoutCase(items);

  //Resolve possible errors
  if (typeof items === 'string') {
    return h('div.tooltip-value', items);
  }
  else if (items.length === 1) {
    return h('div.tooltip-value', items[0]);
  }
  else if (!(items)) {
    return '-';
  }

  //Render List
  return h(ulClass, items.map(item => h(liClass, item)));
}

//Render a standard tooltip item
//Strings -> HTML
function makeTooltipItem(value, field) {
  return h('div.fake-paragraph', [h('div.field-name', field), h('div.tooltip-value', value.toString())]);
}

//Delete duplicates and ignore case
//Requires a valid array
//Array -> Array 
function deleteDuplicatesWithoutCase(list) {
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


//Generate a data source link based on database name
//Requires a valid database name
//Note : prefix is optional
//String -> HTML 
function generateDataSourceLink(name, prefix = '') {
  let db = config.databases;
  let link = db.filter(value => name.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
  if (link.length === 1 && link[0][1]) {
    return h('div', h('div.field-name', prefix), h('a.plain-link', { href: link[0][1], target: '_blank' }, link[0][0]));
  }
  else if (link.length === 1) {
    return h('div', h('div.field-name', prefix), h('a.plain-link', link[0][1]));
  }
  else {
    return h('div', h('div.field-name', prefix), h('a.plain-link', name));
  }
}

//Sort Database ID's by database name
//Requires a valid database ID array
//Array -> Array 
function sortByDatabaseId(dbArray) {
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

//Generate list of all given database id's
//Requires a valid database Id Object
//Array -> HTML
function generateIdList(dbIdObject, trim) {
  //get name and trim ID list to 5 items
  let name = dbIdObject.database;
  let list = dbIdObject.ids;
  let db = config.databases;

  //Format names
  let dbScan = db.filter(data => name.toUpperCase().indexOf(data[0].toUpperCase()) !== -1);
  if (dbScan.length > 0) { name = dbScan[0][0]; }

  //Trim list
  if (trim) { list = dbIdObject.ids.slice(0, 1); }

  //Generate a list or a single link
  if (list.length == 1 && trim) {
    return h('li.db-item', generateDBLink(name, list[0], true));
  }
  else {
    return h('li.db-item', h('div.db-name', name + ": "), list.map(data => generateDBLink(name, data, false), this));
  }
}

//Generate a database link
//Strings -> HTML 
function generateDBLink(dbName, dbId, printId) {
  //Get base url for dbid
  let db = config.databases;
  let className = '';
  let link = db.filter(value => dbName.toUpperCase() === value[0].toUpperCase());
  if (!link || link.length !== 1) {
    link = db.filter(value => dbName.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
  }

  //Render link as database name, if requested
  if (printId) {
    className = '-single-ref';
  }

  //Build reference url
  if (link.length === 1 && link[0][1]) {
    let url = link[0][1] + link[0][2] + dbId;
    dbId = printId ? dbName : dbId;
    return h('a.db-link' + className, { href: url, target: '_blank' }, dbId);
  }
  else {
    dbId = printId ? dbName : dbId;
    return h('div.db-no-link' + className, dbId);
  }
}

//Generate HTML Element for no data
// () -> HTML
function noDataWarning() {
  return h('div.tooltip-image', [
    h('div.tooltip-heading', this.name),
    h('div.tooltip-internal', h('div.tooltip-warning', 'No Additional Information'))
  ]);
}


module.exports = {
  parseMetadata,
  noDataWarning
};