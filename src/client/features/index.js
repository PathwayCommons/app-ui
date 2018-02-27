const Paint = require('./paint');
const Entry = require('./entry');
const View = require('./view');
const Edit = require('./edit');
const Search = require('./search');
const GeneQuery = require('./enrichment/gene-query-ui');
const Enrichment = require('./enrichment/enrichment-ui');
const GqEnrich = require('./enrichment/gq-enrich-ui');

module.exports = {Paint, Entry, Search, View, Edit, GeneQuery, Enrichment, GqEnrich};