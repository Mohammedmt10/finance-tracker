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
import { userModel } from "../db.js";
import { authMiddleware } from "../middleware.js";
import z from "zod";
import bcrypt from "bcrypt";
const router = express.Router();
router.get("/", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userModel.findOne({
        _id: req.userId,
    });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({
        email: user.email,
    });
}));
router.put("/change-password", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = z.object({
        currentPassword: z
            .string()
            .min(3)
            .max(30)
            .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/),
        newPassword: z
            .string()
            .min(3)
            .max(30)
            .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/),
    });
    const safeparsed = body.safeParse(req.body);
    if (!safeparsed.success) {
        return res.status(411).json({ message: "Invalid credentials" });
    }
    const { currentPassword, newPassword } = safeparsed.data;
    const user = yield userModel.findById(req.userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = yield bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        return res.status(411).json({ message: "Invalid credentials" });
    }
    const hashedPassword = yield bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    yield user.save();
    return res.status(200).json({ message: "Password changed successfully" });
}));
export default router;
