const h = require('hyperscript');
const classNames = require('classnames');
const _ = require('lodash');
const config = require('../../config');
const queryString = require('query-string');

//Handle standard name related metadata fields
const trimString = (trim) =>{return trim ? 'more »' : '« less';};

const standardNameHandler = (pair) => makeTooltipItem(pair[1], 'Name: ');
const displayNameHandler = (pair) => makeTooltipItem(pair[1], 'Display Name: ');
const nameHandler = (pair, expansionFunction, trim) => {
  let revisedList = filterChemicalFormulas(pair[1]);
  let shortArray = trim ? trimValue(revisedList, config.defaultEntryLimit):
                   filterChemicalFormulas(pair[1]);
  let expansionLink = revisedList.length > config.defaultEntryLimit ?
  h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, trimString(trim)) : h('div.error');
  return h('div.fake-paragraph', [
    h('div.field-name', 'Synonyms:'),
    valueToHtml(shortArray, true),
    expansionLink
  ]);
};

//Handle database related fields
const databaseHandler = (pair, expansionFunction, trim) => {
  const expansionLink = h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, trimString(trim));
  if (pair[1].length < 1) { return h('div.error'); }
  return generateDatabaseList(sortByDatabaseId(pair[1]), trim, expansionLink);
};

//Handle interaction/Detailed views related fields
let maxListEntries=8;
const viwerListHandler =(pair, expansionFunction, trim, title) => {
  let db = config.databases;
  const inner = (database, data, isDBVisble, index) => {
    let link = db.filter(value => database.toUpperCase() === value.database.toUpperCase());
    return h('a.db-link' ,{href:'/view?',search: queryString.stringify({
      uri: link[0].url + link[0].search + data, 
      title:title, removeInfoMenu:true}),
    target: '_blank', }, 'Interaction '+(index+1));
  };
  const expansionLink = pair[1].length>maxListEntries? h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, trimString(trim)):'';
  if (pair[1].length < 1) { return h('div.error'); }
  return interactionList(sortByDatabaseId(pair[1]), expansionLink, maxListEntries, inner, trim);
};

const listHandler = (pair, expansionFunction, trim) => {
  const inner = generateDBLink;
  const expansionLink = pair[1].length>maxListEntries? h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, trimString(trim)):'';
  if (pair[1].length < 1) { return h('div.error'); }
  return interactionList(sortByDatabaseId(pair[1]), expansionLink, maxListEntries, inner, trim);
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
  .set('Display Name', displayNameHandler)
  .set('Type', typeHandler)
  .set('Names', nameHandler)
  .set('Database IDs', databaseHandler)
  .set('Publications', publicationHandler)
  .set('List',listHandler)
  .set('Detailed Views',viwerListHandler);

 /**
  * parseMetadata(pair, trim)
  * @param pair An array of length 2 consiting of a key and a associated value
  * @param trim  An optional parameter that indicates if the data presented should be trimmed to a reasonable length
  * @returns HTML Element
  * @description Generate HTML elements for a Parsed Metadata Field
  * Sample Input : parseMetadata(['Standard Name', 'TP53'])
  * Sample Output : <div class='fake-paragraph'><div class='field-name'></div></div>
*/
function parseMetadata(pair, trim = true, expansionFunction, title) {
  const doNotRender = ['Data Source', 'Data SourceTrim', 'Display Name'];
  let key = pair[0];

  let handler = metaDataKeyMap.get(key);
  if (handler) {
    return handler(pair, expansionFunction, trim, title);
  }
  else if (!(trim) && !doNotRender.includes(key)) {
    return defaultHandler(pair);
  }
  else {
    return h('div.error');
  }
}

/**
 * trimValue(value, n)
 * @param value  An array of values
 * @param n An integer representation of number of desired fields
 * @returns JS Array
 * @description Trims an array to n length
 * Sample Input : trimValue([1, 2, 3, 4, 5,], 3)
 * Sample Output : [1, 2, 3]
 */
function trimValue(value, n) {
  if (typeof value === 'string') {
    return value;
  }
  else {
    return value.slice(0, n);
  }
}

