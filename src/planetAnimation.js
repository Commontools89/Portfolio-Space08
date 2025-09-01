import * as THREE from 'three';
import { feature } from 'topojson-client';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { createOrbSync } from './orbSync.js';

export function createPlanet() {
  const scene = new THREE.Scene();
  // Scene mode: 'planet' or 'house'
  let mode = 'planet';
  // Group for all Earth meshes so we can rotate the planet as a whole
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);
  // House group (hidden initially)
  const houseGroup = new THREE.Group();
  houseGroup.visible = false;
  scene.add(houseGroup);
  let birds = [];
  const gltfLoader = new GLTFLoader();
  let treeTrunks = null; // InstancedMesh placeholders (optional)
  let treeCrowns = null;
  let savedCam = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('planetCanvas'),
    alpha: true,
    antialias: true
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const radius = 1.5;

  // Add base black sphere for oceans/non-pointed regions (unlit)
  const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.9
  });
  const baseSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  earthGroup.add(baseSphere);

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

  // Fetch land outlines only (no country borders) and draw coastline rings
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
    .then(r => r.json())
    .then(topology => {
      const land = feature(topology, topology.objects.land);
      const geoms = (land.type === 'FeatureCollection') ? land.features.map(f => f.geometry) : [land.geometry];
      geoms.forEach(geometry => {
        if (!geometry) return;
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
    earthGroup.add(line);
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
  earthGroup.add(core);
  // Click on Guntur marker to switch to house scene
  core.userData.isGuntur = true;

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
    earthGroup.add(ring);
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
  earthGroup.add(lfCore);

  // Lake Forest ripple rings (use same effect as Guntur)
  function createRingAt(position, lookTarget, radiusScale) {
    const ringGeo = new THREE.RingGeometry(0.022 * radiusScale, 0.024 * radiusScale, 128);
    const ring = new THREE.Mesh(ringGeo, rippleMat.clone());
    ring.position.copy(position);
    ring.lookAt(lookTarget);
    earthGroup.add(ring);
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
  earthGroup.add(rayLine);
  
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
  const moonGeometry = new THREE.SphereGeometry(moonRadius, 128, 128);
  
  // Create lunar material and emboss craters directly via bump map
  const baseTexLoader = new THREE.TextureLoader();
  const moonBumpMap = baseTexLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg');
  const moonMaterial = new THREE.MeshPhongMaterial({
    color: 0xd5fa1b,
    bumpMap: moonBumpMap,
    bumpScale: 0.06,
    specular: 0x222222,
    shininess: 20,
    transparent: true,
    opacity: 0.95
  });
  
  // Procedurally carve craters into the moon geometry (no extra meshes)
  function carveCraters(geometry, defs) {
    const pos = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const normal = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      vertex.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      normal.copy(vertex).normalize();
      let inset = 0;
      for (let j = 0; j < defs.length; j++) {
        const d = defs[j];
        const dot = THREE.MathUtils.clamp(normal.dot(d.dir), -1, 1);
        const ang = Math.acos(dot);
        if (ang < d.radius) {
          const k = 0.5 * (1 + Math.cos(Math.PI * ang / d.radius));
          inset += d.depth * k;
        }
      }
      if (inset > 0) {
        vertex.addScaledVector(normal, -inset);
        pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  const craterDefs = [
    { dir: new THREE.Vector3(0.2, 0.3, 0.8).normalize(), radius: 0.22, depth: 0.02 },
    { dir: new THREE.Vector3(-0.4, 0.1, 0.6).normalize(), radius: 0.28, depth: 0.03 },
    { dir: new THREE.Vector3(0.6, -0.2, 0.4).normalize(), radius: 0.18, depth: 0.014 },
    { dir: new THREE.Vector3(-0.3, -0.4, 0.7).normalize(), radius: 0.24, depth: 0.022 },
    { dir: new THREE.Vector3(0.1, 0.5, 0.5).normalize(), radius: 0.2, depth: 0.018 },
    { dir: new THREE.Vector3(-0.5, 0.2, 0.3).normalize(), radius: 0.17, depth: 0.015 },
    { dir: new THREE.Vector3(0.4, -0.3, 0.6).normalize(), radius: 0.26, depth: 0.025 },
    { dir: new THREE.Vector3(-0.2, -0.1, 0.9).normalize(), radius: 0.16, depth: 0.012 },
    // far side craters
    { dir: new THREE.Vector3(-0.2, 0.3, -0.8).normalize(), radius: 0.24, depth: 0.02 },
    { dir: new THREE.Vector3(0.5, -0.1, -0.6).normalize(), radius: 0.2, depth: 0.018 },
    { dir: new THREE.Vector3(-0.6, 0.2, -0.4).normalize(), radius: 0.22, depth: 0.02 },
    { dir: new THREE.Vector3(0.3, -0.5, -0.5).normalize(), radius: 0.18, depth: 0.016 },
  ];
  carveCraters(moonGeometry, craterDefs);
  
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  
  // Position moon at a distance from Earth
  const moonDistance = 3.5;
  moon.position.set(moonDistance, 0, 0);
  scene.add(moon);

  // Drag + snap-to-orbit
  let moonDragging = false;
  let moonSnap = null; // { start:number, from:Vector3, to:Vector3, duration:number }
  let moonResume = null; // { start:number, duration:number }
  const dragControls = new DragControls([moon], camera, renderer.domElement);
  dragControls.addEventListener('dragstart', () => {
    controls.enabled = false;
    moonDragging = true;
    moonSnap = null;
    moonAngularVelocity = 0;
  });
  dragControls.addEventListener('drag', (e) => {
    const p = e.object.position;
    const d = p.length();
    const minD = moonRadius * 2.2;
    const maxD = moonDistance * 6;
    if (d < minD || d > maxD) {
      const nx = p.x / (d || 1);
      const ny = p.y / (d || 1);
      const nz = p.z / (d || 1);
      const clampR = Math.max(minD, Math.min(maxD, d));
      p.set(nx * clampR, ny * clampR, nz * clampR);
    }
  });
  dragControls.addEventListener('dragend', () => {
    controls.enabled = true;
    moonDragging = false;
    // snap target projected to the orbit ring at y=0 for stable start
    const target = new THREE.Vector3(moon.position.x, 0, moon.position.z).normalize().multiplyScalar(moonDistance);
    moonSnap = { start: performance.now(), from: moon.position.clone(), to: target, duration: 900 };
    moonResume = null; // will start after snap finishes
  });

  // Removed masking surface sphere; using bump directly on base moon

  // Removed accent layer to avoid hiding bump details

  // Lightweight option: rely on bump map instead of extra crater meshes

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
  
  // Simple verde scandal house (inspired by sunposition's minimal scene building)
  function buildHouse(group) {
    // Platform (smaller to avoid overlap with planet elements)
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.18, 48), new THREE.MeshPhongMaterial({ color: 0x0a0a0a }));
    platform.position.y = -0.09;
    group.add(platform);

    // Option A: Load a GLTF modern house similar to the reference demo
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    const gltf = new GLTFLoader();
    gltf.setDRACOLoader(draco);
    gltf.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/AVIFTest/forest_house.glb', (res)=>{
      const model = res.scene;
      model.scale.set(0.22, 0.22, 0.22); // slightly bigger to blend with modern house/trees
      // move GLTF house to former hut spot
      model.position.set(-1.0, 0, 0.9);
      // reverse facing
      model.rotation.y = Math.PI;
      // theme walls verde scandal, roof black, keep GLTF trees/leaves natural
      const modelBox = new THREE.Box3().setFromObject(model);
      const totalH = (modelBox.max.y - modelBox.min.y) || 1;
      const roofBandY = modelBox.max.y - 0.2 * totalH; // top 20%
      const isLeaves = (n) => /leaf|leaves|foliage|pine|needles/i.test(n || '');
      const isTrunk  = (n) => /trunk|bark|wood|stem/i.test(n || '');
      const roofBrown = new THREE.Color(0x6b4f2a);
      model.traverse(o=>{
        if (!o.isMesh || !o.material) return;
        const mat = o.material;
        const hasColor = !!mat.color;
        const bb = new THREE.Box3().setFromObject(o);
        const dx = bb.max.x - bb.min.x;
        const dy = bb.max.y - bb.min.y;
        const dz = bb.max.z - bb.min.z;
        const flat = dy < Math.max(dx, dz) * 0.25; // thin compared to span
        const nearTop = bb.max.y >= roofBandY;
        if (hasColor) {
          if (isLeaves(o.name)) {
            mat.color = new THREE.Color(0xa9ff1b); // our modern leaves green
          } else if (isTrunk(o.name)) {
            mat.color = new THREE.Color(0x5a3b27); // trunk brown
          } else if (nearTop && flat) {
            mat.color = roofBrown; // roof brown
          } else {
            mat.color = new THREE.Color(0xd5fa1b); // theme walls/other
          }
        }
      });
      group.add(model);
    }, undefined, ()=>{/* fallback to procedural if needed */});

    // Procedural modern house fallback disabled to prefer exact GLTF model
    const facadeMat = new THREE.MeshPhysicalMaterial({ color: 0xd5fa1b, metalness: 0.25, roughness: 0.5, clearcoat: 0.35 });
    const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x101010, metalness: 0.6, roughness: 0.4 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x8fd80a, transmission: 0.85, thickness: 0.08, roughness: 0.12, transparent: true, opacity: 0.9 });

    // Build modern house elements into a subgroup so we can shift slightly right
    const modern = new THREE.Group();
    const blockA = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.8), facadeMat);
    blockA.position.set(0, 0.325, 0);
    const blockB = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.65), darkMat);
    blockB.position.set(-0.6, 0.7, -0.05);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.05, 0.95), darkMat);
    roof.position.set(0, 0.7, 0);
    const windowWall = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.02), glassMat);
    windowWall.position.set(0.08, 0.5, 0.41);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.03), darkMat);
    door.position.set(-0.5, 0.28, 0.41);
    modern.add(blockA, blockB, roof, windowWall, door);
    modern.position.set(0.7, 0, 0.2); // a little to the right

    // Remove tank/car per request; add modern subgroup
    group.add(modern);

    // Fewer trees around platform (leave space for pool)
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x5a3b27 });
    const leafMat = new THREE.MeshPhongMaterial({ color: 0xa9ff1b });
    function addTree(x, z, s=1) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04*s, 0.05*s, 0.5*s, 8), trunkMat);
      trunk.position.set(x, 0.25*s, z);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28*s, 0), leafMat);
      crown.position.set(x, 0.65*s, z);
      group.add(trunk, crown);
    }
    const ring = 1.6;
    const treePositions = [
      [Math.cos(0)*ring, Math.sin(0)*ring],
      [Math.cos(1.7)*ring, Math.sin(1.7)*ring], // moved a bit more away from GLTF house
      [Math.cos(4.0)*ring, Math.sin(4.0)*ring]
    ];
    treePositions.forEach(([tx,tz],i)=>addTree(tx, tz, 0.9 + (i%2)*0.15));

    // Garden shrubs around platform
    const shrubMat = new THREE.MeshPhongMaterial({ color: 0xa9ff1b });
    function addShrub(x, z, s = 1) {
      const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 * s, 0), shrubMat);
      shrub.position.set(x, 0.12 * s, z);
      group.add(shrub);
    }
    // Remove platform shrubs per request

    // Grass patch around modern house base
    const grassMat = new THREE.MeshPhongMaterial({ color: 0xd5fa1b });
    const grass = new THREE.Mesh(new THREE.CircleGeometry(0.9, 64), grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(modern.position.x, 0.001, modern.position.z);
    group.add(grass);

    // Add sparse grass tufts on the patch (low-poly, verde theme)
    const tuftMat = new THREE.MeshPhongMaterial({ color: 0xd5fa1b });
    function addGrassTuft(x, z, scale = 1) {
      const tuft = new THREE.Group();
      const h = 0.08 * scale;
      const r = 0.01 * scale;
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), tuftMat);
        blade.position.y = h / 2;
        blade.rotation.z = (-0.6 + Math.random() * 1.2) * 0.6; // lean a bit
        blade.rotation.y = (i / 3) * Math.PI * 2;
        tuft.add(blade);
      }
      tuft.position.set(x, 0.0, z);
      group.add(tuft);
    }
    // Distribute tufts randomly within the grass circle, avoiding house footprint
    const patchR = 0.85;
    const houseExR = 0.28, houseExZ = 0.2; // ellipse exclusion near door/walls
    for (let i = 0; i < 36; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * patchR;
      const gx = modern.position.x + Math.cos(ang) * r;
      const gz = modern.position.z + Math.sin(ang) * r;
      const ex = (gx - modern.position.x) / houseExR;
      const ez = (gz - modern.position.z) / houseExZ;
      if ((ex * ex + ez * ez) < 1.0) continue; // skip inside footprint ellipse
      addGrassTuft(gx, gz, 0.8 + Math.random() * 0.6);
    }

    // Decorative poles with small lamps
    const poleMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    const lampMat = new THREE.MeshPhongMaterial({ color: 0xd5fa1b, emissive: 0x5a8f0a, emissiveIntensity: 0.8 });
    function addPole(x, z, h = 0.6) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, h, 12), poleMat);
      mast.position.set(x, h / 2, z);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), lampMat);
      lamp.position.set(x, h + 0.03, z);
      const light = new THREE.PointLight(0xd5fa1b, 0.55, 2.2);
      light.position.set(x, h + 0.05, z);
      group.add(mast, lamp, light);
    }
    addPole(0.3, 0.9, 0.62);   // near modern house side
    addPole(-0.2, -1.1, 0.58); // opposite edge
    addPole(1.1, -0.4, 0.64);  // another corner

    // Fence around the platform with a gate opening
    const fencePostMat = new THREE.MeshPhongMaterial({ color: 0x303030 });
    const fenceRailMat = new THREE.MeshPhongMaterial({ color: 0x202020 });
    const fenceRadius = 2.55; // slightly outside platform
    const posts = 18;
    const gateSpan = Math.PI / 7; // opening angle for gate
    const gateCenter = -Math.PI / 2; // gate facing toward camera initially
    const postH = 0.22;
    const postGeo = new THREE.CylinderGeometry(0.02, 0.02, postH, 10);
    for (let i = 0; i < posts; i++) {
      const ang = (i / posts) * Math.PI * 2;
      const delta = Math.atan2(Math.sin(ang - gateCenter), Math.cos(ang - gateCenter));
      if (Math.abs(delta) < gateSpan * 0.5) continue; // skip posts in gate span
      const x = Math.cos(ang) * fenceRadius;
      const z = Math.sin(ang) * fenceRadius;
      const post = new THREE.Mesh(postGeo, fencePostMat);
      post.position.set(x, postH / 2, z);
      group.add(post);
      // No rails/chains per request; keep posts as border only
    }

    // Remove hut per request

    // Birds: custom parrot-like silhouette (body + thin wings + tail), no GLTF
    const verdeMatFlat = new THREE.MeshBasicMaterial({ color: 0xd5fa1b, side: THREE.DoubleSide });
    const verdeMatLit = new THREE.MeshPhongMaterial({ color: 0xd5fa1b, shininess: 30 });
    function tri(ax,ay,az,bx,by,bz,cx,cy,cz){
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([ax,ay,az,bx,by,bz,cx,cy,cz]),3));
      g.computeVertexNormals();
      return new THREE.Mesh(g, verdeMatFlat);
    }
    function createVBird() {
      const bird = new THREE.Group();
      const wingSpan = 0.1;
      const wingHeight = 0.03;
      const wingGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        0, 0, 0,
        wingSpan, 0, 0,
        wingSpan / 2, wingHeight, 0,
      ]);
      wingGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const wingL = new THREE.Mesh(wingGeometry, verdeMatFlat);
      const wingR = new THREE.Mesh(wingGeometry.clone(), verdeMatFlat);
      wingR.scale.x = -1;
      bird.add(wingL, wingR);
      // Make birds a bit smaller
      bird.scale.set(0.8, 0.8, 0.8);
      bird.userData = {
        r: 1.4 + Math.random()*0.6,
        h: 0.75 + Math.random()*0.4,
        sp: 0.9 + Math.random()*0.6,
        ph: Math.random()*Math.PI*2,
        flap: 8 + Math.random()*4,
        hiddenStart: 0,
        wingL,
        wingR
      };
      group.add(bird);
      birds.push(bird);
    }
    const numBirds = 14;
    for (let i = 0; i < numBirds; i++) createVBird();

    group.position.set(0, 0, 0);
  }
  buildHouse(houseGroup);

  // Camera motion tracking for particle wind coupling
  const prevCamPos = new THREE.Vector3().copy(camera.position);
  const prevCamQuat = camera.quaternion.clone();
  const windVec = new THREE.Vector3();

  let moonAngle = 0;
  const moonSpeed = 0.005; // Speed of moon orbit
  let moonAngularVelocity = moonSpeed;
  const moonAngularAcceleration = moonSpeed / 30;

  // --- SANDBAND PARTICLE FIELD (orb-like, deterministic) ---
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let particleSeed = Math.floor(Math.random() * 1e9) >>> 0;
  let simStartMs = Date.now();
  const particleRadius = radius * 2.0;
  let particleCount = 6500; // denser halo around entire globe
  // Band shards per active window (so particles "transfer" between tabs)
  let bandPoints = [];
  let bandGeos = [];
  let bandPos = [];
  let bandDir = [];
  let bandPhase = [];
  let bandSpeed = [];
  let bandVel = [];
  let rng = mulberry32(particleSeed);

  function buildBandShards(shards) {
    // cleanup old
    bandPoints.forEach(p => scene.remove(p));
    bandPoints = []; bandGeos = []; bandPos = []; bandDir = []; bandPhase = []; bandSpeed = [];
    const counts = new Array(shards).fill(0).map(() => 0);
    // two-pass: first decide counts, then allocate
    const tmpAssign = new Int32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      tmpAssign[i] = i % shards;
      counts[tmpAssign[i]]++;
    }
    for (let s = 0; s < shards; s++) {
      bandPos[s] = new Float32Array(counts[s] * 3);
      bandDir[s] = new Float32Array(counts[s] * 3);
      bandPhase[s] = new Float32Array(counts[s]);
      bandSpeed[s] = new Float32Array(counts[s]);
      bandVel[s] = new Float32Array(counts[s] * 3);
    }
    rng = mulberry32(particleSeed);
    const writeIdx = new Array(shards).fill(0);
    for (let i = 0; i < particleCount; i++) {
      const shard = tmpAssign[i];
      const wi = writeIdx[shard]++;
      const u = rng();
      const v = rng();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const band = 0.22; // thicker band for full wrap
      const radial = particleRadius + (rng() * 2 - 1) * (radius * band);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      bandPos[shard][wi * 3 + 0] = x * radial;
      bandPos[shard][wi * 3 + 1] = y * radial;
      bandPos[shard][wi * 3 + 2] = z * radial;
      // build a random tangent on the sphere to avoid equator bias
      const nx = x, ny = y, nz = z;
      // pick a reference not parallel to normal
      let rx = 0, ry = 1, rz = 0;
      if (Math.abs(ny) > 0.9) { rx = 1; ry = 0; rz = 0; }
      // t1 = normalize(cross(n, ref))
      let t1x = ny * rz - nz * ry;
      let t1y = nz * rx - nx * rz;
      let t1z = nx * ry - ny * rx;
      const t1len = Math.hypot(t1x, t1y, t1z) || 1; t1x/=t1len; t1y/=t1len; t1z/=t1len;
      // t2 = normalize(cross(n, t1))
      let t2x = ny * t1z - nz * t1y;
      let t2y = nz * t1x - nx * t1z;
      let t2z = nx * t1y - ny * t1x;
      const t2len = Math.hypot(t2x, t2y, t2z) || 1; t2x/=t2len; t2y/=t2len; t2z/=t2len;
      const ang = rng() * Math.PI * 2;
      let tx = t1x * Math.cos(ang) + t2x * Math.sin(ang);
      let ty = t1y * Math.cos(ang) + t2y * Math.sin(ang);
      let tz = t1z * Math.cos(ang) + t2z * Math.sin(ang);
      bandDir[shard][wi * 3 + 0] = tx;
      bandDir[shard][wi * 3 + 1] = ty;
      bandDir[shard][wi * 3 + 2] = tz;
      bandPhase[shard][wi] = rng() * Math.PI * 2;
      bandSpeed[shard][wi] = 0.15 + rng() * 0.55;
    }
    for (let s = 0; s < shards; s++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(bandPos[s], 3));
      bandGeos[s] = geo;
      const mat = new THREE.PointsMaterial({
        color: 0xd5fa1b,
        size: 0.0055,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const pts = new THREE.Points(geo, mat);
      pts.visible = true; // we'll toggle by ownership below
      scene.add(pts);
      bandPoints[s] = pts;
    }
  }

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

    // Rotate Earth group slowly: one revolution per real day
    const secondsPerDay = 86400;
    const deltaSeconds = delta / 1000;
    earthGroup.rotation.y += (2 * Math.PI) * (deltaSeconds / secondsPerDay);

    // Moon orbit or drag/snap
    if (!moonDragging && !moonSnap) {
      // ease back into orbital speed if coming out of a snap
      let speedScale = 1;
      if (moonResume) {
        const tt = Math.min(1, (performance.now() - moonResume.start) / moonResume.duration);
        speedScale = 1 - Math.pow(1 - tt, 3);
        if (tt >= 1) moonResume = null;
      }
      moonAngle += moonSpeed * speedScale;
    moon.position.x = Math.cos(moonAngle) * moonDistance;
    moon.position.z = Math.sin(moonAngle) * moonDistance;
    }
    if (moonSnap) {
      const tSnap = Math.min(1, (performance.now() - moonSnap.start) / moonSnap.duration);
      const ease = 1 - Math.pow(1 - tSnap, 3);
      moon.position.lerpVectors(moonSnap.from, moonSnap.to, ease);
      // keep orbit phase aligned with snapped position to prevent jump
      moonAngle = Math.atan2(moon.position.z, moon.position.x);
      if (tSnap >= 1) {
        moonSnap = null;
        moonResume = { start: performance.now(), duration: 450 };
      }
    }
    
    // Rotate moon slightly on its own axis
    moon.rotation.y += 0.002;

    // Animate birds around the house
    if (houseGroup.visible && birds.length) {
      const tNow = performance.now() * 0.001;
      // advance GLTF bird mixers for wing flaps
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        const d = b.userData || {};
        const a = tNow * (d.sp || 1.0) + (d.ph || 0);
        const r = d.r || 1.4;
        const h = d.h || 0.8;
        // show after full orbit, then hide for ~2s
        const cycle = 2.0;
        const phase = (a % (Math.PI*2)) / (Math.PI*2);
        if (phase < 0.02 && (!d.hiddenStart || tNow - d.hiddenStart > cycle)) d.hiddenStart = tNow;
        b.visible = !(tNow - (d.hiddenStart || 0) < cycle);
        b.position.set(Math.cos(a) * r, h + Math.sin(a*2)*0.08, Math.sin(a) * r);
        b.rotation.y = -(a + Math.PI/2);
        // flap wings and add slight roll/tilt
        const flap = Math.sin(tNow * (d.flap || 8));
        if (d.wingL && d.wingR) {
          d.wingL.rotation.z = 0.5 + flap * 0.8;
          d.wingR.rotation.z = -0.5 - flap * 0.8;
        }
        b.rotation.z = flap * 0.14;
        b.rotation.x = -0.12;
      }
    }
    
    // Sand flow: drift along tangent with gentle turbulence + camera-coupled wind
    const nowMs = Date.now();
    const simT = (nowMs - simStartMs) * 0.0012; // global time so tabs match
    // camera-based wind vector (world space delta)
    windVec.copy(camera.position).sub(prevCamPos);
    const camMoveLen = windVec.length();
    prevCamPos.copy(camera.position);
    // time step for physics
    if (!animate._physPrev) animate._physPrev = performance.now();
    const nowPhys = performance.now();
    const dt = Math.min(0.05, (nowPhys - animate._physPrev) / 1000);
    animate._physPrev = nowPhys;
    for (let s = 0; s < bandPoints.length; s++) {
      const pos = bandGeos[s].attributes.position.array;
      const dir = bandDir[s];
      const spd = bandSpeed[s];
      const ph = bandPhase[s];
      const vel = bandVel[s];
      for (let i = 0; i < spd.length; i++) {
        const idx = i * 3;
        let x = pos[idx + 0];
        let y = pos[idx + 1];
        let z = pos[idx + 2];
        const tx = dir[idx + 0];
        const ty = dir[idx + 1];
        const tz = dir[idx + 2];
        const sp = spd[i];
        const phase = ph[i];
        // base drift (tangent)
        const baseDrift = 0.45 * dt; // scaled by dt
        vel[idx + 0] += tx * sp * baseDrift;
        vel[idx + 1] += ty * sp * baseDrift;
        vel[idx + 2] += tz * sp * baseDrift;
        // wind coupling: project camera-motion onto tangent plane
        const r = Math.hypot(x, y, z) || particleRadius;
        const nx = x / r, ny = y / r, nz = z / r;
        const wx = windVec.x, wy = windVec.y, wz = windVec.z;
        const wDotN = wx * nx + wy * ny + wz * nz;
        const wxT = wx - wDotN * nx;
        const wyT = wy - wDotN * ny;
        const wzT = wz - wDotN * nz;
        const windGain = Math.min(1.0, 2.5 * camMoveLen);
        vel[idx + 0] += wxT * windGain * 0.12;
        vel[idx + 1] += wyT * windGain * 0.12;
        vel[idx + 2] += wzT * windGain * 0.12;
        const breathe = Math.sin(simT * 1.7 + phase) * (radius * 0.02);
        // radial transfer offset tweaked toward shard's target
        const ro = bandPoints[s].userData;
        ro.radialOffset += ((ro.radialTarget || 0) - (ro.radialOffset || 0)) * 0.05;
        const targetR = particleRadius + breathe + (ro.radialOffset || 0);
        const springK = 6.0; // radial spring strength
        const radialErr = (targetR - r);
        vel[idx + 0] += nx * springK * radialErr * dt;
        vel[idx + 1] += ny * springK * radialErr * dt;
        vel[idx + 2] += nz * springK * radialErr * dt;
        // damping
        const damp = Math.pow(0.92, dt * 60);
        vel[idx + 0] *= damp;
        vel[idx + 1] *= damp;
        vel[idx + 2] *= damp;
        // integrate
        x += vel[idx + 0];
        y += vel[idx + 1];
        z += vel[idx + 2];
        // project back to target sphere radius to prevent equator accumulation
        const r2 = Math.hypot(x, y, z) || targetR;
        if (r2 > 0) {
          const inv = targetR / r2;
          pos[idx + 0] = x * inv;
          pos[idx + 1] = y * inv;
          pos[idx + 2] = z * inv;
        } else {
          pos[idx + 0] = nx * targetR;
          pos[idx + 1] = ny * targetR;
          pos[idx + 2] = nz * targetR;
        }
      }
      bandGeos[s].attributes.position.needsUpdate = true;
      bandPoints[s].rotation.y += 0.0009;
      // fade toward target opacity for transfer visual
      const mat = bandPoints[s].material;
      const target = typeof bandPoints[s].userData.targetOpacity === 'number' ? bandPoints[s].userData.targetOpacity : 0.9;
      mat.opacity += (target - mat.opacity) * 0.08; // smooth approach
      if (mat.opacity < 0.02 && target === 0.0) {
        bandPoints[s].visible = false; // fully hidden when faded out
      } else {
        bandPoints[s].visible = true;
      }
    }
    
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

  // Raycaster to detect clicks on the Guntur marker and toggle to house scene
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('click', (ev) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([core], true);
    if (intersects.length && intersects[0].object.userData.isGuntur) {
      // Toggle to house view
      mode = 'house';
      // save camera/target
      savedCam.position.copy(camera.position);
      savedCam.target = controls.target.clone();
      earthGroup.visible = false;
      houseGroup.visible = true;
      controls.target.set(0, 0.5, 0);
      camera.position.set(2.8, 1.6, 3.2);
      controls.update();
    }
  });

  // ESC to exit house and return to planet
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mode === 'house') {
      mode = 'planet';
      houseGroup.visible = false;
      earthGroup.visible = true;
      controls.target.copy(savedCam.target || new THREE.Vector3());
      camera.position.copy(savedCam.position || new THREE.Vector3(0,0,4.5));
      controls.update();
    }
  });

  // Cross-window orb sync (camera + target + particle seed/time)
  const orb = createOrbSync({
    getState: () => ({
      target: controls.target.toArray(),
      position: camera.position.toArray(),
      zoom: camera.zoom,
      pSeed: particleSeed,
      pStart: simStartMs,
      pCount: particleCount,
      shards: 2
    }),
    applyState: (s) => {
      if (!s) return;
      if (Array.isArray(s.target)) controls.target.fromArray(s.target);
      if (Array.isArray(s.position)) camera.position.fromArray(s.position);
      if (typeof s.zoom === 'number') camera.zoom = s.zoom;
      if (typeof s.pSeed === 'number' && s.pSeed !== particleSeed) {
        particleSeed = s.pSeed >>> 0;
        rebuildParticles();
      }
      if (typeof s.pStart === 'number') {
        simStartMs = s.pStart;
      }
      if (typeof s.pCount === 'number' && s.pCount !== particleCount) {
        particleCount = Math.max(1000, Math.min(12000, s.pCount | 0));
        buildBandShards(currentShardTotal);
      }
      camera.updateProjectionMatrix();
      controls.update();
    },
    throttleMs: 80,
  });
  orb.start();
  // Leadership: only the focused tab broadcasts continuously
  let isLeader = document.hasFocus();
  let currentShardTotal = 2;
  const onFocus = () => { isLeader = true; orb.broadcast(true); };
  const onBlur = () => { isLeader = false; };
  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);
  // Force an initial broadcast so the other tab latches on
  orb.broadcast(true);
  const send = () => { if (isLeader) orb.broadcast(false); };
  controls.addEventListener('change', send);
  const heartbeat = setInterval(() => { if (isLeader) orb.broadcast(false); }, 600);

  // Split particle band across tabs so particles "transfer"
  // Track active window ids list to assign a stable shard index
  const LIST_KEY = 'planet_window_list_v1';
  const myId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  let windowList = [];
  let myIndex = 0;
  function readList() {
    try { return JSON.parse(localStorage.getItem(LIST_KEY) || '[]') || []; } catch { return []; }
  }
  function writeList(list) {
    try { localStorage.setItem(LIST_KEY, JSON.stringify(list)); } catch {}
  }
  function registerWindow() {
    const list = readList().filter(Boolean);
    if (!list.includes(myId)) list.push(myId);
    windowList = list;
    writeList(windowList);
  }
  function unregisterWindow() {
    const list = readList().filter(id => id && id !== myId);
    writeList(list);
  }
  function rebalance() {
    windowList = readList().filter(Boolean);
    if (!windowList.includes(myId)) registerWindow();
    myIndex = Math.max(0, windowList.indexOf(myId));
    const shards = Math.max(1, windowList.length);
    currentShardTotal = shards;
    buildBandShards(shards);
    // Cross-fade shard visibility so it looks like particles transfer
    for (let s = 0; s < bandPoints.length; s++) {
      const isMine = (s === myIndex);
      const mat = bandPoints[s].material;
      mat.opacity = isMine ? 0.0 : mat.opacity; // start fade-in for own shard
      bandPoints[s].visible = true; // keep visible during fade
      bandPoints[s].userData.targetOpacity = isMine ? 0.9 : 0.0;
      // set radial travel targets for visible transfer (outward for losing, inward for gaining)
      if (typeof bandPoints[s].userData.radialOffset !== 'number') {
        bandPoints[s].userData.radialOffset = isMine ? (radius * 0.6) : 0;
      }
      bandPoints[s].userData.radialTarget = isMine ? 0 : (radius * 0.6);
    }
  }
  window.addEventListener('storage', (e) => {
    if (e.key === LIST_KEY) rebalance();
  });
  registerWindow();
  buildBandShards(readList().length || 1);
  rebalance();

  return {
    dispose: () => {
      controls.removeEventListener('change', send);
      clearInterval(heartbeat);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      // Decrement tab count and cleanup
      try {
        const val = parseInt(localStorage.getItem('planet_tab_count_v1') || '1', 10) || 1;
        localStorage.setItem('planet_tab_count_v1', String(Math.max(0, val - 1)));
      } catch (_) {}
      dragControls.dispose();
    }
  };
}