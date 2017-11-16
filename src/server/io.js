const sio = require('socket.io');

module.exports = {
  io : null,
  set : function(server){
    return this.io = sio(server);
  },

  get : function(){
    return this.io;
  }
};