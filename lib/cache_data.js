'use strict';

var g_object = {};

exports.set = function(key, value, callback){
    if(g_object[key] == null){
        g_object[key] = value;
    }
    callback(null);
};
exports.get = function(key, callback){
    if(g_object[key] == null){
        callback(1, null);
        return;
    }
    callback(null, g_object[key]);
};
exports.trace = function(){
    for(var key in g_object){
        var val = g_object[key];
        console.log('key=%s, value=%s', key, val);
    }
};
