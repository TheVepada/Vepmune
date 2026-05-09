import bcrypt from "bcryptjs";
import { findUserById, updateUser } from "../models/userModel.js";

export async function getUserProfile(req, res, next) {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (Number(req.user.id) !== Number(req.params.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    if (Number(req.user.id) !== Number(req.params.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const payload = { ...req.body };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 12);
    }

    const result = await updateUser(req.params.id, payload);
    if (!result.affectedRows) {
      return res.status(400).json({ message: "No changes made" });
    }

    const user = await findUserById(req.params.id);
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}
