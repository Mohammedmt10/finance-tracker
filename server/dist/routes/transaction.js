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
import { authMiddleware } from "../middleware.js";
import { transactionModel } from "../db.js";
import z from "zod";
const router = express.Router();
router.use(authMiddleware);
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryObj = {
            userId: req.userId,
        };
        const rawType = req.query.type;
        if (rawType === "Income" || rawType === "Expense") {
            queryObj.type = rawType;
        }
        else if (rawType) {
            res
                .status(400)
                .json({ message: "Invalid filter type. Must be Income or Expense." });
            return;
        }
        if (req.query.startDate || req.query.endDate) {
            queryObj.date = {};
            if (req.query.startDate) {
                queryObj.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                queryObj.date.$lte = new Date(req.query.endDate);
            }
        }
        const sortField = req.query.sortBy || "date";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const transactions = yield transactionModel
            .find(queryObj)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);
        const totalRecords = yield transactionModel.countDocuments(queryObj);
        res.status(200).json({
            data: transactions,
            pagination: {
                totalRecords,
                currentPage: page,
                totalPages: Math.ceil(totalRecords / limit),
                hasNextPage: page * limit < totalRecords,
                hasPrevPage: page > 1 && totalRecords > 0,
            },
        });
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Server error fetching transactions" });
    }
}));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = z.object({
            amount: z.number().min(1),
            type: z.enum(["Income", "Expense"]),
            description: z.string().optional(),
        });
        const safeParse = body.safeParse(req.body);
        if (!safeParse.success) {
            return res.status(411).json({ message: "Invalid input" });
        }
        const transaction = yield transactionModel.create({
            amount: safeParse.data.amount,
            type: safeParse.data.type,
            description: safeParse.data.description,
            userId: req.userId,
        });
        res.status(201).json({ message: "Transaction added successfully" });
    }
    catch (error) {
        console.error("Error adding transaction:", error);
        res.status(500).json({ message: "Server error adding transaction" });
    }
}));
export default router;
