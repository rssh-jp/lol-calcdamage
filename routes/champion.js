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
        console.log('req : ', req.query);
        data.champ_1_id = req.query.champ_1_id != null ? req.query.champ_1_id : 0;
        data.select_list = [];
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
            if(err){
                n(err);
                return;
            }
            if(res == null){
                n(null);
                return;
            }
            data.champ = {skill : res.skill};
            n(null);
        });
    });
    async.waterfall(task, function(error){
        console.log('data : ', data.champ);
        res.render('champion', { title: 'LoL Damage Calculation', data : data });
    });
});
var replaceSpellVars = function(tooltip, key, spell){
    var is_exist = false;
    var index = 0;
    if(spell.vars == null){
        return tooltip;
    }
    for(var i=0; i<spell.vars.length; i++){
        var val = spell.vars[i];
        if(val.key == key){
            is_exist = true;
            index = i;
            break;
        }
    }
    if(!is_exist){
        return tooltip;
    }
    tooltip = tooltip.replace('{{ ' + key + ' }}', spell.vars[index].coeff);
    return tooltip;
};
var getSpellDescription = function(spell){
    console.log('spell : ', util.inspect(spell, true, null));
    var sanitized_description = spell.sanitizedDescription;
    var sanitized_tooltip = spell.sanitizedTooltip;
    for(var i=0; i<10; i++){
        var num = i + 1;
        var a = 'a' + num;
        var f = 'f' + num;
        var e = 'e' + num;
        sanitized_description = replaceSpellVars(sanitized_description, a, spell);
        sanitized_description = replaceSpellVars(sanitized_description, f, spell);
        sanitized_description = sanitized_description.replace("{{ " + e + " }}", spell.effectBurn[num]);
        sanitized_tooltip = replaceSpellVars(sanitized_tooltip, a, spell);
        sanitized_tooltip = replaceSpellVars(sanitized_tooltip, f, spell);
        sanitized_tooltip = sanitized_tooltip.replace("{{ " + e + " }}", spell.effectBurn[num]);
    }
//    sanitized_description = replaceSpellVars(sanitized_description, 'a1', spell);
//    sanitized_description = replaceSpellVars(sanitized_description, 'a2', spell);
//    sanitized_description = replaceSpellVars(sanitized_description, 'a3', spell);
//    sanitized_description = replaceSpellVars(sanitized_description, 'a4', spell);
//    sanitized_description = replaceSpellVars(sanitized_description, 'a5', spell);
//    sanitized_description = sanitized_description.replace("{{ e1 }}", spell.effectBurn[1]);
//    sanitized_description = sanitized_description.replace("{{ e2 }}", spell.effectBurn[2]);
//    sanitized_description = sanitized_description.replace("{{ e3 }}", spell.effectBurn[3]);
//    sanitized_description = sanitized_description.replace("{{ e4 }}", spell.effectBurn[4]);
//    sanitized_description = sanitized_description.replace("{{ e5 }}", spell.effectBurn[5]);
//    sanitized_tooltip = replaceSpellVars(sanitized_tooltip, 'a1', spell);
//    sanitized_tooltip = replaceSpellVars(sanitized_tooltip, 'a2', spell);
//    sanitized_tooltip = replaceSpellVars(sanitized_tooltip, 'a3', spell);
//    sanitized_tooltip = replaceSpellVars(sanitized_tooltip, 'a4', spell);
//    sanitized_tooltip = replaceSpellVars(sanitized_tooltip, 'a5', spell);
//    sanitized_tooltip = sanitized_tooltip.replace("{{ e1 }}", spell.effectBurn[1]);
//    sanitized_tooltip = sanitized_tooltip.replace("{{ e2 }}", spell.effectBurn[2]);
//    sanitized_tooltip = sanitized_tooltip.replace("{{ e3 }}", spell.effectBurn[3]);
//    sanitized_tooltip = sanitized_tooltip.replace("{{ e4 }}", spell.effectBurn[4]);
//    sanitized_tooltip = sanitized_tooltip.replace("{{ e5 }}", spell.effectBurn[5]);
    var str = '';
    str += sanitized_description;
    str += sanitized_tooltip;
    return str;
};

var searchChampDetail = function(query, callback){
    var ret = {};
    var task = [];
    task.push(function(next){
        if(query.champ_1_id == null){
            next(100);
            return;
        }
        next(null);
    });
    task.push(function(next){
        RequestMan.searchChampDataSpells(query.champ_1_id, function(err, res){
            ret.skill = {
                q : getSpellDescription(res.spells[0]),
                w : getSpellDescription(res.spells[1]),
                e : getSpellDescription(res.spells[2]),
                r : getSpellDescription(res.spells[3]),
            };
            next(null);
        });
    });
    task.push(function(next){
        next(null);
    });
    async.waterfall(task, function(error){
        if(error){
            if(error == 100){
                error = null;
                ret = null;
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
