'use strict';


var redisModel = require('../models/redis'),
    ensureAuthenticated = require('../lib/ensureAuthenticated.js');

module.exports = function (app) {
    app.get('/api/jobs/pending/status/:type', ensureAuthenticated, function (req, res) {
        var type = req.param("type");
        redisModel.makePendingByType(type).done(function(results){
            res.json(results);
        });
    });

    app.get('/api/jobs/pending/id/:type/:id', ensureAuthenticated, function (req, res) {
        var id = req.param("id"),
            type = req.param("type");
        redisModel.makePendingById(type, id).done(function(results){
            results.user = req.user;
            res.json(results);
        });
    });

    app.get('/api/jobs/delete/status/:type', ensureAuthenticated, function (req, res) {
        var type = req.param("type");
        redisModel.deleteJobByStatus(type).done(function(results){
            results.user = req.user;
            res.json(results);
        });
    });

    app.get('/api/jobs/delete/id/:type/:id', ensureAuthenticated, function (req, res) {
        var id = req.param("id"),
            type = req.param("type");
        redisModel.deleteJobById(type, id).done(function(results){
            results.user = req.user;
            res.json(results);
        });
    });

    app.get('/api/jobs/info/:type/:id', ensureAuthenticated, function(req, res){
        var id = req.param("id"),
            type = req.param("type");
        redisModel.getDataById(type, id).done(function(results){
            results.user = req.user;
            res.json(results);
        });
    });
};
