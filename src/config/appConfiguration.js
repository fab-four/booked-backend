const express = require('express');
// const debug = require('debug')('app:appConfiguration');
const passportFunction = require('./passport.js');

const appConfiguration = (app) => {
  passportFunction(app);
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  // app.use('/uploads', express.static('uploads'));
};

module.exports = appConfiguration;
