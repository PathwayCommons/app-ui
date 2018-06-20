
//this is part of the hide nodes selected with shift+drag feature
const bindBox = (cy) => {
    //This event fires for every node inside the box selection region
    cy.on('box',evt => {

        //add this to the cy object, so the data can be accessed by the button
        if(cy.selectedNodesToHide)
            cy.selectedNodesToHide.push(evt.target);
        else 
            cy.selectedNodesToHide = [evt.target];

    });

};

module.exports = bindBox;