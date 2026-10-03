require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const required = (name) => {
    const value = String(process.env[name] || '').trim();
    if (!value) throw new Error(`Missing required value: ${name}`);
    return value;
};

const run = async () => {
    const name = required('BOOTSTRAP_ADMIN_NAME');
    const email = required('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
    const phone = required('BOOTSTRAP_ADMIN_PHONE').replace(/[+\s()-]/g, '');
    const password = required('BOOTSTRAP_ADMIN_PASSWORD');

    if (name.length > 100) throw new Error('BOOTSTRAP_ADMIN_NAME must be 100 characters or fewer');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
        throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address');
    }
    if (!/^\d{10,15}$/.test(phone)) {
        throw new Error('BOOTSTRAP_ADMIN_PHONE must contain 10 to 15 digits');
    }
    if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters and no more than 72 bytes');
    }

    const [existing] = await pool.query(
        'SELECT user_id, role FROM users WHERE email = ?',
        [email]
    );

    if (existing.length > 0) {
        if (existing[0].role === 'admin') {
            console.log('An administrator already exists for this email; no changes were made.');
            return;
        }
        throw new Error('This email already belongs to a non-admin account');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
        `INSERT INTO users (name, email, password, phone, role)
         VALUES (?, ?, ?, ?, 'admin')`,
        [name, email, passwordHash, phone]
    );

    console.log(`Administrator created for ${email}. Remove BOOTSTRAP_ADMIN_* values after use.`);
};

run()
    .catch((error) => {
        console.error(`Administrator bootstrap failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
