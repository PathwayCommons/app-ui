const fetch = require('node-fetch');
const convert = require('sbgnml-to-cytoscape');

function queryPC(pcID) {
    const prefix = 'http://www.pathwaycommons.org/pc2/get?uri=';
    const suffix = '&format=sbgn';

    var url = prefix + pcID + suffix;
    return fetch(url, { method: 'GET', format: 'SBGN' }).then((response) => {
        return response.text();
    }).then((text) => {
        if(!text){
            return null;
        }
        return convert(text);
    });
}

function queryMetadata(pcID){
    throw new Error('ERROR: Harsh\'s metadata script is not yet implemented');
}

module.exports = {
    queryPC: queryPC,
    queryMetadata: queryMetadata
};