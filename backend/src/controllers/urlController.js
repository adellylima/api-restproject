const crypto = require("crypto");
const db = require("../models/database");
const jwt = require("jsonwebtoken");
const secretKey = "secret-key";

function generateShortId() {
  return crypto.randomBytes(3).toString("hex");
}

function getUser(req, res) {
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
  });
}

exports.shortenUrl = (req, res) => {
  const { url } = req.body;
  getUser(req, res)
  const email = req.user ? req.user.email : null;

  if (!url) {
    return res.status(400).json({ message: "URL is required." });
  }

  const shortId = generateShortId();
  const lastUpdated = new Date().toISOString();

  const query = `INSERT INTO urls (shortId, url, email, accessCount, lastUpdated, deletedAt) VALUES (?, ?, ?, 0, ?, NULL)`;
  db.run(query, [shortId, url, email, lastUpdated], function (err) {
    if (err) {
      return res.status(500).json({ message: "Error creating shortened URL." });
    }
    const shortenedUrl = `http://localhost:/${shortId}`;
    res.json({ shortenedUrl });
  });
};

exports.incrementAccessCount = (req, res) => {
  const { shortId } = req.params;
  const lastUpdated = new Date().toISOString();

  const selectQuery =
    "SELECT * FROM urls WHERE shortId = ? AND deletedAt IS NULL";
  db.get(selectQuery, [shortId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching URL." });
    }
    if (!row) {
      return res.status(404).json({ message: "URL not found or deleted." });
    }

    const updateQuery =
      "UPDATE urls SET accessCount = accessCount + 1, lastUpdated = ? WHERE shortId = ?";
    db.run(updateQuery, [lastUpdated, shortId], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error updating access count." });
      }
      res.status(200).json({ message: "Access count incremented." });
    });
  });
};

exports.redirectUrl = (req, res) => {
  const { shortId } = req.params;

  const selectQuery =
    "SELECT * FROM urls WHERE shortId = ? AND deletedAt IS NULL";
  db.get(selectQuery, [shortId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching URL." });
    }
    if (!row) {
      return res.status(404).json({ message: "URL not found or deleted." });
    }

    const updateQuery =
      "UPDATE urls SET accessCount = accessCount + 1, lastUpdated = ? WHERE shortId = ?";
    db.run(updateQuery, [new Date().toISOString(), shortId], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error updating access count." });
      }
      res.redirect(row.url);
    });
  });
};

exports.listUrls = (req, res) => {
  const userEmail = req.user ? req.user.email : null;
  const query = userEmail
    ? "SELECT * FROM urls WHERE email = ? AND deletedAt IS NULL"
    : "SELECT * FROM urls WHERE deletedAt IS NULL";
  const params = userEmail ? [userEmail] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching URLs." });
    }
    res.json(rows);
  });
};

exports.editUrl = (req, res) => {
  const { shortId } = req.params;
  const { newUrl } = req.body;
  const lastUpdated = new Date().toISOString();

  const selectQuery =
    "SELECT * FROM urls WHERE shortId = ? AND deletedAt IS NULL";
  db.get(selectQuery, [shortId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching URL." });
    }
    if (!row) {
      return res.status(404).json({ message: "URL not found or deleted." });
    }

    if (row.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You don't have permission to edit this URL." });
    }

    const updateQuery =
      "UPDATE urls SET url = ?, lastUpdated = ? WHERE shortId = ?";
    db.run(updateQuery, [newUrl, lastUpdated, shortId], function (err) {
      if (err) {
        return res.status(500).json({ message: "Error updating URL." });
      }
      res.json({ message: "URL updated successfully." });
    });
  });
};

exports.deleteUrl = (req, res) => {
  const { shortId } = req.params;

  const selectQuery =
    "SELECT * FROM urls WHERE shortId = ? AND deletedAt IS NULL";
  db.get(selectQuery, [shortId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching URL." });
    }
    if (!row) {
      return res
        .status(404)
        .json({ message: "URL not found or already deleted." });
    }

    if (row.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this URL." });
    }

    const updateQuery = "UPDATE urls SET deletedAt = ? WHERE shortId = ?";
    db.run(updateQuery, [new Date().toISOString(), shortId], function (err) {
      if (err) {
        return res.status(500).json({ message: "Error deleting URL." });
      }
      res.json({ message: "URL deleted successfully." });
    });
  });
};
