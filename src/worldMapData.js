export const worldMapData = [
  // Arctic Region
  { minLat: 66.5, maxLat: 90, minLong: -180, maxLong: 180, density: 400 },

  // North America
  { minLat: 48, maxLat: 75, minLong: -170, maxLong: -50, density: 600 },
  { minLat: 49, maxLat: 60, minLong: -130, maxLong: -110, density: 200 },
  // ... rest of the detailed regions
];

// You can also add helper functions for specific regions
export function getNorthAmericaRegions() {
  return worldMapData.filter(region => 
    region.minLat >= 15 && region.maxLat <= 75 && 
    region.minLong >= -170 && region.maxLong <= -50
  );
}

// Add more regional helper functions as needed 