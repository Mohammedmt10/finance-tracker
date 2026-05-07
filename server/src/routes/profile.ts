import express from "express";
import { userModel } from "../db.js";
import { authMiddleware } from "../middleware.js";
import z from "zod";
import bcrypt from "bcrypt";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const user = await userModel.findOne({
    _id: req.userId,
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    email: user.email,
  });
});

router.put("/change-password", authMiddleware, async (req, res) => {
  const body = z.object({
    currentPassword: z
      .string()
      .min(3)
      .max(30)
      .regex(
        /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/,
      ),
    newPassword: z
      .string()
      .min(3)
      .max(30)
      .regex(
        /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/,
      ),
  });

  const safeparsed = body.safeParse(req.body);

  if (!safeparsed.success) {
    return res.status(411).json({ message: "Invalid credentials" });
  }

  const { currentPassword, newPassword } = safeparsed.data;

  const user = await userModel.findById(req.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    return res.status(411).json({ message: "Invalid credentials" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await user.save();

  return res.status(200).json({ message: "Password changed successfully" });
});

export default router;
