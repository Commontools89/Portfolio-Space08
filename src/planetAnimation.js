import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function createPlanet() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('planetCanvas'),
    alpha: true,
    antialias: true
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const radius = 1.5;

  // Add base black sphere for oceans/non-pointed regions
  const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.9
  });
  const baseSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(baseSphere);

  function latLongToVector3(lat, long, r) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (long + 180) * (Math.PI / 180);
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  // Ultra-detailed world map
  const worldMap = [
    // NORTH AMERICA
    // Canada (split into regions)
    { minLat: 60, maxLat: 75, minLong: -140, maxLong: -60, density: 400 }, // Northern territories
    { minLat: 48, maxLat: 60, minLong: -140, maxLong: -88, density: 300 }, // Western provinces
    { minLat: 43, maxLat: 60, minLong: -88, maxLong: -60, density: 300 }, // Eastern provinces
    { minLat: 46, maxLat: 51, minLong: -67, maxLong: -52, density: 100 }, // Newfoundland

    // United States (detailed regions)
    { minLat: 45, maxLat: 49, minLong: -125, maxLong: -95, density: 200 }, // Northwest
    { minLat: 37, maxLat: 45, minLong: -125, maxLong: -100, density: 250 }, // Northern states
    { minLat: 32, maxLat: 37, minLong: -125, maxLong: -100, density: 200 }, // Southwest
    { minLat: 30, maxLat: 45, minLong: -100, maxLong: -75, density: 300 }, // Central
    { minLat: 25, maxLat: 45, minLong: -75, maxLong: -68, density: 250 }, // Northeast
    { minLat: 24.5, maxLat: 31, minLong: -82, maxLong: -80, density: 100 }, // Florida
    { minLat: 51, maxLat: 72, minLong: -170, maxLong: -140, density: 200 }, // Alaska

    // Mexico (regional detail)
    { minLat: 23, maxLat: 32, minLong: -117, maxLong: -106, density: 200 }, // Northern Mexico
    { minLat: 20, maxLat: 23, minLong: -106, maxLong: -97, density: 150 }, // Central Mexico
    { minLat: 16, maxLat: 20, minLong: -99, maxLong: -86, density: 150 }, // Southern Mexico
    { minLat: 18, maxLat: 22, minLong: -105, maxLong: -98, density: 100 }, // Yucatan Peninsula

    // CENTRAL AMERICA (detailed countries)
    { minLat: 13, maxLat: 17.5, minLong: -92, maxLong: -88, density: 75 }, // Guatemala
    { minLat: 13, maxLat: 14.5, minLong: -88, maxLong: -87, density: 50 }, // El Salvador
    { minLat: 12.5, maxLat: 16, minLong: -89, maxLong: -83, density: 75 }, // Honduras
    { minLat: 11, maxLat: 15, minLong: -87, maxLong: -83, density: 75 }, // Nicaragua
    { minLat: 8, maxLat: 11.2, minLong: -85, maxLong: -82, density: 50 }, // Costa Rica
    { minLat: 7, maxLat: 9.5, minLong: -83, maxLong: -77, density: 50 }, // Panama

    // CARIBBEAN (major islands)
    { minLat: 19.8, maxLat: 23.3, minLong: -78, maxLong: -72, density: 100 }, // Cuba
    { minLat: 17.5, maxLat: 20, minLong: -75, maxLong: -68, density: 75 }, // Hispaniola
    { minLat: 17.5, maxLat: 18.5, minLong: -68, maxLong: -65, density: 50 }, // Puerto Rico
    { minLat: 12, maxLat: 17, minLong: -62, maxLong: -59, density: 50 }, // Lesser Antilles

    // SOUTH AMERICA (detailed regions)
    // Colombia
    { minLat: -4, maxLat: 12, minLong: -79, maxLong: -66, density: 200 },
    // Venezuela
    { minLat: 0, maxLat: 12, minLong: -73, maxLong: -59, density: 200 },
    // Brazil (split into regions)
    { minLat: -33, maxLat: 5, minLong: -74, maxLong: -35, density: 600 }, // Main
    { minLat: -10, maxLat: 0, minLong: -67, maxLong: -50, density: 200 }, // Amazon
    { minLat: -20, maxLat: -10, minLong: -50, maxLong: -35, density: 200 }, // Central
    // Argentina
    { minLat: -55, maxLat: -22, minLong: -73, maxLong: -53, density: 300 },
    // Chile
    { minLat: -56, maxLat: -17, minLong: -76, maxLong: -66, density: 200 },
    // Peru
    { minLat: -18, maxLat: -3, minLong: -82, maxLong: -68, density: 200 },
    // Bolivia
    { minLat: -23, maxLat: -9, minLong: -70, maxLong: -57, density: 150 },

    // EUROPE (detailed countries)
    // British Isles
    { minLat: 49, maxLat: 59, minLong: -11, maxLong: 2, density: 200 }, // UK
    { minLat: 51.5, maxLat: 55.5, minLong: -10, maxLong: -5.5, density: 100 }, // Ireland

    // Western Europe
    { minLat: 41, maxLat: 51.5, minLong: -5, maxLong: 10, density: 300 }, // France
    { minLat: 47, maxLat: 55, minLong: 5, maxLong: 15, density: 200 }, // Germany
    { minLat: 35.5, maxLat: 44, minLong: -10, maxLong: 3, density: 200 }, // Spain
    { minLat: 46, maxLat: 48, minLong: 9, maxLong: 17, density: 100 }, // Austria

    // Northern Europe
    { minLat: 55, maxLat: 65, minLong: 4, maxLong: 30, density: 300 }, // Scandinavia
    { minLat: 59, maxLat: 71, minLong: 4, maxLong: 31, density: 200 }, // Norway
    { minLat: 55, maxLat: 69, minLong: 11, maxLong: 24, density: 200 }, // Sweden
    { minLat: 59.5, maxLat: 70.5, minLong: 21, maxLong: 32, density: 150 }, // Finland
    { minLat: 57.5, maxLat: 59.5, minLong: 21, maxLong: 28, density: 50 }, // Estonia
    { minLat: 56, maxLat: 58, minLong: 21, maxLong: 28, density: 50 }, // Latvia
    { minLat: 54, maxLat: 56, minLong: 21, maxLong: 27, density: 50 }, // Lithuania

    // Eastern Europe
    { minLat: 45, maxLat: 55, minLong: 24, maxLong: 40, density: 300 }, // Ukraine
    { minLat: 51, maxLat: 54, minLong: 14, maxLong: 24, density: 150 }, // Poland
    { minLat: 45.5, maxLat: 49, minLong: 16, maxLong: 22.5, density: 100 }, // Slovakia
    { minLat: 46, maxLat: 49, minLong: 12, maxLong: 19, density: 100 }, // Czech Republic
    { minLat: 45.5, maxLat: 48.5, minLong: 16, maxLong: 23, density: 100 }, // Hungary
    { minLat: 43, maxLat: 48.5, minLong: 20, maxLong: 30, density: 150 }, // Romania
    { minLat: 41, maxLat: 44.5, minLong: 22, maxLong: 28.5, density: 100 }, // Bulgaria

    // Mediterranean
    { minLat: 36.5, maxLat: 47, minLong: 6, maxLong: 19, density: 200 }, // Italy
    { minLat: 35, maxLat: 41.5, minLong: 19, maxLong: 28, density: 150 }, // Greece
    { minLat: 39, maxLat: 42, minLong: -9.5, maxLong: -6, density: 100 }, // Portugal
    { minLat: 34, maxLat: 38, minLong: -5, maxLong: 3, density: 100 }, // Gibraltar/N.Africa Coast

    // ASIA (Detailed Regions)
    // Russia (split into regions)
    { minLat: 50, maxLat: 77, minLong: 27, maxLong: 180, density: 800 }, // Main Russia
    { minLat: 45, maxLat: 50, minLong: 27, maxLong: 87, density: 200 }, // Southern Russia
    { minLat: 60, maxLat: 77, minLong: 60, maxLong: 110, density: 300 }, // Siberia
    
    // East Asia
    { minLat: 20, maxLat: 54, minLong: 73, maxLong: 135, density: 600 }, // China
    { minLat: 30, maxLat: 46, minLong: 125, maxLong: 145, density: 300 }, // Japan
    { minLat: 33, maxLat: 38.5, minLong: 126, maxLong: 129.5, density: 150 }, // South Korea
    { minLat: 38.5, maxLat: 43, minLong: 124, maxLong: 131, density: 150 }, // North Korea
    { minLat: 21, maxLat: 25.5, minLong: 120, maxLong: 122, density: 50 }, // Taiwan

    // Southeast Asia
    { minLat: 5, maxLat: 20, minLong: 97, maxLong: 106, density: 200 }, // Vietnam
    { minLat: 10, maxLat: 15, minLong: 102, maxLong: 108, density: 100 }, // Cambodia
    { minLat: 14, maxLat: 22, minLong: 100, maxLong: 107, density: 150 }, // Laos
    { minLat: 5, maxLat: 21, minLong: 97, maxLong: 101, density: 200 }, // Thailand
    { minLat: 1, maxLat: 7, minLong: 100, maxLong: 119, density: 200 }, // Malaysia
    { minLat: -11, maxLat: 6, minLong: 95, maxLong: 141, density: 400 }, // Indonesia
    { minLat: 4, maxLat: 21, minLong: 116, maxLong: 127, density: 200 }, // Philippines

    // South Asia
    { minLat: 8, maxLat: 37, minLong: 68, maxLong: 97, density: 500 }, // India
    { minLat: 26.5, maxLat: 30.5, minLong: 80, maxLong: 88, density: 100 }, // Nepal
    { minLat: 23.5, maxLat: 27, minLong: 88, maxLong: 93, density: 75 }, // Bangladesh
    { minLat: 5.5, maxLat: 10, minLong: 79, maxLong: 82, density: 75 }, // Sri Lanka
    { minLat: 23, maxLat: 37, minLong: 60, maxLong: 77, density: 200 }, // Pakistan

    // Central Asia
    { minLat: 35, maxLat: 45, minLong: 46, maxLong: 87, density: 300 }, // Kazakhstan
    { minLat: 37, maxLat: 43, minLong: 58, maxLong: 73, density: 150 }, // Uzbekistan
    { minLat: 35, maxLat: 41, minLong: 52, maxLong: 66, density: 150 }, // Turkmenistan
    { minLat: 39, maxLat: 43, minLong: 69, maxLong: 80, density: 100 }, // Kyrgyzstan
    { minLat: 36.5, maxLat: 41, minLong: 67, maxLong: 75, density: 100 }, // Tajikistan

    // MIDDLE EAST
    { minLat: 31, maxLat: 42, minLong: 34, maxLong: 48.5, density: 200 }, // Turkey
    { minLat: 29, maxLat: 37, minLong: 47, maxLong: 63, density: 200 }, // Iran
    { minLat: 29, maxLat: 34, minLong: 34, maxLong: 39, density: 100 }, // Israel/Palestine
    { minLat: 31, maxLat: 37, minLong: 38, maxLong: 48, density: 150 }, // Iraq
    { minLat: 32, maxLat: 37, minLong: 35, maxLong: 42, density: 150 }, // Syria
    { minLat: 29, maxLat: 33, minLong: 34, maxLong: 39, density: 75 }, // Jordan
    { minLat: 16, maxLat: 30, minLong: 34, maxLong: 55, density: 200 }, // Saudi Arabia
    { minLat: 22.5, maxLat: 30, minLong: 50, maxLong: 56, density: 100 }, // UAE
    { minLat: 16, maxLat: 19, minLong: 41, maxLong: 54, density: 100 }, // Yemen
    { minLat: 16, maxLat: 27, minLong: 51, maxLong: 59, density: 100 }, // Oman

    // AFRICA
    // North Africa
    { minLat: 20, maxLat: 37, minLong: -17, maxLong: 25, density: 400 }, // Morocco to Libya
    { minLat: 31, maxLat: 37, minLong: 9, maxLong: 11, density: 100 }, // Tunisia
    { minLat: 27, maxLat: 37, minLong: -8, maxLong: 12, density: 200 }, // Morocco
    { minLat: 19, maxLat: 37, minLong: -8, maxLong: 12, density: 200 }, // Algeria
    { minLat: 20, maxLat: 33, minLong: 25, maxLong: 35, density: 200 }, // Egypt
    { minLat: 20, maxLat: 33, minLong: 13, maxLong: 25, density: 150 }, // Libya

    // West Africa
    { minLat: 4, maxLat: 24, minLong: -17, maxLong: 16, density: 400 }, // West African Coast
    { minLat: 4, maxLat: 11, minLong: -11, maxLong: -2, density: 100 }, // Ivory Coast
    { minLat: 6, maxLat: 11, minLong: 2, maxLong: 14, density: 150 }, // Nigeria
    { minLat: 11, maxLat: 23, minLong: -17, maxLong: 24, density: 200 }, // Sahel Region

    // Central Africa
    { minLat: -5, maxLat: 5, minLong: 8, maxLong: 31, density: 300 }, // Central African Region
    { minLat: -5, maxLat: 2, minLong: 12, maxLong: 18, density: 150 }, // Gabon
    { minLat: -5, maxLat: 5, minLong: 18, maxLong: 31, density: 200 }, // Congo
    { minLat: -13, maxLat: 5, minLong: 12, maxLong: 31, density: 250 }, // DR Congo

    // East Africa
    { minLat: -12, maxLat: 5, minLong: 29, maxLong: 41, density: 300 }, // East African Region
    { minLat: -4.5, maxLat: 5, minLong: 33, maxLong: 41, density: 150 }, // Kenya
    { minLat: -11, maxLat: -1, minLong: 29, maxLong: 40, density: 150 }, // Tanzania
    { minLat: -1.5, maxLat: 4, minLong: 29.5, maxLong: 35, density: 100 }, // Uganda
    { minLat: 3, maxLat: 14.5, minLong: 33, maxLong: 43, density: 150 }, // Ethiopia
    { minLat: -26, maxLat: -10, minLong: 30, maxLong: 41, density: 200 }, // Mozambique

    // Southern Africa
    { minLat: -35, maxLat: -22, minLong: 16, maxLong: 33, density: 200 }, // South Africa
    { minLat: -22, maxLat: -17, minLong: 20, maxLong: 33, density: 100 }, // Zimbabwe
    { minLat: -19, maxLat: -8, minLong: 20, maxLong: 33, density: 150 }, // Zambia
    { minLat: -28, maxLat: -17, minLong: 11, maxLong: 25, density: 100 }, // Namibia
    { minLat: -25, maxLat: -17, minLong: 25, maxLong: 33, density: 100 }, // Botswana

    // OCEANIA
    // Australia (detailed regions)
    { minLat: -39, maxLat: -10, minLong: 113, maxLong: 153, density: 400 }, // Main continent
    { minLat: -43.5, maxLat: -39, minLong: 143, maxLong: 148, density: 100 }, // Tasmania
    { minLat: -31, maxLat: -17, minLong: 115, maxLong: 129, density: 150 }, // Western Australia
    { minLat: -38, maxLat: -28, minLong: 140, maxLong: 153, density: 150 }, // Eastern Coast
    { minLat: -27, maxLat: -10, minLong: 142, maxLong: 153, density: 150 }, // Queensland

    // New Zealand
    { minLat: -47, maxLat: -34, minLong: 166, maxLong: 178, density: 200 }, // Main islands
    { minLat: -46, maxLat: -40, minLong: 166, maxLong: 174, density: 100 }, // South Island
    { minLat: -41, maxLat: -34, minLong: 172, maxLong: 178, density: 100 }, // North Island

    // Pacific Islands
    { minLat: -21, maxLat: -17, minLong: 177, maxLong: 180, density: 50 }, // Fiji
    { minLat: -9, maxLat: -6, minLong: 143, maxLong: 155, density: 100 }, // Papua New Guinea
    { minLat: -20, maxLat: -8, minLong: 160, maxLong: 167, density: 75 }, // Solomon Islands
    { minLat: -15, maxLat: -13, minLong: 171, maxLong: 173, density: 25 }, // Samoa
    { minLat: 13, maxLat: 21, minLong: 144, maxLong: 146, density: 25 }, // Mariana Islands

    // POLAR REGIONS
    // Antarctica (detailed coastline)
    { minLat: -90, maxLat: -60, minLong: -180, maxLong: 180, density: 500 }, // Main continent
    { minLat: -75, maxLat: -60, minLong: -120, maxLong: -45, density: 200 }, // Antarctic Peninsula
    { minLat: -78, maxLat: -72, minLong: 160, maxLong: 180, density: 150 }, // Ross Ice Shelf

    // Arctic
    { minLat: 66.5, maxLat: 90, minLong: -180, maxLong: 180, density: 400 }, // Arctic Circle
    { minLat: 70, maxLat: 83, minLong: -60, maxLong: -11, density: 150 }, // Greenland Coast
    { minLat: 74, maxLat: 81, minLong: 10, maxLong: 35, density: 100 }, // Svalbard

    // Additional detailed regions and refinements

    // ISLANDS & ARCHIPELAGOS
    // Caribbean (more detailed)
    { minLat: 21.5, maxLat: 23.5, minLong: -80, maxLong: -74, density: 75 }, // Bahamas
    { minLat: 12, maxLat: 18.5, minLong: -71, maxLong: -68, density: 50 }, // Dominican Republic
    { minLat: 18, maxLat: 20, minLong: -78, maxLong: -76, density: 50 }, // Jamaica
    { minLat: 10, maxLat: 11.5, minLong: -85, maxLong: -83, density: 25 }, // Trinidad & Tobago
    
    // Mediterranean Islands
    { minLat: 35, maxLat: 38, minLong: 8, maxLong: 11, density: 50 }, // Sardinia
    { minLat: 36.5, maxLat: 38.5, minLong: 12, maxLong: 15, density: 50 }, // Sicily
    { minLat: 34, maxLat: 36, minLong: 32, maxLong: 34, density: 50 }, // Cyprus
    { minLat: 35, maxLat: 40, minLong: 19, maxLong: 26, density: 75 }, // Crete & Aegean Islands

    // Indian Ocean Islands
    { minLat: -20, maxLat: -13, minLong: 44, maxLong: 51, density: 75 }, // Madagascar
    { minLat: -21, maxLat: -20, minLong: 55, maxLong: 56, density: 25 }, // Reunion
    { minLat: -4.5, maxLat: -4, minLong: 55, maxLong: 56, density: 25 }, // Seychelles
    { minLat: -20.5, maxLat: -19.5, minLong: 57, maxLong: 58, density: 25 }, // Mauritius

    // DETAILED COASTAL REGIONS
    // North America Coast
    { minLat: 48, maxLat: 60, minLong: -128, maxLong: -123, density: 100 }, // Pacific Northwest
    { minLat: 32, maxLat: 42, minLong: -124, maxLong: -117, density: 100 }, // California Coast
    { minLat: 25, maxLat: 31, minLong: -98, maxLong: -80, density: 100 }, // Gulf Coast
    { minLat: 36, maxLat: 47, minLong: -78, maxLong: -70, density: 100 }, // Atlantic Coast

    // South America Coast
    { minLat: -55, maxLat: -30, minLong: -75, maxLong: -70, density: 100 }, // Chilean Coast
    { minLat: -23, maxLat: -5, minLong: -48, maxLong: -35, density: 100 }, // Brazilian Coast
    { minLat: 0, maxLat: 12, minLong: -75, maxLong: -70, density: 75 }, // Colombian Coast

    // MAJOR RIVER DELTAS
    { minLat: 22, maxLat: 27, minLong: 88, maxLong: 91, density: 50 }, // Ganges Delta
    { minLat: 30, maxLat: 32, minLong: 30, maxLong: 32, density: 50 }, // Nile Delta
    { minLat: 40, maxLat: 45, minLong: 28, maxLong: 30, density: 50 }, // Danube Delta
    { minLat: -34, maxLat: -32, minLong: -59, maxLong: -57, density: 50 }, // Rio de la Plata

    // MAJOR PENINSULAS
    { minLat: 35, maxLat: 42, minLong: 26, maxLong: 45, density: 100 }, // Anatolia
    { minLat: 8, maxLat: 23, minLong: 72, maxLong: 77, density: 100 }, // Indian Peninsula
    { minLat: 35, maxLat: 43, minLong: 126, maxLong: 130, density: 75 }, // Korean Peninsula
    { minLat: 58, maxLat: 71, minLong: 5, maxLong: 31, density: 100 }, // Scandinavian Peninsula

    // MAJOR MOUNTAIN RANGES
    { minLat: 26, maxLat: 35, minLong: 80, maxLong: 89, density: 75 }, // Himalayas
    { minLat: 35, maxLat: 47, minLong: 6, maxLong: 14, density: 75 }, // Alps
    { minLat: 42, maxLat: 43, minLong: -3, maxLong: 3, density: 50 }, // Pyrenees
    { minLat: -35, maxLat: -30, minLong: -71, maxLong: -69, density: 50 }, // Andes

    // MAJOR DESERTS
    { minLat: 15, maxLat: 35, minLong: -15, maxLong: 35, density: 200 }, // Sahara (sparse points)
    { minLat: -25, maxLat: -20, minLong: 14, maxLong: 25, density: 50 }, // Namib
    { minLat: -30, maxLat: -25, minLong: 125, maxLong: 140, density: 50 }, // Australian Outback
    { minLat: 35, maxLat: 45, minLong: 75, maxLong: 95, density: 50 }, // Gobi

    // MAJOR LAKES
    { minLat: 40, maxLat: 47, minLong: -88, maxLong: -82, density: 50 }, // Great Lakes
    { minLat: -3, maxLat: 3, minLong: 29, maxLong: 31, density: 25 }, // Lake Victoria
    { minLat: 45, maxLat: 47, minLong: 24, maxLong: 25, density: 25 }, // Lake Baikal
    { minLat: 40, maxLat: 47, minLong: 45, maxLong: 54, density: 25 }, // Caspian Sea

    // INDIAN SUBCONTINENT (Highly Detailed)
    // India - Regional Divisions
    { minLat: 28, maxLat: 37, minLong: 72, maxLong: 80, density: 150 }, // Northern India
    { minLat: 27, maxLat: 35, minLong: 80, maxLong: 89, density: 150 }, // North-East India
    { minLat: 22, maxLat: 28, minLong: 75, maxLong: 88, density: 200 }, // Central India
    { minLat: 15, maxLat: 22, minLong: 73, maxLong: 87, density: 200 }, // Eastern India
    { minLat: 8, maxLat: 15, minLong: 74, maxLong: 85, density: 200 }, // Southern India
    { minLat: 18, maxLat: 29, minLong: 69, maxLong: 75, density: 150 }, // Western India

    // India - State Level Details
    { minLat: 29, maxLat: 33, minLong: 75, maxLong: 79, density: 75 }, // Punjab & Haryana
    { minLat: 23, maxLat: 27, minLong: 84, maxLong: 89, density: 75 }, // Bihar
    { minLat: 18, maxLat: 23, minLong: 82, maxLong: 87, density: 75 }, // West Bengal
    { minLat: 15, maxLat: 20, minLong: 73, maxLong: 79, density: 75 }, // Maharashtra
    { minLat: 11, maxLat: 15, minLong: 74, maxLong: 79, density: 75 }, // Karnataka
    { minLat: 8, maxLat: 13, minLong: 76, maxLong: 81, density: 75 }, // Tamil Nadu
    { minLat: 8, maxLat: 13, minLong: 74, maxLong: 77, density: 75 }, // Kerala
    { minLat: 21, maxLat: 27, minLong: 75, maxLong: 82, density: 75 }, // Madhya Pradesh
    { minLat: 20, maxLat: 24, minLong: 83, maxLong: 87, density: 75 }, // Odisha
    { minLat: 15, maxLat: 20, minLong: 77, maxLong: 84, density: 75 }, // Andhra Pradesh
    { minLat: 30, maxLat: 35, minLong: 75, maxLong: 79, density: 75 }, // Himachal Pradesh
    { minLat: 22, maxLat: 25, minLong: 68, maxLong: 75, density: 75 }, // Gujarat

    // India - Major Cities Regions
    { minLat: 18.5, maxLat: 19.5, minLong: 72.5, maxLong: 73.5, density: 25 }, // Mumbai
    { minLat: 28, maxLat: 29, minLong: 76.5, maxLong: 77.5, density: 25 }, // Delhi
    { minLat: 12.5, maxLat: 13.5, minLong: 77, maxLong: 78, density: 25 }, // Bangalore
    { minLat: 22, maxLat: 23, minLong: 88, maxLong: 89, density: 25 }, // Kolkata
    { minLat: 13, maxLat: 14, minLong: 80, maxLong: 81, density: 25 }, // Chennai

    // Neighboring Countries - Detailed
    // Pakistan
    { minLat: 23, maxLat: 37, minLong: 60, maxLong: 77, density: 200 }, // Main Pakistan
    { minLat: 33, maxLat: 37, minLong: 70, maxLong: 75, density: 75 }, // Northern Areas
    { minLat: 24, maxLat: 27, minLong: 66, maxLong: 70, density: 75 }, // Sindh
    { minLat: 28, maxLat: 32, minLong: 69, maxLong: 72, density: 75 }, // Punjab (Pakistan)

    // Bangladesh
    { minLat: 20.5, maxLat: 26.5, minLong: 88, maxLong: 92.5, density: 150 }, // Main Bangladesh
    { minLat: 22, maxLat: 24, minLong: 90, maxLong: 91, density: 50 }, // Central Region
    { minLat: 24, maxLat: 25, minLong: 91, maxLong: 92, density: 50 }, // Sylhet Region

    // Nepal
    { minLat: 26.5, maxLat: 30.5, minLong: 80, maxLong: 88, density: 100 }, // Main Nepal
    { minLat: 27.5, maxLat: 28.5, minLong: 83, maxLong: 85, density: 50 }, // Central Nepal
    { minLat: 28, maxLat: 29, minLong: 81, maxLong: 83, density: 50 }, // Western Nepal

    // Bhutan
    { minLat: 26.5, maxLat: 28.5, minLong: 88.5, maxLong: 92, density: 75 }, // Main Bhutan
    { minLat: 27, maxLat: 28, minLong: 89, maxLong: 91, density: 25 }, // Central Bhutan

    // Sri Lanka
    { minLat: 5.5, maxLat: 10, minLong: 79, maxLong: 82, density: 100 }, // Main Sri Lanka
    { minLat: 6.5, maxLat: 9.5, minLong: 79.5, maxLong: 81.5, density: 50 }, // Central Region

    // GEOGRAPHICAL FEATURES OF INDIAN SUBCONTINENT
    // Mountain Ranges
    { minLat: 28, maxLat: 36, minLong: 72, maxLong: 80, density: 100 }, // Western Himalayas
    { minLat: 26, maxLat: 30, minLong: 80, maxLong: 89, density: 100 }, // Central Himalayas
    { minLat: 26, maxLat: 29, minLong: 88, maxLong: 96, density: 100 }, // Eastern Himalayas
    { minLat: 18, maxLat: 25, minLong: 72, maxLong: 77, density: 75 }, // Western Ghats
    { minLat: 11, maxLat: 22, minLong: 76, maxLong: 87, density: 75 }, // Eastern Ghats

    // Major Rivers
    { minLat: 22, maxLat: 31, minLong: 77, maxLong: 88, density: 75 }, // Ganges Basin
    { minLat: 21, maxLat: 26, minLong: 67, maxLong: 77, density: 75 }, // Indus Basin
    { minLat: 15, maxLat: 22, minLong: 73, maxLong: 83, density: 75 }, // Narmada & Godavari
    { minLat: 10, maxLat: 16, minLong: 75, maxLong: 80, density: 75 }, // Krishna & Kaveri

    // Coastal Regions
    { minLat: 8, maxLat: 23, minLong: 69, maxLong: 72, density: 75 }, // Western Coast
    { minLat: 8, maxLat: 22, minLong: 80, maxLong: 87, density: 75 }, // Eastern Coast
    { minLat: 8, maxLat: 10, minLong: 74, maxLong: 77, density: 50 }, // Malabar Coast
    { minLat: 20, maxLat: 22, minLong: 86, maxLong: 88, density: 50 }, // Sundarbans

    // Desert & Plateau Regions
    { minLat: 24, maxLat: 30, minLong: 69, maxLong: 75, density: 75 }, // Thar Desert
    { minLat: 15, maxLat: 22, minLong: 73, maxLong: 82, density: 100 }, // Deccan Plateau
    { minLat: 22, maxLat: 25, minLong: 75, maxLong: 79, density: 75 }, // Malwa Plateau

    // IMPROVED CONTINENTAL BOUNDARIES
    
    // NORTH AMERICA - Enhanced Coastlines
    // Eastern Seaboard (detailed coastal progression)
    { minLat: 44.8, maxLat: 45.2, minLong: -67.0, maxLong: -66.8, density: 25 }, // Maine tip
    { minLat: 41.5, maxLat: 45.0, minLong: -71.0, maxLong: -69.8, density: 75 }, // New England coast
    { minLat: 40.5, maxLat: 41.6, minLong: -74.1, maxLong: -72.0, density: 50 }, // Long Island
    { minLat: 36.5, maxLat: 40.5, minLong: -76.0, maxLong: -73.9, density: 100 }, // Mid-Atlantic
    { minLat: 35.0, maxLat: 36.5, minLong: -75.8, maxLong: -75.2, density: 50 }, // Outer Banks
    
    // Gulf Coast (precise bay and delta definitions)
    { minLat: 29.5, maxLat: 30.5, minLong: -89.5, maxLong: -88.5, density: 50 }, // Mississippi Delta
    { minLat: 29.7, maxLat: 30.0, minLong: -93.9, maxLong: -89.5, density: 75 }, // Louisiana coast
    { minLat: 26.0, maxLat: 29.7, minLong: -97.5, maxLong: -94.0, density: 100 }, // Texas coast
    
    // West Coast (detailed coastal features)
    { minLat: 47.8, maxLat: 48.5, minLong: -124.8, maxLong: -124.2, density: 50 }, // Olympic Peninsula
    { minLat: 46.0, maxLat: 47.8, minLong: -124.2, maxLong: -123.8, density: 75 }, // Washington coast
    { minLat: 42.0, maxLat: 46.0, minLong: -124.4, maxLong: -124.0, density: 75 }, // Oregon coast
    { minLat: 37.8, maxLat: 42.0, minLong: -123.8, maxLong: -123.2, density: 100 }, // Northern California
    { minLat: 34.0, maxLat: 37.8, minLong: -122.5, maxLong: -121.8, density: 100 }, // Central California
    
    // Great Lakes (precise shoreline definition)
    { minLat: 41.5, maxLat: 43.5, minLong: -87.5, maxLong: -82.5, density: 100 }, // Lake Michigan
    { minLat: 43.5, maxLat: 47.0, minLong: -89.5, maxLong: -82.0, density: 100 }, // Lake Superior
    { minLat: 42.0, maxLat: 44.0, minLong: -83.0, maxLong: -78.5, density: 75 }, // Lake Erie
    
    // EURASIA - Refined Coastal Details
    // European Peninsula Coastlines
    { minLat: 43.0, maxLat: 44.5, minLong: -9.5, maxLong: -8.5, density: 50 }, // Galicia
    { minLat: 43.3, maxLat: 43.8, minLong: -1.8, maxLong: -1.2, density: 25 }, // Bay of Biscay
    { minLat: 48.5, maxLat: 51.0, minLong: -5.5, maxLong: -1.0, density: 75 }, // Brittany
    { minLat: 51.0, maxLat: 53.5, minLong: -10.5, maxLong: -6.0, density: 75 }, // Ireland west
    { minLat: 57.5, maxLat: 58.7, minLong: -7.0, maxLong: -5.0, density: 50 }, // Scottish Highlands

    // Mediterranean Coastline (high detail)
    { minLat: 35.9, maxLat: 36.5, minLong: -5.5, maxLong: -5.0, density: 25 }, // Gibraltar
    { minLat: 36.5, maxLat: 37.5, minLong: -2.5, maxLong: 0.0, density: 50 }, // Southern Spain
    { minLat: 41.0, maxLat: 43.0, minLong: 9.0, maxLong: 9.8, density: 50 }, // Corsica
    { minLat: 37.5, maxLat: 38.5, minLong: 12.5, maxLong: 15.0, density: 50 }, // Sicily
    { minLat: 40.5, maxLat: 41.5, minLong: 16.5, maxLong: 18.5, density: 50 }, // Italian heel

    // Baltic Sea Coastline
    { minLat: 54.0, maxLat: 55.0, minLong: 10.0, maxLong: 12.0, density: 50 }, // Danish straits
    { minLat: 55.0, maxLat: 56.0, minLong: 12.5, maxLong: 14.5, density: 50 }, // Southern Sweden
    { minLat: 59.0, maxLat: 60.0, minLong: 16.5, maxLong: 18.5, density: 50 }, // Stockholm archipelago
    
    // TRANSITION ZONES (for smoother landmass appearance)
    // North Atlantic transitions
    { minLat: 50.0, maxLat: 52.0, minLong: -6.0, maxLong: -4.0, density: 35 }, // Celtic Sea
    { minLat: 53.0, maxLat: 54.0, minLong: -5.5, maxLong: -3.5, density: 35 }, // Irish Sea
    { minLat: 57.0, maxLat: 58.0, minLong: -7.5, maxLong: -5.5, density: 35 }, // Hebrides
    
    // Mediterranean transitions
    { minLat: 35.5, maxLat: 37.0, minLong: -1.0, maxLong: 1.0, density: 35 }, // Alboran Sea
    { minLat: 37.5, maxLat: 38.5, minLong: 15.0, maxLong: 16.0, density: 35 }, // Strait of Messina
    { minLat: 40.0, maxLat: 41.0, minLong: 18.5, maxLong: 19.5, density: 35 }, // Adriatic entrance

    // PRECISE ISLAND CHAINS
    // Greek Islands (detailed)
    { minLat: 35.0, maxLat: 35.5, minLong: 24.0, maxLong: 26.0, density: 25 }, // Crete
    { minLat: 36.5, maxLat: 37.0, minLong: 25.0, maxLong: 25.5, density: 15 }, // Cyclades
    { minLat: 38.5, maxLat: 39.0, minLong: 20.5, maxLong: 21.0, density: 15 }, // Ionian Islands

    // Japanese Archipelago (precise)
    { minLat: 31.0, maxLat: 31.5, minLong: 130.5, maxLong: 131.0, density: 15 }, // Kyushu tip
    { minLat: 33.0, maxLat: 34.5, minLong: 132.0, maxLong: 134.0, density: 35 }, // Shikoku
    { minLat: 34.5, maxLat: 35.5, minLong: 138.5, maxLong: 140.0, density: 35 }, // Tokyo Bay
    { minLat: 41.5, maxLat: 42.5, minLong: 141.0, maxLong: 142.0, density: 35 }, // Hokkaido

    // SOUTHEAST ASIA DETAILED COASTLINES
    // Indonesian Archipelago (precise island chains)
    { minLat: -6.2, maxLat: -5.8, minLong: 106.7, maxLong: 107.0, density: 25 }, // Jakarta Bay
    { minLat: -8.0, maxLat: -7.5, minLong: 112.5, maxLong: 113.0, density: 25 }, // East Java
    { minLat: -8.8, maxLat: -8.4, minLong: 115.0, maxLong: 115.5, density: 25 }, // Bali
    { minLat: -8.5, maxLat: -8.2, minLong: 116.0, maxLong: 116.5, density: 25 }, // Lombok
    { minLat: -3.7, maxLat: -3.2, minLong: 128.0, maxLong: 128.5, density: 25 }, // Ambon
    
    // Philippines (detailed island groups)
    { minLat: 14.4, maxLat: 14.7, minLong: 120.9, maxLong: 121.1, density: 25 }, // Manila Bay
    { minLat: 10.2, maxLat: 10.8, minLong: 123.8, maxLong: 124.2, density: 25 }, // Cebu
    { minLat: 7.0, maxLat: 7.5, minLong: 125.5, maxLong: 125.8, density: 25 }, // Davao
    { minLat: 18.2, maxLat: 18.6, minLong: 121.5, maxLong: 122.0, density: 25 }, // Northern Luzon

    // Malaysian Peninsula (precise coastline)
    { minLat: 1.2, maxLat: 1.5, minLong: 103.5, maxLong: 104.0, density: 25 }, // Singapore Strait
    { minLat: 2.8, maxLat: 3.2, minLong: 101.2, maxLong: 101.5, density: 25 }, // Klang Valley
    { minLat: 5.2, maxLat: 5.6, minLong: 100.2, maxLong: 100.5, density: 25 }, // Penang
    { minLat: 6.0, maxLat: 6.4, minLong: 99.5, maxLong: 100.0, density: 25 }, // Langkawi

    // EAST ASIAN COASTLINE DETAILS
    // China's Eastern Coast
    { minLat: 31.1, maxLat: 31.3, minLong: 121.4, maxLong: 121.8, density: 35 }, // Shanghai
    { minLat: 22.1, maxLat: 22.4, minLong: 113.8, maxLong: 114.2, density: 35 }, // Hong Kong
    { minLat: 39.8, maxLat: 40.1, minLong: 121.5, maxLong: 121.8, density: 35 }, // Dalian
    { minLat: 37.4, maxLat: 37.7, minLong: 121.3, maxLong: 121.6, density: 35 }, // Qingdao
    
    // Korean Peninsula (detailed coastline)
    { minLat: 37.4, maxLat: 37.7, minLong: 126.3, maxLong: 126.7, density: 30 }, // Incheon
    { minLat: 35.0, maxLat: 35.3, minLong: 129.0, maxLong: 129.3, density: 30 }, // Busan
    { minLat: 34.7, maxLat: 35.0, minLong: 127.8, maxLong: 128.1, density: 30 }, // South coast
    { minLat: 38.5, maxLat: 38.8, minLong: 128.2, maxLong: 128.5, density: 30 }, // East coast

    // SOUTH ASIAN PRECISE COASTLINES
    // Indian Subcontinent (detailed coastal features)
    { minLat: 18.89, maxLat: 19.12, minLong: 72.80, maxLong: 72.95, density: 35 }, // Mumbai Harbor
    { minLat: 22.53, maxLat: 22.65, minLong: 88.28, maxLong: 88.40, density: 35 }, // Kolkata Port
    { minLat: 13.05, maxLat: 13.25, minLong: 80.25, maxLong: 80.35, density: 35 }, // Chennai Coast
    { minLat: 8.45, maxLat: 8.65, minLong: 76.85, maxLong: 77.00, density: 35 }, // Kerala Backwaters
    
    // Sri Lankan Coast (precise boundaries)
    { minLat: 6.85, maxLat: 7.05, minLong: 79.80, maxLong: 79.95, density: 25 }, // Colombo
    { minLat: 5.90, maxLat: 6.10, minLong: 80.50, maxLong: 80.65, density: 25 }, // Galle
    { minLat: 8.50, maxLat: 8.65, minLong: 81.15, maxLong: 81.30, density: 25 }, // Trincomalee
    
    // PERSIAN GULF DETAILED COASTLINE
    { minLat: 25.23, maxLat: 25.35, minLong: 55.25, maxLong: 55.35, density: 25 }, // Dubai Coast
    { minLat: 26.15, maxLat: 26.30, minLong: 50.50, maxLong: 50.65, density: 25 }, // Bahrain
    { minLat: 24.45, maxLat: 24.60, minLong: 54.30, maxLong: 54.45, density: 25 }, // Abu Dhabi
    { minLat: 29.25, maxLat: 29.40, minLong: 48.85, maxLong: 49.00, density: 25 }, // Kuwait Bay

    // AFRICAN COASTLINE PRECISION
    // Mediterranean Coast
    { minLat: 31.15, maxLat: 31.25, minLong: 29.85, maxLong: 30.00, density: 30 }, // Alexandria
    { minLat: 36.75, maxLat: 36.90, minLong: 3.00, maxLong: 3.25, density: 30 }, // Algiers
    { minLat: 33.85, maxLat: 34.00, minLong: 9.85, maxLong: 10.00, density: 30 }, // Tunisia Coast
    
    // West African Coast
    { minLat: 14.65, maxLat: 14.80, minLong: -17.50, maxLong: -17.35, density: 30 }, // Dakar
    { minLat: 6.40, maxLat: 6.55, minLong: 3.35, maxLong: 3.45, density: 30 }, // Lagos
    { minLat: 5.25, maxLat: 5.35, minLong: -4.05, maxLong: -3.90, density: 30 }, // Abidjan

    // East African Coast
    { minLat: -6.85, maxLat: -6.75, minLong: 39.25, maxLong: 39.35, density: 30 }, // Dar es Salaam
    { minLat: -4.05, maxLat: -3.95, minLong: 39.60, maxLong: 39.70, density: 30 }, // Mombasa
    { minLat: -25.95, maxLat: -25.85, minLong: 32.55, maxLong: 32.65, density: 30 }, // Maputo

    // MAJOR RIVER DELTAS (precise boundaries)
    // Nile Delta
    { minLat: 31.25, maxLat: 31.35, minLong: 30.05, maxLong: 30.15, density: 40 }, // Rosetta
    { minLat: 31.35, maxLat: 31.45, minLong: 31.75, maxLong: 31.85, density: 40 }, // Damietta
    
    // Ganges-Brahmaputra Delta
    { minLat: 22.15, maxLat: 22.25, minLong: 88.95, maxLong: 89.05, density: 40 }, // Sundarbans
    { minLat: 21.95, maxLat: 22.05, minLong: 89.45, maxLong: 89.55, density: 40 }, // Khulna

    // NORTH AMERICAN DETAILED COASTLINES
    // Pacific Northwest Detail
    { minLat: 48.25, maxLat: 48.45, minLong: -124.72, maxLong: -124.55, density: 25 }, // Olympic Coast
    { minLat: 47.85, maxLat: 48.05, minLong: -122.95, maxLong: -122.75, density: 25 }, // Puget Sound
    { minLat: 47.55, maxLat: 47.75, minLong: -122.45, maxLong: -122.25, density: 25 }, // Seattle Harbor
    { minLat: 48.65, maxLat: 48.85, minLong: -123.35, maxLong: -123.15, density: 25 }, // Victoria Coast
    
    // California Coast Detail
    { minLat: 37.75, maxLat: 37.85, minLong: -122.52, maxLong: -122.45, density: 25 }, // Golden Gate
    { minLat: 37.45, maxLat: 37.55, minLong: -122.45, maxLong: -122.35, density: 25 }, // San Francisco Bay
    { minLat: 34.35, maxLat: 34.45, minLong: -119.45, maxLong: -119.35, density: 25 }, // Santa Barbara
    { minLat: 32.65, maxLat: 32.75, minLong: -117.25, maxLong: -117.15, density: 25 }, // San Diego Bay

    // Atlantic Coast Detail
    { minLat: 40.65, maxLat: 40.75, minLong: -74.05, maxLong: -73.95, density: 25 }, // New York Harbor
    { minLat: 42.32, maxLat: 42.42, minLong: -71.05, maxLong: -70.95, density: 25 }, // Boston Harbor
    { minLat: 39.85, maxLat: 39.95, minLong: -75.15, maxLong: -75.05, density: 25 }, // Philadelphia Coast
    { minLat: 36.85, maxLat: 36.95, minLong: -76.35, maxLong: -76.25, density: 25 }, // Chesapeake Bay

    // EUROPEAN INTRICATE COASTLINES
    // Norwegian Fjords
    { minLat: 60.35, maxLat: 60.45, minLong: 5.25, maxLong: 5.35, density: 25 }, // Bergen Fjord
    { minLat: 63.42, maxLat: 63.52, minLong: 10.35, maxLong: 10.45, density: 25 }, // Trondheim Fjord
    { minLat: 68.95, maxLat: 69.05, minLong: 17.95, maxLong: 18.05, density: 25 }, // Tromsø Coast
    
    // Mediterranean Detailed Coast
    { minLat: 40.82, maxLat: 40.92, minLong: 14.22, maxLong: 14.32, density: 25 }, // Naples Bay
    { minLat: 37.92, maxLat: 38.02, minLong: 15.52, maxLong: 15.62, density: 25 }, // Messina Strait
    { minLat: 45.42, maxLat: 45.52, minLong: 12.32, maxLong: 12.42, density: 25 }, // Venice Lagoon
    { minLat: 43.28, maxLat: 43.38, minLong: 5.32, maxLong: 5.42, density: 25 }, // Marseille Coast

    // Baltic Sea Detailed Coast
    { minLat: 59.32, maxLat: 59.42, minLong: 18.02, maxLong: 18.12, density: 25 }, // Stockholm Archipelago
    { minLat: 60.15, maxLat: 60.25, minLong: 24.92, maxLong: 25.02, density: 25 }, // Helsinki Coast
    { minLat: 54.32, maxLat: 54.42, minLong: 18.62, maxLong: 18.72, density: 25 }, // Gdańsk Bay
    
    // ASIAN DETAILED COASTLINES
    // South China Sea Coast
    { minLat: 22.27, maxLat: 22.37, minLong: 114.15, maxLong: 114.25, density: 25 }, // Hong Kong Harbor
    { minLat: 1.22, maxLat: 1.32, minLong: 103.82, maxLong: 103.92, density: 25 }, // Singapore Strait
    { minLat: 10.75, maxLat: 10.85, minLong: 106.72, maxLong: 106.82, density: 25 }, // Saigon River
    
    // Japanese Coast Detail
    { minLat: 35.62, maxLat: 35.72, minLong: 139.72, maxLong: 139.82, density: 25 }, // Tokyo Bay
    { minLat: 34.62, maxLat: 34.72, minLong: 135.42, maxLong: 135.52, density: 25 }, // Osaka Bay
    { minLat: 33.92, maxLat: 34.02, minLong: 131.02, maxLong: 131.12, density: 25 }, // Kanmon Strait
    
    // OCEANIA DETAILED COASTLINES
    // Australian Coast
    { minLat: -33.87, maxLat: -33.77, minLong: 151.22, maxLong: 151.32, density: 25 }, // Sydney Harbor
    { minLat: -37.82, maxLat: -37.72, minLong: 144.92, maxLong: 145.02, density: 25 }, // Port Phillip
    { minLat: -27.47, maxLat: -27.37, minLong: 153.02, maxLong: 153.12, density: 25 }, // Brisbane River
    
    // New Zealand Coast
    { minLat: -36.85, maxLat: -36.75, minLong: 174.75, maxLong: 174.85, density: 25 }, // Auckland Harbor
    { minLat: -41.28, maxLat: -41.18, minLong: 174.75, maxLong: 174.85, density: 25 }, // Wellington Harbor
    { minLat: -43.58, maxLat: -43.48, minLong: 172.72, maxLong: 172.82, density: 25 }, // Lyttelton Harbor

    // ISLAND CHAIN DETAILS
    // Caribbean Precise Islands
    { minLat: 18.32, maxLat: 18.42, minLong: -64.95, maxLong: -64.85, density: 20 }, // St. Thomas
    { minLat: 17.12, maxLat: 17.22, minLong: -61.85, maxLong: -61.75, density: 20 }, // Antigua
    { minLat: 13.12, maxLat: 13.22, minLong: -59.65, maxLong: -59.55, density: 20 }, // Barbados
    
    // Pacific Islands Detail
    { minLat: -17.75, maxLat: -17.65, minLong: 177.42, maxLong: 177.52, density: 20 }, // Suva Harbor
    { minLat: -14.28, maxLat: -14.18, minLong: -170.72, maxLong: -170.62, density: 20 }, // Pago Pago
    { minLat: 21.28, maxLat: 21.38, minLong: -157.87, maxLong: -157.77, density: 20 }, // Honolulu

    // MAJOR PENINSULA DETAILS
    { minLat: 40.82, maxLat: 41.02, minLong: 28.92, maxLong: 29.12, density: 30 }, // Bosphorus
    { minLat: 25.12, maxLat: 25.32, minLong: 55.12, maxLong: 55.32, density: 30 }, // Dubai Coast
    { minLat: 1.22, maxLat: 1.42, minLong: 103.82, maxLong: 104.02, density: 30 }, // Singapore

    // CONTINENTAL OUTLINE PRECISION
    
    // NORTH AMERICA OUTLINE
    // Northern Edge
    { minLat: 71.32, maxLat: 71.42, minLong: -156.88, maxLong: -156.78, density: 30 }, // Point Barrow
    { minLat: 68.35, maxLat: 68.45, minLong: -166.72, maxLong: -166.62, density: 30 }, // Cape Prince of Wales
    { minLat: 83.02, maxLat: 83.12, minLong: -75.92, maxLong: -75.82, density: 30 }, // Northern Greenland
    
    // Eastern Seaboard Outline
    { minLat: 44.95, maxLat: 45.05, minLong: -66.98, maxLong: -66.88, density: 35 }, // Bay of Fundy
    { minLat: 42.32, maxLat: 42.42, minLong: -70.95, maxLong: -70.85, density: 35 }, // Cape Cod
    { minLat: 35.22, maxLat: 35.32, minLong: -75.52, maxLong: -75.42, density: 35 }, // Cape Hatteras
    { minLat: 24.52, maxLat: 24.62, minLong: -81.82, maxLong: -81.72, density: 35 }, // Florida Keys

    // Western Edge
    { minLat: 48.35, maxLat: 48.45, minLong: -124.72, maxLong: -124.62, density: 35 }, // Olympic Peninsula
    { minLat: 37.78, maxLat: 37.88, minLong: -122.52, maxLong: -122.42, density: 35 }, // San Francisco
    { minLat: 32.52, maxLat: 32.62, minLong: -117.12, maxLong: -117.02, density: 35 }, // San Diego

    // SOUTH AMERICA OUTLINE
    // Northern Coast
    { minLat: 12.42, maxLat: 12.52, minLong: -71.62, maxLong: -71.52, density: 35 }, // Guajira Peninsula
    { minLat: 10.62, maxLat: 10.72, minLong: -61.92, maxLong: -61.82, density: 35 }, // Trinidad
    { minLat: 5.52, maxLat: 5.62, minLong: -55.22, maxLong: -55.12, density: 35 }, // French Guiana

    // Southern Tip
    { minLat: -54.88, maxLat: -54.78, minLong: -67.28, maxLong: -67.18, density: 35 }, // Cape Horn
    { minLat: -51.72, maxLat: -51.62, minLong: -69.12, maxLong: -69.02, density: 35 }, // Magellan Strait
    { minLat: -42.52, maxLat: -42.42, minLong: -74.92, maxLong: -74.82, density: 35 }, // Chilean Coast

    // EURASIA OUTLINE
    // Western Europe
    { minLat: 43.32, maxLat: 43.42, minLong: -9.18, maxLong: -9.08, density: 35 }, // Cape Finisterre
    { minLat: 51.42, maxLat: 51.52, minLong: 1.42, maxLong: 1.52, density: 35 }, // Dover Strait
    { minLat: 60.52, maxLat: 60.62, minLong: 4.82, maxLong: 4.92, density: 35 }, // Norwegian Coast

    // Mediterranean Outline
    { minLat: 36.12, maxLat: 36.22, minLong: -5.42, maxLong: -5.32, density: 35 }, // Gibraltar
    { minLat: 37.92, maxLat: 38.02, minLong: 15.62, maxLong: 15.72, density: 35 }, // Sicily
    { minLat: 40.82, maxLat: 40.92, minLong: 28.92, maxLong: 29.02, density: 35 }, // Bosphorus

    // Asian Coast
    { minLat: 31.22, maxLat: 31.32, minLong: 121.42, maxLong: 121.52, density: 35 }, // Yangtze Delta
    { minLat: 35.12, maxLat: 35.22, minLong: 139.72, maxLong: 139.82, density: 35 }, // Tokyo Bay
    { minLat: 1.22, maxLat: 1.32, minLong: 103.82, maxLong: 103.92, density: 35 }, // Singapore

    // AFRICA OUTLINE
    // Mediterranean Coast
    { minLat: 31.22, maxLat: 31.32, minLong: 32.28, maxLong: 32.38, density: 35 }, // Nile Delta
    { minLat: 36.82, maxLat: 36.92, minLong: 3.02, maxLong: 3.12, density: 35 }, // Algiers
    { minLat: 35.82, maxLat: 35.92, minLong: -5.92, maxLong: -5.82, density: 35 }, // Tangier

    // Horn of Africa
    { minLat: 11.52, maxLat: 11.62, minLong: 43.12, maxLong: 43.22, density: 35 }, // Bab el-Mandeb
    { minLat: 11.92, maxLat: 12.02, minLong: 51.22, maxLong: 51.32, density: 35 }, // Cape Guardafui
    { minLat: -4.62, maxLat: -4.52, minLong: 39.62, maxLong: 39.72, density: 35 }, // Zanzibar

    // Southern Africa
    { minLat: -34.32, maxLat: -34.22, minLong: 18.42, maxLong: 18.52, density: 35 }, // Cape of Good Hope
    { minLat: -25.92, maxLat: -25.82, minLong: 32.52, maxLong: 32.62, density: 35 }, // Maputo
    { minLat: -15.92, maxLat: -15.82, minLong: 5.62, maxLong: 5.72, density: 35 }, // Angola Coast

    // OCEANIA OUTLINE
    // Australia
    { minLat: -33.85, maxLat: -33.75, minLong: 151.22, maxLong: 151.32, density: 35 }, // Sydney
    { minLat: -31.92, maxLat: -31.82, minLong: 115.92, maxLong: 116.02, density: 35 }, // Perth
    { minLat: -12.42, maxLat: -12.32, minLong: 130.82, maxLong: 130.92, density: 35 }, // Darwin

    // New Zealand
    { minLat: -36.82, maxLat: -36.72, minLong: 174.72, maxLong: 174.82, density: 35 }, // Auckland
    { minLat: -46.42, maxLat: -46.32, minLong: 168.32, maxLong: 168.42, density: 35 }, // South Island

    // MAJOR PENINSULAS OUTLINE
    { minLat: 68.92, maxLat: 69.02, minLong: 20.92, maxLong: 21.02, density: 35 }, // Scandinavian
    { minLat: 41.02, maxLat: 41.12, minLong: 28.92, maxLong: 29.02, density: 35 }, // Anatolian
    { minLat: 25.32, maxLat: 25.42, minLong: 56.32, maxLong: 56.42, density: 35 }, // Arabian

    // CONNECTING LANDMASS OUTLINES
    { minLat: 54.52, maxLat: 54.62, minLong: -5.92, maxLong: -5.82, density: 30 }, // Irish Sea
    { minLat: 35.82, maxLat: 35.92, minLong: -5.62, maxLong: -5.52, density: 30 }, // Gibraltar Strait
    { minLat: 40.92, maxLat: 41.02, minLong: 28.92, maxLong: 29.02, density: 30 }, // Bosphorus
    { minLat: 24.52, maxLat: 24.62, minLong: 35.52, maxLong: 35.62, density: 30 }, // Red Sea
    { minLat: 25.52, maxLat: 25.62, minLong: 56.92, maxLong: 57.02, density: 30 }, // Strait of Hormuz

    // ... (continuing with more precise outlines) ...
  ];

  const points = [];
  worldMap.forEach(region => {
    for (let i = 0; i < region.density; i++) {
      const jitter = 0.12;
      const lat = region.minLat + Math.random() * (region.maxLat - region.minLat);
      const long = region.minLong + Math.random() * (region.maxLong - region.minLong);
      const point = latLongToVector3(
        lat + (Math.random() - 0.5) * jitter,
        long + (Math.random() - 0.5) * jitter,
        radius * 1.001 // Very slight offset to prevent z-fighting
      );
      points.push(point);
    }
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.PointsMaterial({
    color: 0xd5fa1b,
    size: 0.018,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  });

  const pointCloud = new THREE.Points(geometry, material);
  scene.add(pointCloud);

  camera.position.z = 4.5;
  
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.5;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', onWindowResize, false);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}