'use strict';


var redisModel = require('../models/redis'),
    q = require('q'),
    ensureAuthenticated = require('../lib/ensureAuthenticated.js');


module.exports = function (app) {
    var getFailedData = function(req, res){
        var dfd = q.defer();
        redisModel.getStatus("failed").done(function(failed){
            redisModel.getJobsInList(failed).done(function(keys){
                redisModel.formatKeys(keys).done(function(keyList){
                    redisModel.getStatusCounts().done(function(countObject){
                        var model = { keys: keyList, counts: countObject, failed: true, type: "Failed"};
                        dfd.resolve(model);
                    });
                });
            });
        });
        return dfd.promise;
    }

    app.get('/failed', ensureAuthenticated, function (req, res) {
        getFailedData(req, res).done(function(model){
            model.user = req.user;
            res.render('jobList', model);
        });
    });

    app.get('/api/failed', ensureAuthenticated, function (req, res) {
        getFailedData(req, res).done(function(model){
            model.user = req.user;
            res.json(model);
        });
    });
};
