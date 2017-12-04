//A simplified cytoscape stylesheet
let style = [
  {
    "selector": "node",
    "style": {
      "background-color": "#f6f6f6",
      "background-opacity": "1",
      "border-color": "#555",
      "border-width": "3px",
      "opacity": "1",
      "text-halign": "center",
      "text-opacity": "1",
      "text-outline-color": "white",
      "text-outline-opacity": "1",
      "text-outline-width": "0.75px",
      "text-valign": "center"
    }
  },
  {
    "selector": "edge",
    "style": {
      "color": "#555",
      "text-border-color": "#555",
      "width": "1.5px",
      "line-color": "#555",
      "curve-style": "bezier",
      "arrow-scale": "1.75",
      "source-arrow-color": "#555",
      "target-arrow-color": "#555",
      "source-arrow-fill": "hollow",
      "target-arrow-fill": "hollow"
    }
  }
];

//Render Options
let getRenderOptions = (graph, positions) => ({
  elements: graph,
  style: style,
  resolvesTo: 'base64uri',
  format: 'png',
  width: 480,
  height: 480,
  background: 'transparent',
  layout: {
    name: 'preset',
    positions: positions
  }
});

module.exports = getRenderOptions;