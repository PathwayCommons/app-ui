const fs = require('fs');

const tmp = JSON.parse(fs.readFileSync('./generic_physical_entities.json'));

const processed = {};

tmp.forEach(o => {
  processed[o.uri] = {
    name: o.name,
    label: o.label,
    synonyms: o['HGNC Symbol']
  };
});


fs.writeFileSync('./generic-physical-entity-map.json', JSON.stringify(processed));
