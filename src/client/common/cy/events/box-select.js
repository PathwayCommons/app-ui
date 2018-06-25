
//this is part of the hide nodes selected with shift+drag feature
const bindBox = (cy) => {
    //This event fires for every node inside the box selection region
    cy.on('box',evt => {
        //add this to the cy object, so the data can be accessed by the button
            cy.selectedNodesToHide.push(evt.target);
    });
    
    //reset selection when user begins to draw a new box
    cy.on('boxstart', () =>{
        cy.selectedNodesToHide = [];
    });

    //reset selection on click, 
    //this way the selected nodes array matches the built-in node highlighting
    cy.on('click', () => {
        cy.selectedNodesToHide = [];
    });

};

module.exports = bindBox;