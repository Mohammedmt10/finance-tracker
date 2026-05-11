import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware.js";
import { tagModel } from "../db.js";
import z from "zod";

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /tag
 * Returns all tags belonging to the authenticated user, sorted alphabetically.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const tags = await tagModel
      .find({ userId: req.userId })
      .sort({ name: 1 });

    res.status(200).json({ data: tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ message: "Server error fetching tags" });
  }
});

/**
 * POST /tag
 * Creates a new tag for the authenticated user.
 * Returns 409 if the tag name already exists for this user.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const body = z.object({
      name: z
        .string()
        .min(1)
        .max(30)
        .transform((val) => val.trim().toLowerCase()),
    });

    const safeParse = body.safeParse(req.body);
    if (!safeParse.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const { name } = safeParse.data;

    // Check for duplicate
    const existing = await tagModel.findOne({ userId: req.userId, name });
    if (existing) {
      return res.status(409).json({ message: "Tag already exists", data: existing });
    }

    const tag = await tagModel.create({
      name,
      userId: req.userId,
    });

    res.status(201).json({ message: "Tag created successfully", data: tag });
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({ message: "Server error creating tag" });
  }
});

/**
 * DELETE /tag/:id
 * Deletes a tag by its ID. Only the owner can delete their own tags.
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const tag = await tagModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({ message: "Server error deleting tag" });
  }
});

export default router;
