var redisAdapter = require('redis'),
    updateInfo = require('./updateInfo');

exports.connect = function(settings){
    redis = redisAdapter.createClient(settings.port, settings.host, settings.options);
    if(settings.password){
        redis.auth(settings.password);
    }
    redis.on("error", console.log);
    updateInfo.startUpdatingInfo();
};