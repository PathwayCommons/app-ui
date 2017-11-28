const _ = require('lodash');
const apiCaller = require('../../../services/apiCaller/');

/* rearrangeGraph(layouts, positions, cy, headless, options)
Apply a human created layout and submit the changes to the server
Returns a PNG of the modified graph
Note : -Options Parameter is optional
       -Layouts is a collection of layouts
       -Positions is a collection of position objects 
*/
function rearrangeGraph(layouts, positions, cy, renderImage, options) {
  //Modify positions for each layout entry
  const layoutOpts = _.find(layouts, (layout) => layout.displayName === 'Human-created').options;
  let layout = cy.layout(layoutOpts);

  //Rearrange items to match given layout
  layout.run();

  //Save positions upon layout stop
  return layout.pon('layoutstop').then(function () {
    if (!(renderImage)) {
      //Post each position to the server
      cy.nodes().forEach(element => {
        if (positions[element.id()]) {
          //Save local position
          let position = element.position();

          //Save remote position
          if (options.admin && !renderImage) {
            apiCaller.submitNodeChange(options.uri, 'latest', element.id(), position);
          }
        }
      });

      //Animate zoom and fit
      cy.animate({
        fit: {
          eles: cy.elements(), padding: 100
        }
      }, { duration: 700 });
    }
    //Return an image of the resulting graph
    else if (renderImage) {
      return cy.png({ full: true, scale: 2 });
    }
  });

}

module.exports = rearrangeGraph; 