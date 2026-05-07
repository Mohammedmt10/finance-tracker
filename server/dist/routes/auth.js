var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import { z } from "zod";
import { userModel, OtpModel } from "../db.js";
import emailjs from "@emailjs/nodejs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = express.Router();
emailjs.init({
    publicKey: process.env.EMAIL_USER_ID,
    privateKey: process.env.EMAIL_PRIVATE_KEY,
});
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = z.object({
        email: z.string().min(3).max(30),
        password: z
            .string()
            .min(3)
            .max(30)
            .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/),
        actionToken: z.string().min(3),
    });
    const safeparsed = body.safeParse(req.body);
    if (!safeparsed.success) {
        return res.status(411).json({ message: "Invalid input" });
    }
    const data = safeparsed.data;
    try {
        const exist = yield userModel.findOne({
            email: data.email,
        });
        if (exist) {
            return res.status(411).json({ message: "email already exists" });
        }
        const hashedPassword = yield bcrypt.hash(data.password, 10);
        const user = yield userModel.create({
            email: data.email,
            password: hashedPassword,
        });
        res.status(200).json({ message: "User created successfully", user });
    }
    catch (error) {
        return res.status(411).json({ message: "Something went wrong", error });
    }
}));
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = z.object({
        email: z.string().min(3).max(30),
        password: z
            .string()
            .min(3)
            .max(30)
            .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/),
    });
    const safeparsed = body.safeParse(req.body);
    if (!safeparsed.success) {
        return res.status(411).json({ message: "Invalid input" });
    }
    const data = safeparsed.data;
    try {
        const user = yield userModel.findOne({
            email: data.email,
        });
        if (!user) {
            return res.status(411).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = yield bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            return res.status(411).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "", {
            expiresIn: "1d",
        });
        res.status(200).json({ message: "User signed in successfully", token });
    }
    catch (error) {
        return res.status(411).json({ message: "Something went wrong", error });
    }
}));
router.post("/send-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = z.object({
        email: z.string().email(),
        purpose: z.enum(["SIGNUP", "SIGNIN", "FORGOT_PASSWORD", "CHANGE_PASSWORD"]),
    });
    const safeparsed = body.safeParse(req.body);
    if (!safeparsed.success) {
        return res.status(400).json({ message: "Invalid input" });
    }
    const { email, purpose } = safeparsed.data;
    try {
        const existingUser = yield userModel.findOne({ email });
        // --- LOGIC GATES ---
        if (purpose === "SIGNUP" && existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        // For Signin, Forgot, or Change password, the user MUST exist
        if (["SIGNIN", "FORGOT_PASSWORD", "CHANGE_PASSWORD"].includes(purpose) &&
            !existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // Upsert the OTP (Overwrites if one already exists for this email+purpose)
        yield OtpModel.findOneAndUpdate({ email, purpose }, { otp }, { upsert: true, returnDocument: "after" });
        // Send Email via EmailJS
        const emailParams = {
            email: email,
            passcode: otp,
        };
        const result = yield emailjs.send(process.env.EMAIL_SERVICE_ID || "", process.env.EMAIL_TEMPLATE_ID || "", emailParams, {
            publicKey: process.env.EMAIL_USER_ID || "",
            privateKey: process.env.EMAIL_PRIVATE_KEY || "",
        });
        console.log("Email sent successfully:", result.status, result.text);
        res.status(200).json({ message: "OTP sent successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error });
    }
}));
router.post("/verify-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = z.object({
        email: z.string().email(),
        otp: z.string().length(4),
        purpose: z.enum(["SIGNUP", "SIGNIN", "FORGOT_PASSWORD", "CHANGE_PASSWORD"]),
    });
    const safeparsed = body.safeParse(req.body);
    if (!safeparsed.success)
        return res.status(400).json({ message: "Invalid input" });
    const { email, otp, purpose } = safeparsed.data;
    try {
        const otpDoc = yield OtpModel.findOne({ email, purpose });
        if (!otpDoc || otpDoc.otp !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        // Delete OTP after successful verification
        yield OtpModel.deleteOne({ _id: otpDoc._id });
        // --- OUTCOME 1: Direct Signin ---
        if (purpose === "SIGNIN") {
            const user = yield userModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "", {
                expiresIn: "7d",
            });
            return res.status(200).json({
                message: "Signed in successfully",
                token: authToken,
            });
        }
        // --- OUTCOME 2: Issue Action Token for Signup/Password Changes ---
        // This token proves to your other routes that the email was verified
        const actionToken = jwt.sign({ email, purpose, isVerified: true }, process.env.JWT_SECRET || "", { expiresIn: "15m" });
        res.status(200).json({
            message: "OTP verified successfully",
            actionToken,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}));
router.post("/reset-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = z.object({
        email: z.string().email(),
        newPassword: z
            .string()
            .min(3)
            .max(30)
            .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/, "Password must be strong (Uppercase, Lowercase, Number, Special Char)"),
        actionToken: z.string(), // This is the token received from /verify-otp
    });
    const safeparsed = body.safeParse(req.body);
    if (!safeparsed.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: safeparsed.error,
        });
    }
    const { email, newPassword, actionToken } = safeparsed.data;
    try {
        const decoded = jwt.verify(actionToken, process.env.JWT_SECRET || "");
        if (typeof decoded === "string") {
            return res.status(403).json({ message: "Invalid token" });
        }
        // 2. Security Checks: Match email and ensure the purpose was FORGOT_PASSWORD
        if (!decoded ||
            decoded.email !== email ||
            decoded.purpose !== "FORGOT_PASSWORD" ||
            !decoded.isVerified) {
            return res
                .status(403)
                .json({ message: "Unauthorized: OTP verification required" });
        }
        // 3. Check if user exists
        const user = yield userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // 4. Hash and Update
        const hashedPassword = yield bcrypt.hash(newPassword, 10);
        yield userModel.updateOne({ email }, { $set: { password: hashedPassword } });
        res.status(200).json({ message: "Password updated successfully" });
    }
    catch (error) {
        return res.status(403).json({ error: error });
    }
}));
export default router;
