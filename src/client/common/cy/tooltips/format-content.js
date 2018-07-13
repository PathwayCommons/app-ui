



// LEGACY TOOLTIP CODE FOR INTERACTIONS
// THIS WILL ALL BE REWRITTEN EVENTUALLY


// function sortByDatabaseId(dbArray) {
//   //Sort by database name
//   let sorted = [];
//   let databases = _.groupBy(dbArray, entry => entry[0]);

//   //Remove dbName from each entry
//   _.forEach(databases, function (value, key) {
//     databases[key] = _.map(databases[key], entry => entry[1]);
//     sorted.push({ database: key, ids: databases[key] });
//   });

//   return sorted;
// }

// //Handle interaction/Detailed views related fields
// let maxListEntries=8;
// const viwerListHandler =(pair, expansionFunction, trim, title) => {
//   let db = config.databases;
//   const inner = (database, data, isDBVisble, index) => {
//     let link = db.filter(value => database.toUpperCase() === value.database.toUpperCase());
//     return h('a.db-link' ,{href:'/view?',search: queryString.stringify({
//       uri: link[0].url + link[0].search + data, 
//       title:title, removeInfoMenu:true}),
//     target: '_blank', }, 'Interaction '+(index+1));
//   };
//   const expansionLink = pair[1].length>maxListEntries? h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, trimString(trim)):'';
//   if (pair[1].length < 1) { return h('div.error'); }
//   return interactionList(sortByDatabaseId(pair[1]), expansionLink, maxListEntries, inner, trim);
// };

// const listHandler = (pair, expansionFunction, trim) => {
//   const inner = generateDBLink;
//   const expansionLink = pair[1].length>maxListEntries? h('div.more-link', { onclick: () => expansionFunction(pair[0]) }, trimString(trim)):'';
//   if (pair[1].length < 1) { return h('div.error'); }
//   return interactionList(sortByDatabaseId(pair[1]), expansionLink, maxListEntries, inner, trim);
// };


// const searchLinkHandler = (pair) => {
//   let searchTerm = pair[1];
//   return h('div.fake-paragraph',
//   h('a.tooltip-search-link',{href:"/search?q=" + searchTerm,target:"_blank"},'Find Pathways')
//   );
// };

// const metaDataKeyMap = new Map()
//   .set('List',listHandler)
//   .set('Detailed Views',viwerListHandler)
//   .set('Search Link',searchLinkHandler);

// function interactionList(sortedArray, expansionLink, maxViews, inner, trim) {
//   //Generate list
//   return sortedArray.map(entry=>{
//     let list=entry.ids;
//     if(trim){
//       list=list.slice(0,maxViews); 
//     }
//     const links= list.map((link,index)=>inner(entry.database,link,false,index));
//     return h('div.fake-paragraph', [h('div.span-field-name', entry.database+':'), _.concat(links,expansionLink)]);
//   });
// }

// module.exports = {
//   sortByDatabaseId
// };