import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

try {
  mongoose.connect(process.env.DATABASE_URL || "");
} catch (err) {
  console.log(err);
}

// 1. Cleaned up UserSchema (Removed OTP fields entirely)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Added unique: true here so emails don't duplicate
  password: { type: String, required: true },
});

// 2. Cleaned up otpSchema (Removed unnecessary sparse)
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: {
    type: String,
    required: true,
    enum: ["SIGNUP", "SIGNIN", "FORGOT_PASSWORD", "CHANGE_PASSWORD"],
  },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-deletes after 10 mins
});

// 3. TransactionSchema
const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ["Income", "Expense"], required: true },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  description: { type: String, required: false },
  date: { type: Date, default: Date.now },
  userId: { type: Types.ObjectId, ref: "User", required: true },
});

// 4. TagSchema — user-created dynamic tags
const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});
tagSchema.index({ userId: 1, name: 1 }, { unique: true });

export const OtpModel = mongoose.model("OTP", otpSchema);
export const userModel = mongoose.model("User", UserSchema);
export const transactionModel = mongoose.model(
  "Transaction",
  transactionSchema,
);
export const tagModel = mongoose.model("Tag", tagSchema);
