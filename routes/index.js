var https = require('https');
var http = require('http');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    requestTest();
//    requestTest2();
  res.render('index', { title: 'LoL Damage Calculation' });
});

var API_KEY = 'RGAPI-8344AE70-1B54-4223-839B-0EA9C88BC31C';
//var API_KEY = 'https://jp.api.pvp.net/api/lol/jp/v1.2/champion/1?api_key=RGAPI-8344AE70-1B54-4223-839B-0EA9C88BC31C';

var Const = {
    PATH : {
        CHAMP : '/api/lol/jp/v1.2/champion/',
    },
};
var Enum = {
    PATH_TYPE : {
        CHAMP : 'CHAMP',
    },
};

var getPath = function(type, params){
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
    var options = {
        host : 'ddragon.leagueoflegends.com',
        method : 'GET',
        path : '/tool/',
    };
    var req = http.request(options, function(res){
        var str = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            str += chunk;
        });
        res.on('end', function(){
            console.log(str);
        });
    });
    req.end();
    req.on('error', function(err){
        console.log('error : ', err);
    });
};

module.exports = router;
