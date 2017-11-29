const h = require('hyperscript');
const classNames = require('classnames');
const _ = require('lodash');
const config = require('./config');

//Handle name related metadata fields
const standardNameHandler = (pair) => makeTooltipItem(pair[1], 'Name: ');
const standardNameHandlerTrim = (pair) => standardNameHandler(pair);
const nameHandlerTrim = (pair, expansionFunction) => {
  let revisedList = filterChemicalFormulas(pair[1]);
  let shortArray = trimValue(revisedList, config.defaultEntryLimit);
  let expansionLink = revisedList.length > config.defaultEntryLimit ?
    h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, 'more »') : h('div.error');

  return h('div.fake-paragraph', [
    h('div.field-name', 'Synonyms:'),
    valueToHtml(shortArray, true),
    expansionLink
  ]);
};
const nameHandler = (pair, expansionFunction) => {
  let shortArray = filterChemicalFormulas(pair[1]);
  return h('div.fake-paragraph', [
    h('div.field-name', 'Synonyms:'),
    valueToHtml(shortArray, true),
    h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, '« less')
  ]);
};

//Handle database related fields
/*
const dataSourceHandler = (pair) => {
  let source = pair[1].replace('http://pathwaycommons.org/pc2/', '');
  let link = generateDataSourceLink(source, 'Data Source: ');
  return h('div.fake-paragraph', link);
};*/

const databaseHandlerTrim = (pair, expansionFunction) => {
  const expansionLink = h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, 'more »');
  if (pair[1].length < 1) { return h('div.error'); }
  return generateDatabaseList(sortByDatabaseId(pair[1]), true, expansionLink);
};
const databaseHandler = (pair, expansionFunction) => {
  const expansionLink = h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, '« less');
  if (pair[1].length < 1) { return h('div.error'); }
  return generateDatabaseList(sortByDatabaseId(pair[1]), false, expansionLink);

};

//Handle publication related fields
const publicationHandler = (pair) => {
  if (!pair || pair[1].length < 1) { return h('div.error'); }
  return h('div.fake-paragraph', [h('div.field-name', pair[0] + ': '), publicationList(pair[1])]);
};

//Handle type related fields
const typeHandler = (pair) => {
  let type = pair[1].toString().substring(3);
  let formattedType = type.replace(/([A-Z])/g, ' $1').trim();
  return h('div.tooltip-type',  formattedType);
};

//Handle comment related fields
const commentHandler = (pair, expansionFunction) => {
  //Filter out replaced entries
  let comments = removedReplacedComments(pair[1]);

  //Don't print comments if there are none.
  if (comments.length < 1) { return h('div.error'); }

  //Generate expansion link
  let expansionLink = h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, '« less');
  comments[comments.length - 1] = [comments[comments.length - 1], expansionLink];

  return h('div.fake-paragraph', [h('div.field-name', 'Comments' + ': '), valueToHtml(comments, false)]);
};
const commentHandlerTrim = (pair, expansionFunction) => {
  //Filter out replaced entries
  let comments = removedReplacedComments(pair[1]);
  let shortArray = trimValue(comments, config.commentEntryLimit);
  //Don't print comments if there are none.

  if (comments.length < 1) { return h('div.error'); }

  //Generate expansion link
  let expansionLink = comments.length > config.commentEntryLimit ?
    h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, 'more »') : null;
  if (expansionLink) { shortArray[config.commentEntryLimit - 1] = [shortArray[config.commentEntryLimit - 1], expansionLink]; }

  return h('div.fake-paragraph', [h('div.field-name', 'Comments' + ': '), valueToHtml(shortArray, false)]);
};

//Default to generating a list of all items
const defaultHandler = (pair) => {
  let key = pair[0];
  let isCommaSeparated = true;

  return h('div.fake-paragraph', [
    h('div.field-name', key + ': '),
    valueToHtml(pair[1], isCommaSeparated)
  ]);
};

const metaDataKeyMap = new Map()
  .set('Standard Name', standardNameHandler)
  .set('Standard NameTrim', standardNameHandlerTrim)
  .set('Type', typeHandler)
  .set('TypeTrim', typeHandler)
  .set('Names', nameHandler)
  .set('NamesTrim', nameHandlerTrim)
  .set('Database IDs', databaseHandler)
  .set('Database IDsTrim', databaseHandlerTrim)
  .set('Publications', publicationHandler)
  .set('PublicationsTrim', publicationHandler)
  .set('Comment', commentHandler)
  .set('CommentTrim', commentHandlerTrim);

//Generate HTML elements for a Parsed Metadata Field
//Optional trim parameter indicates if the data presented should be trimmed to a reasonable length
//Data Pair -> HTML
function parseMetadata(pair, trim = true, expansionFunction) {
  const doNotRender = ['Data Source', 'Data SourceTrim', 'Display Name'];
  let key = pair[0];

  //Use the trim function if trim is applied
  if (trim) {
    key += "Trim";
  }

  let handler = metaDataKeyMap.get(key);
  if (handler) {
    return handler(pair, expansionFunction);
  }
  else if (!(trim) && !doNotRender.includes(key)) {
    return defaultHandler(pair);
  }
  else {
    return h('div.error');
  }
}

//Trim a value to n terms
//String or Array -> Array
function trimValue(value, n) {
  if (typeof value === 'string') {
    return value;
  }
  else {
    return value.slice(0, n);
  }
}

