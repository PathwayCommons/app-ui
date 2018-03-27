const h = require('hyperscript');
const tippy = require('tippy.js');

const config = require('../../config');

const formatContent = require('./format-content');
const collection = require('./collection');
const getPublications = require('./publications');

//Manage the creation and display of metadata HTML content
//Requires a valid name, cytoscape element, and parsedMetadata array
class MetadataTip {

  constructor(name, data, cyElement) {
    this.name = name;
    this.data = data.parsedMetadata;
    this.cyElement = cyElement;
    this.db = config.databases;
    this.viewStatus = {};
  }

  //Show Tippy Tooltip
  show(cy, callback) {
    //Get tooltip object from class
    let tooltip = this.tooltip;
    let tooltipExt = tooltip;
    let zoom= this.zoom;
    let isEdge=this.cyElement.isEdge();

    getPublications(this.data).then(function (data) {
      this.data = data;

      //Hide all other tooltips
      this.hideAll(cy);

      //If no tooltip exists create one
      if (!tooltip||(zoom!=cy.zoom()&&isEdge)) {
        zoom=cy.zoom();
        //Generate HTML
        let tooltipHTML = this.generateToolTip(zoom,isEdge,callback);
        let expandedHTML = this.generateExtendedToolTip(zoom,isEdge,callback);

        //Create tippy object
        let refObject = this.cyElement.popperRef();
        tooltip = tippy(refObject, { html: tooltipHTML, theme: 'light', interactive: true, trigger: 'manual', hideOnClick: false, arrow: true, position: 'bottom', distance: isEdge? -25*zoom+7:10});
        tooltipExt = tippy(refObject, { html: expandedHTML, theme: 'light', interactive: true, trigger: 'manual', hideOnClick: false, arrow: true, position: 'bottom', distance: isEdge? -25*zoom+7:10 });
        //Resolve Reference issues
        tooltip.selector.dim = refObject.dim;
        tooltip.selector.cyElement = refObject.cyElement;
        tooltipExt.selector.dim = refObject.dim;
        tooltipExt.selector.cyElement = refObject.cyElement;

        //Save tooltips
        this.tooltip = tooltip;
        this.zoom=zoom;
        this.tooltipExt = tooltipExt;
      }

      //Show Tooltip
      tooltip.show(tooltip.store[0].popper);
      this.visible = true;
    }.bind(this));
  }

  //Validate the name of object and use Display Name as the fall back option
  validateName() {
    if (!(this.name)) {
      let displayName = this.data.filter(pair => pair[0] === 'Display Name');
      if (displayName.length > 0) { this.name = displayName[0][1].toString(); }
    }
  }

  //Generate HTML Elements for tooltips
  generateToolTip(zoom,isEdge,callback) {
    //Order the data array
    let data = collection.toTop(this.data, config.tooltipOrder);
    data = collection.toBottom(data, config.tooltipReverseOrder);

    if (!(data) || data.length === 0) {
      return formatContent.noDataWarning(this.name);
    }

    //Ensure name is not blank
    this.validateName();

    //Generate the expand field option
    const expandFunction = this.displayMore(zoom,isEdge);

    if (!(this.data)) { this.data = []; }
    return h('div.tooltip-image', [
      h('div.tooltip-heading', this.name),
      h('div.tooltip-internal', h('div', (data).map(item => formatContent.parseMetadata(item, true, expandFunction, this.name)), this))
    ]);
  }

  //Generate HTML Elements for the side bar
  generateExtendedToolTip(zoom,isEdge,callback) {
    //Order the data array
    let data = collection.toTop(this.data, config.tooltipOrder);
    data = collection.toBottom(data, config.tooltipReverseOrder);
    if (!(data)) data = [];

    if (!(data) || data.length === 0) {
      return formatContent.noDataWarning(this.name);
    }

    //Ensure name is not blank
    this.validateName();

    //Generate expansion and collapse functions 
    const expandFunction = this.displayMore(zoom,isEdge);
    const collapseFunction = this.displayLess(zoom,isEdge);

    const getExpansionFunction = item => !this.isExpanded(item[0]) ? expandFunction : collapseFunction;

    if (!(this.data)) { this.data = []; }
    return h('div.tooltip-image', [
      h('div.tooltip-heading', this.name),
      h('div.tooltip-internal', h('div', (data).map(item => formatContent.parseMetadata(item, !this.isExpanded(item[0]), getExpansionFunction(item), this.name), this)))
    ]
    );
  }

  //Hide all tooltip objects
  hideAll(cy) {
    cy.elements().each(function (element) {
      var tempElement = element.scratch('_tooltip');
      if (tempElement && tempElement.isVisible()) { tempElement.hide(); }
    });
  }


  //Hide Tippy tooltip
  hide() {
    if (this.tooltip) {
      this.tooltip.hide(this.tooltip.store[0].popper);
      this.tooltipExt.hide(this.tooltipExt.store[0].popper);
    }
    this.visible = false;
    this.viewStatus = {};
  }

  //Destroy Tippy tooltip
  destroy() {
    if (this.tooltip) {
      this.tooltip.destroy(this.tooltip.store[0].popper);
      this.tooltip = null;
    }
  }

  //Get display status of tooltip
  isVisible() {
    return this.visible;
  }

  //Display the expanded tooltip
  expandToolTip(expansionObject, expansionField, fieldStatus,zoom,isEdge) {
    //Modify view status
    expansionObject.viewStatus[expansionField] = fieldStatus;

    //Hide existing tooltip 
    const existingToolTip = expansionObject.tooltipExt;
    existingToolTip.hide(existingToolTip.store[0].popper);
  
    //Get tooltip objects
    let tooltip = expansionObject.tooltip;
    const expandedHTML = expansionObject.generateExtendedToolTip(zoom,isEdge);

    //Create tippy object
    let refObject = expansionObject.cyElement.popperRef();
    let tooltipExt = tippy(refObject, { html: expandedHTML,
      theme: 'light',
      interactive: true,
      trigger: 'manual',
      hideOnClick: false,
      arrow: true,
      position: 'bottom',
      animation: 'shift',
      duration : 1,
      distance: isEdge? -25*zoom+7:10
    });

    //Resolve Reference issues
    tooltipExt.selector.dim = refObject.dim;
    tooltipExt.selector.cyElement = refObject.cyElement;

    //Hide and show
    tooltip.hide(tooltip.store[0].popper);
    tooltipExt.show(tooltipExt.store[0].popper);

    //Save extended tooltip
    expansionObject.tooltipExt = tooltipExt;
  }

  //Return a function that binds a tooltip to the expanded tooltip view
  displayMore(zoom,isEdge) {
    let that = this;
    return (field) => that.expandToolTip(that, field, true,zoom,isEdge);
  }

  //Return a function that binds an expanded tooltip to the minimized view.
  displayLess(zoom,isEdge) {
    let that = this;
    return (field) => that.expandToolTip(that, field, false,zoom,isEdge);
  }

  //Return the expansion status of a specified field
  isExpanded(field) {
    return this.viewStatus[field];
  }

}

module.exports = MetadataTip;