const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: '31.76.12.103',
    port: 3306,
    user: 'isp-44_anufriev_va',
    password: 'isp-44_anufriev_va',
    database: 'isp-44_anufriev_va',
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err, connection) => {
    if (err) { console.error('Ошибка БД:', err.message); return; }
    console.log('MySQL подключён!');
    connection.release();
});

// ── АВТОРИЗАЦИЯ ─────────────────────────────────────

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Заполни все поля' });
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Такой пользователь уже существует' });
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json({ message: 'Аккаунт создан!' });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        if (results.length === 0) return res.status(401).json({ error: 'Неверный логин или пароль' });
        res.json({ message: 'Вход выполнен', username: results[0].username });
    });
});

// ── ТОВАРЫ ──────────────────────────────────────────

app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка БД' });
        res.json(results);
    });
});

// ── КОРЗИНА ─────────────────────────────────────────

app.get('/api/cart', (req, res) => {
    const sql = `SELECT korzina.id, products.name, products.price
                 FROM korzina JOIN products ON korzina.product_id = products.id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка БД' });
        res.json(results);
    });
});

app.post('/api/cart', (req, res) => {
    const { product_id } = req.body;
    db.query('INSERT INTO korzina (product_id) VALUES (?)', [product_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Ошибка добавления' });
        res.status(201).json({ message: 'Добавлено', id: result.insertId });
    });
});

app.delete('/api/cart/:id', (req, res) => {
    db.query('DELETE FROM korzina WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка удаления' });
        res.json({ message: 'Удалено' });
    });
});

app.delete('/api/cart', (req, res) => {
    db.query('DELETE FROM korzina', (err) => {
        if (err) return res.status(500).json({ error: 'Ошибка очистки' });
        res.json({ message: 'Корзина очищена' });
    });
});

app.listen(PORT, () => {
    console.log('Сервер запущен: http://localhost:' + PORT);
});
