//A simplified cytoscape style
let style = [
  {
    "selector": "node",
    "style": {
      "background-color": "#f6f6f6",
      "background-opacity": "1",
      "border-color": "#555",
      "border-width": "1.5px",
      "opacity": "1",
      "text-halign": "center",
      "text-opacity": "1",
      "text-outline-color": "white",
      "text-outline-opacity": "1",
      "text-outline-width": "0.75px",
      "text-valign": "center"
    }
  }
];

//Render Options
let getRenderOptions = (graph, positions) => ({
  elements: graph,
  style: style,
  resolvesTo: 'base64uri',
  format: 'png',
  width: 640,
  height: 480,
  background: 'transparent',
  layout: {
    name: 'preset',
    positions: positions
  }
});

module.exports = getRenderOptions;