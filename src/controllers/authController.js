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
    delete user.password;
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
    delete user.password;
    sendResponse(res, {
      msg: 'Profile',
      success: true,
      user,
    });
  };

  const updateDetails = async (req, res) => {
    const user = await UserModel.findOne({email: req.user.email});
    Object.keys(req.body).forEach((key) => {
      if (key !== '__v') {
        user[key] = req.body[key];
      }
    });
    user.save().then((response) => {
      sendResponse(res, {success: true, msg: 'Data saved'});
    }).catch((err) => {
      sendResponse(res, {success: false, msg: 'Data not saved'});
    });
  };

  const getSellers = async (req, res) => {
    const user = await UserModel.findOne({email: req.user.email});
    if (user.isSeller) {
      sendResponse(res, {success: false, msg: 'Only buyers are allowed to access this data'});
      return;
    }
    let users = await UserModel.find({isSeller: true});
    users = users.filter((user) => user.seller.books.some(
        (book) => (book.bookId === req.body.id) && (book.quantity)),
    );
    const sellers = users.map((user) => {
      return {
        name: user.personalDetails.firstName + ' ' + user.personalDetails.lastName,
        email: user.email,
        price: user.seller.books.filter((book) => (book.bookId === req.body.id))[0].price,
        quantity: user.seller.books.filter((book) => (book.bookId === req.body.id))[0].quantity,
      };
    });
    debug(sellers);
    sendResponse(res, {
      msg: 'Sellers',
      success: true,
      data: sellers,
    });
  };

  const buy = async (req, res) => {
    debug(req.body);
    const user = await UserModel.findOne({email: req.user.email});
    if (user.isSeller) {
      sendResponse(res, {success: false, msg: 'Only buyers are allowed to buy items'});
      return;
    }
    const seller = await UserModel.findOne({email: req.body.sellerId});
    // eslint-disable-next-line guard-for-in
    for (const book of seller.seller.books) {
      if (book.bookId === req.body.bookId) {
        book.quantity -= req.body.quantity;
        break;
      }
    }
    user.buyer.bought.push({
      ...req.body,
      date: new Date(),
    });

    Promise.all([seller.save(), user.save()]).then((response) => {
      sendResponse(res, {success: true, msg: 'Data saved'});
    }).catch((err) => {
      debug(err);
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
    getSellers,
    buy,
  };
};

module.exports = authController;
