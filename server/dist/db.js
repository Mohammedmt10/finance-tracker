import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
dotenv.config();
mongoose.connect(process.env.DATABASE_URL || "");
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String, required: false, unique: true },
    otpExpiry: { type: Date, required: false },
});
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
const transactionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    type: { type: String, enum: ["Income", "Expense"], required: true },
    description: { type: String, required: false },
    date: { type: Date, default: Date.now },
    userId: { type: Types.ObjectId, ref: "User", required: true },
});
export const OtpModel = mongoose.model("OTP", otpSchema);
export const userModel = mongoose.model("User", UserSchema);
export const transactionModel = mongoose.model("Transaction", transactionSchema);
