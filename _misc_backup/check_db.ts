import db from './src/lib/db.ts';

try {
  const settings = db.prepare("SELECT * FROM site_settings").all();
  console.log("Settings:", settings);

  const gallery = db.prepare("SELECT * FROM gallery").all();
  console.log("Gallery:", gallery);
} catch (e) {
  console.error(e);
}
