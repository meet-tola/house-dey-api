import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import prisma from "../lib/prisma.js";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4(); 

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        verificationToken,
        verified: false,
      },
    });

    // Send verification email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newUser.email,
      subject: 'Verify your email',
      html: `<p>Click the link to verify your email: <a href="${process.env.FRONTEND_URL}/verify/${verificationToken}">Verify Email</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).send("User registered successfully. Please check your email to verify your account.");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering user");
  }
};


export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
      },
    });

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Email verification failed:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};



export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(401).json({ message: "Invalid Credentials" });
    if (!user.verified) return res.status(401).json({ message: "Please verify your email before logging in." });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Incorrect Password" });

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
        secure: process.env.NODE_ENV === 'production', 
      })
      .status(200)
      .json({ message: "Login Successful", user, token });
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
