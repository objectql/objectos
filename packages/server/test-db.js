const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:postgres@localhost:5432/objectql'
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Connection Error:', err);
    } else {
        console.log('Connection Success:', res.rows[0]);
    }
    pool.end();
});
