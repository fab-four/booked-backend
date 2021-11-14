// const debug = require('debug')('app:strategy');
const passport = require('passport');
require('./strategies/jwt.strategy')();

module.exports = function passportConfig(app) {
  app.use(passport.initialize());
};
