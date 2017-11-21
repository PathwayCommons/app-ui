//Import Depedencies
const express = require('express');
const qs = require('querystring');
const router = express.Router();

router.get('/:path', function(req,res){
  res.redirect('http://www.pathwaycommons.org/pc2/' + req.params.path+ '?' + qs.stringify(req.query));
});

module.exports = router;