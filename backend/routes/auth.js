const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { jwtSecret, jwtExpiresIn } = require('../config');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password, role } = req.body || {};
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    if (!['rider', 'driver'].includes(role)) {
        return res.status(400).json({ error: 'role must be rider or driver' });
    }
    try {
        const user = await db.one(
            `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role`,
            [username, bcrypt.hashSync(password, 10), role]
        );
        res.status(201).json(user);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    try {
        const row = await db.one(`SELECT * FROM users WHERE username = $1`, [username]);
        if (!row || !password || !bcrypt.compareSync(password, row.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: row.id, role: row.role }, jwtSecret, { expiresIn: jwtExpiresIn });
        res.json({ token, user: { id: row.id, username: row.username, role: row.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
