'use strict';


var redisModel = require('../models/redis'),
    q = require('q'),
    ensureAuthenticated = require('../lib/ensureAuthenticated.js');


module.exports = function (app) {
    var requestActive = function(req, res){
        var dfd = q.defer();
        redisModel.getStatus("active").done(function(active){
            redisModel.getJobsInList(active).done(function(keys){
                redisModel.formatKeys(keys).done(function(formattedKeys){
                    redisModel.getProgressForKeys(formattedKeys).done(function(keyList){
                        redisModel.getStatusCounts().done(function(countObject){
                            var model = { keys: keyList, counts: countObject, active: true, type: "Active" };
                            dfd.resolve(model);
                        });
                    });
                });
            });
        });
        return dfd.promise;
    }

    app.get('/active', ensureAuthenticated, function (req, res) {
        requestActive(req, res).done(function(model){
            model.user = req.user;
            res.render('jobList', model);
        });
    });

    app.get('/api/active', ensureAuthenticated, function (req, res) {
        requestActive(req, res).done(function(model){
            model.user = req.user;
            res.json(model);
        });
    });
};
