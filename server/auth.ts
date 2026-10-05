import { getAuth } from "@clerk/express";

export function requireUser(req, res, next) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Entre na sua conta para continuar." });
  }

  req.userId = userId;
  next();
}
