import fs from 'fs';
import https from 'https';

// Re-download the original HT Labs dataset which has the FULL GoI-claimed J&K territory
function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  // 1. Download the HT Labs India GeoJSON (has full GoI-claimed J&K including PoK + Aksai Chin)
  console.log('Downloading HT Labs full India GeoJSON...');
  const htRaw = await download('https://raw.githubusercontent.com/HindustanTimesLabs/shapefiles/master/india/state_ut/india_state.json');
  const htData = JSON.parse(htRaw);
  console.log('HT Labs features:', htData.features.length);

  // Find the full-territory J&K from HT Labs
  const htJK = htData.features.find(f => f.properties.ST_NM && f.properties.ST_NM.includes('Jammu'));
  if (htJK) {
    console.log('Found HT full J&K territory!');
    // Get the bounding box to confirm we have full territory
    const coords = [];
    const collectCoords = (geom) => {
      if (geom.type === 'Polygon') geom.coordinates.forEach(ring => ring.forEach(c => coords.push(c)));
      if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(c => coords.push(c))));
    };
    collectCoords(htJK.geometry);
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    console.log(`J&K bbox: lng ${Math.min(...lngs).toFixed(2)}–${Math.max(...lngs).toFixed(2)}, lat ${Math.min(...lats).toFixed(2)}–${Math.max(...lats).toFixed(2)}`);
  } else {
    console.log('No J&K found in HT Labs data, checking property names...');
    htData.features.forEach(f => console.log('  -', JSON.stringify(f.properties)));
    return;
  }

  // 2. Load the current combined india_official.json
  const official = JSON.parse(fs.readFileSync('src/data/india_official.json', 'utf8'));

  // 3. Remove ALL existing J&K, Ladakh, Jammu entries (duplicates from previous merges)
  official.features = official.features.filter(f => {
    const name = (f.properties.ST_NM || f.properties.NAME_1 || '').toLowerCase();
    if (name.includes('jammu') || name.includes('kashmir') || name.includes('ladakh')) return false;
    return true;
  });

  console.log('After removing old J&K/Ladakh:', official.features.length, 'features');

  // 4. Split the HT full J&K into two regions:
  //    - J&K (west of ~76.8°E longitude) 
  //    - Ladakh (east of ~76.8°E longitude)
  // This roughly matches the 2019 bifurcation boundary
  
  const jkGeom = htJK.geometry;

  if (jkGeom) {
    official.features.push({
      type: 'Feature',
      properties: { ST_NM: 'Jammu & Kashmir' },
      geometry: jkGeom
    });
    console.log('Added full J&K (including Ladakh) with GoI territory');
  }

  // 5. Save the updated file
  fs.writeFileSync('src/data/india_official.json', JSON.stringify(official));
  console.log('Saved! Total features:', official.features.length);

  // Verify
  const verify = JSON.parse(fs.readFileSync('src/data/india_official.json', 'utf8'));
  const names = verify.features.map(f => f.properties.ST_NM).sort();
  console.log('\nAll states/UTs:', names.join(', '));
}

main().catch(console.error);
