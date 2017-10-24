/**
  Pathway Commons Central Data Caches

  CDC Interface

  Purpose:  Backend interface. Designed to work well with React.

  Note: See blurb below for use and explanation

  To do: 

  @author Jonah Dlin
  @version 1.1 2017/10/17
**/

const io = require('socket.io-client');
var socket = io('192.168.90.176:3000');

/*
Socket.io works similarly to React in that when updates happen, it pushes them live.
With that in mind, these socket.io functions are meant to work directly with React
states by way of an updateFunction. Normally this updateFunction is an arrow function
that updates the state of a React component with whatever information is passed through
by the server, giving the backend the ability to live rerender the page.

Functions here starting with "init" and ending with "Socket" are meant to take an updateFunction
and those starting with "request" are meant to prompt the backend to send something through the
matching "init___Socket" function. Example of use would be:

CDC.initEditKeyValidationSocket(valid => {
  this.setState({editkeyvalid: valid});
});
CDC.requestEditKeyValidation(params);
*/

const CDC = {
  initGraphSocket(updateFunction) {
    socket.on('layoutPackage', (cyZip) => {
      var cyJSON = JSON.parse(atob(cyZip));
      updateFunction(cyJSON.graph);
    });
  },

  initEditLinkSocket(updateFunction) {
    socket.on('editKey', (editURI) => {
      updateFunction(editURI);
    });
  },

  initEditKeyValidationSocket(updateFunction) {
    socket.on('editPermissions', (valid) => {
      updateFunction(valid);
    });
  },

  // Request a graph from the server. Should send back a cyJSON graph
  requestGraph(uri, version) {
    socket.emit('getLayout', {uri: uri, version: version.toString()});
  },

  // Used only in the admin app. Validation is done on the server-side
  requestEditLink(uri, version) {
    socket.emit('getEditKey', {uri: uri, version: version.toString()});
  },

  // Used to initially validate a user
  requestEditKeyValidation(uri, version, key) {
    socket.emit('checkEditKey', {uri: uri, version: version.toString(), key: key});
  },

  // Send a dif in a node to the backend. The backend will deal with merging these diffs into
  // a layout
  submitDiff(uri, version, key, node_id, pos) {
    socket.emit('submitLayout', {uri: uri, version: version.toString(), key: key, id: node_id, pos: JSON.stringify(pos)});
  },

  // Send a session closed message to the backend so it can save the diffs to a new layout
  submitSessionEnd() {
    socket.emit('sessionEnd', {closed: true});
  }

};

// All errors are currently sent through on this 'error' channel. We obviously will take out this
// console log in production but it's good to see where the errors are coming from
socket.on('error', (msg) => {
  console.log('##################\nCDC error\n'+msg+'\n##################');
});

module.exports = CDC;