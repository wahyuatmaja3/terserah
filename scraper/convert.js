#!/usr/bin/env node
/**
 * convert.js : Normalizer & Merger for gosom/google-maps-scraper output
 * Converts raw JSON or CSV into Terserah's assets/data/places.json format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DB_PATH = path.resolve(__dirname, '../assets/data/places.json');
const TARGET_JS_PATH = path.resolve(__dirname, '../assets/data/places.js');

// Category mapping helper
function inferCategory(title = '', primaryCat = '', categories = []) {
  const text = `${title} ${primaryCat} ${categories.join(' ')}`.toLowerCase();

  // 1. Religi / Spiritual (Masjid, Gereja, Vihara, Pura, Klenteng, Place of Worship)
  if (text.match(/masjid|mosque|gereja|church|vihara|temple|pura|religi|makam|klenteng|place_of_worship/)) {
    return 'spiritual';
  }

  // 2. Jajan / Snack (Street Snacks, Dimsum, Chikuro, Popcorn, Siomay, etc.)
  if (text.match(/dimsum|dim sum|chikuro|shihlin|popcorn|ayam popcorn|pok pok|pok-pok|hot star|hot-star|siomay|batagor|cireng|sempol|pentol|cilok|takoyaki|pancong|kue pancong|jasuke|odeng|churros|croffle|toast|snack|kudapan|street snack|gorengan|tahu gejrot|pisang keju|crepes|pukis|corndog|bungeoppang|martabak mini|bakwan|tahu walik|risol|risoles|pastel|tahu bakso|pempek/)) {
    return 'snack';
  }

  // 3. Hiburan / Entertainment (Billiard, Bioskop, Game Center, Rental PS, Board Game, etc.)
  if (text.match(/cinema|bioskop|xxi|cgv|cinepolis|arcade|bowling|karaoke|biliar|billiard|pool lounge|\bpool\b|game center|game|amusement|hiburan|timezone|funworld|trans studio|cow play|amazone|escape room|playland|board game|boardgame|playstation|rental ps|ps5|ps4|ps lounge|vr lounge|laser tag/)) {
    return 'entertainment';
  }

  // 4. Hangout / Nongkrong (Cafe, Warkop, Kedai, Coffee Shop)
  if (text.match(/coffee|kopi|cafe|kafe|nongkrong|roastery|gelato|boba|\bbar\b|lounge|espresso|warkop|cangkruk|angkringan|stmj|kedai|es coklat|es teh|teh tarik|roti bakar/)) {
    return 'hangout';
  }

  // 5. Food / Makan (Restoran, Warung, Kuliner Berat)
  if (text.match(/restoran|restaurant|makan|warung|kuliner|bakso|mie|sate|padang|sunda|seafood|sushi|ramen|steak|pizza|burger|dapur|kitchen|bistro|eatery|rawon|soto|bebek|penyet|penyetan|pecel|nasi|tahu tek|tahu telor|rujak|lontong|gultik|martabak|terang bulan|gacoan|ayambakar|ayamgoreng|fast_food|food_court|cuanki|gudeg|bubur|pudak|babat|cumi/)) {
    return 'food';
  }

  // 6. Alam / Nature
  if (text.match(/taman|park|hutan|nature|alam|danau|lake|pantai|beach|kebun|curug|gunung|outdoor|mangrove|air terjun|ecotourism|viewpoint/)) {
    return 'nature';
  }

  // 7. Shopping / Belanja
  if (text.match(/mall|shopping|plaza|supermarket|pasar|toko|boutique|distro|factory outlet|kios|oleh-oleh|pusat perbelanjaan|thrift/)) {
    return 'shopping';
  }

  // 8. Budaya / Culture
  if (text.match(/museum|galeri|\bart\b|gallery|monumen|monument|cagar budaya|budaya|theatre|teater|heritage|candi|balai pemuda|kota lama/)) {
    return 'culture';
  }

  // 9. Fitness / Olahraga
  if (text.match(/gym|fitness|stadium|stadion|lapangan|gor|badminton|padel|futsal|olahraga|sport|tennis|renang/)) {
    return 'fitness';
  }

  return 'food'; // default fallback
}

// Budget tier helper
function inferBudgetTier(priceRange = '', category = 'food', title = '') {
  const t = title.toLowerCase();
  if (t.match(/warkop|angkringan|kaki lima|tenda|pkl|warung|es teh|stmj|pentol|cilok|tahu tek|rujak|gultik|soto|rawon|bakso|pecel|mie ayam|mie|lontong|penyet|penyetan|goreng|kedai|cuanki|bubur|pancong|jasuke|cireng|sempol|batagor|siomay|dimsum|chikuro|popcorn|shihlin|takoyaki/)) {
    return 'cheap';
  }
  if (priceRange === '$' || priceRange === '1') return 'cheap';
  if (priceRange === '$$' || priceRange === '2') return 'moderate';
  if (priceRange === '$$$' || priceRange === '3') return 'pricey';
  if (priceRange === '$$$$' || priceRange === '4') return 'luxury';

  if (category === 'snack' || category === 'nature' || category === 'spiritual') return 'cheap';
  if (category === 'entertainment') return 'moderate';
  if (category === 'hangout') return 'moderate';
  return 'moderate';
}

// Parse CSV line safely (supporting quotes)
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const entries = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] || '';
    });
    entries.push(obj);
  }
  return entries;
}

// Normalize entry into Terserah schema
function normalizeEntry(raw) {
  const title = raw.title || raw.name || raw.Title || '';
  if (!title) return null;

  const lat = parseFloat(raw.latitude || raw.lat || 0);
  const lon = parseFloat(raw.longitude || raw.longtitude || raw.lon || raw.lng || 0);

  if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) {
    return null; // Skip items without valid GPS coordinates
  }

  const rawCats = Array.isArray(raw.categories)
    ? raw.categories
    : (typeof raw.categories === 'string' && raw.categories ? raw.categories.split(',').map(c => c.trim()) : []);
  const primaryCat = raw.category || raw.Category || (rawCats[0] || '');
  const category = inferCategory(title, primaryCat, rawCats);

  const rating = parseFloat(raw.review_rating || raw.rating || 4.5) || 4.5;
  const ratingsCount = parseInt(raw.review_count || raw.ratingsCount || raw.user_ratings_total || 0, 10) || null;

  const budgetTier = inferBudgetTier(raw.price_range || raw.priceLevel, category, title);
  const priceLevel = budgetTier === 'cheap' ? 1 : budgetTier === 'moderate' ? 2 : budgetTier === 'pricey' ? 3 : 4;

  const address = raw.address || raw.vicinity || raw.formatted_address || 'Area Sekitar';
  const photoUrl = raw.thumbnail || raw.photoUrl || raw.photo || null;

  const tags = [];
  if (ratingsCount) {
    tags.push(`${ratingsCount.toLocaleString('id-ID')} ulasan`);
  }
  if (primaryCat) {
    tags.push(primaryCat);
  }
  rawCats.slice(0, 2).forEach(c => {
    if (!tags.includes(c)) tags.push(c);
  });

  const cid = raw.cid || raw.data_id || raw.input_id || '';
  const placeId = raw.placeId || cid || `gm-${Math.abs(Math.sin(lat + lon) * 1000000).toFixed(0)}`;
  const googleMapsUrl = raw.link || raw.reviews_link || `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  let isOpen = null;
  if (typeof raw.status === 'string') {
    const s = raw.status.toLowerCase();
    if (s.includes('open')) isOpen = true;
    else if (s.includes('closed')) isOpen = false;
  } else if (typeof raw.isOpen === 'boolean') {
    isOpen = raw.isOpen;
  }

  return {
    id: `gmaps/${placeId}`,
    placeId,
    name: title,
    lat,
    lon,
    category,
    address,
    rating: Number(rating.toFixed(1)),
    ratingsCount,
    budgetTier,
    priceLevel,
    photoUrl,
    isOpen,
    tags: tags.slice(0, 4),
    googleMapsUrl,
    source: 'google-maps-scraper',
  };
}

export function convertAndMerge(rawFilePath) {
  let entries = [];

  if (rawFilePath && fs.existsSync(rawFilePath)) {
    console.log(`Membaca file data: ${rawFilePath}`);
    const content = fs.readFileSync(rawFilePath, 'utf-8');
    if (rawFilePath.endsWith('.csv')) {
      entries = parseCSV(content);
    } else {
      try {
        const parsed = JSON.parse(content);
        entries = Array.isArray(parsed) ? parsed : (parsed.data || parsed.results || [parsed]);
      } catch (err) {
        console.error('Gagal parse file JSON:', err.message);
        process.exit(1);
      }
    }
  } else {
    // Look for default outputs in scraper folder
    const candidates = [
      path.join(__dirname, 'results.json'),
      path.join(__dirname, 'results.csv'),
      path.join(__dirname, 'output.json'),
      path.join(__dirname, 'output.csv'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return convertAndMerge(c);
      }
    }
    console.error('Tidak ditemukan file hasil scraping untuk dikonversi.');
    console.log('Gunakan: node scraper/convert.js <path-ke-file-hasil-scrape.json|csv>');
    process.exit(1);
  }

  // Ensure target folder exists
  const targetDir = path.dirname(TARGET_DB_PATH);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Load existing places.json if any
  let existingPlaces = [];
  if (fs.existsSync(TARGET_DB_PATH)) {
    try {
      existingPlaces = JSON.parse(fs.readFileSync(TARGET_DB_PATH, 'utf-8'));
      if (!Array.isArray(existingPlaces)) existingPlaces = [];
    } catch {
      existingPlaces = [];
    }
  }

  const existingMap = new Map();
  existingPlaces.forEach(p => {
    // Unique key: lowercase name + approximate coords
    const key = `${p.name.toLowerCase().trim()}_${p.lat.toFixed(3)}_${p.lon.toFixed(3)}`;
    existingMap.set(key, p);
  });

  let addedCount = 0;
  let updatedCount = 0;

  for (const raw of entries) {
    const item = normalizeEntry(raw);
    if (!item) continue;

    const key = `${item.name.toLowerCase().trim()}_${item.lat.toFixed(3)}_${item.lon.toFixed(3)}`;
    if (existingMap.has(key)) {
      // Merge updates
      const old = existingMap.get(key);
      existingMap.set(key, { ...old, ...item });
      updatedCount++;
    } else {
      existingMap.set(key, item);
      addedCount++;
    }
  }

  const mergedPlaces = Array.from(existingMap.values());
  const jsonContent = JSON.stringify(mergedPlaces, null, 2);
  fs.writeFileSync(TARGET_DB_PATH, jsonContent, 'utf-8');
  fs.writeFileSync(TARGET_JS_PATH, `window.TERSERAH_PLACES = ${jsonContent};\n`, 'utf-8');

  console.log('----------------------------------------------------');
  console.log(`✅ Sukses update: ${path.relative(process.cwd(), TARGET_DB_PATH)}`);
  console.log(`📊 Tempat baru ditambahkan: ${addedCount}`);
  console.log(`🔄 Tempat diperbarui: ${updatedCount}`);
  console.log(`📍 Total tempat di database sekarang: ${mergedPlaces.length}`);
  console.log('----------------------------------------------------');
  console.log('💡 Langkah berikutnya:');
  console.log('  git add assets/data/places.json');
  console.log('  git commit -m "data: update scraped google maps places"');
  console.log('  git push origin master');
  console.log('----------------------------------------------------');
}

// Run CLI directly only if executed directly from terminal
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const inputArg = process.argv[2];
  convertAndMerge(inputArg);
}
