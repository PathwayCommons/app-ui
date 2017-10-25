//Replace Authentication Code Here with User Login System Later 
var ip = require('ip');

//Compare IP aganist reserved local ips
function reservedIPComparison(givenIP) {
  var reservedIp = [
    ['167772160', 184549375],  /*    10.0.0.0 -  10.255.255.255 */
    ['3232235520', 3232301055], /* 192.168.0.0 - 192.168.255.255 */
    ['2130706432', 2147483647], /*   127.0.0.0 - 127.255.255.255 */
    ['2851995648', 2852061183], /* 169.254.0.0 - 169.254.255.255 */
    ['2886729728', 2887778303], /*  172.16.0.0 -  172.31.255.255 */
    ['3758096384', 402653183], /*   224.0.0.0 - 239.255.255.255 */];

  //Convert IPV6 local to IPV4 Local 
  if (givenIP.charAt(0) == ':' && givenIP != '::1') {
    givenIP = givenIP.slice(7);
  }

  //Get Long of given ip
  var ipLong = ip.toLong(givenIP);
  var i = 0;

  //Compare against all reserved ips
  for (i = 0; i < reservedIp.length; i++) {
    if ((ipLong >= reservedIp[i][0]) && (ipLong <= reservedIp[i][1])) {
      return true;
    }
  }

  if (givenIP === '::1') return true;
  else return false;
}

//Determine if a user is locally present
module.exports.checkUser = function (req, socketIO = false) {
  //Get Ip 
  var ip;

  if (socketIO) {
    ip = req;
  }
  else {
    ip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
  }

  //Check if user ip is local
  return reservedIPComparison(ip);
};