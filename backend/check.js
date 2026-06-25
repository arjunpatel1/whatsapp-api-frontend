const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.db');
db.all('SELECT * FROM templates', (err, rows) => {
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
