var express = require('express');
var router = express.Router();

var async = require('async');

var CacheData = require(__dirname + '/../lib/cache_data');
var RequestMan = require(__dirname + '/../lib/request_manager');

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
        data.select_list = [];
        n(null);
    });
//    task.push(function(n){
//        searchChampData(null, function(err, res){
//            if(err){
//                n(err);
//                return;
//            }
//            var select_list = [];
//            for(var key in res.data){
//                var val = res.data[key];
//                var d = {
//                    name : key,
//                    id : val.id,
//                    name_jp : val.name,
//                };
//                select_list.push(d);
//            }
//            select_list.sort(function(v1, v2){
//                return v1.id - v2.id;
//            });
//            data.select_list = select_list;
//            n(null);
//        });
//    });
//    task.push(function(n){
//        searchChampDetail(req.query, function(err, res){
//            if(res == null){
//                n(null);
//                return;
//            }
//            data.champ_stats = res;
//            n(null);
//        });
//    });
    task.push(function(n){
        RequestMan.searchChampDataAll(202, function(err, res){
            getSpellDescription(res.spells[0]);
            n(null);
        });
    });
    async.waterfall(task, function(error){
        res.render('index', { title: 'LoL Damage Calculation', data : data });
    });
});
var getSpellDescription = function(spell){
    console.log('spell : ', spell);
};

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
                var as = (0.625 + s.attackspeedoffset) + ((0.625 + s.attackspeedoffset) * (s.attackspeedperlevel * lvoffset) / 100);
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
                var as = (0.625 + s.attackspeedoffset) + ((0.625 + s.attackspeedoffset) * (s.attackspeedperlevel * lvoffset) / 100);
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

var searchChampDetailData = function(id, callback){
    var CACHE_NAME = 'CHAMP_DETAIL_DATA';
    var CACHE_KEY = CACHE_NAME + id;
    var ret = null;
    var task = [];
    // キャッシュから取得
    task.push(function(next){
        CacheData.get(CACHE_KEY, function(err, res){
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
        RequestMan.searchChampDataStats(id, function(err, res){
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
        CacheData.set(CACHE_KEY, ret, function(err){
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
var searchChampData = function (id, callback){
    var CACHE_NAME = 'CHAMP_DATA';
    var CACHE_KEY = CACHE_NAME + id;
    var ret = null;
    var task = [];
    // キャッシュから取得
    task.push(function(next){
        CacheData.get(CACHE_KEY, function(err, res){
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
        RequestMan.searchChampDataInfo(id, function(err, res){
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
        CacheData.set(CACHE_KEY, ret, function(err){
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