/**
 * valueToHtml(value, isCommaSeparated)
 * @param {*} value The value to be converted to HT
 * @param {*} isCommaSeparated Optional parameter defines if the result is a list or a comma separated list
 * @returns HTML Element
 * @description Creates an HTML Element for any given value
 * Sample Input : valueToHtml('test' false)
 * Sample Output: <div class='tooltip-value>test</div>
 */
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

/**
 * makeList(items, ulClass, liClass)
 * @param items A collection of values to display
 * @param ulClass An optional variable to override the unordered list class
 * @param liClass An optional variable to override the list item class
 * @returns HTML Element
 * @description Convert a generic array or string to an html list
 * Sample Input : [test
 * Sample Output : <ul class='value-list'><li class='value-list-item'>test</li></ul>
 */
function makeList(items, ulClass = 'ul.value-list', liClass = 'li.value-list-item') {
  return h(ulClass, items.map(item => h(liClass, item)));
}

/**
 * makeTooltipItem(value, field)
 * @param value A text value to display
 * @param field The field name that corresponds to the value
 * @returns HTML Element
 * @description Create a standard tooltip item
 * Sample Input : makeTooltipItem('Name', 'Test')
 * Sample Output : <div class='fake-paragraph'><div class='field-name'>Name</div><div class='tooltip-value'>Test</div></div>
 */
function makeTooltipItem(value, field) {
  return h('div.fake-paragraph', [h('div.field-name', field), h('div.tooltip-value', value.toString())]);
}

/**
 * deleteDuplicatesWithoutCase(list)
 * @param list An array of elements
 * @returns Array
 * @description Delete duplicates and ignore case
 * Sample Input : deleteDuplicatesWithoutCase(['hi', 'HI'])
 * Sample Output : ['hi']
 */
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

/**
 * sortByDataBaseId(dbArray)
 * @param dbArray An array of database ids, formatted as pairs of ids and database names
 * @returns Array
 * @description Sorts database id's by database names
 * Sample Input : sortByDatabaseId([[Reactome, id1], [Reactome, id2]])
 * Sample Output : [{database : 'Reactome', ids: [id1, id2]}]
 */
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
/**
 * generateIdList(dbIdObject, trim)
 * @param dbIdObject An entry from the sorted database list
 * @param trim An optional paramter that indicates if the list should be shortened
 * @returns HTML Element
 * @description Generates a list of all given database ids
 * Sample Input : generateIdList({'Reactome' : 'R-HSA-59544'})
 * Sample Output : <div class="fake-spacer"><a class="db-link-single-ref" href="http://identifiers.org/reactome/R-HSA-59544" target="_blank">Reactome</a></div>
 */
