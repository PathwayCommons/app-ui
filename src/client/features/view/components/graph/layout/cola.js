const colaOpts = {
  name: 'cola',
  fit: true,
  randomize: false,
  nodeSpacing: function( node ){
    if (node.data('class').includes('process')) {
      return 40;
    }
    if (node.data('class').includes('complex' )) {
      return 60;
    }
    return 10;
  } // extra spacing around nodes
};

module.exports = colaOpts;
