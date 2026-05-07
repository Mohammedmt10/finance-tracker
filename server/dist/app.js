import auth from "./routes/auth.js";
import express from "express";
const app = express();
app.use("/auth", auth);
export default app;
