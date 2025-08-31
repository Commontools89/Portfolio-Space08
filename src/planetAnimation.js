import * as THREE from 'three';
import { feature } from 'topojson-client';
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

  // Add base black sphere for oceans/non-pointed regions (unlit)
  const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.9
  });
  const baseSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(baseSphere);

  // Add ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);

  // Add directional light for 3D effect
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  function latLongToVector3(lat, long, r) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (long + 180) * (Math.PI / 180);
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  // Line material for continent outlines
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0xd5fa1b,
    transparent: true,
    opacity: 0.95
  });

  // Fetch precise coastlines from world-atlas TopoJSON and draw as joined polylines
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(topology => {
      const geojson = feature(topology, topology.objects.countries);
      geojson.features.forEach(f => {
        const geometry = f.geometry;
        if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => drawGeoRing(ring));
          });
        } else if (geometry.type === 'Polygon') {
          geometry.coordinates.forEach(ring => drawGeoRing(ring));
        }
      });
    })
    .catch(() => {
      // Fail silently if network blocks; planet still renders
    });

  function drawGeoRing(ring) {
    const pts = [];
    for (let i = 0; i < ring.length; i++) {
      const lon = ring[i][0];
      const lat = ring[i][1];
      pts.push(latLongToVector3(lat, lon, radius * 1.001));
    }
    // Close loop
    if (ring.length) {
      const lon0 = ring[0][0];
      const lat0 = ring[0][1];
      pts.push(latLongToVector3(lat0, lon0, radius * 1.001));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geom, outlineMaterial);
    scene.add(line);
  }

  // Add glowing ripple marker at Guntur, Andhra Pradesh, India (~16.3067 N, 80.4365 E)
  const gunturLat = 16.3067;
  const gunturLon = 80.4365;

  const markerPos = latLongToVector3(gunturLat, gunturLon, radius * 1.003);

  // Core glowing point
  const coreGeo = new THREE.SphereGeometry(0.014, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xd5fa1b });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.copy(markerPos);
  scene.add(core);

  // Ripple rings (animated scale + fade)
  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xd5fa1b,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });

  function createRing(radiusScale) {
    const ringGeo = new THREE.RingGeometry(0.022 * radiusScale, 0.024 * radiusScale, 128);
    const ring = new THREE.Mesh(ringGeo, rippleMat.clone());
    ring.position.copy(markerPos);
    // Orient ring to be tangent to globe at the marker
    ring.lookAt(core.position.clone().multiplyScalar(1.05));
    scene.add(ring);
    return ring;
  }

  const ring1 = createRing(1);
  const ring2 = createRing(1.6);
  const ring3 = createRing(2.2);

  let t = 0;
  const rippleSpeed = 0.006;

  // Add a second marker for Lake Forest, California (~33.6469 N, -117.6861 W)
  const lfLat = 33.6469;
  const lfLon = -117.6861;
  const lfPos = latLongToVector3(lfLat, lfLon, radius * 1.003);

  // Core for Lake Forest marker (same color/size as Guntur)
  const lfCoreGeo = new THREE.SphereGeometry(0.014, 16, 16);
  const lfCoreMat = new THREE.MeshBasicMaterial({ color: 0xd5fa1b });
  const lfCore = new THREE.Mesh(lfCoreGeo, lfCoreMat);
  lfCore.position.copy(lfPos);
  scene.add(lfCore);

  // Lake Forest ripple rings (use same effect as Guntur)
  function createRingAt(position, lookTarget, radiusScale) {
    const ringGeo = new THREE.RingGeometry(0.022 * radiusScale, 0.024 * radiusScale, 128);
    const ring = new THREE.Mesh(ringGeo, rippleMat.clone());
    ring.position.copy(position);
    ring.lookAt(lookTarget);
    scene.add(ring);
    return ring;
  }
  const lfRing1 = createRingAt(lfPos, lfCore.position.clone().multiplyScalar(1.05), 1);
  const lfRing2 = createRingAt(lfPos, lfCore.position.clone().multiplyScalar(1.05), 1.6);
  const lfRing3 = createRingAt(lfPos, lfCore.position.clone().multiplyScalar(1.05), 2.2);

  // Traveling glowing ray over the Pacific between Guntur and Lake Forest
  function buildRayPath() {
    // Great-circle base path from Guntur to Lake Forest with smooth mid bulge
    const v0 = latLongToVector3(gunturLat, gunturLon, 1).normalize();
    const v1 = latLongToVector3(lfLat, lfLon, 1).normalize();
    const dot = THREE.MathUtils.clamp(v0.dot(v1), -1, 1);
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega) || 1e-6;
    const lift = 0.18; // how high the arc lifts at midpoint
    return {
      getPoint: (t) => {
        const a = Math.sin((1 - t) * omega) / sinOmega;
        const b = Math.sin(t * omega) / sinOmega;
        const v = v0.clone().multiplyScalar(a).add(v1.clone().multiplyScalar(b)).normalize();
        const bulge = lift * Math.sin(Math.PI * t); // 0 at ends, max at middle
        return v.multiplyScalar(radius * (1 + bulge));
      }
    };
  }
  const rayCurve = buildRayPath();
  
  // Curved thin line for traveling ray
  const numRaySamples = 256;
  const rayPositions = new Float32Array(numRaySamples * 3);
  const rayLineGeom = new THREE.BufferGeometry();
  rayLineGeom.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
  const rayLineMat = new THREE.LineBasicMaterial({
    color: 0xd5fa1b,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const rayLine = new THREE.Line(rayLineGeom, rayLineMat);
  scene.add(rayLine);
  
  // Progressive reveal state (no arrow head)
  let rayProgress = 0; // 0 -> 1 head position along arc
  const segmentSpan = 0.38; // longer visible arc segment
  let lastTime = performance.now();
  let rayPhase = 0; // 0=travel, 1=merge into Lake Forest
  let mergeElapsed = 0;
  const travelDurationMs = 5000; // time to go from A to B
  const mergeDurationMs = 800; // time to merge tail into B

  // Major cities with their coordinates
  const majorCities = [
    // North America
    { name: "New York", lat: 40.7128, long: -74.0060 },
    { name: "Los Angeles", lat: 34.0522, long: -118.2437 },
    { name: "Chicago", lat: 41.8781, long: -87.6298 },
    { name: "Toronto", lat: 43.6532, long: -79.3832 },
    { name: "Mexico City", lat: 19.4326, long: -99.1332 },
    { name: "Vancouver", lat: 49.2827, long: -123.1207 },
    { name: "Miami", lat: 25.7617, long: -80.1918 },
    { name: "Houston", lat: 29.7604, long: -95.3698 },
    
    // South America
    { name: "São Paulo", lat: -23.5505, long: -46.6333 },
    { name: "Buenos Aires", lat: -34.6118, long: -58.3960 },
    { name: "Rio de Janeiro", lat: -22.9068, long: -43.1729 },
    { name: "Bogotá", lat: 4.7110, long: -74.0721 },
    { name: "Lima", lat: -12.0464, long: -77.0428 },
    { name: "Santiago", lat: -33.4489, long: -70.6693 },
    
    // Europe
    { name: "London", lat: 51.5074, long: -0.1278 },
    { name: "Paris", lat: 48.8566, long: 2.3522 },
    { name: "Berlin", lat: 52.5200, long: 13.4050 },
    { name: "Madrid", lat: 40.4168, long: -3.7038 },
    { name: "Rome", lat: 41.9028, long: 12.4964 },
    { name: "Amsterdam", lat: 52.3676, long: 4.9041 },
    { name: "Moscow", lat: 55.7558, long: 37.6176 },
    { name: "Istanbul", lat: 41.0082, long: 28.9784 },
    
    // Asia
    { name: "Tokyo", lat: 35.6762, long: 139.6503 },
    { name: "Beijing", lat: 39.9042, long: 116.4074 },
    { name: "Shanghai", lat: 31.2304, long: 121.4737 },
    { name: "Mumbai", lat: 19.0760, long: 72.8777 },
    { name: "Delhi", lat: 28.7041, long: 77.1025 },
    { name: "Bangkok", lat: 13.7563, long: 100.5018 },
    { name: "Seoul", lat: 37.5665, long: 126.9780 },
    { name: "Singapore", lat: 1.3521, long: 103.8198 },
    { name: "Hong Kong", lat: 22.3193, long: 114.1694 },
    { name: "Dubai", lat: 25.2048, long: 55.2708 },
    
    // Africa
    { name: "Cairo", lat: 30.0444, long: 31.2357 },
    { name: "Lagos", lat: 6.5244, long: 3.3792 },
    { name: "Nairobi", lat: -1.2921, long: 36.8219 },
    { name: "Johannesburg", lat: -26.2041, long: 28.0473 },
    { name: "Casablanca", lat: 33.5731, long: -7.5898 },
    { name: "Addis Ababa", lat: 9.0320, long: 38.7489 },
    
    // Oceania
    { name: "Sydney", lat: -33.8688, long: 151.2093 },
    { name: "Melbourne", lat: -37.8136, long: 144.9631 },
    { name: "Auckland", lat: -36.8485, long: 174.7633 },
    { name: "Perth", lat: -31.9505, long: 115.8605 }
  ];

  // City markers removed per request (coastlines rendered as dotted points instead)

  // Create Moon with bright glowing verde scandal color
  const moonRadius = 0.3;
  const moonGeometry = new THREE.SphereGeometry(moonRadius, 64, 64);
  
  // Create lunar surface material with bright glowing verde scandal color
  const moonMaterial = new THREE.MeshPhongMaterial({
    color: 0xd5fa1b, // Bright glowing verde scandal base (your theme color)
    shininess: 100, // High shininess for metallic look
    transparent: true,
    opacity: 0.95
  });
  
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  
  // Position moon at a distance from Earth
  const moonDistance = 3.5;
  moon.position.set(moonDistance, 0, 0);
  scene.add(moon);

  // Add surface layer with bright glowing verde scandal color
  const surfaceGeometry = new THREE.SphereGeometry(moonRadius * 0.98, 48, 48);
  const surfaceMaterial = new THREE.MeshPhongMaterial({
    color: 0xd5fa1b, // Bright glowing verde scandal
    shininess: 150, // Very high shininess
    transparent: true,
    opacity: 0.9
  });
  const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
  moon.add(surface);

  // Add accent layer with bright glowing verde scandal
  const accentGeometry = new THREE.SphereGeometry(moonRadius * 0.99, 32, 32);
  const accentMaterial = new THREE.MeshPhongMaterial({
    color: 0xd5fa1b, // Bright glowing verde scandal accent
    shininess: 200, // Extremely shiny
    transparent: true,
    opacity: 0.8
  });
  const accent = new THREE.Mesh(accentGeometry, accentMaterial);
  moon.add(accent);

  // Add realistic lunar craters
  const craterPositions = [
    { x: 0.2, y: 0.3, z: 0.8, radius: 0.08, depth: 0.02 },
    { x: -0.4, y: 0.1, z: 0.6, radius: 0.12, depth: 0.03 },
    { x: 0.6, y: -0.2, z: 0.4, radius: 0.06, depth: 0.015 },
    { x: -0.3, y: -0.4, z: 0.7, radius: 0.1, depth: 0.025 },
    { x: 0.1, y: 0.5, z: 0.5, radius: 0.09, depth: 0.02 },
    { x: -0.5, y: 0.2, z: 0.3, radius: 0.07, depth: 0.018 },
    { x: 0.4, y: -0.3, z: 0.6, radius: 0.11, depth: 0.028 },
    { x: -0.2, y: -0.1, z: 0.9, radius: 0.05, depth: 0.012 },
    { x: 0.3, y: 0.4, z: 0.4, radius: 0.08, depth: 0.02 },
    { x: -0.6, y: -0.2, z: 0.5, radius: 0.13, depth: 0.032 },
    { x: 0.7, y: 0.1, z: 0.3, radius: 0.04, depth: 0.01 },
    { x: -0.1, y: -0.6, z: 0.4, radius: 0.09, depth: 0.022 },
    { x: 0.5, y: 0.6, z: 0.2, radius: 0.06, depth: 0.015 },
    { x: -0.7, y: -0.3, z: 0.3, radius: 0.08, depth: 0.02 },
    { x: 0.2, y: -0.5, z: 0.6, radius: 0.11, depth: 0.027 }
  ];

  craterPositions.forEach(crater => {
    const craterGeometry = new THREE.SphereGeometry(crater.radius, 16, 16);
    const craterMaterial = new THREE.MeshPhongMaterial({
      color: 0x7a9a2a, // Medium bright verde scandal for subtle crater shadows
      shininess: 30,
      transparent: true,
      opacity: 0.4
    });
    const craterMesh = new THREE.Mesh(craterGeometry, craterMaterial);
    
    // Position crater on moon surface
    craterMesh.position.set(
      crater.x * moonRadius * 0.8,
      crater.y * moonRadius * 0.8,
      crater.z * moonRadius * 0.8
    );
    
    // Scale to create depth effect
    craterMesh.scale.set(1, 1, crater.depth);
    
    moon.add(craterMesh);
  });

  // Add bright glowing lighting for maximum verde scandal effect
  const moonLight = new THREE.PointLight(0xffffff, 2.0, 15);
  moonLight.position.set(moonDistance + 1, 1, 0);
  scene.add(moonLight);

  // Add bright glowing verde scandal accent lighting
  const moonLight2 = new THREE.PointLight(0xd5fa1b, 1.8, 12);
  moonLight2.position.set(moonDistance - 0.5, -0.5, 0.5);
  scene.add(moonLight2);

  // Add bright glowing ambient verde scandal glow
  const moonLight3 = new THREE.PointLight(0xd5fa1b, 1.5, 8);
  moonLight3.position.set(moonDistance, 0, 0);
  scene.add(moonLight3);

  // Add extra bright glowing highlight
  const moonLight4 = new THREE.PointLight(0xffffff, 1.5, 10);
  moonLight4.position.set(moonDistance + 0.5, 0.5, 0.5);
  scene.add(moonLight4);

  // Add even more bright glowing lighting
  const moonLight5 = new THREE.PointLight(0xffffff, 1.2, 12);
  moonLight5.position.set(moonDistance + 0.8, -0.3, 0.8);
  scene.add(moonLight5);

  // Add intense verde scandal glow
  const moonLight6 = new THREE.PointLight(0xd5fa1b, 1.0, 6);
  moonLight6.position.set(moonDistance, 0.3, 0.3);
  scene.add(moonLight6);

  camera.position.z = 4.5;
  
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.5;

  let moonAngle = 0;
  const moonSpeed = 0.005; // Speed of moon orbit

  function animate() {
    requestAnimationFrame(animate);
    
    // Ripple animation (Guntur marker)
    t += rippleSpeed;
    [ring1, ring2, ring3].forEach((ring, i) => {
      const phase = t + i * 0.33;
      const eased = 0.5 - 0.5 * Math.cos((phase % 1) * Math.PI); // cosine ease
      const s = 1 + eased * 1.4;
      ring.scale.set(s, s, s);
      ring.material.opacity = 0.65 * (1 - eased);
    });

    // Lake Forest ripple animation (same as Guntur)
    [lfRing1, lfRing2, lfRing3].forEach((ring, i) => {
      const phase = t + i * 0.33;
      const eased = 0.5 - 0.5 * Math.cos((phase % 1) * Math.PI);
      const s = 1 + eased * 1.4;
      ring.scale.set(s, s, s);
      ring.material.opacity = 0.65 * (1 - eased);
    });

    // Reveal arc from A to B over ~5 seconds, then loop
    const now = performance.now();
    const delta = Math.min(100, now - lastTime);
    lastTime = now;

    if (rayPhase === 0) {
      // Travel
      rayProgress += delta / travelDurationMs;
      if (rayProgress >= 1) {
        rayProgress = 1;
        rayPhase = 1;
        mergeElapsed = 0;
      }
    } else {
      // Merge tail into Lake Forest, shrinking segment while head stays at B
      mergeElapsed += delta;
      if (mergeElapsed >= mergeDurationMs) {
        // restart
        rayPhase = 0;
        rayProgress = 0;
      }
    }
    const posArr = rayLineGeom.attributes.position.array;
    const head = rayProgress;
    const remaining = (rayPhase === 1) ? Math.max(0, 1 - mergeElapsed / mergeDurationMs) : 1;
    const effectiveSpan = segmentSpan * remaining;
    const tail = Math.max(0, head - effectiveSpan);
    const minSamples = 64; // smooth segment
    const samples = Math.max(minSamples, Math.floor(numRaySamples * segmentSpan));
    let lastX = 0, lastY = 0, lastZ = 0;
    for (let i = 0; i < numRaySamples; i++) {
      if (i < samples) {
        const s = (samples <= 1) ? 1 : (i / (samples - 1));
        const t = tail + (head - tail) * s;
        const p = rayCurve.getPoint(t);
        posArr[i * 3 + 0] = lastX = p.x;
        posArr[i * 3 + 1] = lastY = p.y;
        posArr[i * 3 + 2] = lastZ = p.z;
      } else {
        posArr[i * 3 + 0] = lastX;
        posArr[i * 3 + 1] = lastY;
        posArr[i * 3 + 2] = lastZ;
      }
    }
    rayLineGeom.attributes.position.needsUpdate = true;
    rayLineGeom.computeBoundingSphere();

    // No arrow head; just the animated arc line

    // Animate moon orbit
    moonAngle += moonSpeed;
    moon.position.x = Math.cos(moonAngle) * moonDistance;
    moon.position.z = Math.sin(moonAngle) * moonDistance;
    
    // Rotate moon slightly on its own axis
    moon.rotation.y += 0.002;
    
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