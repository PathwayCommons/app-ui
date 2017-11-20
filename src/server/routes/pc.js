//Import Depedencies
const express = require('express');
const router = express.Router();

router.get('/:path', function(req,res){
  res.redirect('http://www.pathwaycommons.org/pc2/' + req.params.path);
});

module.exports = router;