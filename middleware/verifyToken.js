import jwt from "jsonwebtoken";
import cookie from "cookie";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  
  const cookies = cookie.parse(req.headers.cookie || '');
  const tokenFromCookie = cookies.token;

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) return res.status(403).json({ message: "Token is not Valid!" });
    req.userId = payload.id;
    next();
  });
};
