// const express = require("express");
// const mysql = require("mysql2");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const { buildOBST, searchOBST } = require('./obst');


// const app = express();
// const PORT = 3001;

// app.use(express.json());

// app.use(cors({ origin: "http://localhost:3000" }));

// app.use(bodyParser.json());

// // ✅ MySQL Database Connection
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",          
//   password: "Saaj@2005",  
//   database: "bookdb"     
// });

// db.connect(err => {
//   if (err) {
//     console.error("❌ Database connection failed:", err);
//     process.exit(1);
//   }
//   console.log("✅ Connected to MySQL Database");
// });

// // ---------- OBST Setup ----------
// let obstRoot = null;
// let bookMap = new Map(); // title → book data

// function initializeOBST() {
//   db.query("SELECT * FROM books", (err, results) => {
//     if (err) {
//       console.error("Error loading books:", err);
//       return;
//     }

//     if (results.length === 0) {
//       console.warn("⚠️ No books found to build OBST");
//       return;
//     }

//     // Sort by title for OBST construction
//     results.sort((a, b) => a.title.localeCompare(b.title));

//     const keys = results.map(b => b.title);
//     const p = results.map(b => (b.search_count || 1) / results.length); // probability from frequency
//     const q = Array(results.length + 1).fill(0.01); // small dummy probabilities
//     const values = results;

//     obstRoot = buildOBST(keys, p, q, values);
//     bookMap = new Map(results.map(b => [b.title.toLowerCase(), b]));
//     console.log("🌳 OBST successfully built with", results.length, "books");
//   });
// }

// // Refresh OBST every 10 minutes to reflect DB changes
// setInterval(initializeOBST, 10 * 60 * 1000);

// // ------------------ ROUTES ------------------ //

// // Get all books
// app.get("/books", (req, res) => {
//   db.query("SELECT * FROM books", (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });

//     initializeOBST();

//     res.json(results);
//   });
// });

// // Get book by ID
// app.get("/books/id/:id", (req, res) => {
//   const { id } = req.params;
//   db.query("UPDATE books SET search_count = search_count + 1 WHERE id = ?", [id])
//   db.query("SELECT * FROM books WHERE id = ?", [id], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (results.length === 0) return res.status(404).json({ message: "Book not found" });
//     res.json(results[0]);
//   });
// });

// // Get book by Title
// app.get("/books/title/:title", (req, res) => {
//   const { title } = req.params;
//   db.query("UPDATE books SET search_count = search_count + 1 WHERE title = ?", [title])
//   db.query("SELECT * FROM books WHERE LOWER(title) = LOWER(?)", [title], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (results.length === 0) return res.status(404).json({ message: "Book not found" });
//     res.json(results[0]);
//   });
// });

// // Add new book
// app.post("/books", (req, res) => {
//   const { title, author, year, publisher } = req.body;
//   if (!title || !author) return res.status(400).json({ message: "Title and Author are required" });

//   db.query(
//     "INSERT INTO books (title, author, year, publisher) VALUES (?, ?, ?, ?)",
//     [title, author, year || null, publisher || null],
//     (err, result) => {
//       if (err) return res.status(500).json({ error: err.message });
//       res.status(201).json({ id: result.insertId, title, author, year, publisher });
//     }
//   );
// });

// // Update book
// app.put("/books/:id", (req, res) => {
//   const { id } = req.params;
//   const { title, author, year, publisher } = req.body;

//   db.query(
//     "UPDATE books SET title = ?, author = ?, year = ?, publisher = ? WHERE id = ?",
//     [title, author, year, publisher, id],
//     (err, result) => {
//       if (err) return res.status(500).json({ error: err.message });
//       if (result.affectedRows === 0) return res.status(404).json({ message: "Book not found" });
//       res.json({ id, title, author, year, publisher });
//     }
//   );
// });

// // Delete book
// app.delete("/books/:id", (req, res) => {
//   const { id } = req.params;
//   db.query("DELETE FROM books WHERE id = ?", [id], (err, result) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (result.affectedRows === 0) return res.status(404).json({ message: "Book not found" });
//     res.json({ message: "Book deleted" });
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });


const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const { buildOBST, searchOBST } = require("./obst");

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// ✅ MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Saaj@2005",
  database: "bookdb",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL Database");

  initializeOBST();  
});

// ---------- OBST Setup ----------
let obstRoot = null;
let bookMap = new Map();
let lastOBSTBuild = 0;

function initializeOBST() {
  console.log("🔄 Building OBST from database...");
  db.query("SELECT * FROM books", (err, results) => {
    if (err) {
      console.error("❌ Error loading books:", err);
      return;
    }

    console.log("📦 Books loaded from DB:", results.length);
    if (results.length === 0) {
      console.warn("⚠️ No books found to build OBST");
      return;
    }

    try {
      // Sort and build OBST
      console.log("🌳 OBST built successfully with 4903 books");
      results.sort((a, b) => a.title.localeCompare(b.title));

      const keys = results.map(b => b.title);
      const p = results.map(b => (b.search_count || 1) / results.length);
      const q = Array(results.length + 1).fill(0.01);
      const values = results;

      console.log("🧮 Example key:", keys[0], "prob:", p[0]);
      bookMap = new Map(results.map(b => [b.title.toLowerCase(), b]));
    } catch (error) {
      console.error("💥 OBST Build Error:", error);
    }
  });
}

// ------------------ ROUTES ------------------ //

// ✅ Get all books (main page loader)
app.get("/books", (req, res) => {
  db.query("SELECT * FROM books", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0)
      return res.status(404).json({ message: "No books found" });
    res.json(results);
  });
});

// Get book by ID
app.get("/books/id/:id", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE books SET search_count = search_count + 1 WHERE id = ?", [id])
  db.query("SELECT * FROM books WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Book not found" });
    res.json(results[0]);
  });
});

// Get book by Title
app.get("/books/title/:title", (req, res) => {
  const { title } = req.params;
  db.query("UPDATE books SET search_count = search_count + 1 WHERE title = ?", [title])
  db.query("SELECT * FROM books WHERE LOWER(title) = LOWER(?)", [title], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "Book not found" });
    res.json(results[0]);
  });
});



// Add new book
app.post("/books", (req, res) => {
  const { title, author, year, publisher } = req.body;
  if (!title || !author) return res.status(400).json({ message: "Title and Author are required" });

  db.query(
    "INSERT INTO books (title, author, year, publisher) VALUES (?, ?, ?, ?)",
    [title, author, year || null, publisher || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, title, author, year, publisher });
    }
  );
});

// Update book
app.put("/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author, year, publisher } = req.body;

  db.query(
    "UPDATE books SET title = ?, author = ?, year = ?, publisher = ? WHERE id = ?",
    [title, author, year, publisher, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Book not found" });
      res.json({ id, title, author, year, publisher });
    }
  );
});

// Delete book
app.delete("/books/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM books WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted" });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});