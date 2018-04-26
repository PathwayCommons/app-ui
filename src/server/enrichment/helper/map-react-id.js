const mapReactId = (identifier) => {
  if (identifier.substring(0, 5) === "REAC:") {
    return "R-HSA-" + identifier.substring(5, identifier.length);
  }
  return identifier;
}

module.exports = { mapReactId };