var https = require('https');
var http = require('http');

var express = require('express');
var router = express.Router();

var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {
    var select_list = [];
    var task = [];
    task.push(function(next){
        searchChampData(null, function(err, res){
            if(err){
                next(err);
                return;
            }
            for(var key in res.data){
                var val = res.data[key];
                var data = {
                    name : key,
                    id : val.id,
                    name_jp : val.name,
                };
                select_list.push(data);
            }
            select_list.sort(function(v1, v2){
                return v1.id - v2.id;
            });
            console.log('select_list : ', select_list);
            next(null);
        });
    });
//    task.push(function(next){
//        searchF2PChamp(function(err){
//            next(err);
//        });
//    });
    async.waterfall(task, function(error){
        res.render('index', { title: 'LoL Damage Calculation', select_list : select_list, select_size : select_list.length });
    });
});

var API_KEY = 'RGAPI-8344AE70-1B54-4223-839B-0EA9C88BC31C';

var URL = {
    CHAMPION : {
        HOST : 'jp.api.pvp.net',
        PATH : {
            FREE2PLAY : '/api/lol/jp/v1.2/champion',
        },
    },
    STATIC_DATA : {
        HOST : 'global.api.pvp.net',
        PATH : {
            CHAMPION : '/api/lol/static-data/jp/v1.2/champion',
        },
    },
};

var getURL = function(type_str, params){
    if(params == null){
        params = {};
    }
    var param_str = '';
    if(params.param != null){
        param_str = '/' + params.param;
    }
    var get = [];
    for(var key in params.get){
        var str = key + '=' + params.get[key];
        get.push(str);
    }
    var get_str = get.join('&');
    var s = type_str.split('.');
    var url = URL[s[0]];
    var ret = {
        host : url.HOST,
        path : url.PATH[s[1]] + param_str + '?' + get_str,
    };
    return ret;
};

var request = function(type_str, params, callback){
    var ret = '';
    var url = getURL(type_str, params);
    console.log('path : ', url.path);
    var options = {
        hostname : url.host,
        method : 'GET',
        path : url.path,
    };
    var req = https.request(options, function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            ret += chunk;
        });
        res.on('end', function(){
            callback(null, ret);
        });
    });
    req.end();
    req.on('error', function(err){
        callback(err, null);
    });
};

var searchF2PChamp = function (callback){
    request('CHAMPION.FREE2PLAY', {get : {champData : 'stats', api_key : API_KEY}}, function(err, res){
        if(err){
            callback(err);
            return;
        }
        var obj = JSON.parse(res);
        console.log(obj);
        callback(null);
    });
};
var searchChampData = function (id, callback){
    var params = {
        get : {
            locale : 'ja_JP',
            champData : 'info',
            api_key : API_KEY,
        },
    };
    if(id != null){
        params['param'] = '1';
    }
    request('STATIC_DATA.CHAMPION', params, function(err, res){
        if(err){
            callback(err, null);
            return;
        }
        var obj = JSON.parse(res);
        callback(null, obj);
    });
};


module.exports = router;
