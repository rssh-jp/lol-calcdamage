var util = require('util');

var express = require('express');
var router = express.Router();

var async = require('async');

var CacheData = require(__dirname + '/../lib/cache_data');
var RequestMan = require(__dirname + '/../lib/request_manager');

router.get('/', function(req, res, next) {
    var data = {};
    var task = [];
    task.push(function(n){
        search(function(err){
            n(err);
        });
    });
    task.push(function(n){
        n(null);
    });
    task.push(function(n){
        n(null);
    });
    async.waterfall(task, function(error){
        res.render('summoner', { title: 'LoL Summoner search', data : data });
    });
});

var search = function(callback){
    var task = [];
    task.push(function(next){
        RequestMan.searchSummonerByName('roughsea', function(err, res){
            console.log('res : ', res);
            next(null);
        });
    });
    task.push(function(next){
        RequestMan.searchSummonerDataMasteries('6300399', function(err, res){
            console.log('res : ', util.inspect(res['6300399'].pages, true, null));
            next(null);
        });
    });
    async.waterfall(task, function(error){
        callback(error);
    });
};

module.exports = router;
