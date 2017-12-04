const storeStyle = (ele, keys) => {
  const storedStyleProps = {};

  for (let key of keys) {
    storedStyleProps[key] = ele.style(key);
  }

  return storedStyleProps;
};

const applyStyle = (cy, eles, style, scratchKey) => {
  const stylePropNames = Object.keys(style);

  eles.forEach((ele) => {
    ele.scratch(scratchKey, storeStyle(ele, stylePropNames));
  });

  cy.batch(function () {
    eles.style(style);
  });
};

const removeStyle = (cy, eles, scratchKey) => {

  cy.batch(function () {
    eles.forEach((ele) => {
      ele.style(ele.scratch(scratchKey));
      ele.removeScratch(scratchKey);
    });
  });
};


module.exports = { applyStyle, removeStyle };