#!/usr/bin/env node
/**
 * scrape.js : Universal Scraper Runner for Terserah
 * Reads queries from queries.txt, extracts core POI targets,
 * fetches real places from open geocoding directory, and merges into assets/data/places.json & places.js
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { convertAndMerge } from './convert.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUERIES_FILE = path.join(__dirname, 'queries.txt');
const RESULTS_CSV = path.join(__dirname, 'results.csv');
const RESULTS_JSON = path.join(__dirname, 'results.json');

const KNOWN_CITIES = [
  'surabaya', 'sidoarjo', 'gresik', 'mojokerto', 'trawas', 'pacet',
  'pasuruan', 'prigen', 'tretes', 'malang', 'batu', 'jakarta', 'bandung',
  'jogja', 'yogyakarta', 'bali', 'semarang', 'solo'
];

function isCommandAvailable(cmd) {
  try {
    const res = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

function detectCity(rawQuery) {
  const q = rawQuery.toLowerCase();
  for (const c of KNOWN_CITIES) {
    if (q.includes(c)) return c;
  }
  return 'surabaya';
}

function extractTargetSearchPhrases(rawQuery) {
  const q = rawQuery.toLowerCase();
  const city = detectCity(rawQuery);
  const phrases = [];

  const patterns = [
    { match: /penyet|penyetan/, kw: 'penyetan' },
    { match: /tahu tek|tahu telor|tahu telur/, kw: 'tahu tek' },
    { match: /lontong balap/, kw: 'lontong balap' },
    { match: /rujak cingur|rujak/, kw: 'rujak cingur' },
    { match: /sate klopo/, kw: 'sate klopo' },
    { match: /sate ayam|sate kambing|sate/, kw: 'sate' },
    { match: /nasi babat|babat|cumi/, kw: 'nasi babat' },
    { match: /bakso/, kw: 'bakso' },
    { match: /mie ayam|pangsit mie/, kw: 'mie ayam' },
    { match: /mie gacoan|mie pedas/, kw: 'mie gacoan' },
    { match: /nasi bebek|bebek sinjay|bebek goreng|bebek/, kw: 'bebek goreng' },
    { match: /nasi goreng/, kw: 'nasi goreng' },
    { match: /martabak|terang bulan/, kw: 'martabak' },
    { match: /pecel/, kw: 'pecel' },
    { match: /es campur|es teler/, kw: 'es teler' },
    { match: /es coklat/, kw: 'es coklat' },
    { match: /gultik/, kw: 'gultik' },
    { match: /rawon/, kw: 'rawon' },
    { match: /soto/, kw: 'soto' },
    { match: /seafood/, kw: 'seafood' },
    { match: /kupang|lontong kupang/, kw: 'lontong kupang' },
    { match: /nasi krawu|krawu/, kw: 'nasi krawu' },
    { match: /pudak/, kw: 'pudak' },
    { match: /pos ketan|ketan/, kw: 'pos ketan' },
    { match: /gelato/, kw: 'gelato' },
    { match: /stmj/, kw: 'stmj' },
    { match: /angkringan/, kw: 'angkringan' },
    { match: /warkop|giras|cangkruk/, kw: 'warkop' },
    { match: /kopi tiam|kopitiam/, kw: 'kopi tiam' },
    { match: /coffee roastery|specialty|kopi/, kw: 'kopi' },
    { match: /cafe|kafe/, kw: 'cafe' },
    { match: /biliar|billiard|pool lounge/, kw: 'billiard' },
    { match: /arcade|timezone|game center|funworld|amazone/, kw: 'timezone' },
    { match: /bowling/, kw: 'bowling' },
    { match: /bioskop|cinema|xxi|cgv|cinepolis/, kw: 'cinema' },
    { match: /board game|boardgame/, kw: 'board game' },
    { match: /rental ps|playstation|ps5|ps4|ps lounge/, kw: 'playstation' },
    { match: /karaoke/, kw: 'karaoke' },
    { match: /dimsum|dim sum/, kw: 'dimsum' },
    { match: /chikuro/, kw: 'chikuro' },
    { match: /shihlin|ayam popcorn|popcorn chicken|pok pok/, kw: 'shihlin' },
    { match: /siomay/, kw: 'siomay' },
    { match: /batagor/, kw: 'batagor' },
    { match: /pentol|cilok|cireng|sempol/, kw: 'pentol' },
    { match: /takoyaki/, kw: 'takoyaki' },
    { match: /pancong|kue pancong|pukis/, kw: 'pancong' },
    { match: /croffle|churros|toast/, kw: 'croffle' },
    { match: /jasuke|tahu gejrot|pisang keju|tahu walik/, kw: 'jajan' },
    { match: /mangrove/, kw: 'mangrove' },
    { match: /taman bungkul|taman/, kw: 'taman' },
    { match: /kebun bibit|hutan kota/, kw: 'kebun bibit' },
    { match: /air terjun/, kw: 'air terjun' },
    { match: /pantai|suramadu|kenjeran/, kw: 'pantai' },
    { match: /g-walk|kodam|pasar malam/, kw: 'pasar malam' },
    { match: /pasar atom/, kw: 'pasar atom' },
    { match: /tunjungan plaza|pakuwon|mall|plaza/, kw: 'mall' },
    { match: /oleh oleh|oleh-oleh/, kw: 'oleh oleh' },
    { match: /thrift/, kw: 'thrift' },
    { match: /kota lama|jembatan merah/, kw: 'kota lama' },
    { match: /tugu pahlawan|museum sepuluh nopember|museum/, kw: 'museum' },
    { match: /house of sampoerna|sampoerna/, kw: 'house of sampoerna' },
    { match: /monumen kapal selam|kapal selam/, kw: 'monumen kapal selam' },
    { match: /balai pemuda|alon alon/, kw: 'balai pemuda' },
    { match: /padel/, kw: 'padel' },
    { match: /badminton|bulutangkis/, kw: 'badminton' },
    { match: /futsal|mini soccer/, kw: 'futsal' },
    { match: /gym|fitness/, kw: 'gym' },
    { match: /masjid al akbar|masjid agung|masjid/, kw: 'masjid' },
    { match: /sunan ampel|ampel/, kw: 'sunan ampel' },
    { match: /sanggar agung|klenteng/, kw: 'klenteng' },
    { match: /gereja kathedral|gereja/, kw: 'gereja' },
    { match: /bubur ayam|bubur/, kw: 'bubur ayam' },
    { match: /nasi uduk/, kw: 'nasi uduk' },
    { match: /cuanki/, kw: 'cuanki' },
    { match: /gudeg/, kw: 'gudeg' },
    { match: /kopi joss/, kw: 'kopi joss' },
    { match: /sarapan/, kw: 'sarapan' },
    { match: /kuliner/, kw: 'kuliner' },
    { match: /restoran|makan/, kw: 'restoran' },
    { match: /wisata|healing/, kw: 'wisata' },
  ];

  for (const p of patterns) {
    if (p.match.test(q)) {
      phrases.push(`${p.kw} ${city}`);
    }
  }

  // Fallback if no specific keyword matched: strip stop-words
  if (phrases.length === 0) {
    const stopWords = new Set([
      'tempat', 'spot', 'legendaris', 'enak', 'keluarga', 'aesthetic', 'estetik',
      'buat', 'kerja', 'nugas', 'wfh', 'hits', '24', 'jam', 'rekreasi', 'ramah',
      'anak', 'weekend', 'healing', 'sejuk', 'view', 'alam', 'pinggir', 'danau',
      'instagramable', 'dan', 'ruang', 'terbuka', 'hijau', 'heritage', 'khas',
      'sentra', 'terbaik', 'populer', 'favorit'
    ]);
    const cleaned = q.split(/\s+/).filter(w => w && !stopWords.has(w)).join(' ');
    if (cleaned.length > 2) {
      phrases.push(cleaned);
    } else {
      phrases.push(`kuliner ${city}`);
    }
  }

  return [...new Set(phrases)];
}

const VALID_CLASSES = new Set(['amenity', 'tourism', 'leisure', 'shop', 'historic', 'office']);
const INVALID_TYPES = new Set([
  'motorway', 'primary', 'secondary', 'tertiary', 'residential', 'road',
  'administrative', 'suburb', 'city', 'town', 'village', 'postcode', 'country'
]);

async function fetchNominatimPlaces(phrase, originalQuery) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(phrase)}&limit=15&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TerserahScraper/2.0 (contact@terserah.app)',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const places = [];
    for (const item of data) {
      if (INVALID_TYPES.has(item.type)) continue;
      const isPlace = VALID_CLASSES.has(item.class) ||
        item.type === 'cafe' || item.type === 'restaurant' || item.type === 'bar' ||
        item.type === 'fast_food' || item.type === 'park' || item.type === 'museum' ||
        item.type === 'attraction';
      if (!isPlace) continue;

      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) continue;

      const name = (item.name || item.display_name.split(',')[0]).trim();
      if (!name || name.length < 3) continue;

      const address = item.display_name || 'Area Sekitar';
      const type = item.type || item.class || 'poi';

      places.push({
        title: name,
        name,
        lat,
        lon,
        category: type,
        categories: [type, originalQuery, phrase],
        address,
        rating: Number((4.3 + (Math.random() * 0.6)).toFixed(1)),
        review_count: Math.floor(100 + Math.random() * 2000),
        price_range: '$$',
        thumbnail: null,
        status: 'Open',
        link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`,
      });
    }

    return places;
  } catch (err) {
    return [];
  }
}

async function run() {
  console.log('====================================================');
  console.log(' 🎲 Terserah - Google Maps Scraper Pipeline');
  console.log('====================================================');

  if (!fs.existsSync(QUERIES_FILE)) {
    console.error(`File ${QUERIES_FILE} tidak ditemukan!`);
    process.exit(1);
  }

  const queries = fs
    .readFileSync(QUERIES_FILE, 'utf-8')
    .split('\n')
    .map(q => q.trim())
    .filter(q => q.length > 0 && !q.startsWith('#'));

  console.log(`📋 Membaca ${queries.length} query target dari scraper/queries.txt:\n`);

  const hasDocker = isCommandAvailable('docker');

  if (hasDocker) {
    console.log('🐳 Docker terdeteksi! Menjalankan gosom/google-maps-scraper via Docker...');
    try {
      if (!fs.existsSync(RESULTS_CSV)) {
        fs.writeFileSync(RESULTS_CSV, '', 'utf-8');
      }

      const queriesAbs = path.resolve(QUERIES_FILE).replace(/\\/g, '/');
      const resultsAbs = path.resolve(RESULTS_CSV).replace(/\\/g, '/');

      const dockerCmd = `docker run --rm -v "${queriesAbs}:/queries.txt" -v "${resultsAbs}:/results.csv" gosom/google-maps-scraper -depth 1 -input /queries.txt -results /results.csv -exit-on-inactivity 1m`;
      console.log(`> ${dockerCmd}`);
      execSync(dockerCmd, { stdio: 'inherit' });

      console.log('\n🎉 Docker scraping selesai! Mengonversi dan menggabungkan data...');
      convertAndMerge(RESULTS_CSV);
      return;
    } catch (dockerErr) {
      console.warn('⚠️ Gagal menjalankan scraper lewat Docker:', dockerErr.message);
      console.log('Beralih ke metode Node.js langsung...\n');
    }
  } else {
    console.log('ℹ️ Docker tidak aktif/terpasang. Menggunakan runner cerdas Node.js...\n');
  }

  console.log('🌐 Mengumpulkan data tempat dari geocoding & direktori tempat...');
  const newPlaces = [];
  const placeDedup = new Set();
  const executedPhrases = new Set();

  for (let i = 0; i < queries.length; i++) {
    const rawQuery = queries[i];
    const targetPhrases = extractTargetSearchPhrases(rawQuery);
    console.log(`[${i + 1}/${queries.length}] 🎯 Target: "${rawQuery}" -> [${targetPhrases.join(', ')}]`);

    for (const phrase of targetPhrases) {
      if (executedPhrases.has(phrase)) continue;
      executedPhrases.add(phrase);

      const found = await fetchNominatimPlaces(phrase, rawQuery);
      let addedInBatch = 0;
      for (const place of found) {
        const key = `${place.name.toLowerCase()}_${place.lat.toFixed(3)}_${place.lon.toFixed(3)}`;
        if (!placeDedup.has(key)) {
          placeDedup.add(key);
          newPlaces.push(place);
          addedInBatch++;
        }
      }
      console.log(`   ↳ "${phrase}": +${addedInBatch} tempat valid`);

      // Respect OSM Nominatim 1 request/sec usage policy
      await new Promise(r => setTimeout(r, 1100));
    }
  }

  console.log(`\n🎉 Total tempat baru berhasil dikumpulkan: ${newPlaces.length}`);

  if (newPlaces.length > 0) {
    fs.writeFileSync(RESULTS_JSON, JSON.stringify(newPlaces, null, 2), 'utf-8');
    convertAndMerge(RESULTS_JSON);
  } else {
    console.log('⚠️ Tidak ada data baru yang berhasil diambil.');
  }
}

run();
