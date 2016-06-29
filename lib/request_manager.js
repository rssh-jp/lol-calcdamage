'use strict';

var https = require('https');

var async = require('async');

var cache_data = require(__dirname + '/../lib/cache_data');

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
    SUMMONER : {
        HOST : 'jp.api.pvp.net',
        PATH : {
            SUMMONER : '/api/lol/jp/v1.4/summoner/by-name',
        },
    },
};

/**
 * URLの取得
 * @param   type_str    string  CHAMPION.FREE2PLAY のようにURLのキーを.でつなぐ
 * @param   params      object  {param : '1', get : {key1 : "value1", key2 : "value2"}} 
 *                              paramにパスの引数、getにGET引数を渡す
 * @return              object  {host : 'jp.api.pvp.net', path : '/api/lol/jp/v1.2/champion'}
 *                              ホストとパスを返す
 **/
var getURL = function(type_str, params){
    if(params == null){
        params = {};
    }
    var param_str = '';
    if(params.param != null){
        param_str = '/' + params.param.join('/');
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

/**
 * httpsリクエストを送信し、その結果を受け取る
 * @param   type_str    string      CHAMPION.FREE2PLAY のようにURLのキーを.でつなぐ
 * @param   params      object      {param : '1', get : {key1 : "value1", key2 : "value2"}} 
 *                                  paramにパスの引数、getにGET引数を渡す
 * @param   callback    calblack    1.error, 2.json形式でのオブジェクトデータ
 **/
var request = function(type_str, params, callback){
    var ret = '';
    var url = getURL(type_str, params);
    console.log('url : ', url);
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

/**
 * free to play 無料チャンピオンの取得
 * @param   type        string      lol apiのchampDataに渡すもの
 *                                  'info'  簡易情報
 *                                  'stats' ステータス情報
 *                                  'all'   全情報
 * @param   callback    callback    1.error, 2.object
 **/
var searchF2PChamp = function (type, callback){
    var params = {
        get : {
            champData : type,
            api_key : API_KEY,
        },
    };
    request('CHAMPION.FREE2PLAY', params, function(err, res){
        if(err){
            callback(err);
            return;
        }
        var obj = JSON.parse(res);
        callback(null, obj);
    });
};
/**
 * free to play 無料チャンピオンの取得
 * @param   callback    callback    1.error
 **/
var searchF2PChampStats = exports.searchF2PChampStats = function (callback){
    searchF2PChamp('stats', callback);
};
/**
 * チャンピオンのデータを取得する
 * @param   type        string      lol apiのchampDataに渡すもの
 *                                  'info'  簡易情報
 *                                  'stats' ステータス情報
 *                                  'all'   全情報
 * @param   id          int         チャンピオンのid
 * @param   callback    callback    1.error, 2.object
 **/
var searchChampData = function(type, id, callback){
    var params = {
        get : {
            locale : 'ja_JP',
            champData : type,
            api_key : API_KEY,
        },
    };
    if(id != null){
        params['param'] = [id];
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
var searchChampDataInfo = exports.searchChampDataInfo = function(id, callback){
    searchChampData('info', id, callback);
};
var searchChampDataStats = exports.searchChampDataStats = function(id, callback){
    searchChampData('stats', id, callback);
};
var searchChampDataSpells = exports. searchChampDataSpells = function(id, callback){
    searchChampData('spells', id, callback);
};
var searchChampDataAll = exports. searchChampDataAll = function(id, callback){
    searchChampData('all', id, callback);
};

/**
 * サモナーのデータを取得する
 * @param   name        string      サモナー名
 * @param   callback    callback    1.error, 2.object
 **/
var searchSummoner = exports.searchSummoner = function(name, callback){
    var params = {
        get : {
            api_key : API_KEY,
        },
    };
    params['param'] = [name];
    request('SUMMONER.BYNAME', params, function(err, res){
        if(err){
            callback(err, null);
            return;
        }
        var obj = JSON.parse(res);
        callback(null, obj);
    });
};
/**
 * サモナーのデータを取得する
 * @param   type        string      lol apiのサモナーに渡すもの
 *                                  'masteries' マスタリー
 *                                  'runes'     ルーン
 *                                  'name'      名前
 * @param   id          int         サモナーのid
 * @param   callback    callback    1.error, 2.object
 **/
var searchSummonerData = function(type, id, callback){
    var params = {
        get : {
            api_key : API_KEY,
        },
    };
    params['param'] = [name];
    params.param.push(type);
    request('SUMMONER.SUMMONER', params, function(err, res){
        if(err){
            callback(err, null);
            return;
        }
        var obj = JSON.parse(res);
        callback(null, obj);
    });
};
