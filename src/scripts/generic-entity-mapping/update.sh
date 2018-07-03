#!/bin/sh

##
# Creates or updates generic-physical-entity-map.json data file.
#
# Pr-requisites:
#  - curl
#  - gunzip
#  - jq (https://stedolan.github.io/jq/; or install with npm: npm install hjson -g)
#  - hjson (optional - if the input is not strict JSON; use https://hjson.org/users-bin.html)
#
##
# Input is a (gzipped) JSON array:
# [
#  {
#   "type":"Protein", "organism":["Homo sapiens"], "datasource":["BioGRID"],
#   "name":["MRPL4"],"label":"MRPL4",
#   "HGNC Symbol":["MRPL4"], "UniProt":["Q9BYD3"]
#   "uri":"http:\/\/pathwaycommons.org\/pc2\/Protein_refseq_XP_011526347_identity_1524632035733", "generic":false},
#  ...
# ]
# , and the output is like:
# {
#   "http://pathwaycommons.org/pc2/Protein_59c3de6ff42fef7607107a00a02c552d":{
#       "name":["STAT6 upregulated extracellular proteins"],
#       "label":"STAT6 upregulated extracellular proteins",
#        "synonyms":["IGHG4","IGHG1","CCL11","IGHE"]},
#   "http://pathwaycommons.org/pc2/Protein_b09fd31f5f1e115b8d710e208aa92338":{
#       "name":["Ggamma"], "label":"Ggamma",
#       "synonyms":["GNGT1","GNG3","GNG10","GNG2","GNGT2","GNG5","GNG4","GNG7","GNG8","GNG12","GNG13"]},
#   ...
# }
##

DATA="http://www.pathwaycommons.org/archives/PC2/$PC_VERSION/physical_entities.json.gz"

echo "Processing $DATA"

curl -s "$DATA" | gunzip -c | jq -cS 'map(select(.generic)) | reduce .[] as $o ({}; . + {($o.uri): {name: $o.name, label:$o.label, synonyms:$o."HGNC Symbol"}})' > generic-physical-entity-map.json

mv generic-physical-entity-map.json ../../server/graph-generation/generic-physical-entities/

echo "\nUpdated generic-physical-entity-map.json"
