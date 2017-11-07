const presetOpts = (layoutJSON) => {
  return {
    name: 'preset',
    positions: node => {
      return layoutJSON[node];
    }, 
    fit: true,
    padding: 50
  };
};

module.exports = presetOpts;
