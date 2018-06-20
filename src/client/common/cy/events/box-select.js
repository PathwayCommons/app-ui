

const bindMouseUp = (cy) => {



    cy.on('box',evt => {

        if(cy.selectedNodesToHide)
            cy.selectedNodesToHide.push(evt.target);
        else 
            cy.selectedNodesToHide = [evt.target];


    });

};

module.exports = bindMouseUp;