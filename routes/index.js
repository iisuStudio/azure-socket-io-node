
/*
 * GET home page.
 */
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.send('home page!');
});

module.exports = router;

// exports.index = function(req, res){
//   res.render('index', { title: 'Express' });
// };
