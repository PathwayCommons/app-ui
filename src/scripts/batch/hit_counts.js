/**
 * Using user query strings from the input stream,
 * this script gets the number pathways and interactions (SIF edges).
 * Results will be the same as or close (see comments below) to
 * what one could get at apps.pathwaycommons.org if settings and queries are same.
 *
 * This script simply calls the app-ui server-side modules
 * (does not start the nore server nor web app),
 * which, in order, search for pathways and inferred simple
 * interactions in the Pathway Commons backend (PC2 and Sifgraph services).
 *
 * @author Igor Rodchenkov
 */

const {getInteractionGraphFromPC} = require('../../server/routes/interactions/generate-interactions-json');
const {search} = require('../../server/routes/search/search');
const csv = require('csv');
const {pipeline} = require('stream');
const logger = require('../../server/logger');


const transform = csv.transform((data, callback) => {
  let out = [];
  let q = data['Term'];
  out.push(q);

  // apply the same hack as done on the app-ui's client-side, in ServerAPI.search (before  going /api/search)
  if (/^((uniprot|hgnc):\w+|ncbi:[0-9]+)$/i.test(q)) {
    q=q.replace(/^(uniprot|ncbi|hgnc):/i,"");
  }

  // A quick-fix and note -
  // PC's all-in-one full-text index (unlike name: and xrefid: fields) was build
  // using Lucene StandardAnalyzer, which treats '-' (dash), etc., as wildcard when tokenizing original text,
  // which, e.g., results in q="R-MMU-975956" matches too many and irrelevant pathways (it's like R OR MMU OR 975956).
  // One should search like q=name:R-MMU-975956 or q=xrefid:R-MMU-975956 or q="R-MMU-975956" (i.e., quotes are part of the query),
  // but app-ui (apps.pathwaycommons.org) app does not support lucene syntax (though the app specifically detects gene/protein names
  // and uses them to find interactions in a separate query).
  // I.e., a user likely wanted http://apps.pathwaycommons.org/search?q=%22R-HSA-201451%22&type=Pathway (one hit - BMP pathway)
  // rather that http://apps.pathwaycommons.org/search?q=R-HSA-201451&type=Pathway (99 nonsense hits).
  // So let's surround with quotes all one-word queries, like make literally use "R-MMU-975956", "Crb2", etc.
  // (note that the CSV parser removes surrounding quotes, if any, from the input values, which is expected behavior.)
  if (!/\s/g.test(q)) {
    q = '"' + q + '"';
  }

  search({q})
    .then((res) => {
      let {genes, searchHits} = res;
      // the number of pathways
      out.push(searchHits.length);
      return genes.map(geneInfo => geneInfo.geneSymbol);
    })
    .then((symbols) => {
      if (symbols && symbols.length > 0) {
        return getInteractionGraphFromPC(symbols);
      }
    })
    .then((graph) => {
      (graph && graph.edges) ? out.push(graph.edges.length) : out.push(0);
      callback(null, out); //to pipe
      // logger.info("transformed: " + data);
    })
    .catch((e) => {
      logger.error(e);
    });
}, {parallel: 2});

// run!
//Usage: 
//node hit_counts.js <input.csv >output;
//or
//cat input.csv | node hit_counts.js >output
console.log("TERM,PATHWAYS,INTERACTIONS"); //output title row
// (pipeline() is new in Node 10)
// parse CSV data from stdin, query PC, output to stdout
pipeline(
  process.stdin,
  csv.parse({ //see csv.js.org
    record_delimiter: ["\r","\n","\r\n"], //allow all EOLs messy input
    skip_empty_lines: true,
    max_record_size: 1024,
    // relax_column_count: true,
    // relax: true, //preserve quotes inside unquoted field
    skip_lines_with_error: true, //if column names in the first row, we will use e.g. row['Term'], otherwise row[0].
    columns: true,
    // trim: true, //if columns are quoted, this has no effect
    // comment: "#",
  }),
  transform,
  csv.stringify(),
  process.stdout,
  err => {
    if (err) {
      logger.error('Pipeline failed: ' + err);
    } else {
      logger.error('Pipeline succeeded.');
    }
  }
);
