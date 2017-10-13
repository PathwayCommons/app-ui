/**
    Pathway Commons Central Data Cache

    Pathway Commons Server Routing
    index.js

    Purpose : Defines basic routes for the server

    Requires : None

    Effects : None

    Note : None

    TODO: None

    @author Geoff Elder
    @version 1.1 2017/10/10
**/

const express = require('express');
const router = express.Router();

/* GET home page.
All URLS not specified earlier in server/index.js (e.g. REST URLs) get handled by the React UI */



router.get('*', function(req, res, next) {
  res.render('index.html');
});

module.exports = router;
