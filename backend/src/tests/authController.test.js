const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models/database");
const authController = require("../controllers/authController");

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

jest.mock("sqlite3", () => {
  return {
    Database: jest.fn().mockImplementation(() => ({
      run: jest.fn((query, params, callback) => callback(null)),
      get: jest.fn((query, params, callback) => callback(null)),
    })),
  };
});

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

  const setRequestBody = (email, password) => {
    req.body = { email, password };
  };

  const mockJwtVerify = (isValid, payload = null) => {
    jwt.verify.mockImplementation((token, secret, callback) =>
      callback(
        isValid ? null : new Error("Invalid token"),
        isValid ? payload : null
      )
    );
  };

  describe("authenticate", () => {
    test("should respond with 401 when no token is provided", () => {
      authController.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentication token is missing.",
      });
    });

    test("should respond with 403 when token is invalid", () => {
      req.cookies.token = "invalidToken";
      mockJwtVerify(false);

      authController.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
    });
  });

  describe("register", () => {
    test("should respond with 400 when email or password is missing", () => {
      setRequestBody("", "");

      authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email and password are required.",
      });
    });

    test("should respond with 500 when there is a database error", () => {
      setRequestBody("test@example.com", "password123");
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

    test("should respond with 201 when user is registered successfully", () => {
      setRequestBody("test@example.com", "password123");
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
    test("should respond with 400 when email or password is missing", () => {
      setRequestBody("", "");

      authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email and password are required.",
      });
    });

    test("should respond with 500 when there is a database error", () => {
      setRequestBody("test@example.com", "password123");
      db.get.mockImplementation((query, params, callback) =>
        callback(new Error("Database error"))
      );

      authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching user.",
      });
    });

    test("should respond with 401 when credentials are invalid", () => {
      setRequestBody("test@example.com", "wrongpassword");
      db.get.mockImplementation((query, params, callback) =>
        callback(null, {
          email: "test@example.com",
          password: "hashedPassword",
        })
      );
      bcrypt.compareSync.mockReturnValue(false);

      authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid credentials.",
      });
    });

    test("should log in successfully with valid credentials", () => {
      setRequestBody("test@example.com", "password123");
      db.get.mockImplementation((query, params, callback) =>
        callback(null, {
          email: "test@example.com",
          password: "hashedPassword",
        })
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
    test("should return isAuthenticated false when token is missing", () => {
      authController.checkAuth(req, res);

      expect(res.json).toHaveBeenCalledWith({ isAuthenticated: false });
    });

    test("should return isAuthenticated false when token is invalid", () => {
      req.cookies.token = "invalidToken";
      mockJwtVerify(false);

      authController.checkAuth(req, res);

      expect(res.json).toHaveBeenCalledWith({ isAuthenticated: false });
    });

    test("should return isAuthenticated true when token is valid", () => {
      req.cookies.token = "validToken";
      mockJwtVerify(true, { email: "test@example.com" });

      authController.checkAuth(req, res);

      expect(res.json).toHaveBeenCalledWith({ isAuthenticated: true });
    });
  });
});
