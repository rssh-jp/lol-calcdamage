var https = require('https');
var http = require('http');

var express = require('express');
var router = express.Router();

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
};

/* GET home page. */
router.get('/', function(req, res, next) {
    var data = {};
    var task = [];
    task.push(function(n){
        console.log('req : ', req.query);
        data.champ_1_id = req.query.champ_1_id != null ? req.query.champ_1_id : 0;
        data.champ_2_id = req.query.champ_2_id != null ? req.query.champ_2_id : 0;
        data.champ_1_lv = req.query.champ_1_lv != null ? req.query.champ_1_lv : 0;
        data.champ_2_lv = req.query.champ_2_lv != null ? req.query.champ_2_lv : 0;
        data.champ_1_add_ad = req.query.champ_1_add_ad != null ? req.query.champ_1_add_ad : null;
        data.champ_2_add_ad = req.query.champ_2_add_ad != null ? req.query.champ_2_add_ad : null;
        n(null);
    });
    task.push(function(n){
        searchChampData(null, function(err, res){
            if(err){
                n(err);
                return;
            }
            var select_list = [];
            for(var key in res.data){
                var val = res.data[key];
                var d = {
                    name : key,
                    id : val.id,
                    name_jp : val.name,
                };
                select_list.push(d);
            }
            select_list.sort(function(v1, v2){
                return v1.id - v2.id;
            });
            data.select_list = select_list;
            n(null);
        });
    });
    task.push(function(n){
        searchChampDetail(req.query, function(err, res){
            if(res == null){
                n(null);
                return;
            }
            data.champ_stats = res;
            n(null);
        });
    });
//    task.push(function(n){
//        searchF2PChamp(function(err){
//            n(err);
//        });
//    });
    async.waterfall(task, function(error){
        console.log('data : ', data.champ_stats);
        res.render('index', { title: 'LoL Damage Calculation', data : data });
    });
});

var searchChampDetail = function(query, callback){
    var ret = {};
    var task = [];
    task.push(function(next){
        if(query.champ_1_id == null){
            next(10);
            return;
        }
        else{
            var lvoffset = query.champ_1_lv - 1;
            var add_ad = parseInt(query.champ_1_add_ad);
            searchChampDetailData(query.champ_1_id, function(err, res){
                var s = res.stats;
                ret.champ_1 = s;
                var ad = s.attackdamage + (s.attackdamageperlevel * lvoffset) + add_ad;
                var ar = s.armor + (s.armorperlevel * lvoffset);
                var mr = s.spellblock + (s.spellblockperlevel * lvoffset);
                var hp = s.hp + (s.hpperlevel * lvoffset);
                var mp = s.mp + (s.mpperlevel * lvoffset);
                var cr = s.crit + (s.critperlevel * lvoffset);
                var as = (1 + s.attackspeedoffset) + ((1 + s.attackspeedoffset) * (s.attackspeedperlevel * lvoffset) / 100);
                var data = {
                    attackdamage : Math.floor(ad * 1000) / 1000,
                    armor        : Math.floor(ar * 1000) / 1000,
                    spellblock   : Math.floor(mr * 1000) / 1000,
                    hp           : Math.floor(hp * 1000) / 1000,
                    mp           : Math.floor(mp * 1000) / 1000,
                    crit         : Math.floor(cr * 1000) / 1000,
                    attackspeed  : Math.floor(as * 1000) / 1000,
                };
                ret.champ_1_detail = data;
                next(null);
            });
        }
    });
    task.push(function(next){
        if(query.champ_2_id == null){
            next(10);
            return;
        }
        else{
            var lvoffset = query.champ_2_lv - 1;
            var add_ad = parseInt(query.champ_2_add_ad);
            searchChampDetailData(query.champ_2_id, function(err, res){
                var s = res.stats;
                ret.champ_2 = s;
                var ad = s.attackdamage + (s.attackdamageperlevel * lvoffset) + add_ad;
                var ar = s.armor + (s.armorperlevel * lvoffset);
                var mr = s.spellblock + (s.spellblockperlevel * lvoffset);
                var hp = s.hp + (s.hpperlevel * lvoffset);
                var mp = s.mp + (s.mpperlevel * lvoffset);
                var cr = s.crit + (s.critperlevel * lvoffset);
                var as = (1 + s.attackspeedoffset) + ((1 + s.attackspeedoffset) * (s.attackspeedperlevel * lvoffset) / 100);
                var data = {
                    attackdamage : Math.floor(ad * 1000) / 1000,
                    armor        : Math.floor(ar * 1000) / 1000,
                    spellblock   : Math.floor(mr * 1000) / 1000,
                    hp           : Math.floor(hp * 1000) / 1000,
                    mp           : Math.floor(mp * 1000) / 1000,
                    crit         : Math.floor(cr * 1000) / 1000,
                    attackspeed  : Math.floor(as * 1000) / 1000,
                };
                ret.champ_2_detail = data;
                next(null);
            });
        }
    });
    // ダメージ量の計算
    task.push(function(next){
        if(query.champ_1_id == null || query.champ_2_id == null){
            next(10);
            return;
        }
        // champ_1 -> champ_2へ攻撃
        {
            var atk = ret.champ_1_detail;
            var def = ret.champ_2_detail;
            var corr_ar = def.armor * (1) * (1) - 0
            var ad_damage = atk.attackdamage * (100 / (100 + corr_ar));
            ret.champ_1_damage = {
                ad_damage : ad_damage,
            }
        }
        // champ_2 -> champ_1へ攻撃
        {
            var atk = ret.champ_2_detail;
            var def = ret.champ_1_detail;
            var corr_ar = def.armor * (1) * (1) - 0
            var ad_damage = atk.attackdamage * (100 / (100 + corr_ar));
            ret.champ_2_damage = {
                ad_damage : ad_damage,
            }
        }
        next(null);
    });
    async.waterfall(task, function(error){
        if(error){
            if(error == 10){
                ret = null;
                error = null;
            }
        }
        callback(error, ret);
    });
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
var searchChampDataMain = function(id, callback){
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
var searchChampDetailData = function(id, callback){
    var params = {
        
        get : {
            locale : 'ja_JP',
            champData : 'stats',
            api_key : API_KEY,
        },
    };
    if(id != null){
        params['param'] = id;
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
var searchChampData = function (id, callback){
    var CACHE_NAME = 'CHAMP_DATA';
    var CACHE_KEY = CACHE_NAME + id;
    var ret = null;
    var task = [];
    // キャッシュから取得
    task.push(function(next){
        cache_data.get(CACHE_KEY, function(err, res){
            if(err){
                next(null);
                return;
            }
            ret = res;
            next(100);
        });
    });
    // apiを使って取得
    task.push(function(next){
        searchChampDataMain(id, function(err, res){
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
        cache_data.set(CACHE_KEY, ret, function(err){
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


module.exports = router;
