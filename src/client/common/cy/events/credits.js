const bindCredits = cy => {
  const getCurrentPosition = () => cy.scratch('_creditsPos');
  const setNewPosition = value => cy.scratch('_creditsPos', value);
  const creditsKey = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

  //Node to add to cytoscape object if credit code is entered
  const creditsNode = {
    group: 'nodes',
    position: { x: 55, y: 66 },
    data: {
      "bbox": { "h": 400, "w": 400, "x": 50, "y": 50 },
      "class": "macromolecule",
      "clonemarker": false,
      "id": "do-not-submit",
      "label": "Pathway Commons Gene",
      "parsedMetadata": [["Type", "bp:Protein"],
      ["Data Source", "http://baderlab.org"],
      ["Display Name", "Pathway Commons Gene"],
      ["Comment", ["Created at UofT", "Special Thanks to Gary Bader and Jeffrey Wong", "Development Support Provided by Max Franz and Dylan Fong"]],
      ["Names", ["UofT Gene", "BaderLab Gene", "Pathway Commons Search"]],
      ["Cellular Location", ["Donnelly Centre"]],
      ["Database IDs", [["Bader Lab", "2017"]]],
      ["Standard Name", "Pathway Commons 53"]],
      "stateVariables": [
        {
          "class": "state variable",
          "id": "dns",
          "state": {
            "value": "x[1 - 636]",
            "variable": ""
          }
        }
      ],
      "unitsOfInformation": []
    },
  };

  //Reset counter
  cy.scratch('_creditsPos', 0);

  //Keep track of key strokes
  document.addEventListener('keydown', function (e) {
    
    var requiredKey = creditsKey[getCurrentPosition()];

    if (requiredKey == e.keyCode) {
      setNewPosition(getCurrentPosition() + 1);

      if (getCurrentPosition() === creditsKey.length) {
        
        //Remove any old nodes
        cy.remove('#do-not-submit');

        //Create a new node
        setNewPosition(0);
        cy.add(creditsNode);
        cy.style().selector('#do-not-submit')
        .style('width', '611px')
        .style('height', '728px')
        .style('background-image', 'img/icon.png');
      }
    }
    else {
      setNewPosition(0);
    }
  });

};

module.exports = bindCredits;