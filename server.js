const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const dbPath = 'places.sqlite'; // Replace with your path

app.get('/api/history', (req, res) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) return res.status(500).json({ error: err.message });
    });

    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';

    let query = `
        SELECT title, url, datetime(last_visit_date/1000000, 'unixepoch', 'localtime') AS time
        FROM moz_places
        WHERE last_visit_date IS NOT NULL
    `;
    if (search) {
        query += ` AND (title LIKE ? OR url LIKE ?)`;
    }
    query += ` ORDER BY last_visit_date DESC LIMIT ? OFFSET ?`;

    const params = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
        db.close();
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
