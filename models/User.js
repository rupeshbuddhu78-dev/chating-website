const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, select: false },
    googleId: { type: String, index: true, sparse: true },
    profileImage: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    country: { type: String, default: '' },
    language: { type: String, default: '' },
    bio: { type: String, maxlength: 300, default: '' },

    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String, select: false },
    verifyExpiry: { type: Date, select: false },

    isPremium: { type: Boolean, default: false },
    premiumPlan: { type: String, default: '' },
    premiumExpiry: { type: Date, default: null },

    banned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },

    reportsCount: { type: Number, default: 0 },
    lastLogin: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.activePremium = function () {
  return this.isPremium && this.premiumExpiry && this.premiumExpiry > new Date();
};

module.exports = mongoose.model('User', userSchema);
