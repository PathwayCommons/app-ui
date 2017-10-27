//Create a html element with given attributes
//Returns a html element with given attributes
//Requires a valid attribute array
function createHtmlElement(elementName, attributes, textContent) {
  //Create element
  var el = document.createElement(elementName);

  //Loop through and assign attributes
  for (var i = 0; i < attributes.length; i++) {
    el[attributes[i][0]] = attributes[i][1];
  }

  //Add text
  let textnode = document.createTextNode(textContent);   
  if (textContent) el.appendChild(textnode);

  return el;
}


//Append a series of elements to a parent
//Returns a html element with appended children
//Requires valid html element and array of children
function appendMultiple(parent, children) {
  for (var i = 0; i < children.length; i++) {
    parent.appendChild(children[i]);
  }
  return parent;
}


//Formats mapped data into a html tooltip object
//Returns a HTML Object
//Requires a valid parsedMetdata Array
function createToolTipHTMLObject(name, data) {

  var demoText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sagittis, sem non pharetra dictum, eros turpis condimentum \
  sem, ut sagittis mi elit a elit. Duis dignissim, augue a hendrerit venenatis, dolor metus sagittis nisi, vitae tempus \
  lectus risus vel lacus. Pr oin dictum, metus in accumsan condimentum, tortor diam porta tellus, et accumsan elit ex \
  a libero";

  var tooltip = createHtmlElement('div', [['className', 'tooltip-image']]);
  var tooltipChildren = [
    createHtmlElement('img', [['src', 'img/tooltip.png']]),
    createHtmlElement('div', [['className', 'tooltip-heading']], name),
    createHtmlElement('i', [['className', 'material-icons tooltip-button-show']], 'open_in_new'),
    createHtmlElement('i', [['className', 'material-icons tooltip-button-pdf']], 'picture_as_pdf'),
    createHtmlElement('div', [['className', 'tooltip-internal']], demoText)
  ];

  tooltip = appendMultiple(tooltip, tooltipChildren);

  return tooltip; 
}

module.exports = createToolTipHTMLObject; 