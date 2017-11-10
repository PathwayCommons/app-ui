  //Push a metadata field to the bottom of the list
  function pushToBottom(data, field) {
    for (var x in data) {
      data[x][0] == field ? data.push(data.splice(x, 1)[0]) : 0;
    }
    return data;
  }

  //Order a given metadata data array
  function orderArray(data) {

    //Push Database IDs to the bottom of the list
    data = this.pushToBottom(data, "Database IDs");

    //Push Comments to the bottom of the list
    data = this.pushToBottom(data, 'Comment');

    return data;
  }

  module.exports = {
    pushToBottom,
    orderArray
  };