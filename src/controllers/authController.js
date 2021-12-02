const UserModel = require('./Models/user');
const jwt = require('jsonwebtoken');
const debug = require('debug')('app:authController');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const {_} = require('lodash');

const JWT_SECRET = process.env.JWT_SECRET;

const authController = () => {
  const sendResponse = (res, data, code=200) => {
    res.status(code).json(data);
  };

  const createTokenAndSendResponse = async (req, res, user, msg) => {
    // debug(user);
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
            msg: msg,
          });
        });
  };
  const signIn = async (req, res) => {
    // debug(req.body);

    const user = await UserModel.findOne({email: req.body.email});
    if (user == null) {
      return sendResponse(res, {success: false, msg: 'No such user'});
    }
    if (await user.validatePassword(req.body.password)) {
      createTokenAndSendResponse(req, res, user, 'Signed in');
    } else {
      sendResponse(res, {
        msg: 'Incorrect password',
        success: false,
      });
    }
  };
  const signUp = async (req, res) => {
    // debug(req.body);
    const user = new UserModel({
      ...req.body,
    });

    user
        .save()
        .then((result) => {
          createTokenAndSendResponse(req, res, user, 'Signed up');
        })
        .catch((err) => {
          debug(err);
          sendResponse(res, {success: false, msg: 'Sign up failed'});
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
      sendResponse(res, {success: true, msg: 'Details updated'});
    }).catch((err) => {
      sendResponse(res, {success: false, msg: 'Failed to update details'});
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
    sendResponse(res, {
      msg: 'Sellers',
      success: true,
      data: sellers,
    });
  };

  const buy = async (req, res) => {
    // debug(req.body);
    const user = await UserModel.findOne({email: req.user.email});
    if (user.isSeller) {
      sendResponse(res, {success: false, msg: 'Only buyers are allowed to buy items'});
      return;
    }
    const seller = await UserModel.findOne({email: req.body.sellerId});
    const date = new Date();
    let price;
    for (const book of seller.seller.books) {
      if (book.bookId === req.body.bookId) {
        book.quantity -= req.body.quantity;
        price = book.price;
        break;
      }
    }
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: req.body.bookTitle,
            },
            unit_amount: price * 100,
          },
          quantity: req.body.quantity,
        },
      ],
      success_url: req.get('origin') + `/book/${req.body.bookId}`,
      cancel_url: req.get('origin') + `/book/${req.body.bookId}`,
    });
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

    user.buyer.bought.push({
      ..._.pick(req.body, ['sellerId', 'quantity', 'bookId']),
      date: date,
    });

    seller.seller.sold.push({
      ..._.pick(req.body, ['quantity', 'bookId']),
      price: price,
      date: date,
      buyerId: user.email,
    });

    Promise.all([seller.save(), user.save()]).then((response) => {
      sendResponse(res, {
        success: true,
        msg: 'Item bought successfully',
        url: session.url,
        secret: paymentIntent.client_secret,
      });
    }).catch((err) => {
      debug(err);
      sendResponse(res, {success: false, msg: 'Failed to buy item'});
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
