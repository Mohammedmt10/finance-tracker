import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import dotenv from "dotenv";
import profileRouter from "./routes/profile.js";
import transactionRouter from "./routes/transaction.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/transaction", transactionRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
