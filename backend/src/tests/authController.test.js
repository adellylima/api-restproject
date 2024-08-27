const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models/database");
const authController = require("../controllers/authController");

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../models/database");

describe("Auth Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    next = jest.fn();
  });

  describe("authenticate", () => {
    test("should return 401 if token is missing", () => {
      authController.authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentication token is missing.",
      });
    });

    test("should return 403 if token is invalid", () => {
      req.cookies.token = "invalidToken";
      jwt.verify.mockImplementation((token, secret, callback) =>
        callback(new Error("Invalid token"), null)
      );

      authController.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
    });
  });

  describe("register", () => {
    test("should return 400 if email or password is missing", () => {
      req.body = {};

      authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email and password are required.",
      });
    });

    test("should return 500 if database error occurs", () => {
      req.body = { email: "test@example.com", password: "password123" };
      bcrypt.hashSync.mockReturnValue("hashedPassword");
      db.run.mockImplementation((query, params, callback) =>
        callback(new Error("Database error"))
      );

      authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error registering user.",
      });
    });

    test("should return 201 if user is registered successfully", () => {
      req.body = { email: "test@example.com", password: "password123" };
      bcrypt.hashSync.mockReturnValue("hashedPassword");
      db.run.mockImplementation((query, params, callback) => callback(null));

      authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User registered successfully.",
      });
    });
  });

  describe("login", () => {
    test("should return 400 if email or password is missing", () => {
      req.body = {};

      authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email and password are required.",
      });
    });

    test("should return 500 if database error occurs", () => {
      req.body = { email: "test@example.com", password: "password123" };
      db.get.mockImplementation((query, params, callback) =>
        callback(new Error("Database error"))
      );

      authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching user.",
      });
    });

    test("should return 401 if credentials are invalid", () => {
      req.body = { email: "test@example.com", password: "wrongpassword" };
      db.get.mockImplementation((query, params, callback) =>
        callback(null, { email: "test@example.com", password: "hashedPassword" })
      );
      bcrypt.compareSync.mockReturnValue(false);

      authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials." });
    });

    test("should log in successfully with valid credentials", () => {
      req.body = { email: "test@example.com", password: "password123" };
      db.get.mockImplementation((query, params, callback) =>
        callback(null, { email: "test@example.com", password: "hashedPassword" })
      );
      bcrypt.compareSync.mockReturnValue(true);
      jwt.sign.mockReturnValue("validToken");

      authController.login(req, res);

      expect(res.cookie).toHaveBeenCalledWith("token", "validToken", {
        httpOnly: true,
        maxAge: 3600000,
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged in successfully.",
      });
    });
  });

  describe("checkAuth", () => {
    test("should return isAuthenticated false if token is missing", () => {
      authController.checkAuth(req, res);

      expect(res.json).toHaveBeenCalledWith({ isAuthenticated: false });
    });

    test("should return isAuthenticated false if token is invalid", () => {
      req.cookies.token = "invalidToken";
      jwt.verify.mockImplementation((token, secret, callback) =>
        callback(new Error("Invalid token"), null)
      );

      authController.checkAuth(req, res);

      expect(res.json).toHaveBeenCalledWith({ isAuthenticated: false });
    });

    test("should return isAuthenticated true if token is valid", () => {
      req.cookies.token = "validToken";
      jwt.verify.mockImplementation((token, secret, callback) =>
        callback(null, { email: "test@example.com" })
      );

      authController.checkAuth(req, res);

      expect(res.json).toHaveBeenCalledWith({ isAuthenticated: true });
    });
  });
});
