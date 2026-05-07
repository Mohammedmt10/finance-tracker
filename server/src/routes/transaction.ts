import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware.js";
import { transactionModel } from "../db.js";
import z from "zod";

const router = express.Router();
router.use(authMiddleware);

interface TransactionQuery {
  userId: string;
  type?: "Income" | "Expense";
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

router.post("/", async (req: Request, res: Response) => {
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

    const transaction = await transactionModel.create({
      amount: safeParse.data.amount,
      type: safeParse.data.type,
      description: safeParse.data.description,
      userId: req.userId,
    });

    res.status(201).json({ message: "Transaction added successfully" });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Server error adding transaction" });
  }
});

export default router;
