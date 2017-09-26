module.exports = function appendScript(){
  let script = document.createElement('script');
  script.src = 'http://' + window.location.hostname + ':3001/browser-sync/browser-sync-client.js';

  document.head.insertBefore( script, document.head.firstChild );
};
