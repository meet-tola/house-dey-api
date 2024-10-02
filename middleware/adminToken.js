import jwt from "jsonwebtoken";

// Middleware to authenticate and authorize admin
export const adminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Check if user is an admin
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
