'use strict';
var async = require('async');

var Enum = {
    SYSTEM : require(__dirname + '/../lib/system_enum'),
};
var CacheData = require(__dirname + '/../lib/cache_data');
var RequestMan = require(__dirname + '/../lib/request_manager');

var searchChampListAll = exports.searchChampListAll = function(callback){
    searchChampList(CONST_CHAMP_LIST_TYPE.ALL, callback);
};
var searchChampListInfo = exports.searchChampListInfo = function(callback){
    searchChampList(CONST_CHAMP_LIST_TYPE.INFO, callback);
};
var searchChampListStats = exports.searchChampListStats = function(callback){
    searchChampList(CONST_CHAMP_LIST_TYPE.STATS, callback);
};
var searchChampListSpells = exports.searchChampListSpells = function(callback){
    searchChampList(CONST_CHAMP_LIST_TYPE.SPELLS, callback);
};

var searchChampAll = exports.searchChampAll = function(id, callback){
    searchChamp(CONST_CHAMP_LIST_TYPEALL.ALL, id, callback);
};
var searchChampInfo = exports.searchChampInfo = function(id, callback){
    searchChamp(CONST_CHAMP_LIST_TYPE.INFO, id, callback);
};
var searchChampStats = exports.searchChampStats = function(id, callback){
    searchChamp(CONST_CHAMP_LIST_TYPE.STATS, id, callback);
};
var searchChampSpells = exports.searchChampSpells = function(id, callback){
    searchChamp(CONST_CHAMP_LIST_TYPE.SPELLS, id, callback);
};

var CONST_CHAMP_LIST_TYPE = {
    ALL    : 'ALL',
    INFO   : 'INFO',
    STATS  : 'STATS',
    SPELLS : 'SPELLS',
};
var CACHE_NAME = Enum.SYSTEM.CACHE_NAME;
var CONST_CHAMP_LIST = {
    ALL    :{CACHE_NAME : CACHE_NAME.CHAMPION_ALL_ALL,    EXTERNAL_FUNC : RequestMan.searchChampDataAll,    INNER_FUNC : searchChampListAll   },
    INFO   :{CACHE_NAME : CACHE_NAME.CHAMPION_INFO_ALL,   EXTERNAL_FUNC : RequestMan.searchChampDataInfo,   INNER_FUNC : searchChampListInfo  },
    STATS  :{CACHE_NAME : CACHE_NAME.CHAMPION_STATS_ALL,  EXTERNAL_FUNC : RequestMan.searchChampDataStats,  INNER_FUNC : searchChampListStats },
    SPELLS :{CACHE_NAME : CACHE_NAME.CHAMPION_SPELLS_ALL, EXTERNAL_FUNC : RequestMan.searchChampDataSpells, INNER_FUNC : searchChampListSpells},
};

var searchChamp = function(type, id, callback){
    var ret = null;
    var list = [];
    var task = [];
    // データの取得（全件取得）
    task.push(function(next){
        CONST_CHAMP_LIST[type].INNER_FUNC(function(err, res){
            if(err){
                next(err);
                return;
            }
            list = res;
            next(null);
        });
    });
    // 該当データのみをピックアップ
    task.push(function(next){
        for(var key in list.data){
            var val = list.data[key];
            if(val.id == id){
                ret = val;
                break;
            }
        }
        next(null);
    });
    async.waterfall(task, function(error){
        callback(error, ret);
    });
};

var searchChampList = function(type, callback){
    var ret = null;
    var task = [];
    // キャッシュから取得
    task.push(function(next){
        CacheData.get(CONST_CHAMP_LIST[type].CACHE_NAME, function(err, res){
            if(err){
                next(null);
                return;
            }
            ret = res;
            next(100);
        });
    });
    // apiから取得
    task.push(function(next){
        CONST_CHAMP_LIST[type].EXTERNAL_FUNC(null, function(err, res){
            if(err){
                next(err);
                return;
            }
            ret = res;
            next(null);
        });
    });
    // キャッシュに登録
    task.push(function(next){
        CacheData.set(CONST_CHAMP_LIST[type].CACHE_NAME, ret, function(err){
            next(err);
        });
    });
    async.waterfall(task, function(error){
        if(error){
            if(error == 100){
                error = null;
            }
        }
        callback(error, ret);
    });
};

