const passport = require('passport');
const {Strategy, ExtractJwt} = require('passport-jwt');
// const debug = require('debug')('app:jwt.strategy');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

module.exports = function JwtStrategy() {
  passport.use(
      new Strategy(options, (jwtPayload, done) => {
        return done(null, jwtPayload);
      }),
  );
};
