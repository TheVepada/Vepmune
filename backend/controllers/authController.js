import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmailOrUsername } from "../models/userModel.js";

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET || "change_this_secret", { expiresIn: "7d" });
}

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, and password are required" });
    }

    const existing = await findUserByEmailOrUsername(email);
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await createUser({ username, email, password: hashedPassword });
    return res.status(201).json({ user, token: generateToken(user) });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;
    if (!identifier || !password) {
      return res.status(400).json({ message: "email/username and password are required" });
    }

    const user = await findUserByEmailOrUsername(identifier);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at },
      token: generateToken(user),
    });
  } catch (error) {
    return next(error);
  }
}
