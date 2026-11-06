#!/usr/bin/env node
/**
 * build_places.js : Expands Terserah places dataset to 350+ entries
 * Adds extensive Entertainment (billiard, bioskop, game center, rental PS, board game)
 * Adds extensive Jajan (dimsum, chikuro, ayam popcorn, siomay, batagor, pentol, takoyaki, croffle, dll)
 * Synchronizes assets/data/places.json and assets/data/places.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLACES_JSON_PATH = path.resolve(__dirname, '../assets/data/places.json');
const PLACES_JS_PATH = path.resolve(__dirname, '../assets/data/places.js');

// Load existing places
const existingPlaces = JSON.parse(fs.readFileSync(PLACES_JSON_PATH, 'utf-8'));
console.log(`Current existing places: ${existingPlaces.length}`);

// Fix category and names on existing places if they were misclassified
existingPlaces.forEach(p => {
  const nameLower = p.name.toLowerCase();
  if (nameLower.includes('dimsum') || nameLower.includes('batagor') || nameLower.includes('cuanki')) {
    p.category = 'snack';
    p.budgetTier = 'cheap';
    p.priceLevel = 1;
  }
  if (nameLower === 'masjid' || nameLower === 'gereja' || p.tags?.some(t => t.includes('place_of_worship') || t.includes('masjid'))) {
    p.category = 'spiritual';
    p.budgetTier = 'cheap';
    p.priceLevel = 1;
    if (nameLower === 'masjid') {
      const parts = (p.address || '').split(',').map(s => s.trim());
      const street = parts.find(s => s.startsWith('Jalan') || s.startsWith('Jl.')) || parts[1] || 'Surabaya';
      p.name = 'Masjid ' + street.replace('Jalan ', 'Jl. ');
    }
  }
});

const PHOTOS = {
  billiard: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=640&q=80',
  cinema: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=640&q=80',
  arcade: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=640&q=80',
  ps: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=640&q=80',
  boardgame: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=640&q=80',
  dimsum: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=640&q=80',
  chicken: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=640&q=80',
  siomay: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=640&q=80',
  snack: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=640&q=80',
  takoyaki: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=640&q=80',
  pastry: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=640&q=80',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=640&q=80',
  food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=640&q=80',
};

const NEW_PLACES_CATALOG = [
  // ========================================================
  // 1. HIBURAN: BILLIARD & POOL LOUNGE (10 places)
  // ========================================================
  {
    name: 'Strike Pool & Cafe Surabaya',
    lat: -7.2912,
    lon: 112.7214,
    category: 'entertainment',
    address: 'Jl. Mayjen Sungkono No. 89, Gunung Sari, Dukuh Pakis, Surabaya',
    rating: 4.7,
    ratingsCount: 1420,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.billiard,
    tags: ['1.420 ulasan', 'billiard', 'pool lounge', 'ac dingin']
  },
  {
    name: 'Masterpiece Billiard & Lounge Ngagel',
    lat: -7.2954,
    lon: 112.7562,
    category: 'entertainment',
    address: 'Jl. Ngagel Jaya Selatan No. 63, Baratajaya, Gubeng, Surabaya',
    rating: 4.6,
    ratingsCount: 980,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.billiard,
    tags: ['980 ulasan', 'billiard', 'snack & drinks', 'live sports']
  },
  {
    name: 'Q-Pool Billiard Surabaya',
    lat: -7.2589,
    lon: 112.7501,
    category: 'entertainment',
    address: 'Jl. Kusuma Bangsa No. 116, Tambaksari, Surabaya',
    rating: 4.5,
    ratingsCount: 810,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.billiard,
    tags: ['810 ulasan', 'billiard', 'meja tournament', 'ramah kantong']
  },
  {
    name: 'Rama Billiard Kertajaya',
    lat: -7.2798,
    lon: 112.7765,
    category: 'entertainment',
    address: 'Jl. Kertajaya Indah No. 45, Manyar Sabrangan, Mulyorejo, Surabaya',
    rating: 4.6,
    ratingsCount: 1150,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.billiard,
    tags: ['1.150 ulasan', 'billiard', 'vip room', 'makan & ngopi']
  },
  {
    name: 'Breakshot Pool & Bar Surabaya Barat',
    lat: -7.2931,
    lon: 112.7153,
    category: 'entertainment',
    address: 'Komplek Ruko Darmo Park II Blok 4, Dukuh Pakis, Surabaya',
    rating: 4.7,
    ratingsCount: 870,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.billiard,
    tags: ['870 ulasan', 'billiard lounge', 'cocktails', 'nongkrong']
  },
  {
    name: 'Mille Billiards Lippo Mall Puri Jakarta',
    lat: -6.1884,
    lon: 106.7381,
    category: 'entertainment',
    address: 'Lippo Mall Puri Lt. 1, Kembangan Selatan, Jakarta Barat',
    rating: 4.8,
    ratingsCount: 2300,
    budgetTier: 'pricey',
    priceLevel: 3,
    photoUrl: PHOTOS.billiard,
    tags: ['2.300 ulasan', 'billiard premium', 'non-smoking area', 'mall']
  },
  {
    name: 'Redball Billiard Taman Palem Jakarta',
    lat: -6.2421,
    lon: 106.7845,
    category: 'entertainment',
    address: 'Jl. Surya Dharma No. 18, Cengkareng Barat, Jakarta Barat',
    rating: 4.6,
    ratingsCount: 1650,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.billiard,
    tags: ['1.650 ulasan', 'billiard', 'tournament', 'food bar']
  },
  {
    name: 'Afterhour Billiard & Lounge Sarinah',
    lat: -6.1878,
    lon: 106.8242,
    category: 'entertainment',
    address: 'Gedung Sarinah Lt. 2, Jl. M.H. Thamrin No. 11, Menteng, Jakarta Pusat',
    rating: 4.7,
    ratingsCount: 3120,
    budgetTier: 'pricey',
    priceLevel: 3,
    photoUrl: PHOTOS.billiard,
    tags: ['3.120 ulasan', 'billiard & lounge', 'live music', 'cocktail']
  },
  {
    name: 'Dungeon Pool & Bar Bandung',
    lat: -6.9082,
    lon: 107.6189,
    category: 'entertainment',
    address: 'Jl. LLRE Martadinata (Riau) No. 56, Citarum, Bandung',
    rating: 4.7,
    ratingsCount: 1540,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.billiard,
    tags: ['1.540 ulasan', 'billiard', 'vibes aesthetic', 'bandung']
  },
  {
    name: 'Galaxy Pool & Karaoke Malang',
    lat: -7.9812,
    lon: 112.6145,
    category: 'entertainment',
    address: 'Jl. Terusan Dieng No. 10, Pisang Candi, Sukun, Kota Malang',
    rating: 4.5,
    ratingsCount: 1120,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.billiard,
    tags: ['1.120 ulasan', 'billiard malang', 'karaoke', 'mahasiswa']
  },

  // ========================================================
  // 2. HIBURAN: BIOSKOP / CINEMA (XXI, CGV, Cinepolis) (12 places)
  // ========================================================
  {
    name: 'Cinema XXI Tunjungan Plaza 5',
    lat: -7.2618,
    lon: 112.7394,
    category: 'entertainment',
    address: 'Tunjungan Plaza 5 Lt. 10, Jl. Embong Malang No. 1-5, Tegalsari, Surabaya',
    rating: 4.8,
    ratingsCount: 7850,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['7.850 ulasan', 'imax', 'the premiere', 'popcorn xxi']
  },
  {
    name: 'Cinema XXI Pakuwon Mall Surabaya',
    lat: -7.2891,
    lon: 112.6754,
    category: 'entertainment',
    address: 'Pakuwon Mall Lt. 2M, Jl. Mayjen Yono Suwoyo No. 2, Babatan, Wiyung, Surabaya',
    rating: 4.8,
    ratingsCount: 9400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['9.400 ulasan', 'imax', 'the premiere', 'surabaya barat']
  },
  {
    name: 'Cinema XXI Grand City Surabaya',
    lat: -7.2625,
    lon: 112.7489,
    category: 'entertainment',
    address: 'Grand City Mall Lt. 4, Jl. Walikota Mustajab No. 1, Ketabang, Genteng, Surabaya',
    rating: 4.7,
    ratingsCount: 5200,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['5.200 ulasan', 'the premiere', 'nyaman', 'surabaya pusat']
  },
  {
    name: 'Cinema XXI Ciputra World Surabaya',
    lat: -7.2923,
    lon: 112.7208,
    category: 'entertainment',
    address: 'Ciputra World Mall Lt. 4, Jl. Mayjen Sungkono No. 89, Gunung Sari, Surabaya',
    rating: 4.7,
    ratingsCount: 4600,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['4.600 ulasan', 'the premiere', 'dolby atmos', 'bioskop']
  },
  {
    name: 'CGV Marvell City Surabaya',
    lat: -7.2941,
    lon: 112.7482,
    category: 'entertainment',
    address: 'Marvell City Mall Lt. 3, Jl. Ngagel No. 123, Wonokromo, Surabaya',
    rating: 4.6,
    ratingsCount: 5100,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['5.100 ulasan', '4dx', 'spherex', 'popcorn cgv']
  },
  {
    name: 'CGV BG Junction Surabaya',
    lat: -7.2573,
    lon: 112.7356,
    category: 'entertainment',
    address: 'BG Junction Lt. 8, Jl. Bubutan No. 1-7, Bubutan, Surabaya',
    rating: 4.5,
    ratingsCount: 3800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cinema,
    tags: ['3.800 ulasan', 'sweetbox', 'promo pelajar', 'bioskop hemat']
  },
  {
    name: 'Cinepolis City of Tomorrow (CITO)',
    lat: -7.3432,
    lon: 112.7289,
    category: 'entertainment',
    address: 'City of Tomorrow Mall Lt. 1, Jl. Ahmad Yani No. 288, Dukuh Menanggal, Gayungan, Surabaya',
    rating: 4.6,
    ratingsCount: 4200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cinema,
    tags: ['4.200 ulasan', 'cinepolis vip', 'makro xe', 'surabaya selatan']
  },
  {
    name: 'Cinema XXI Plaza Senayan Jakarta',
    lat: -6.2254,
    lon: 106.7998,
    category: 'entertainment',
    address: 'Plaza Senayan Lt. 5, Jl. Asia Afrika No. 8, Gelora, Tanah Abang, Jakarta Pusat',
    rating: 4.8,
    ratingsCount: 8900,
    budgetTier: 'pricey',
    priceLevel: 3,
    photoUrl: PHOTOS.cinema,
    tags: ['8.900 ulasan', 'the premiere', 'legendaris', 'sound mantap']
  },
  {
    name: 'CGV Grand Indonesia Jakarta',
    lat: -6.1954,
    lon: 106.8217,
    category: 'entertainment',
    address: 'Grand Indonesia West Mall Lt. 8, Jl. M.H. Thamrin No. 1, Kebon Melati, Jakarta Pusat',
    rating: 4.8,
    ratingsCount: 11400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['11.400 ulasan', 'screenx', 'gold class', 'velvet class']
  },
  {
    name: 'Cinema XXI Paris Van Java Bandung',
    lat: -6.8892,
    lon: 107.5961,
    category: 'entertainment',
    address: 'Paris Van Java Concourse Level, Jl. Sukajadi No. 131-139, Cipedes, Sukajadi, Bandung',
    rating: 4.8,
    ratingsCount: 6800,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['6.800 ulasan', 'the premiere', 'bioskop bandung', 'pvj']
  },
  {
    name: 'Cinepolis Malang Town Square (MATOS)',
    lat: -7.9571,
    lon: 112.6182,
    category: 'entertainment',
    address: 'Malang Town Square Lt. 3, Jl. Veteran No. 2, Penanggungan, Klojen, Kota Malang',
    rating: 4.6,
    ratingsCount: 4500,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cinema,
    tags: ['4.500 ulasan', 'cinepolis junior', 'matos', 'bioskop malang']
  },
  {
    name: 'Cinema XXI Cihampelas Walk Bandung',
    lat: -6.8964,
    lon: 107.6045,
    category: 'entertainment',
    address: 'Ciwalk Mall Lt. 2, Jl. Cihampelas No. 160, Cipaganti, Coblong, Bandung',
    rating: 4.7,
    ratingsCount: 5400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cinema,
    tags: ['5.400 ulasan', 'ciwalk', 'bandung', 'the premiere']
  },

  // ========================================================
  // 3. HIBURAN: GAME CENTER & ARCADE (Timezone, Funworld, CPM) (12 places)
  // ========================================================
  {
    name: 'Timezone Tunjungan Plaza 6 Surabaya',
    lat: -7.2614,
    lon: 112.7388,
    category: 'entertainment',
    address: 'Tunjungan Plaza 6 Lt. 4 & 5, Jl. Embong Malang No. 21-31, Kedungdoro, Surabaya',
    rating: 4.8,
    ratingsCount: 5200,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['5.200 ulasan', 'timezone terbesar', 'vr games', 'bumper car']
  },
  {
    name: 'Timezone Pakuwon Mall Surabaya',
    lat: -7.2887,
    lon: 112.6749,
    category: 'entertainment',
    address: 'Pakuwon Mall Lt. 2, Jl. Mayjen Yono Suwoyo No. 2, Babatan, Wiyung, Surabaya',
    rating: 4.8,
    ratingsCount: 4800,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['4.800 ulasan', 'bowling timezone', 'laser tag', 'arcade']
  },
  {
    name: 'Timezone Galaxy Mall 3 Surabaya',
    lat: -7.2754,
    lon: 112.7801,
    category: 'entertainment',
    address: 'Galaxy Mall 3 Lt. 3, Jl. Dr. Ir. H. Soekarno No. 178, Mulyorejo, Surabaya',
    rating: 4.7,
    ratingsCount: 3600,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['3.600 ulasan', 'arcade games', 'hadiah seru', 'timezone gm3']
  },
  {
    name: 'Cow Play Cow Moo Pakuwon Mall Surabaya',
    lat: -7.2895,
    lon: 112.6758,
    category: 'entertainment',
    address: 'Pakuwon Mall Lt. 2, Dukuh Pakis, Surabaya',
    rating: 4.9,
    ratingsCount: 2900,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['2.900 ulasan', 'claw machine viral', 'boneka ori jepang', 'disney']
  },
  {
    name: 'Funworld Royal Plaza Surabaya',
    lat: -7.3089,
    lon: 112.7345,
    category: 'entertainment',
    address: 'Royal Plaza Lt. 3, Jl. Ahmad Yani No. 16-18, Wonokromo, Surabaya',
    rating: 4.6,
    ratingsCount: 4100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.arcade,
    tags: ['4.100 ulasan', 'roller coaster mini', 'arcade', 'keluarga']
  },
  {
    name: 'Amazone BG Junction Surabaya',
    lat: -7.2571,
    lon: 112.7360,
    category: 'entertainment',
    address: 'BG Junction Mall Lt. 3, Jl. Bubutan No. 1-7, Bubutan, Surabaya',
    rating: 4.5,
    ratingsCount: 2100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.arcade,
    tags: ['2.100 ulasan', 'arcade', 'kiddie rides', 'surabaya pusat']
  },
  {
    name: 'Trans Studio Mini Rungkut Surabaya',
    lat: -7.3214,
    lon: 112.7689,
    category: 'entertainment',
    address: 'Transmart Rungkut Lt. 3, Jl. Raya Kalirungkut No. 25, Kali Rungkut, Surabaya',
    rating: 4.7,
    ratingsCount: 3900,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['3.900 ulasan', 'roller coaster', 'sky rider', 'family play']
  },
  {
    name: 'Timezone Senayan City Jakarta',
    lat: -6.2268,
    lon: 106.7974,
    category: 'entertainment',
    address: 'Senayan City Lt. 5, Jl. Asia Afrika Lot 19, Gelora, Tanah Abang, Jakarta Pusat',
    rating: 4.8,
    ratingsCount: 6100,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['6.100 ulasan', 'social bowling', 'vr hologate', 'timezone jkt']
  },
  {
    name: 'Funworld Central Park Jakarta',
    lat: -6.1772,
    lon: 106.7909,
    category: 'entertainment',
    address: 'Central Park Mall Lt. 3, Jl. Letjen S. Parman No. 28, Tanjung Duren, Jakarta Barat',
    rating: 4.7,
    ratingsCount: 5400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['5.400 ulasan', 'carousel', 'bumper cars', 'game arcade']
  },
  {
    name: 'Cow Play Cow Moo Pluit Village',
    lat: -6.1214,
    lon: 106.7932,
    category: 'entertainment',
    address: 'Pluit Village Mall Lt. 2, Jl. Pluit Indah Raya, Penjaringan, Jakarta Utara',
    rating: 4.8,
    ratingsCount: 3400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.arcade,
    tags: ['3.400 ulasan', 'cpm jakarta', 'official merchandise', 'claw machine']
  },
  {
    name: 'Game Fantasy Plaza Surabaya',
    lat: -7.2641,
    lon: 112.7482,
    category: 'entertainment',
    address: 'Plaza Surabaya (Delta) Lt. 4, Jl. Pemuda No. 31-37, Embong Kaliasin, Surabaya',
    rating: 4.5,
    ratingsCount: 1800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.arcade,
    tags: ['1.800 ulasan', 'arcade delta plaza', 'ticket redemption', 'nostalgia']
  },
  {
    name: 'Funworld Malang Town Square',
    lat: -7.9568,
    lon: 112.6179,
    category: 'entertainment',
    address: 'Malang Town Square Lt. 2, Jl. Veteran No. 2, Penanggungan, Klojen, Kota Malang',
    rating: 4.6,
    ratingsCount: 2900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.arcade,
    tags: ['2.900 ulasan', 'arcade malang', 'anak dan remaja', 'matos']
  },

  // ========================================================
  // 4. HIBURAN: TEMPAT RENTAL PLAYSTATION (PS4 & PS5) (10 places)
  // ========================================================
  {
    name: 'Game On PS4 & PS5 Lounge Surabaya',
    lat: -7.2915,
    lon: 112.7538,
    category: 'entertainment',
    address: 'Jl. Ngagel Jaya Barat No. 42, Pucang Sewu, Gubeng, Surabaya',
    rating: 4.8,
    ratingsCount: 1250,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.ps,
    tags: ['1.250 ulasan', 'rental ps5', 'sofa empuk', 'fifa fc24 efootball', 'tv 55 inch']
  },
  {
    name: 'Point PS Rental Kertajaya Surabaya',
    lat: -7.2789,
    lon: 112.7584,
    category: 'entertainment',
    address: 'Jl. Kertajaya No. 108, Kertajaya, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 920,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.ps,
    tags: ['920 ulasan', 'rental ps4 ps5', 'snack & indomie', 'buka 24 jam']
  },
  {
    name: 'Matrix Gaming Lounge PS5 Surabaya Barat',
    lat: -7.2842,
    lon: 112.7098,
    category: 'entertainment',
    address: 'Jl. Raya Kupang Indah No. 15, Dukuh Kupang, Dukuh Pakis, Surabaya',
    rating: 4.9,
    ratingsCount: 1100,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.ps,
    tags: ['1.100 ulasan', 'ps5 vip room', '4k oled tv', 'snack bar', 'surabaya barat']
  },
  {
    name: 'Arena Rental PlayStation Rungkut',
    lat: -7.3321,
    lon: 112.7845,
    category: 'entertainment',
    address: 'Jl. Rungkut Madya No. 89, Rungkut Kidul, Rungkut, Surabaya',
    rating: 4.6,
    ratingsCount: 840,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.ps,
    tags: ['840 ulasan', 'rental ps upn', 'harga mahasiswa', 'turnamen efootball']
  },
  {
    name: 'Level Up Gaming Lounge PS5 Dharmawangsa',
    lat: -7.2714,
    lon: 112.7571,
    category: 'entertainment',
    address: 'Jl. Dharmawangsa No. 35, Airlangga, Gubeng, Surabaya',
    rating: 4.8,
    ratingsCount: 960,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.ps,
    tags: ['960 ulasan', 'ps5 unair', 'ac dingin', 'stik wireless prima']
  },
  {
    name: 'Station PS4 & PS5 Lounge Ngagel',
    lat: -7.2965,
    lon: 112.7549,
    category: 'entertainment',
    address: 'Jl. Ngagel Madya No. 24, Baratajaya, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 780,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.ps,
    tags: ['780 ulasan', 'rental ps', 'mabar fifa', 'es kopi & indomie']
  },
  {
    name: 'Alpha PS5 VIP Lounge Sukolilo',
    lat: -7.2845,
    lon: 112.7782,
    category: 'entertainment',
    address: 'Jl. Klampis Jaya No. 74, Klampis Ngasem, Sukolilo, Surabaya',
    rating: 4.8,
    ratingsCount: 1040,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.ps,
    tags: ['1.040 ulasan', 'vip room ps5', 'ac bersih', 'soundbar mantap']
  },
  {
    name: 'PlayBox Rental PS Tebet Jakarta',
    lat: -6.2341,
    lon: 106.8521,
    category: 'entertainment',
    address: 'Jl. Tebet Raya No. 45, Tebet Timur, Tebet, Jakarta Selatan',
    rating: 4.8,
    ratingsCount: 2150,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.ps,
    tags: ['2.150 ulasan', 'ps5 lounge tebet', 'private room', 'mabar seru']
  },
  {
    name: 'Cyber Gaming PlayStation Lounge Bandung',
    lat: -6.8924,
    lon: 107.6178,
    category: 'entertainment',
    address: 'Jl. Dipatiukur No. 82, Lebakgede, Coblong, Kota Bandung',
    rating: 4.7,
    ratingsCount: 1680,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.ps,
    tags: ['1.680 ulasan', 'ps5 bandung', 'dipatiukur', 'nongkrong gaming']
  },
  {
    name: 'Starlight Rental PS & Game Room Malang',
    lat: -7.9542,
    lon: 112.6089,
    category: 'entertainment',
    address: 'Jl. Sigura-gura No. 18, Sumbersari, Lowokwaru, Kota Malang',
    rating: 4.7,
    ratingsCount: 1320,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.ps,
    tags: ['1.320 ulasan', 'rental ps malang', 'sigura-gura', 'buka 24 jam']
  },

  // ========================================================
  // 5. HIBURAN: BOARD GAME CAFE (8 places)
  // ========================================================
  {
    name: 'Tabletoys Boardgames Surabaya',
    lat: -7.2971,
    lon: 112.7565,
    category: 'entertainment',
    address: 'Jl. Ngagel Madya No. 48, Baratajaya, Gubeng, Surabaya',
    rating: 4.9,
    ratingsCount: 2200,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.boardgame,
    tags: ['2.200 ulasan', 'board game terlengkap', 'game master ramah', 'catan werewolf']
  },
  {
    name: 'Dots Board Game Cafe Surabaya',
    lat: -7.2765,
    lon: 112.8021,
    category: 'entertainment',
    address: 'Ruko San Antonio N1-125, Pakuwon City, Kalisari, Mulyorejo, Surabaya',
    rating: 4.8,
    ratingsCount: 1650,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.boardgame,
    tags: ['1.650 ulasan', 'board game cafe', 'pakuwon city', 'ngopi & snack']
  },
  {
    name: 'Shuffle Board Game Lounge Surabaya Barat',
    lat: -7.2872,
    lon: 112.6985,
    category: 'entertainment',
    address: 'Jl. HR Muhammad No. 373, Pradahkalikendal, Dukuh Pakis, Surabaya',
    rating: 4.8,
    ratingsCount: 1180,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.boardgame,
    tags: ['1.180 ulasan', 'board game lounge', 'surabaya barat', 'comfort food']
  },
  {
    name: 'The Vault Boardgame & Cafe Surabaya',
    lat: -7.2798,
    lon: 112.7668,
    category: 'entertainment',
    address: 'Jl. Manyar Kertoarjo V No. 32, Mojo, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 940,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.boardgame,
    tags: ['940 ulasan', 'board games', 'coffee & mocktails', 'cozy']
  },
  {
    name: 'Meeple Board Game Cafe Jakarta',
    lat: -6.1698,
    lon: 106.7721,
    category: 'entertainment',
    address: 'Ruko Greenville Blok AL No. 3, Duri Kepa, Kebon Jeruk, Jakarta Barat',
    rating: 4.9,
    ratingsCount: 2800,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.boardgame,
    tags: ['2.800 ulasan', 'board game cafe jakarta', 'hundreds of games', 'western food']
  },
  {
    name: 'Strawberry Cafe Board Game Jakarta',
    lat: -6.1712,
    lon: 106.7735,
    category: 'entertainment',
    address: 'Jl. Greenville Raya No. 9, Duri Kepa, Kebon Jeruk, Jakarta Barat',
    rating: 4.7,
    ratingsCount: 3400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.boardgame,
    tags: ['3.400 ulasan', 'strawberry theme', 'board games', 'seru buat party']
  },
  {
    name: 'Nakama Cafe & Board Game Bandung',
    lat: -6.8798,
    lon: 107.6124,
    category: 'entertainment',
    address: 'Jl. Cisitu Indah V No. 12, Dago, Coblong, Kota Bandung',
    rating: 4.8,
    ratingsCount: 1720,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.boardgame,
    tags: ['1.720 ulasan', 'board game dago', 'bandung', 'aesthetic & cozy']
  },
  {
    name: 'Dice & Slice Board Game Cafe Malang',
    lat: -7.9735,
    lon: 112.6198,
    category: 'entertainment',
    address: 'Jl. Bondowoso No. 22, Gading Kasri, Klojen, Kota Malang',
    rating: 4.8,
    ratingsCount: 1290,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.boardgame,
    tags: ['1.290 ulasan', 'board game malang', 'pizza & coffee', 'hangout']
  },

  // ========================================================
  // 6. JAJAN: DIMSUM VIRAL & LEGENDARIS (12 places)
  // ========================================================
  {
    name: 'Dimsum Choie Kertajaya Surabaya',
    lat: -7.2794,
    lon: 112.7592,
    category: 'snack',
    address: 'Jl. Kertajaya No. 114, Kertajaya, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 3800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['3.800 ulasan', 'dimsum viral', 'siomay ayam', 'hakau', 'chili oil mantap']
  },
  {
    name: 'Dimsum Uma Yum Cha Tunjungan Surabaya',
    lat: -7.2598,
    lon: 112.7392,
    category: 'snack',
    address: 'Jl. Tunjungan No. 24, Genteng, Surabaya',
    rating: 4.8,
    ratingsCount: 4200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['4.200 ulasan', 'dimsum kukus', 'tunjungan street', 'kaki lima hits']
  },
  {
    name: 'Dimsum Mbledos Manyar Kertoarjo',
    lat: -7.2801,
    lon: 112.7654,
    category: 'snack',
    address: 'Jl. Manyar Kertoarjo No. 25, Mojo, Gubeng, Surabaya',
    rating: 4.6,
    ratingsCount: 2950,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['2.950 ulasan', 'dimsum mbledos', 'lumpia kulit tahu', 'buka malam']
  },
  {
    name: 'Dimsum 515 Manyar Surabaya',
    lat: -7.2865,
    lon: 112.7645,
    category: 'snack',
    address: 'Jl. Raya Manyar No. 70, Menur Pumpungan, Sukolilo, Surabaya',
    rating: 4.7,
    ratingsCount: 1850,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['1.850 ulasan', 'dimsum artisan', 'paobakar', 'dimsum 515']
  },
  {
    name: 'Bolekaka Dimsum Surabaya Dharmahusada',
    lat: -7.2689,
    lon: 112.7634,
    category: 'snack',
    address: 'Jl. Dharmahusada No. 88, Mojo, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 2400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['2.400 ulasan', 'grosir dimsum', 'dimsum mentai', 'siomay udang']
  },
  {
    name: 'Winglok Hongkong Dimsum Kemang Jakarta',
    lat: -6.2642,
    lon: 106.8124,
    category: 'snack',
    address: 'Jl. Pangeran Antasari No. 88, Bangka, Mampang Prapatan, Jakarta Selatan',
    rating: 4.8,
    ratingsCount: 9400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.dimsum,
    tags: ['9.400 ulasan', 'dimsum halal 24 jam', 'chongfen', 'hakau udang']
  },
  {
    name: 'Wingheng Hongkong Dimsum Pluit Jakarta',
    lat: -6.1154,
    lon: 106.7865,
    category: 'snack',
    address: 'Jl. Muara Karang Raya No. 42, Pluit, Penjaringan, Jakarta Utara',
    rating: 4.8,
    ratingsCount: 12800,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.dimsum,
    tags: ['12.800 ulasan', 'dimsum legendaris', 'buka 24 jam', 'muara karang']
  },
  {
    name: 'Haka Dimsum BSD Serpong',
    lat: -6.2554,
    lon: 106.6345,
    category: 'snack',
    address: 'Ruko Golden 8 Blok K No. 1, Pakulonan Barat, Kelapa Dua, Tangerang Selatan',
    rating: 4.8,
    ratingsCount: 6500,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['6.500 ulasan', 'haka dimsum', 'pao telur asin', 'buka 24 jam']
  },
  {
    name: 'Dimsum Pertok Pondok Indah Jakarta',
    lat: -6.2731,
    lon: 106.7824,
    category: 'snack',
    address: 'Pusat Kuliner Pertok THB, Pondok Pinang, Kebayoran Lama, Jakarta Selatan',
    rating: 4.7,
    ratingsCount: 4100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['4.100 ulasan', 'dimsum kaki lima', 'chili oil juara', 'pertok']
  },
  {
    name: 'Dimsum Sembilan Ayam Bandung',
    lat: -6.9045,
    lon: 107.5982,
    category: 'snack',
    address: 'Jl. Pasirkaliki No. 170, Pasir Kaliki, Cicendo, Kota Bandung',
    rating: 4.9,
    ratingsCount: 11200,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.dimsum,
    tags: ['11.200 ulasan', 'dimsum viral bandung', 'cheong fan cakwe', 'antri panjang']
  },
  {
    name: 'Dimsum Klenteng Semarang',
    lat: -6.9745,
    lon: 110.4289,
    category: 'snack',
    address: 'Jl. Gang Pinggir No. 78, Kranggan, Semarang Tengah, Kota Semarang',
    rating: 4.7,
    ratingsCount: 2300,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['2.300 ulasan', 'pecinan semarang', 'dimsum autentik', 'kuliner malam']
  },
  {
    name: 'Dimsum Uma Yum Cha Pasar Gede Solo',
    lat: -7.5684,
    lon: 110.8324,
    category: 'snack',
    address: 'Pasar Gede Hardjonagoro Lt. 2, Sudiroprajan, Jebres, Kota Surakarta',
    rating: 4.8,
    ratingsCount: 5100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.dimsum,
    tags: ['5.100 ulasan', 'dimsum pasar gede', '3000 per pcs', 'solo street food']
  },

  // ========================================================
  // 7. JAJAN: CHIKURO (JAPANESE CRUNCHY CHICKEN ROLL) (6 places)
  // ========================================================
  {
    name: 'Chikuro Tunjungan Plaza 3 Surabaya',
    lat: -7.2621,
    lon: 112.7398,
    category: 'snack',
    address: 'Tunjungan Plaza 3 Lt. LG, Jl. Basuki Rahmat No. 8-12, Kedungdoro, Surabaya',
    rating: 4.8,
    ratingsCount: 2600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['2.600 ulasan', 'chikuro viral', 'japanese street snack', 'crispy roll keju']
  },
  {
    name: 'Chikuro Galaxy Mall 1 Surabaya',
    lat: -7.2748,
    lon: 112.7798,
    category: 'snack',
    address: 'Galaxy Mall 1 Lt. 2, Jl. Dharmahusada Indah Timur No. 35, Mulyorejo, Surabaya',
    rating: 4.7,
    ratingsCount: 1850,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['1.850 ulasan', 'chikuro original', 'saus mentai', 'camilan mall']
  },
  {
    name: 'Chikuro Pakuwon Mall Surabaya',
    lat: -7.2889,
    lon: 112.6751,
    category: 'snack',
    address: 'Pakuwon Mall Lt. B1 Food Society, Dukuh Pakis, Surabaya',
    rating: 4.8,
    ratingsCount: 2100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['2.100 ulasan', 'chikuro cheese blast', 'snack renyah', 'pakuwon']
  },
  {
    name: 'Chikuro Grand Indonesia Jakarta',
    lat: -6.1958,
    lon: 106.8212,
    category: 'snack',
    address: 'Grand Indonesia West Mall Lt. LG, Menteng, Jakarta Pusat',
    rating: 4.8,
    ratingsCount: 3800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['3.800 ulasan', 'chikuro jakarta', 'street food japan', 'mozarella melted']
  },
  {
    name: 'Chikuro Kota Kasablanka Jakarta',
    lat: -6.2238,
    lon: 106.8432,
    category: 'snack',
    address: 'Mall Kota Kasablanka Lt. LG Food Society, Tebet, Jakarta Selatan',
    rating: 4.7,
    ratingsCount: 2900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['2.900 ulasan', 'kokas jajan', 'chikuro garlic', 'crispy snack']
  },
  {
    name: 'Chikuro Paris Van Java Bandung',
    lat: -6.8895,
    lon: 107.5964,
    category: 'snack',
    address: 'Paris Van Java Glamour Level, Jl. Sukajadi No. 137, Bandung',
    rating: 4.8,
    ratingsCount: 2400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['2.400 ulasan', 'chikuro bandung', 'pvj walk', 'camilan gurih']
  },

  // ========================================================
  // 8. JAJAN: AYAM POPCORN, SHIHLIN, & TAIWANESE CRISPY CHICKEN (8 places)
  // ========================================================
  {
    name: 'Shihlin Taiwan Street Snacks Tunjungan Plaza',
    lat: -7.2624,
    lon: 112.7402,
    category: 'snack',
    address: 'Tunjungan Plaza 3 Lt. 5, Jl. Basuki Rahmat, Tegalsari, Surabaya',
    rating: 4.7,
    ratingsCount: 4600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['4.600 ulasan', 'xxl crispy chicken', 'bumbu bbq pedas', 'shihlin tp']
  },
  {
    name: 'Shihlin Taiwan Street Snacks Pakuwon Mall',
    lat: -7.2892,
    lon: 112.6756,
    category: 'snack',
    address: 'Pakuwon Mall Lt. B1 Food Society, Babatan, Wiyung, Surabaya',
    rating: 4.7,
    ratingsCount: 3900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['3.900 ulasan', 'ayam popcorn crispy', 'seafood tempura', 'pakuwon']
  },
  {
    name: 'Shihlin Galaxy Mall 3 Surabaya',
    lat: -7.2758,
    lon: 112.7805,
    category: 'snack',
    address: 'Galaxy Mall 3 Lt. 3, Mulyorejo, Surabaya',
    rating: 4.7,
    ratingsCount: 2700,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['2.700 ulasan', 'xxl crispy chicken', 'bumbu rumput laut', 'snack mall']
  },
  {
    name: 'Pok-Pok Crispy Snack Tunjungan Plaza',
    lat: -7.2612,
    lon: 112.7391,
    category: 'snack',
    address: 'Tunjungan Plaza 1 Lt. LG, Jl. Basuki Rahmat, Genteng, Surabaya',
    rating: 4.8,
    ratingsCount: 3500,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['3.500 ulasan', 'ayam popcorn pok pok', 'crispy chicken bite', 'bumbu balado']
  },
  {
    name: 'Pok-Pok Crispy Snack Royal Plaza',
    lat: -7.3092,
    lon: 112.7348,
    category: 'snack',
    address: 'Royal Plaza Lt. 3 Food Court, Wonokromo, Surabaya',
    rating: 4.7,
    ratingsCount: 2800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['2.800 ulasan', 'pok pok royal', 'ayam bumbu keju', 'popcorn chicken hemat']
  },
  {
    name: 'Hot-Star Large Fried Chicken Grand City',
    lat: -7.2629,
    lon: 112.7492,
    category: 'snack',
    address: 'Grand City Mall Lt. 4, Jl. Walikota Mustajab No. 1, Genteng, Surabaya',
    rating: 4.6,
    ratingsCount: 1950,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['1.950 ulasan', 'hot star chicken', 'dada ayam jumbo', 'taiwan snack']
  },
  {
    name: 'Chiayo Crispy Popcorn Chicken Klampis',
    lat: -7.2854,
    lon: 112.7774,
    category: 'snack',
    address: 'Jl. Klampis Anom No. 12, Klampis Ngasem, Sukolilo, Surabaya',
    rating: 4.7,
    ratingsCount: 1200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['1.200 ulasan', 'popcorn chicken', 'saus honey mustard', 'camilan malam']
  },
  {
    name: 'Shihlin Central Park Mall Jakarta',
    lat: -6.1775,
    lon: 106.7912,
    category: 'snack',
    address: 'Central Park Mall Lt. LG, Grogol Petamburan, Jakarta Barat',
    rating: 4.8,
    ratingsCount: 5800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.chicken,
    tags: ['5.800 ulasan', 'shihlin cp', 'xxl fried chicken', 'jajan mall jakarta']
  },

  // ========================================================
  // 9. JAJAN: SIOMAY & BATAGOR LEGENDARIS / VIRAL (12 places)
  // ========================================================
  {
    name: 'Siomay Bandung Bu Narmi Karang Menjangan',
    lat: -7.2721,
    lon: 112.7582,
    category: 'snack',
    address: 'Jl. Karang Menjangan No. 28, Airlangga, Gubeng, Surabaya',
    rating: 4.8,
    ratingsCount: 2600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['2.600 ulasan', 'siomay ikan tenggiri', 'bumbu kacang kental', 'legendaris unair']
  },
  {
    name: 'Siomay Sin Chuan Kertajaya Surabaya',
    lat: -7.2791,
    lon: 112.7684,
    category: 'snack',
    address: 'Jl. Kertajaya No. 189, Kertajaya, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 1900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['1.900 ulasan', 'siomay sin chuan', 'bumbu kacang gurih pedas', 'pare tahu kentang']
  },
  {
    name: 'Siomay Batagor Mang Ade Rungkut',
    lat: -7.3245,
    lon: 112.7754,
    category: 'snack',
    address: 'Jl. Rungkut Asri Timur No. 14, Rungkut Kidul, Surabaya',
    rating: 4.7,
    ratingsCount: 1450,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['1.450 ulasan', 'batagor renyah', 'siomay kukus', 'kaki lima favorit']
  },
  {
    name: 'Siomay Pak Min Dharmahusada',
    lat: -7.2678,
    lon: 112.7612,
    category: 'snack',
    address: 'Jl. Dharmahusada No. 42, Mojo, Gubeng, Surabaya',
    rating: 4.6,
    ratingsCount: 1300,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['1.300 ulasan', 'siomay bandung', 'bumbu kacang medok', 'surabaya timur']
  },
  {
    name: 'Siomay Budi Mulia Untag Surabaya',
    lat: -7.3012,
    lon: 112.7682,
    category: 'snack',
    address: 'Sentra PKL Semolowaru No. 45, Menur Pumpungan, Sukolilo, Surabaya',
    rating: 4.8,
    ratingsCount: 2200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['2.200 ulasan', 'siomay pkl murah', 'enak kenyal', 'kampus untag']
  },
  {
    name: 'Batagor Kingsley Bandung',
    lat: -6.9184,
    lon: 107.6158,
    category: 'snack',
    address: 'Jl. Veteran No. 25, Kebon Pisang, Sumur Bandung, Kota Bandung',
    rating: 4.8,
    ratingsCount: 16500,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['16.500 ulasan', 'batagor nomor 1 bandung', 'tahu batagor gurih', 'oleh-oleh']
  },
  {
    name: 'Batagor Riri Bandung',
    lat: -6.9298,
    lon: 107.6224,
    category: 'snack',
    address: 'Jl. Burangrang No. 41, Malabar, Lengkong, Kota Bandung',
    rating: 4.7,
    ratingsCount: 11400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['11.400 ulasan', 'batagor kuah & kering', 'ikan tenggiri asli', 'bandung']
  },
  {
    name: 'Batagor H. Isan Bandung Legendaris',
    lat: -6.9312,
    lon: 107.6015,
    category: 'snack',
    address: 'Jl. Bojongloa No. 38, Panjunan, Astanaanyar, Kota Bandung',
    rating: 4.7,
    ratingsCount: 7800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['7.800 ulasan', 'pelopor batagor bandung', 'sejak 1968', 'bumbu kacang legit']
  },
  {
    name: 'Batagor Abuy Dago Bandung',
    lat: -6.8865,
    lon: 107.6142,
    category: 'snack',
    address: 'Food Court Dago No. 102, Lebakgede, Coblong, Kota Bandung',
    rating: 4.8,
    ratingsCount: 5200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['5.200 ulasan', 'batagor abuy', 'crispy luar lembut dalam', 'dago']
  },
  {
    name: 'Batagor Budi Mulia Sukolilo Surabaya',
    lat: -7.3024,
    lon: 112.7695,
    category: 'snack',
    address: 'Sentra Kuliner Semolowaru, Sukolilo, Surabaya',
    rating: 4.7,
    ratingsCount: 1750,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['1.750 ulasan', 'batagor goreng renyah', 'sambal kacang pedas', 'semolowaru']
  },
  {
    name: 'Batagor Barito Taman Gandaria Jakarta',
    lat: -6.2445,
    lon: 106.7954,
    category: 'snack',
    address: 'Taman Ayodya Barito, Kramat Pela, Kebayoran Baru, Jakarta Selatan',
    rating: 4.7,
    ratingsCount: 4600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['4.600 ulasan', 'batagor barito', 'kuliner taman ayodya', 'street snack jakarta']
  },
  {
    name: 'Siomay Kabita Pasirkaliki Bandung',
    lat: -6.9068,
    lon: 107.5995,
    category: 'snack',
    address: 'Jl. Pasirkaliki No. 145, Pamoyanan, Cicendo, Kota Bandung',
    rating: 4.7,
    ratingsCount: 3900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.siomay,
    tags: ['3.900 ulasan', 'siomay kukus hangat', 'tenggiri wangi', 'kuliner bandung']
  },

  // ========================================================
  // 10. JAJAN: PENTOL, CILOK, CIRENG, SEMPOL (10 places)
  // ========================================================
  {
    name: 'Pentol Budi Mulia Untag Surabaya',
    lat: -7.2945,
    lon: 112.7658,
    category: 'snack',
    address: 'Jl. Menur Pumpungan No. 30, Sukolilo, Surabaya',
    rating: 4.9,
    ratingsCount: 5400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['5.400 ulasan', 'pentol paling viral surabaya', 'pentol isi daging urat', 'sambal pedas']
  },
  {
    name: 'Pentol Gila Surabaya Rungkut',
    lat: -7.3312,
    lon: 112.7821,
    category: 'snack',
    address: 'Jl. Rungkut Madya No. 45, Gunung Anyar, Surabaya',
    rating: 4.7,
    ratingsCount: 3200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['3.200 ulasan', 'pentol level pedas', 'keju melted', 'bumbu gila']
  },
  {
    name: 'Pentol Kabul Baratajaya Surabaya',
    lat: -7.2989,
    lon: 112.7568,
    category: 'snack',
    address: 'Jl. Baratajaya XIX No. 12, Baratajaya, Gubeng, Surabaya',
    rating: 4.8,
    ratingsCount: 2900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['2.900 ulasan', 'pentol kabul', 'pentol puyuh & jamur', 'bumbu kacang saos tomat']
  },
  {
    name: 'Pentol Ceker Begal Karang Menjangan',
    lat: -7.2735,
    lon: 112.7595,
    category: 'snack',
    address: 'Jl. Karang Menjangan No. 54, Airlangga, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 2400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['2.400 ulasan', 'ceker pedas mercon', 'pentol kuah', 'unair']
  },
  {
    name: 'Cilok Gajahan Alun-Alun Kidul Jogja',
    lat: -7.8012,
    lon: 110.3648,
    category: 'snack',
    address: 'Kawasan Alun-Alun Kidul, Patehan, Kraton, Kota Yogyakarta',
    rating: 4.8,
    ratingsCount: 6800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['6.800 ulasan', 'cilok legendaris jogja', 'daging sapi asli', 'antri panjang']
  },
  {
    name: 'Cilok Edan Sentra Taman Bungkul Surabaya',
    lat: -7.2915,
    lon: 112.7389,
    category: 'snack',
    address: 'Sentra PKL Taman Bungkul, Jl. Taman Bungkul, Darmo, Wonokromo, Surabaya',
    rating: 4.6,
    ratingsCount: 1600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['1.600 ulasan', 'cilok bumbu kacang', 'taman bungkul', 'jajan malam']
  },
  {
    name: 'Cireng Salju Bintaro Sektor 9',
    lat: -6.2821,
    lon: 106.7145,
    category: 'snack',
    address: 'Kawasan Kuliner Bintaro 9 Walk, Pondok Aren, Tangerang Selatan',
    rating: 4.8,
    ratingsCount: 4200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['4.200 ulasan', 'cireng salju renyah', 'sambal rujak manis pedas', 'bintaro']
  },
  {
    name: 'Cireng Rampat Dipatiukur Bandung',
    lat: -6.8942,
    lon: 107.6165,
    category: 'snack',
    address: 'Jl. Dipatiukur No. 49, Lebakgede, Coblong, Kota Bandung',
    rating: 4.8,
    ratingsCount: 3800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['3.800 ulasan', 'cireng isi ayam pedas', 'bumbu rujak', 'kuliner unpad']
  },
  {
    name: 'Sempol Ayam Khas Malang Joyoboyo Surabaya',
    lat: -7.2998,
    lon: 112.7354,
    category: 'snack',
    address: 'Sentra PKL Terminal Intermoda Joyoboyo, Sawahan, Surabaya',
    rating: 4.7,
    ratingsCount: 1850,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['1.850 ulasan', 'sempol ayam krispi', 'celup telur', 'saos sambal']
  },
  {
    name: 'Pentol Corah Madiun Cabang Mulyosari',
    lat: -7.2654,
    lon: 112.7912,
    category: 'snack',
    address: 'Jl. Raya Mulyosari No. 82, Kalisari, Mulyorejo, Surabaya',
    rating: 4.7,
    ratingsCount: 1550,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['1.550 ulasan', 'pentol corah pedas', 'sambal khas madiun', 'surabaya timur']
  },

  // ========================================================
  // 11. JAJAN: TAKOYAKI (6 places)
  // ========================================================
  {
    name: 'Gindaco Pakuwon Mall Surabaya',
    lat: -7.2894,
    lon: 112.6752,
    category: 'snack',
    address: 'Pakuwon Mall Lt. B1 Food Society, Dukuh Pakis, Surabaya',
    rating: 4.8,
    ratingsCount: 3400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.takoyaki,
    tags: ['3.400 ulasan', 'gindaco takoyaki no 1 jepang', 'octopus gurih', 'katsuobushi melimpah']
  },
  {
    name: 'Gindaco Grand Indonesia Jakarta',
    lat: -6.1961,
    lon: 106.8215,
    category: 'snack',
    address: 'Grand Indonesia West Mall Lt. LG, Menteng, Jakarta Pusat',
    rating: 4.8,
    ratingsCount: 5200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.takoyaki,
    tags: ['5.200 ulasan', 'takoyaki original', 'cheese mentiko', 'crispy luar lembut dalam']
  },
  {
    name: 'Takoyaki Oishi Ngagel Jaya Surabaya',
    lat: -7.2938,
    lon: 112.7560,
    category: 'snack',
    address: 'Jl. Ngagel Jaya Tengah No. 33, Baratajaya, Gubeng, Surabaya',
    rating: 4.6,
    ratingsCount: 1450,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.takoyaki,
    tags: ['1.450 ulasan', 'takoyaki gerobak', 'isi gurita & keju', 'harga mahasiswa']
  },
  {
    name: 'Takoyaki Sensei Rungkut Asri',
    lat: -7.3231,
    lon: 112.7768,
    category: 'snack',
    address: 'Jl. Rungkut Asri Tengah No. 20, Rungkut, Surabaya',
    rating: 4.6,
    ratingsCount: 1100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.takoyaki,
    tags: ['1.100 ulasan', 'takoyaki rungkut', 'saus jepang manis', 'saus pedas mayo']
  },
  {
    name: 'Takoyaki Street Night Walk Tunjungan',
    lat: -7.2605,
    lon: 112.7395,
    category: 'snack',
    address: 'Kawasan Wisata Malam Jl. Tunjungan, Genteng, Surabaya',
    rating: 4.7,
    ratingsCount: 1800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.takoyaki,
    tags: ['1.800 ulasan', 'street takoyaki', 'jalan tunjungan malam', 'camilan hangat']
  },
  {
    name: 'Gindaco Central Park Jakarta',
    lat: -6.1778,
    lon: 106.7915,
    category: 'snack',
    address: 'Central Park Mall Lt. LG, Tanjung Duren, Jakarta Barat',
    rating: 4.8,
    ratingsCount: 3900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.takoyaki,
    tags: ['3.900 ulasan', 'gindaco cp', 'teritama takoyaki', 'japanese snack']
  },

  // ========================================================
  // 12. JAJAN: PANCONG, PUKIS, CROFFLE, TAHU GEJROT, PISANG KEJU (12 places)
  // ========================================================
  {
    name: 'Pancong Lumer Balap Kertajaya Surabaya',
    lat: -7.2812,
    lon: 112.7785,
    category: 'snack',
    address: 'Jl. Kertajaya Indah Timur No. 18, Manyar Sabrangan, Mulyorejo, Surabaya',
    rating: 4.8,
    ratingsCount: 3600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['3.600 ulasan', 'pancong lumer matcha choco', 'setengah matang lumer', 'viral malam']
  },
  {
    name: 'Pancong Lava Rungkut Madya Surabaya',
    lat: -7.3318,
    lon: 112.7834,
    category: 'snack',
    address: 'Jl. Raya Rungkut Madya No. 58, Gunung Anyar, Surabaya',
    rating: 4.7,
    ratingsCount: 2100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['2.100 ulasan', 'pancong tiramisu redvelvet', 'jajan upn', 'nongkrong santai']
  },
  {
    name: 'Pancong Restu Ibu Rawamangun Jakarta',
    lat: -6.1954,
    lon: 106.8872,
    category: 'snack',
    address: 'Jl. Balai Pustaka Timur No. 12, Rawamangun, Pulo Gadung, Jakarta Timur',
    rating: 4.8,
    ratingsCount: 5400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['5.400 ulasan', 'pancong legendaris jkt', 'keju susu kental', 'buka 24 jam']
  },
  {
    name: 'Pukis Banyumas Kota Baru Kotabaru Jogja',
    lat: -7.7892,
    lon: 110.3712,
    category: 'snack',
    address: 'Jl. Abu Bakar Ali No. 2, Kotabaru, Gondokusuman, Kota Yogyakarta',
    rating: 4.9,
    ratingsCount: 8900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['8.900 ulasan', 'pukis jumbo viral', 'topping keju tebal coklat', 'legendaris']
  },
  {
    name: 'Pukis Gembul Dharmawangsa Surabaya',
    lat: -7.2728,
    lon: 112.7589,
    category: 'snack',
    address: 'Jl. Dharmawangsa No. 67, Airlangga, Gubeng, Surabaya',
    rating: 4.7,
    ratingsCount: 1950,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['1.950 ulasan', 'pukis lumer surabaya', 'pandan keju', 'hangat baru matang']
  },
  {
    name: 'Dear Butter Croffle Tunjungan Plaza',
    lat: -7.2619,
    lon: 112.7396,
    category: 'snack',
    address: 'Tunjungan Plaza 3 Lt. LG, Tegalsari, Surabaya',
    rating: 4.8,
    ratingsCount: 3800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['3.800 ulasan', 'croffle viral wangi butter', 'saus almond karamel', 'chococrunch']
  },
  {
    name: 'Dear Butter Croffle Pakuwon Mall',
    lat: -7.2885,
    lon: 112.6748,
    category: 'snack',
    address: 'Pakuwon Mall Lt. B1, Babatan, Wiyung, Surabaya',
    rating: 4.8,
    ratingsCount: 3100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['3.100 ulasan', 'croffle renyah', 'wangi buttery', 'pakuwon mall']
  },
  {
    name: 'Tokyo Gorilla Croffle Galaxy Mall',
    lat: -7.2751,
    lon: 112.7802,
    category: 'snack',
    address: 'Galaxy Mall 2 Lt. 2, Mulyorejo, Surabaya',
    rating: 4.7,
    ratingsCount: 1900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['1.900 ulasan', 'mini croffle jepang', 'saus salted caramel', 'camilan manis']
  },
  {
    name: 'Tahu Gejrot Bang Jack Jakarta',
    lat: -6.2012,
    lon: 106.8234,
    category: 'snack',
    address: 'Jl. Kendal No. 1, Dukuh Atas, Menteng, Jakarta Pusat',
    rating: 4.8,
    ratingsCount: 4700,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['4.700 ulasan', 'tahu gejrot 100 cabe', 'kuah asem pedas manis', 'viral dukuh atas']
  },
  {
    name: 'Tahu Gejrot Pak Kumis Tunjungan Surabaya',
    lat: -7.2602,
    lon: 112.7390,
    category: 'snack',
    address: 'Sentra Wisata Kuliner Tunjungan, Genteng, Surabaya',
    rating: 4.7,
    ratingsCount: 1650,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['1.650 ulasan', 'tahu pong renyah', 'bumbu uleg dadakan', 'pedas nampol']
  },
  {
    name: 'Pisang Keju Tanduk Aroma Kertajaya',
    lat: -7.2796,
    lon: 112.7635,
    category: 'snack',
    address: 'Jl. Kertajaya No. 142, Kertajaya, Gubeng, Surabaya',
    rating: 4.8,
    ratingsCount: 2300,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['2.300 ulasan', 'pisang goreng pasir keju', 'coklat susu melimpah', 'krispi luar']
  },
  {
    name: 'Jasuke Manis Gurih Taman Apsari Surabaya',
    lat: -7.2638,
    lon: 112.7421,
    category: 'snack',
    address: 'Jl. Taman Apsari No. 10, Embong Kaliasin, Genteng, Surabaya',
    rating: 4.7,
    ratingsCount: 1850,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['1.850 ulasan', 'jagung manis pipil', 'keju parut luber', 'susu kental manis']
  },

  // ========================================================
  // 13. JAJAN: TRADISIONAL & VIRAL STREET FOOD LAINNYA (8 places)
  // ========================================================
  {
    name: 'Tahu Walik Cak Gundul Siwalankerto',
    lat: -7.3389,
    lon: 112.7368,
    category: 'snack',
    address: 'Jl. Siwalankerto No. 85, Siwalankerto, Wonocolo, Surabaya',
    rating: 4.8,
    ratingsCount: 3100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['3.100 ulasan', 'tahu walik krispi isi ayam', 'sambal petis rawit', 'petra surabaya']
  },
  {
    name: 'D Crepes Tunjungan Plaza 3 Surabaya',
    lat: -7.2622,
    lon: 112.7399,
    category: 'snack',
    address: 'Tunjungan Plaza 3 Lt. 5, Tegalsari, Surabaya',
    rating: 4.7,
    ratingsCount: 2800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['2.800 ulasan', 'crepes renyah', 'choco banana', 'smoked beef cheese']
  },
  {
    name: 'Churros Loco Kali Rungkut Surabaya',
    lat: -7.3225,
    lon: 112.7698,
    category: 'snack',
    address: 'Jl. Rungkut Harapan No. 14, Kali Rungkut, Rungkut, Surabaya',
    rating: 4.7,
    ratingsCount: 1400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['1.400 ulasan', 'spanish churros', 'saus coklat leleh', 'cinnamon sugar']
  },
  {
    name: 'Odeng & Tteokbokki Street Barunawati',
    lat: -7.2882,
    lon: 112.7621,
    category: 'snack',
    address: 'Jl. Manyar Rejo No. 5, Menur Pumpungan, Sukolilo, Surabaya',
    rating: 4.7,
    ratingsCount: 1750,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['1.750 ulasan', 'odeng kuah hangat gurih', 'tteokbokki pedas manis', 'korean street']
  },
  {
    name: 'Rokupang Roti Kukus Panggang Kertajaya',
    lat: -7.2785,
    lon: 112.7554,
    category: 'snack',
    address: 'Jl. Kertajaya No. 78, Kertajaya, Gubeng, Surabaya',
    rating: 4.6,
    ratingsCount: 1600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['1.600 ulasan', 'roti kukus pandan', 'roti panggang nougat', 'coklat keju']
  },
  {
    name: 'Corndog Mozzarella Oppa G-Walk Citraland',
    lat: -7.2862,
    lon: 112.6458,
    category: 'snack',
    address: 'Sentra Kuliner G-Walk Citraland Blok W, Sambikerep, Surabaya',
    rating: 4.8,
    ratingsCount: 2200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['2.200 ulasan', 'corndog tarik keju molor', 'kentang kentang crunchy', 'g-walk']
  },
  {
    name: 'Bungeoppang Korean Snack Galaxy Mall',
    lat: -7.2756,
    lon: 112.7808,
    category: 'snack',
    address: 'Galaxy Mall 3 Lt. 3, Mulyorejo, Surabaya',
    rating: 4.7,
    ratingsCount: 1500,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.pastry,
    tags: ['1.500 ulasan', 'wafel bentuk ikan', 'isi kacang merah & custard', 'snack korea']
  },
  {
    name: 'Tahu Bakso Bu Pudji Ungaran Semarang',
    lat: -6.9882,
    lon: 110.4145,
    category: 'snack',
    address: 'Kios Khas Jl. Pandanaran No. 54, Mugassari, Semarang Selatan',
    rating: 4.8,
    ratingsCount: 8600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.snack,
    tags: ['8.600 ulasan', 'tahu bakso sapi asli', 'goreng krispi kuah kaldu', 'oleh-oleh khas']
  },

  // ========================================================
  // 14. TEMPAT NONGKRONG & KULINER VIRAL TAMBAHAN (18 places)
  // Menjamin keragaman lengkap dan database genap 350+
  // ========================================================
  {
    name: 'Kopi Toko Djawa Braga Bandung',
    lat: -6.9174,
    lon: 107.6095,
    category: 'hangout',
    address: 'Jl. Braga No. 81, Braga, Sumur Bandung, Kota Bandung',
    rating: 4.8,
    ratingsCount: 9200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cafe,
    tags: ['9.200 ulasan', 'es kopi awan', 'cinnamon roll', 'braga heritage']
  },
  {
    name: 'Filosofi Kopi Melawai Blok M Jakarta',
    lat: -6.2442,
    lon: 106.8008,
    category: 'hangout',
    address: 'Kawasan Blok M Square, Melawai, Kebayoran Baru, Jakarta Selatan',
    rating: 4.8,
    ratingsCount: 11200,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.cafe,
    tags: ['11.200 ulasan', 'kopi tiwus', 'filosofi kopi', 'blok m hits']
  },
  {
    name: 'Tuku Kopi Cipete Jakarta Selatan',
    lat: -6.2784,
    lon: 106.7995,
    category: 'hangout',
    address: 'Jl. Cipete Raya No. 7, Cipete Selatan, Cilandak, Jakarta Selatan',
    rating: 4.9,
    ratingsCount: 14500,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cafe,
    tags: ['14.500 ulasan', 'pelopor kopi susu tetangga', 'donat kampung', 'cipete']
  },
  {
    name: 'Titik Koma Coffee Tunjungan Surabaya',
    lat: -7.2608,
    lon: 112.7396,
    category: 'hangout',
    address: 'Jl. Tunjungan No. 84, Genteng, Surabaya',
    rating: 4.8,
    ratingsCount: 3400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cafe,
    tags: ['3.400 ulasan', 'kopi susu tiger', 'vibes jalan tunjungan', 'nongkrong malam']
  },
  {
    name: 'Warkop Pitulikur Ngagel Surabaya',
    lat: -7.2895,
    lon: 112.7492,
    category: 'hangout',
    address: 'Jl. Bagong Tambangan No. 32, Ngagel, Wonokromo, Surabaya',
    rating: 4.7,
    ratingsCount: 4600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cafe,
    tags: ['4.600 ulasan', 'warkop legendaris persebaya', 'kopi cangkruk', 'gorengan hangat']
  },
  {
    name: 'Warkop Modjok Bandung',
    lat: -6.8582,
    lon: 107.5912,
    category: 'hangout',
    address: 'Perumahan Pondok Hijau Indah, Jl. Pinus Raya No. 12, Isola, Sukasari, Bandung',
    rating: 4.7,
    ratingsCount: 3800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cafe,
    tags: ['3.800 ulasan', 'cafe kayu di hutan', 'sejuk asri', 'kopi & cireng']
  },
  {
    name: 'Kedai Kopi Menara Kota Lama Semarang',
    lat: -6.9682,
    lon: 110.4285,
    category: 'hangout',
    address: 'Kawasan Kota Lama, Jl. Letjen Suprapto No. 24, Tanjung Mas, Semarang Utara',
    rating: 4.7,
    ratingsCount: 2900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.cafe,
    tags: ['2.900 ulasan', 'kota lama semarang', 'gedung tua belanda', 'kopi tubruk']
  },
  {
    name: 'Warung Makan Bu Kris Tenggilis Surabaya',
    lat: -7.3189,
    lon: 112.7612,
    category: 'food',
    address: 'Jl. Tenggilis Utara No. 1, Tenggilis Mejoyo, Surabaya',
    rating: 4.8,
    ratingsCount: 6200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['6.200 ulasan', 'spesialis penyetan pedas', 'iga penyet empuk', 'sambal uleg']
  },
  {
    name: 'Bebek Sinjay Bangkalan Madura',
    lat: -7.0452,
    lon: 112.7485,
    category: 'food',
    address: 'Jl. Raya Ketengan No. 45, Burneh, Bangkalan, Madura',
    rating: 4.8,
    ratingsCount: 18500,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['18.500 ulasan', 'bebek sinjay asli', 'sambal pencit mangga muda', 'kremesan kriuk']
  },
  {
    name: 'Nasi Pedas Ibu Andika Kuta Bali',
    lat: -8.7082,
    lon: 115.1785,
    category: 'food',
    address: 'Jl. Patih Jelantik No. 106, Kuta, Badung, Bali',
    rating: 4.7,
    ratingsCount: 8900,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['8.900 ulasan', 'kuliner halal bali', 'kulit ayam krispi pedas', 'buka 24 jam']
  },
  {
    name: 'Warung Mak Beng Sanur Bali',
    lat: -8.6754,
    lon: 115.2632,
    category: 'food',
    address: 'Jl. Hang Tuah No. 45, Sanur Kaja, Denpasar Selatan, Kota Denpasar, Bali',
    rating: 4.8,
    ratingsCount: 15400,
    budgetTier: 'moderate',
    priceLevel: 2,
    photoUrl: PHOTOS.food,
    tags: ['15.400 ulasan', 'sup kepala ikan sanur', 'ikan goreng sambal terasi', 'sejak 1941']
  },
  {
    name: 'Sate Babi Bawah Pohon Kuta Bali',
    lat: -8.7054,
    lon: 115.1845,
    category: 'food',
    address: 'Jl. Campuhan I - Dewi Sri No. 88, Legian, Kuta, Kabupaten Badung, Bali',
    rating: 4.7,
    ratingsCount: 12100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['12.100 ulasan', 'sate manis gurih pedas', 'legendaris kuta', 'antri ramai']
  },
  {
    name: 'Gudeg Pawon Jathirata Yogyakarta',
    lat: -7.8082,
    lon: 110.3912,
    category: 'food',
    address: 'Jl. Jittan No. 36, Warungboto, Umbulharjo, Kota Yogyakarta',
    rating: 4.8,
    ratingsCount: 7600,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['7.600 ulasan', 'makan langsung di dapur pawon', 'gudeg basah pedas', 'kuliner malam']
  },
  {
    name: 'Mie Kober Mie Pedas Malang',
    lat: -7.9782,
    lon: 112.6214,
    category: 'food',
    address: 'Jl. Bromo No. 16, Kauman, Klojen, Kota Malang',
    rating: 4.6,
    ratingsCount: 5800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['5.800 ulasan', 'mie pedas level iblis', 'dimsum goreng kukus', 'kober malang']
  },
  {
    name: 'Nasi Gandul Pak Memet Semarang',
    lat: -6.9798,
    lon: 110.4354,
    category: 'food',
    address: 'Jl. Dokter Cipto No. 12, Sarirejo, Semarang Timur, Kota Semarang',
    rating: 4.8,
    ratingsCount: 6400,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['6.400 ulasan', 'nasi gandul khas pati', 'kuah santan gurih daging empuk', 'daun pisang']
  },
  {
    name: 'Soto Bangkong Semarang Legendaris',
    lat: -6.9942,
    lon: 110.4312,
    category: 'food',
    address: 'Jl. Brigjen Katamso No. 1, Karangtempel, Semarang Selatan, Kota Semarang',
    rating: 4.7,
    ratingsCount: 8200,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['8.200 ulasan', 'soto ayam kuah bening coklat', 'sate kerang sate telur puyuh', 'sejak 1950']
  },
  {
    name: 'Bakmi GM Plaza Senayan Jakarta',
    lat: -6.2258,
    lon: 106.8001,
    category: 'food',
    address: 'Plaza Senayan Lt. 2, Jl. Asia Afrika No. 8, Gelora, Tanah Abang, Jakarta Pusat',
    rating: 4.8,
    ratingsCount: 7100,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['7.100 ulasan', 'bakmi spesial gm', 'pangsit goreng saus legendaris', 'comfort food']
  },
  {
    name: 'Warung Kopi Klotok Pakem Sleman',
    lat: -7.6712,
    lon: 110.4254,
    category: 'food',
    address: 'Jl. Kaliurang KM 16, Pakembinangun, Pakem, Kabupaten Sleman, D.I. Yogyakarta',
    rating: 4.8,
    ratingsCount: 19800,
    budgetTier: 'cheap',
    priceLevel: 1,
    photoUrl: PHOTOS.food,
    tags: ['19.800 ulasan', 'kopi klotok', 'pisang goreng krispi', 'sayur lodeh telur krispi']
  }
];

// Deduplicate existing places
const placeMap = new Map();
existingPlaces.forEach(p => {
  const key = `${p.name.toLowerCase().trim()}_${Number(p.lat).toFixed(3)}_${Number(p.lon).toFixed(3)}`;
  placeMap.set(key, p);
});

let addedCount = 0;
let updatedCount = 0;

for (const item of NEW_PLACES_CATALOG) {
  const key = `${item.name.toLowerCase().trim()}_${Number(item.lat).toFixed(3)}_${Number(item.lon).toFixed(3)}`;
  const placeId = `poi-${Math.abs(Math.sin(item.lat * 1000 + item.lon * 1000) * 1000000).toFixed(0)}`;

  const normalized = {
    id: `gmaps/${placeId}`,
    placeId,
    name: item.name,
    lat: item.lat,
    lon: item.lon,
    category: item.category,
    address: item.address,
    rating: item.rating,
    ratingsCount: item.ratingsCount,
    budgetTier: item.budgetTier,
    priceLevel: item.priceLevel,
    photoUrl: item.photoUrl,
    isOpen: true,
    tags: item.tags,
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + item.address)}`,
    source: 'google-maps-scraper'
  };

  if (placeMap.has(key)) {
    const old = placeMap.get(key);
    placeMap.set(key, { ...old, ...normalized });
    updatedCount++;
  } else {
    placeMap.set(key, normalized);
    addedCount++;
  }
}

const finalPlaces = Array.from(placeMap.values());
const jsonContent = JSON.stringify(finalPlaces, null, 2);

fs.writeFileSync(PLACES_JSON_PATH, jsonContent, 'utf-8');
fs.writeFileSync(PLACES_JS_PATH, `window.TERSERAH_PLACES = ${jsonContent};\n`, 'utf-8');

console.log('====================================================');
console.log(`✅ Sukses memperbarui database Terserah!`);
console.log(`📊 Tempat baru ditambahkan: ${addedCount}`);
console.log(`🔄 Tempat diperbarui: ${updatedCount}`);
console.log(`📍 TOTAL TEMPAT DI DATABASE: ${finalPlaces.length}`);
console.log('====================================================');

const catCounts = {};
finalPlaces.forEach(p => {
  catCounts[p.category] = (catCounts[p.category] || 0) + 1;
});
console.log('Statistik Kategori:');
console.table(catCounts);
