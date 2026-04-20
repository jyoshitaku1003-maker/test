const EARTH_RADIUS = 6371000;

export const degreesToRadians = (deg) => (deg * Math.PI) / 180;
export const radiansToDegrees = (rad) => (rad * 180) / Math.PI;

export const normalizeHeading = (heading) => {
  let h = heading % 360;
  if (h < 0) h += 360;
  return h;
};

// Move coordinate by a heading and distance (meters), using spherical Earth
export const moveCoordinate = (lat, lng, headingDeg, distanceMeters) => {
  const latRad = degreesToRadians(lat);
  const lngRad = degreesToRadians(lng);
  const headingRad = degreesToRadians(headingDeg);
  const angular = distanceMeters / EARTH_RADIUS;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angular) +
      Math.cos(latRad) * Math.sin(angular) * Math.cos(headingRad)
  );

  const newLngRad =
    lngRad +
    Math.atan2(
      Math.sin(headingRad) * Math.sin(angular) * Math.cos(latRad),
      Math.cos(angular) - Math.sin(latRad) * Math.sin(newLatRad)
    );

  return {
    latitude: radiansToDegrees(newLatRad),
    longitude: radiansToDegrees(newLngRad),
  };
};

// Great-circle bearing from point A to point B
export const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const lat1R = degreesToRadians(lat1);
  const lat2R = degreesToRadians(lat2);
  const deltaLng = degreesToRadians(lng2 - lng1);

  const y = Math.sin(deltaLng) * Math.cos(lat2R);
  const x =
    Math.cos(lat1R) * Math.sin(lat2R) -
    Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(deltaLng);

  return normalizeHeading(radiansToDegrees(Math.atan2(y, x)));
};

// Haversine distance in meters
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Gradually steer toward targetHeading at up to maxTurnRate degrees per step
export const turnTowardHeading = (currentHeading, targetHeading, maxTurnRate) => {
  let diff = targetHeading - currentHeading;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  if (Math.abs(diff) <= maxTurnRate) return targetHeading;
  return normalizeHeading(currentHeading + Math.sign(diff) * maxTurnRate);
};

// Linearly interpolate altitude
export const lerpAltitude = (current, target, rate) => {
  const diff = target - current;
  if (Math.abs(diff) < rate) return target;
  return current + Math.sign(diff) * rate;
};

// Map altitude (meters) to Google Maps zoom level
export const altitudeToZoom = (altitudeMeters) => {
  return Math.max(8, Math.min(18, 17 - Math.log2(altitudeMeters / 300)));
};

export const headingToCompass = (heading) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(normalizeHeading(heading) / 45) % 8];
};

// Clamp lat/lng within Japan's bounding box
export const clampToJapan = (lat, lng, bounds) => ({
  latitude: Math.max(bounds.minLat, Math.min(bounds.maxLat, lat)),
  longitude: Math.max(bounds.minLng, Math.min(bounds.maxLng, lng)),
});
