const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve('/db/database.sqlite'); 

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating users table ' + err.message);
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shortId TEXT UNIQUE,
        url TEXT,
        email TEXT,
        accessCount INTEGER,
        lastUpdated TEXT,
        deletedAt TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating urls table ' + err.message);
      }
    });
  }
});

module.exports = db;
