import { Router } from "express";
import { signupBodySchema, loginBodySchema } from "@fixitnow/types";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/requireAuth";
import {
  signup,
  login,
  refresh,
  logout,
  me,
} from "../controllers/auth.controller";

const router = Router();

router.post("/signup", validate({ body: signupBodySchema }), signup);
router.post("/login", validate({ body: loginBodySchema }), login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
