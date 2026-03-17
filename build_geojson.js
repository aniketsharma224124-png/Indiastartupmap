import fs from 'fs';

const STATE_PATHS = {
  'jammu-kashmir':
    'M 215 88 L 255 100 L 260 80 L 252 58 L 238 38 ' +
    'L 218 22 L 195 12 L 168 10 L 142 16 L 118 28 ' +
    'L 98  50 L 92  73 L 102 95 L 118 110 L 145 122 ' +
    'L 172 130 L 195 134 L 205 130 L 208 130 L 204 108 Z',

  'ladakh':
    'M 260 80 L 255 100 L 295 93 ' +
    'L 315 100 L 332 88 L 358 74 L 385 62 L 415 55 ' +
    'L 445 52 L 465 62 L 480 85 L 475 112 L 458 135 ' +
    'L 430 148 L 400 152 L 368 148 L 338 138 L 310 122 ' +
    'L 292 108 L 282 95 Z',

  'himachal-pradesh': 'M 255 100 L 295 93 L 308 115 L 297 138 L 270 145 L 250 132 L 245 112 Z',
  'punjab': 'M 215 88 L 255 100 L 250 132 L 228 140 L 208 130 L 204 108 Z',
  'uttarakhand': 'M 270 145 L 308 135 L 322 155 L 312 178 L 286 180 L 265 166 Z',
  'haryana': 'M 208 130 L 250 132 L 260 152 L 250 172 L 224 176 L 204 164 L 200 145 Z',
  'delhi': 'M 250 165 L 270 160 L 274 176 L 255 181 L 247 172 Z',
  'uttar-pradesh': 'M 260 152 L 322 155 L 368 165 L 378 196 L 358 226 L 322 242 L 280 246 L 250 236 L 240 210 L 255 186 L 260 170 Z',
  'rajasthan': 'M 152 158 L 208 145 L 224 176 L 260 176 L 260 216 L 244 262 L 214 286 L 174 296 L 138 270 L 128 234 L 133 195 Z',
  'bihar': 'M 358 226 L 402 216 L 422 236 L 416 266 L 386 280 L 356 276 L 335 256 L 340 236 Z',
  'west-bengal': 'M 416 234 L 452 224 L 468 246 L 462 292 L 446 316 L 420 320 L 400 300 L 394 270 L 410 250 Z',
  'sikkim': 'M 448 194 L 467 189 L 472 206 L 459 216 L 444 209 Z',
  'arunachal-pradesh': 'M 470 175 L 542 164 L 568 186 L 562 212 L 522 219 L 480 216 L 464 200 Z',
  'assam': 'M 470 216 L 522 219 L 542 231 L 537 252 L 506 259 L 474 253 L 459 238 Z',
  'nagaland': 'M 537 229 L 562 226 L 570 243 L 556 256 L 535 251 L 530 239 Z',
  'manipur': 'M 538 253 L 560 249 L 567 269 L 556 283 L 537 281 L 527 266 Z',
  'mizoram': 'M 520 271 L 542 266 L 550 287 L 541 302 L 520 302 L 512 286 Z',
  'tripura': 'M 505 261 L 523 256 L 526 276 L 516 286 L 500 283 L 497 269 Z',
  'meghalaya': 'M 460 249 L 502 245 L 510 259 L 499 271 L 462 269 L 454 256 Z',
  'jharkhand': 'M 385 276 L 422 269 L 437 291 L 432 321 L 406 336 L 380 329 L 364 309 L 368 286 Z',
  'odisha': 'M 380 329 L 406 336 L 437 326 L 452 347 L 447 387 L 416 407 L 385 401 L 359 381 L 354 351 L 368 331 Z',
  'chhattisgarh': 'M 304 286 L 356 276 L 372 296 L 377 337 L 361 372 L 330 383 L 299 376 L 281 350 L 284 316 Z',
  'madhya-pradesh': 'M 214 286 L 280 271 L 310 281 L 320 306 L 316 341 L 290 362 L 254 369 L 219 356 L 189 330 L 184 306 L 200 290 Z',
  'gujarat': 'M 123 230 L 160 219 L 200 224 L 216 251 L 215 286 L 194 311 L 169 326 L 138 321 L 109 300 L 099 274 L 104 250 Z',
  'maharashtra': 'M 189 330 L 256 336 L 286 316 L 291 362 L 275 396 L 254 422 L 219 436 L 184 431 L 163 411 L 153 385 L 159 356 Z',
  'goa': 'M 194 461 L 216 456 L 226 471 L 215 484 L 194 483 L 187 471 Z',
  'karnataka': 'M 219 436 L 260 426 L 292 436 L 302 467 L 296 502 L 270 522 L 239 526 L 209 511 L 193 486 L 196 463 L 209 447 Z',
  'andhra-pradesh': 'M 292 436 L 337 426 L 378 442 L 392 472 L 381 511 L 356 527 L 315 531 L 289 516 L 277 491 L 279 461 Z',
  'telangana': 'M 284 391 L 331 383 L 362 391 L 377 417 L 371 441 L 336 449 L 300 446 L 277 426 L 277 406 Z',
  'tamil-nadu': 'M 254 526 L 300 521 L 336 526 L 362 552 L 356 587 L 330 612 L 299 622 L 268 611 L 247 591 L 239 561 L 244 536 Z',
  'kerala': 'M 224 526 L 254 526 L 247 561 L 239 597 L 229 616 L 209 611 L 199 591 L 199 561 L 209 536 Z',
  'puducherry': 'M 314 546 L 329 543 L 333 556 L 321 559 L 311 553 Z',
  'andaman-nicobar': 'M 570 448 L 578 444 L 585 450 L 582 462 L 572 465 L 567 458 Z M 568 472 L 576 468 L 582 474 L 580 484 L 570 487 L 564 480 Z M 566 493 L 573 490 L 578 496 L 575 505 L 566 507 L 561 500 Z'
};

