'use strict';
var async = require('async');

var Enum = {
    SYSTEM : require(__dirname + '/../lib/system_enum'),
};
var CacheData = require(__dirname + '/../lib/cache_data');
var RequestMan = require(__dirname + '/../lib/request_manager');

var searchSummoner = exports.searchSummoner = function(name, callback){
    var ret = null;
    var cache_summoner_data = Enum.SYSTEM.CACHE_NAME.SUMMONER_DATA + ':' + name;
    var cache_summoner_id   = Enum.SYSTEM.CACHE_NAME.SUMMONER_ID   + ':' + name;
    var id = null;
    var task = [];
    // データをキャッシュ検索
    task.push(function(next){
        CacheData.get(cache_summoner_data, function(err, res){
            if(err){
                next(null);
                return;
            }
            ret = res;
            next(100);
        });
    });
    // IDをキャッシュ検索
    task.push(function(next){
        CacheData.get(cache_summoner_id, function(err, res){
            if(err){
                var t = [];
                t.push(function(n){
                    searchSummonerDataByName(name, function(err, res){
                        if(err){
                            n(err);
                            return;
                        }
                        id = res[name].id;
                        n(null);
                    });
                });
                t.push(function(n){
                    searchSummonerDataById(id, function(err, res){
                        if(err){
                            n(err);
                            return;
                        }
                        ret = res;
                        n(null);
                    });
                });
                t.push(function(n){
                    CacheData.set(cache_summoner_id, id, function(err){
                        n(err);
                    });
                });
                t.push(function(n){
                    CacheData.set(cache_summoner_data, ret, function(err){
                        n(err);
                    });
                });
                async.waterfall(t, function(error){
                    next(error);
                });
            }
            else{
                id = res;
                var t = [];
                t.push(function(n){
                    searchSummonerDataById(id, function(err, res){
                        if(err){
                            n(err);
                            return;
                        }
                        ret = res;
                        n(null);
                    });
                });
                t.push(function(n){
                    CacheData.set(cache_summoner_data, ret, function(err){
                        n(err);
                    });
                });
                async.waterfall(t, function(error){
                    next(error);
                });
            }
        });
    });
    task.push(function(next){
        next(null);
    });
    async.waterfall(task, function(error){
        callback(error, ret);
    });
};

var searchSummonerDataById = function(id, callback){
    var ret = null;
    var masteries = null;
    var runes = null;
    var task = [];
    task.push(function(next){
        RequestMan.searchSummonerDataMasteries(id, function(err, res){
            if(err){
                next(err);
                return;
            }
            masteries = res;
            next(null);
        });
    });
    task.push(function(next){
        RequestMan.searchSummonerDataRunes(id, function(err, res){
            if(err){
                next(err);
                return;
            }
            runes = res;
            next(null);
        });
    });
    task.push(function(next){
        if(masteries == null || runes == null){
            next(null);
            return;
        }
        ret = {
            masteries : masteries,
            runes : runes,
        };
        next(null);
    });
    async.waterfall(task, function(error){
        callback(error, ret);
    });
};
var searchSummonerDataByName = function(name, callback){
    var ret = null;
    var task = [];
    task.push(function(next){
        RequestMan.searchSummonerByName(name, function(err, res){
            if(err){
                next(err);
                return;
            }
            ret = res;
            next(null);
        });
    });
    task.push(function(next){
        next(null);
    });
    async.waterfall(task, function(error){
        callback(error, ret);
    });
};
