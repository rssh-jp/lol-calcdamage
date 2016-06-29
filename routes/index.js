var https = require('https');
var http = require('http');

var express = require('express');
var router = express.Router();

var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {
    var task = [];
    task.push(function(next){
        requestTest();
        next(null);
    });
    task.push(function(next){
        requestTest2();
        next(null);
    });
    async.waterfall(task, function(error){
        res.render('index', { title: 'LoL Damage Calculation' });
    });
});

var API_KEY = 'RGAPI-8344AE70-1B54-4223-839B-0EA9C88BC31C';
//var API_KEY = 'https://jp.api.pvp.net/api/lol/jp/v1.2/champion/1?api_key=RGAPI-8344AE70-1B54-4223-839B-0EA9C88BC31C';

var Const = {
    PATH : {
        CHAMP : '/api/lol/jp/v1.2/champion/',
        CHAMP_STATS : '/api/lol/static-data/jp/v1.2/champion/',
    },
};
var Enum = {
    PATH_TYPE : {
        CHAMP : 'CHAMP',
        CHAMP_STATS : 'CHAMP_STATS',
    },
};

var getPath = function(type, params){
    if(params == null){
        params = {};
    }
    var param_str = params.param;
    var get = [];
    for(var key in params.get){
        var str = key + '=' + params.get[key];
        get.push(str);
    }
    var get_str = get.join('&');
    var ret = Const.PATH[type] + param_str + '?' + get_str;
    return ret;
};

var requestTest = function (){
    var path = getPath(Enum.PATH_TYPE.CHAMP, {param : '1', get : {champData : 'stats', api_key : API_KEY}});
    var options = {
        hostname : 'jp.api.pvp.net',
        method : 'GET',
        path : path,
    };
    var req = https.request(options, function(res){
        var str = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            str += chunk;
        });
        res.on('end', function(){
            var obj = JSON.parse(str);
            console.log(obj);
        });
    });
    req.end();
    req.on('error', function(err){
        console.log('error : ', err);
    });
};

var requestTest2 = function (){
    var path = getPath(Enum.PATH_TYPE.CHAMP_STATS, {param : '1', get : {locale : 'ja_JP', champData : 'all', api_key : API_KEY}});
    var options = {
        hostname : 'global.api.pvp.net',
        method : 'GET',
        path : path,
    };
    console.log('path : ', path);
    var req = https.request(options, function(res){
        var str = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            str += chunk;
        });
        res.on('end', function(){
            var obj = JSON.parse(str);
            console.log(obj);
        });
    });
    req.end();
    req.on('error', function(err){
        console.log('error : ', err);
    });
};

module.exports = router;
