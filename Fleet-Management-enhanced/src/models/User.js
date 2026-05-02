const bcrypt = require('bcrypt');
const { query } = require('../config/database');

class User {
    constructor(id, email, password, createdAt, updatedAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static async create(userData) {
        const { email, password } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
            [email, hashedPassword]
        );

        return new User(
            result.rows[0].id,
            result.rows[0].email,
            result.rows[0].password,
            result.rows[0].created_at,
            result.rows[0].updated_at
        );
    }

    static async findByEmail(email) {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return new User(row.id, row.email, row.password, row.created_at, row.updated_at);
    }

    static async findById(id) {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return new User(row.id, row.email, row.password, row.created_at, row.updated_at);
    }

    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = User;