var express = require('express'),
  cons = require('consolidate'),
  dust = require('dustjs-linkedin'),
  passport = require('passport'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  app = express();

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser());
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set("views", __dirname + "/../public/templates/");

module.exports = app;
