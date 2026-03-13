const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'secret-key-12345'; // In production, move to .env

router.post('/register', (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.run(sql, [username, hashedPassword, role], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, username, role });
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row || !bcrypt.compareSync(password, row.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: row.id, role: row.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: row.id, username: row.username, role: row.role } });
    });
});

module.exports = router;
