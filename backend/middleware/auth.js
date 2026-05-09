import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing authentication token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "change_this_secret");
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireOwner(req, res, next) {
  if (!req.user || Number(req.user.id) !== Number(req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}