//Create a HTML Element for a given value
//Note : Optional isCommaSeparated parameter indicates if the list should be
//       printed as a comma separated list.
//       Optional expansion link parameter defines a expansion link property
//Requires a populated array
//Anything -> HTML
function valueToHtml(value, isCommaSeparated = false) {
  //String -> HTML
  if (typeof value === 'string') {
    return h('div.tooltip-value', value);
  }
  //Array Comma Separated -> HTML
  else if (value instanceof Array && isCommaSeparated) {
    //Add a comma to each value
    value = deleteDuplicatesWithoutCase(value);
    value = value.map(value => h('div.tooltip-comma-item', value + ','));

    //Remove comma from the last value
    let end = value.length - 1;
    value[end].innerHTML = value[end].innerHTML.slice(0, -1);

    return value;
  }
  //Array Length 1 -> HTML
  else if (value instanceof Array && value.length === 1) {
    return h('div.tooltip-value', value[0]);
  }
  //Array -> HTML
  else if (value instanceof Array && value.length > 1) {
    value = deleteDuplicatesWithoutCase(value);
    return makeList(value);
  }
  //Anything
  else if (!(value)) {
    return h('div.error', '-');
  }
}

//Convert a generic array or string to an html list
//Array -> HTML
function makeList(items, ulClass = 'ul.value-list', liClass = 'li.value-list-item') {
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
  //Sort by database name
  let sorted = [];
  let databases = _.groupBy(dbArray, entry => entry[0]);

  //Remove dbName from each entry
  _.forEach(databases, function (value, key) {
    databases[key] = _.map(databases[key], entry => entry[1]);
    sorted.push({ database: key, ids: databases[key] });
  });

  return sorted;
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
    return generateDBLink(name, list[0], true);
  }
  else {
    return h('li.db-item', h('div.db-name', name + ": "), list.map(data => generateDBLink(name, data, false), this));
  }
}

//Generate a database link
//Note - optional isDbVisible parameter determines
//       if the database name should be displayed
//Strings -> HTML
function generateDBLink(dbName, dbId, isDbVisible) {
  //Get base url for dbid
  let db = config.databases;
  let className = '';
  let link = db.filter(value => dbName.toUpperCase() === value[0].toUpperCase());
  if (!link || link.length !== 1) {
    link = db.filter(value => dbName.toUpperCase().indexOf(value[0].toUpperCase()) !== -1);
  }

  //Render link as database name, if requested
  if (isDbVisible) {
    className = '-single-ref';
  }

  //Build reference url
  if (link.length === 1 && link[0][1]) {
    let url = link[0][1] + link[0][2] + dbId;
    dbId = isDbVisible ? dbName : dbId;
    return h('div.fake-spacer', h('a.db-link' + className, { href: url, target: '_blank' }, dbId));
  }
  else {
    dbId = isDbVisible ? dbName : dbId;
    return h('div.db-no-link' + className, dbId);
  }
}

//Generate HTML Element for no data
// () -> HTML
function noDataWarning(name) {
  return h('div.tooltip-image', [
    h('div.tooltip-heading', name),
    h('div.tooltip-internal', h('div.tooltip-warning', 'No Additional Information'))
  ]);
}

//Filter out chemical formulas
//Array -> Array
function filterChemicalFormulas(list) {
  //Filter out Chemical formulas
  if (list instanceof Array) { return list.filter(name => (!name.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-\[\]\(\)\\=#$]{6,})$/ig))); }
  return [list];
}

//Create a publication list
//Process given publication data into a formatted list
//Requires a valid publication metadata array
//Array -> HTML
function publicationList(data) {
  //Get all publication title links
  const publicationList = data.map(publication => {
    const id = publication.id;
    const title = publication.title;
    const url = config.publicationsURL + id;
    const date = new Date(publication.date);
    const year = date.getFullYear().toString();

    let authors = publication.firstAuthor;

    //Add author list formatting
    if (publication.authors.length > 1) {
      authors = authors + ' et al.';
    }

    const publicationInfo = publication.source + ' - ' + year;

    return h('li.publication-item', [
      h('a.publication-link', { href: url, target: '_blank' }, title),
      h('div.publication-subinfo', [
        h('div.publication-inline', authors),
        h('div', { className: classNames('publication-divider', 'publication-inline') }, '|'),
        h('div.publication-inline', publicationInfo)
      ])
    ]);
  });

  //Produce a list of items
  return h('ul.publication-list', publicationList);
}


//Generate a list of database ids from sorted array
//Array -> HTML
function generateDatabaseList(sortedArray, trim, expansionLink) {

  //Ignore Publication references
  sortedArray = sortedArray.filter(databaseEntry => databaseEntry.database.toUpperCase() !== 'PUBMED');

  //Determine if there is more than one link for a database
  var hasMultipleIds = _.find(sortedArray, databaseRef => databaseRef.ids.length > 1);

  //Generate list
  let renderValue = sortedArray.map(item => generateIdList(item, trim), this);

   //Append expansion link to render value if one exists
   if (expansionLink && hasMultipleIds && trim) {
    renderValue = [renderValue, expansionLink];
  }
  else if (expansionLink && hasMultipleIds){
    renderValue.push(h('li.db-item', expansionLink));
  }

  //If in expansion mode, append list styling
  if (!trim) {
    renderValue = h('div.wrap-text', h('ul.db-list', renderValue));
  }


  return h('div.fake-paragraph', [h('div.span-field-name', 'Links :'), renderValue]);
}

//Replace any instances of Replaced 
//Anything -> Array 
function removedReplacedComments(comments) {
  const replacedExists = comment => comment.toUpperCase().includes('REPLACED');

  if (typeof comments === 'string') {
    return replacedExists(comments) ? [] : comments;
  }
  else if (!(comments)) {
    return [];
  }
  else {
    return comments.filter(comment => !(replacedExists(comment)));
  }
}

module.exports = {
  parseMetadata,
  noDataWarning,
  sortByDatabaseId
};