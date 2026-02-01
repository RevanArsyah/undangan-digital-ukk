import db from '../src/lib/db';
import { WEDDING_CONFIG } from '../src/constants';

console.log('Seeding site_settings table...');

// Table site_settings is already created by src/lib/db.ts when imported

const initialSettings: Record<string, string> = {
  // Groom
  'groom.name': WEDDING_CONFIG.couple.groom.name,
  'groom.fullName': WEDDING_CONFIG.couple.groom.fullName,
  'groom.parents': WEDDING_CONFIG.couple.groom.parents,
  'groom.instagram': WEDDING_CONFIG.couple.groom.instagram,
  'groom.image': WEDDING_CONFIG.couple.groom.image,

  // Bride
  'bride.name': WEDDING_CONFIG.couple.bride.name,
  'bride.fullName': WEDDING_CONFIG.couple.bride.fullName,
  'bride.parents': WEDDING_CONFIG.couple.bride.parents,
  'bride.instagram': WEDDING_CONFIG.couple.bride.instagram,
  'bride.image': WEDDING_CONFIG.couple.bride.image,

  // Venue
  'venue.name': WEDDING_CONFIG.venue.name,
  'venue.address': WEDDING_CONFIG.venue.address,
  'venue.latitude': String(WEDDING_CONFIG.venue.latitude),
  'venue.longitude': String(WEDDING_CONFIG.venue.longitude),

  // Events - Akad
  'akad.title': WEDDING_CONFIG.events.akad.title,
  'akad.date': WEDDING_CONFIG.events.akad.date,
  'akad.startTime': WEDDING_CONFIG.events.akad.startTime,
  'akad.endTime': WEDDING_CONFIG.events.akad.endTime,
  
  // Events - Resepsi
  'resepsi.title': WEDDING_CONFIG.events.resepsi.title,
  'resepsi.date': WEDDING_CONFIG.events.resepsi.date,
  'resepsi.startTime': WEDDING_CONFIG.events.resepsi.startTime,
  'resepsi.endTime': WEDDING_CONFIG.events.resepsi.endTime,
};

// Insert initial values if they don't exist
const insertStmt = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');

const updates = db.transaction((settings) => {
    for (const [key, value] of Object.entries(settings)) {
        insertStmt.run(key, value);
    }
});

updates(initialSettings);

console.log('Initial settings seeded.');
console.log('Setup complete.');
