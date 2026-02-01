
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'wedding.db');
const db = new Database(dbPath, { readonly: true });

const views = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='view'").all();
console.log("Views found:", views.length);
views.forEach(v => {
    console.log(`\n--- View: ${v.name} ---`);
    console.log(v.sql);
});
