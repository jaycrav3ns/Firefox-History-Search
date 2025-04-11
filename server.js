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
    const sortField = req.query.sort || 'time';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const sortableFields = {
        title: 'title',
        url: 'url',
        time: 'last_visit_date'
    };

    const safeSortField = sortableFields[sortField] || 'last_visit_date';

    let query = `
        WITH base AS (
            SELECT DISTINCT title, url, last_visit_date
            FROM moz_places
            WHERE last_visit_date IS NOT NULL
    `;
    if (search) {
        query += ` AND (title LIKE ? OR url LIKE ?)`;
    }
    query += `
            ORDER BY last_visit_date DESC
            LIMIT ? OFFSET ?
        )
        SELECT title, url, datetime(last_visit_date/1000000, 'unixepoch', 'localtime') AS time
        FROM base
        ORDER BY ${safeSortField} ${sortOrder}
    `;

    const params = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];

    console.log('Query:', query);
    console.log('Params:', params);

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Query error:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.log('Rows returned:', rows.length);
            res.json(rows);
        }
        db.close();
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
