import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import prisma from "../lib/prisma.js";

export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    //Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create to database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role, 
      },
    });

    console.log(newUser);
    res.status(201).send("User registered successfully");
  } catch (error) {
    res.status(500).send("Error registering user");
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check existing users
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(401).json({ message: "Invalid Credentials" });

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Incorrect Password" });

    // Generate cookie token and send to the user
    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
        sameSite: 'None',
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      })
      .status(200)
      .json({ message: "Login Successful", user, token }); // Return user data and token
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login" });
  }
};


export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout successful" });
};

export const checkAuth = async (req, res) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Failed to check auth:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
