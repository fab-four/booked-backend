const express = require('express');
// const debug = require('debug')('app:authRoutes');
const passport = require('passport');

const {signIn, signUp, getProfile} = require('../controllers/authController')();

const authRouter = express.Router();

const router = () => {
  authRouter.route('/signIn').post(signIn);
  authRouter.route('/signUp').post(signUp);
  authRouter.route('/getProfile').post(passport.authenticate('jwt', {session: false}), getProfile);
  // authRouter.route('/getUsers').post(getUsers);

  return authRouter;
};

module.exports = router;
