const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models/database");

const secretKey = "secret-key";

exports.authenticate = (req, res, next) => {
  const token = req.cookies.token; 

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is missing." });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token." });
    }
    req.user = user;
    next();
  });
};

exports.register = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const query = `INSERT INTO users (email, password) VALUES (?, ?)`;
  
  db.run(query, [email, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({ message: "Email already registered." });
      }
      return res.status(500).json({ message: "Error registering user." });
    }
    res.status(201).json({ message: "User registered successfully." });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching user." });
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ email: user.email }, secretKey, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
    res.json({ message: "Logged in successfully." });
  });
};

exports.checkAuth = (req, res) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.json({ isAuthenticated: false });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.json({ isAuthenticated: false });
      }
      res.json({ isAuthenticated: true });
    });
  };
  