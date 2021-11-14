require('dotenv').config();
const express = require('express');
const debug = require('debug')('app');
const appConfiguration = require('./src/config/appConfiguration');
const appRoutes = require('./src/config/appRoutes');
const cors = require('cors');
const app = express();
app.use(cors());
const APP_PORT = process.env.APP_PORT;
app.listen(APP_PORT, () => {
  debug(`Listening at port ${APP_PORT}`);
});

appConfiguration(app);
appRoutes(app);
