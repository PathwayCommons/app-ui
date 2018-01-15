const fs = require('fs');

console.log(__dirname + '/processed_physical_entities.json');

const tmp = JSON.parse(fs.readFileSync(__dirname + '/processed_physical_entities.json'));

const processed = {};

tmp.forEach(o => {
  processed[o.uri] = {
    name: o.name,
    label: o.label,
    synonyms: o['HGNC Symbol']
  };
});


fs.writeFileSync('./generic-physical-entity-map.json', JSON.stringify(processed));
