const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:postgres@localhost:5432/objectql'
});

const checkTables = async () => {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

checkTables();
