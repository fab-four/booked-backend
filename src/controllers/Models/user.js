const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const {Schema} = mongoose;
const SALT_WORK_FACTOR = 10;
mongoose.connect(`${process.env.DB_URL}/${process.env.DB_NAME}`);

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, 'Invalid Email'],
  },
  password: {
    type: String,
    required: true,
  },
  isSeller: Boolean,
  personalDetails: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    sex: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    address: {
      streetAddress: {
        type: String,
        default: '',
      },
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    mobile: {
      type: String,
      validate: [validator.isMobilePhone, 'Invalid Mobile Number'],
    },
  },

  seller: {
    books: [
      {
        bookId: String,
        price: Number,
        quantity: Number,
      },
    ],
    sold: [{
      bookId: String,
      price: Number,
      quantity: Number,
      date: Date,
      buyerId: String,
    },
    ],
  },

  buyer: {
    favourites: [
      {
        type: String,
      },
    ],
    toRead: [
      {
        type: String,
      },
    ],
    read: [
      {
        type: String,
      },
    ],
    bought: [
      {
        bookId: String,
        sellerId: String,
        quantity: Number,
        date: Date,
      },
    ],
  },
});

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.validatePassword = async function validatePassword(data) {
  return bcrypt.compare(data, this.password);
};

module.exports = mongoose.model('User', userSchema);
