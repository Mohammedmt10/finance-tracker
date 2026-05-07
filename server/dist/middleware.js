import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const authMiddleware = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            // 401 Unauthorized is the standard for missing credentials
            return res.status(401).json({ message: "Authentication token missing" });
        }
        // Cast the fallback to string, and the result to your custom payload
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // Type guard for safety
        if (typeof decodedToken === "string") {
            return res.status(401).json({ message: "Invalid token format" });
        }
        // TypeScript now knows that .id exists!
        req.userId = decodedToken.id;
        // Move on to the next function/route handler
        next();
    }
    catch (error) {
        // 403 Forbidden is best when a token is provided but rejected (e.g., expired)
        return res.status(403).json({ message: "Invalid or expired token", error });
    }
};
