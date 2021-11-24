const UserModel = require('./Models/user');
const jwt = require('jsonwebtoken');
const debug = require('debug')('app:authController');

const JWT_SECRET = process.env.JWT_SECRET;

const authController = () => {
  const sendResponse = (res, data, code=200) => {
    res.status(code).json(data);
  };

  const createTokenAndSendResponse = async (req, res, user) => {
    debug(user);
    const payload = {
      email: user.email,
    };
    user['password'] = '';
    jwt.sign(payload, JWT_SECRET, {expiresIn: 604800},
        (err, token) => {
          sendResponse(res, {
            success: true,
            token: `Bearer ${token}`,
            user,
            msg: 'You are logged in',
          });
        });
  };
  const signIn = async (req, res) => {
    debug(req.body);

    const user = await UserModel.findOne({email: req.body.email});
    if (user == null) {
      return sendResponse(res, {success: false, msg: 'No such user'});
    }
    if (await user.validatePassword(req.body.password)) {
      createTokenAndSendResponse(req, res, user);
    } else {
      sendResponse(res, {
        msg: 'Incorrect password',
        success: false,
      });
    }
  };
  const signUp = async (req, res) => {
    debug(req.body);
    const user = new UserModel({
      ...req.body,
    });

    user
        .save()
        .then((result) => {
          createTokenAndSendResponse(req, res, user);
        })
        .catch((err) => {
          debug(err);
          sendResponse(res, {success: false, msg: 'User creation failed'});
        });
  };

  const getProfile = async (req, res) => {
    const user = await UserModel.findOne({email: req.user.email});
    user['password'] = '';
    sendResponse(res, {
      msg: 'Profile',
      success: true,
      user,
    });
  };

  const updateDetails = async (req, res) => {
    const user = await UserModel.findOne({email: req.user.email});
    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key];
    });
    user.save().then((response) => {
      sendResponse(res, {success: true, msg: 'Data saved'});
    }).catch((err) => {
      sendResponse(res, {success: false, msg: 'Data not saved'});
    });
  };
  // const getUsers = async (req, res) => {
  //   // debug(req.body);
  //   if (!req.body.email) {
  //     sendResponse(res, {success: false, msg: 'Email is required to get users\' data'});
  //     return;
  //   }
  //   const user = await UserModel.findOne({email: req.body.email});
  //   if (!user.isHoD && !user.isAdmin) {
  //     sendResponse(res, {success: false, msg: 'Only admins and HoDs are allowed to access data'});
  //     return;
  //   }
  //   delete req.body.email;
  //   UserModel.find(req.body)
  //       .then((response) => {
  //         sendResponse(res, {
  //           msg: 'Users',
  //           success: true,
  //           users: response,
  //         });
  //       })
  //       .catch((err) => {
  //         sendResponse(res, {success: false, msg: 'Failed to get data'});
  //       });
  // };
  return {
    signIn,
    signUp,
    getProfile,
    updateDetails,
    // getUsers,
  };
};

module.exports = authController;
