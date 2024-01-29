// Create file safe names from a uri
const uri2filename = s => s.replace(/[^a-z0-9]/gi, '_').toLowerCase();

module.exports = {
  uri2filename
};