const express = require('express');
// const debug = require('debug')('app:authRoutes');
const passport = require('passport');

const {signIn, signUp, getProfile, updateDetails, getSellers, buy} = require('../controllers/authController')();

const authRouter = express.Router();

const router = () => {
  authRouter.route('/signIn').post(signIn);
  authRouter.route('/signUp').post(signUp);
  authRouter.route('/getProfile').post(passport.authenticate('jwt', {session: false}), getProfile);
  // authRouter.route('/getUsers').post(getUsers);
  authRouter.route('/updateDetails').post(passport.authenticate('jwt', {session: false}), updateDetails);
  authRouter.route('/getSellers').post(passport.authenticate('jwt', {session: false}), getSellers);
  authRouter.route('/buy').post(passport.authenticate('jwt', {session: false}), buy);
  return authRouter;
};

module.exports = router;
