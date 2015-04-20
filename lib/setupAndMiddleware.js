var redisAdapter = require('./redisConnector'),
    express = require('express'),
    wsfedsaml2 = require('passport-azure-ad').WsfedStrategy,
    passport = require('passport');

module.exports = function(app, options){
    options = options || {};
    options.errorPages = options.errorPages || {};
    options.errorPages['not-connected'] = options.errorPages['not-connected'] || 'errors/not-connected';
    options.errorPages['404'] = options.errorPages['404'] || 'errors/404'

    if (!options.redis){
        throw new Error('No redis configuration options passed to matador');
    }
    //Connect to redis
    redisAdapter.connect(options.redis);
    var redisConnectionEnforcer = require('./enforceConnection')(options);

    //Enforce that redis is connected to, will make render an error page if not connected
    app.use(redisConnectionEnforcer);

    //Publicly accessible routes
    app.use('/css/', express.static(__dirname + '/../public/css'));
    app.use('/fonts/', express.static(__dirname + '/../public/fonts'));
    app.use('/img/', express.static(__dirname + '/../public/img'));
    app.use('/js/', express.static(__dirname + '/../public/js'));

    //Setup routes
    require('../controllers/index')(app);
    require('../controllers/active')(app);
    require('../controllers/complete')(app);
    require('../controllers/failed')(app);
    require('../controllers/jobs')(app);
    require('../controllers/pending')(app);
    require('../controllers/queues')(app);

    var users = [];

    var config = {
      realm: 'http://188.166.19.120/',
      identityProviderUrl: 'https://login.microsoftonline.com/16da1a3b-f04d-42d4-8895-be15f1fc57c1/wsfed',
      identityMetadata: 'https://login.microsoftonline.com/16da1a3b-f04d-42d4-8895-be15f1fc57c1/federationmetadata/2007-06/federationmetadata.xml',
      logoutUrl:'http://188.166.19.120/login/callback'
    }

    var wsfedStrategy = new wsfedsaml2(config, function(profile, done) {
      profile.email = profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];

      if (!profile.email) {
          done(new Error("No email found"));
          return;
      }

      process.nextTick(function () {
        findByEmail(profile.email, function(err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            // "Auto-registration"
            users.push(profile);
            return done(null, profile);
          }
          return done(null, user);
        });
      });
    });

    var findByEmail = function (email, fn) {
      for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.email === email) {
          return fn(null, user);
        }
      }
      return fn(null, null);
    };

    passport.use(wsfedStrategy);

    // send the user to WAAD to authenticate
    app.get('/login', passport.authenticate('wsfed-saml2', { failureRedirect: '/', failureFlash: true }), function(req, res) {
        console.log("redirect")
        res.redirect('/');
    });

    // callback from WAAD with a token
    app.post('/login/callback', passport.authenticate('wsfed-saml2', { failureRedirect: '/login/callback', failureFlash: true }), function(req, res) {
        res.redirect('/');
    });

    app.get('/logout', function(req, res){

      // clear the passport session cookies
      req.logout();

      // We need to redirect the user to the WSFED logout endpoint so the
      // auth token will be revoked
      wsfedStrategy.logout({}, function(err, url) {
        if(err) {
          res.redirect('/');
        } else {
          res.redirect(url);
        }
      });
    });

    passport.serializeUser(function(user, done) {
      done(null, user.email);
    });

    passport.deserializeUser(function(id, done) {
      findByEmail(id, function (err, user) {
        done(err, user);
      });
    });

    //404
    app.get('*', function(req, res){
        res.render(options.errorPages["404"]);
    });
};
