// const debug = require('debug')('app:appRoutes');
// const passport = require('passport');
const authRouter = require('../routes/authRoutes')();
// const adminRouter = require('../routes/adminRoutes')();
// const professorRouter = require('../routes/professorRoutes')();
// const hodRouter = require('../routes/hodRoutes')();

const appRoutes = (app) => {
  app.use('/auth', authRouter);
  // app.use(
  //     '/admin',
  //     adminRouter,
  // );
  // app.use('/professor',
  //     passport.authenticate('jwt', {session: false}),
  //     professorRouter);
  // app.use('/hoD',
  //     passport.authenticate('jwt', {session: false}),
  //     (req, res, next) => {
  //       if (req.user.isHoD) {
  //         next();
  //       } else {
  //         return res.status(200).json({success: false, msg: 'You are not authorized.'});
  //       };
  //     }, hodRouter);
};

module.exports = appRoutes;
