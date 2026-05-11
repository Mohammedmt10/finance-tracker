import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware.js";
import { transactionModel, tagModel } from "../db.js";
import mongoose, { Types } from "mongoose";
import z from "zod";

/* ── Category presets ── */
const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Refund",
  "Other",
] as const;

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Education",
  "Travel",
  "Other",
] as const;

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const router = express.Router();
router.use(authMiddleware);

interface TransactionQuery {
  userId: string;
  type?: "Income" | "Expense";
  category?: string;
  tags?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const queryObj: TransactionQuery = {
      userId: req.userId,
    };

    const rawType = req.query.type as string | undefined;
    if (rawType === "Income" || rawType === "Expense") {
      queryObj.type = rawType;
    } else if (rawType) {
      res
        .status(400)
        .json({ message: "Invalid filter type. Must be Income or Expense." });
      return;
    }

    if (req.query.startDate || req.query.endDate) {
      queryObj.date = {};

      if (req.query.startDate) {
        queryObj.date.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        queryObj.date.$lte = new Date(req.query.endDate as string);
      }
    }

    if (req.query.category) {
      queryObj.category = req.query.category as string;
    }

    if (req.query.tag) {
      queryObj.tags = req.query.tag as string;
    }

    const sortField = (req.query.sortBy as string) || "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const transactions = await transactionModel
      .find(queryObj)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalRecords = await transactionModel.countDocuments(queryObj);

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
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error fetching transactions" });
  }
});

/**
 * GET /transaction/categories
 * Returns the preset category lists for Income and Expense.
 */
router.get("/categories", async (_req: Request, res: Response) => {
  res.status(200).json({
    income: INCOME_CATEGORIES,
    expense: EXPENSE_CATEGORIES,
  });
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = z.object({
      amount: z.number().min(1),
      type: z.enum(["Income", "Expense"]),
      category: z
        .string()
        .min(1)
        .refine(
          (val) =>
            ALL_CATEGORIES.includes(val as (typeof ALL_CATEGORIES)[number]),
          { message: "Invalid category" },
        ),
      tags: z.array(z.string().min(1).max(30)).max(10).optional().default([]),
      description: z.string().optional(),
    });

    const safeParse = body.safeParse(req.body);
    if (!safeParse.success) {
      return res
        .status(411)
        .json({ message: "Invalid input", errors: safeParse.error.flatten() });
    }

    const { amount, type, category, tags, description } = safeParse.data;

    // Auto-create any new tags for this user
    if (tags.length > 0) {
      const userObjId = new Types.ObjectId(req.userId);
      const ops = tags.map((name) => ({
        updateOne: {
          filter: { userId: userObjId, name: name.trim().toLowerCase() },
          update: {
            $setOnInsert: {
              userId: userObjId,
              name: name.trim().toLowerCase(),
            },
          },
          upsert: true,
        },
      }));
      await tagModel.bulkWrite(ops);
    }

    await transactionModel.create({
      amount,
      type,
      category,
      tags: tags.map((t) => t.trim().toLowerCase()),
      description,
      userId: req.userId,
    });

    res.status(201).json({ message: "Transaction added successfully" });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Server error adding transaction" });
  }
});

export default router;
