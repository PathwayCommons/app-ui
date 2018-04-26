const mapReactId = (identifier) => {
  if (identifier.substring(0, 5) === "REAC:") {
    console.log(identifier);
    return "R-HSA-" + identifier.substring(5, identifier.length);
  }
  return identifier;
}

module.exports = { mapReactId };