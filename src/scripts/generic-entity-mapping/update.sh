#!/bin/sh

##
# Creates or updates
# src/server/graph-generation/generic-physical-entities/generic-physical-entity-map.json
#
# TODO: once ready, this will replace the generic-physical-entity-map.js
#
#
# input compressed json array of objects:
# [
#  {
#   "UniProt":["Q9BYD3"],
#   "organism":["Homo sapiens"],
#   "datasource":["BioGRID"],
#   "name":["MRPL4"],"label":"MRPL4",
#   "HGNC Symbol":["MRPL4"],
#   "type":"Protein",
#   "uri":"http:\/\/pathwaycommons.org\/pc2\/Protein_refseq_XP_011526347_identity_1524632035733",
#   "generic":false},
#  ...
# ]
#
# output is like-
# {
#  "http://pathwaycommons.org/pc2/Protein_59c3de6ff42fef7607107a00a02c552d":{
#       "name":["STAT6 upregulated extracellular proteins"],
#       "label":"STAT6 upregulated extracellular proteins",
#        "synonyms":["IGHG4","IGHG1","CCL11","IGHE"]},
#   "http://pathwaycommons.org/pc2/Protein_b09fd31f5f1e115b8d710e208aa92338":{
#       "name":["Ggamma"],
#       "label":"Ggamma",
#       "synonyms":["GNGT1","GNG3","GNG10","GNG2","GNGT2","GNG5","GNG4","GNG7","GNG8","GNG12","GNG13"]},
#   ...
# }
#
##

DATA="http://www.pathwaycommons.org/archives/PC2/v$PC_VERSION/physical_entities.json.gz"
echo "Processing $DATA"

curl -s "$DATA" | gunzip -c | jq 'map(select(.generic)) | reduce .[] as $l ({}; . as $in | ($l.uri) as $uri | . + {($uri): {name: $l.name, label:$l.label, synonyms:$l."HGNC Symbol"}})' generic-physical-entity-map.json

echo "\nDone."
