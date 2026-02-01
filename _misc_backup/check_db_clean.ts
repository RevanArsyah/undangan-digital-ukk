import db from './src/lib/db.ts';

try {
  const gallery = db.prepare("SELECT * FROM gallery").all();
  console.log("GALLERY_COUNT:", gallery.length);
  if (gallery.length > 0) {
    console.log("FIRST_IMAGE:", gallery[0]);
  }
} catch (e) {
  console.error("DB_ERROR:", e);
}
