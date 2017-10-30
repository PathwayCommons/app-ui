const presetOpts = {
  name: 'preset',
  positions: (node) => {
    return {
      x: node.data('bbox').x, 
      y: node.data('bbox').y
    };
  }, 
  fit: true,
  padding: 50
};

module.exports = presetOpts;