const LNG_MIN = 67.5, LNG_MAX = 98.0
const LAT_MIN = 6.0, LAT_MAX = 38.0
const W = 640, H = 670

const toRad = (d) => d * Math.PI / 180
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2))
const yMin = mercY(LAT_MIN)
const yMax = mercY(LAT_MAX)

function svgToLngLat(x, y) {
  const lng = (x / W) * (LNG_MAX - LNG_MIN) + LNG_MIN;
  const mY = yMin + ((H - y) / H) * (yMax - yMin);
  const lat = (2 * Math.atan(Math.exp(mY)) - Math.PI / 2) * 180 / Math.PI;
  return [lng, lat];
}

const features = [];

for (const [id, d] of Object.entries(STATE_PATHS)) {
  const parts = d.split(' M ').filter(Boolean).map(s => s.startsWith('M ') ? s : 'M ' + s);
  
  const multiCoords = parts.map(part => {
    const commands = part.trim().replace(/Z$/, '').split(/ L | M /).map(s => s.trim()).filter(Boolean);
    const ring = commands.map(cmd => {
      const parts = cmd.replace(/[ML]\s*/, '').split(/\s+/).map(Number);
      return svgToLngLat(parts[0], parts[1]);
    });
    // Closing ring explicitly for GeoJSON
    if (ring.length > 0) ring.push([...ring[0]]);
    return [ring]; // polygon has 1 outer ring
  });

  features.push({
    type: "Feature",
    properties: { ST_NM: id, NAME: id },
    geometry: {
      type: multiCoords.length > 1 ? "MultiPolygon" : "Polygon",
      coordinates: multiCoords.length > 1 ? multiCoords : multiCoords[0]
    }
  });
}

const collection = { type: "FeatureCollection", features: features };
fs.writeFileSync('src/data/india_official.json', JSON.stringify(collection, null, 2));
console.log('Done mapping custom geojson!');