function generateIdList(dbIdObject, trim) {
  //get name and trim ID list to 5 items
  let name = dbIdObject.database;
  let list = dbIdObject.ids;
  let db = config.databases;

  //Format names
  let dbScan = db.filter(data => name.toUpperCase().indexOf(data.database.toUpperCase()) !== -1);
  if (dbScan.length > 0) { name = dbScan[0].database; }

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

/**
 * generateDBLink(dbname, dbId, isDbVisible)
 * @param dbName A Database name formatted as a string
 * @param dbId  A Database Id formatted as a string
 * @param isDbVisible An optional variable that indicates if the ids or dbName should be displayed as the link
 * @returns HTML Element
 * @description Generates a database reference link based on names, ids, and additional parameters
 * Sample Input : generateDBLink('Reactome', 'R-HSA-59544', true)
 * Sample Output : <div class="fake-spacer"><a class="db-link-single-ref" href="http://identifiers.org/reactome/R-HSA-59544" target="_blank">Reactome</a></div>
 */
function generateDBLink(dbName, dbId, isDbVisible) {
  //Get base url for dbid
  let db = config.databases;
  let className = '';
  let link = db.filter(value => dbName.toUpperCase() === value.database.toUpperCase());
  if (!link || link.length !== 1) {
    link = db.filter(value => dbName.toUpperCase().indexOf(value.database.toUpperCase()) !== -1);
  }

  //Render link as database name, if requested
  if (isDbVisible) {
    className = '-single-ref';
  }
  let label = isDbVisible ? dbName :dbId;

  //Build reference url
  if (link.length === 1 && link[0].url) {
    let url = link[0].url + link[0].search + dbId;
    return h('div.fake-spacer', h('a.db-link' + className, { href: url, target: '_blank' }, label));
  }
  else {
    return h('div.db-no-link' + className, label);
  }
}

/**
 * noDateWarning(name)
 * @param name A node name formatted as a string
 * @returns HTMl Element
 * @description Generates an HTML Element for no data
 * Sample Input : noDataWarning('nucleoplasm')
 * Sample Output :
 * <div class="tooltip-image">
 *    <div class="tooltip-heading">nucleoplasm</div>
 *    <div class="tooltip-internal">
 *        <div class="tooltip-warning">No Additional Information</div>
 *    </div>
 * </div>
 */
function noDataWarning(name) {
  return h('div.tooltip-image', [
    h('div.tooltip-heading', name),
    h('div.tooltip-internal', h('div.tooltip-warning', 'No Additional Information'))
  ]);
}

/**
 * filterChemicalFormula(names)
 * @param names An array of strings
 * @returns Array
 * @description Filters out any strings that contain chemical formulas
 * Sample Input : filterChemicalFormula(['C1CCCCC1C2CCCCC2'])
 * Sample Output : []
 */
function filterChemicalFormulas(names) {
  //Filter out Chemical formulas
  if (names instanceof Array) { return names.filter(name => (!name.trim().match(/^([^J][0-9BCOHNSOPrIFla@+\-\[\]\(\)\\=#$]{6,})$/ig))); }

  //Produce an array to avoid generation functions from throwing errors. 
  return [names];
}

/**
 * publicationList(data)
 * @param data An array of publication objects consisting of titles, authors, and dates
 * @returns HTMl Element
 * @description Processes given publication data into a formatted list
 * Sample Input : publicationList([{id, authors, date, title}])
 * Sample Output:
 * <ul class='publication-list'>
 *    <li class="publication-item">
 *      <a class="publication-link" href="http://identifiers.org/pubmed/16427009" target="_blank">
 *      MDC1 maintains genomic stability by participating in the amplification of ATM-dependent DNA damage signals.</a>
 *      <div class="publication-subinfo">
 *        <div class="publication-inline">Lou Z et al.</div>
 *        <div class="publication-divider publication-inline">|</div>
 *        <div class="publication-inline">Mol Cell - 2006</div></div>
 *    </li>
 * </ul>
 */
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


/**
 * generateDatabaseList(sortedArray, trim, expansionLink)
 * @param sortedArray A sorted database id list
 * @param trim Boolean value which indicates if the values should be trimmed
 * @param expansionLink An optional function which defines the action that should occur upon tooltip expansion
 * @returns HTML Element
 * @description Generates a list of database ids from a sorted array
 * Sample Input : generateDatabaseList([{database : 'Reactome', ids : [id1] }])
 * Sample Output :
 * <div class="fake-paragraph">
 *    <div class="span-field-name">Links :</div>
 *    <div class="fake-spacer">
 *        <a class="db-link-single-ref" href="http://identifiers.org/reactome/R-HSA-5683930" target="_blank">Reactome</a>
 *    </div>
 * </div>
 */
function generateDatabaseList(sortedArray, expansionLink, trim) {
  //Ignore Publication references
  sortedArray = sortedArray.filter(databaseEntry => databaseEntry.database.toUpperCase() !== 'PUBMED');

  //Generate list
  let renderValue = sortedArray.map(item => [generateIdList(item, trim)], this);

  var hasMultipleIds = _.find(sortedArray, databaseRef => databaseRef.ids.length > 1);
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

  return h('div.fake-paragraph', [h('div.span-field-name', 'Links:'), renderValue]);
}

function interactionList(sortedArray, expansionLink, maxViews, inner, trim) {
  //Generate list
  return sortedArray.map(entry=>{
    let list=entry.ids;
    if(trim){
      list=list.slice(0,maxViews); 
    }
    const links= list.map((link,index)=>inner(entry.database,link,false,index));
    return h('div.fake-paragraph', [h('div.span-field-name', entry.database+':'), _.concat(links,expansionLink)]);
  });
}

module.exports = {
  parseMetadata,
  noDataWarning,
  sortByDatabaseId
};