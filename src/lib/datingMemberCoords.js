// Major US city coordinates used to plot dating members on the admin heat map.
// DatingProfile.location is free-text, so we match by lowercased substring.
const DATING_CITIES = [
  { city: "New York", lat: 40.7128, lng: -74.006 },
  { city: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago", lat: 41.8781, lng: -87.6298 },
  { city: "Houston", lat: 29.7604, lng: -95.3698 },
  { city: "Phoenix", lat: 33.4484, lng: -112.074 },
  { city: "Philadelphia", lat: 39.9526, lng: -75.1652 },
  { city: "San Antonio", lat: 29.4241, lng: -98.4936 },
  { city: "San Diego", lat: 32.7157, lng: -117.1611 },
  { city: "Dallas", lat: 32.7767, lng: -96.797 },
  { city: "Austin", lat: 30.2672, lng: -97.7431 },
  { city: "San Jose", lat: 37.3382, lng: -121.8863 },
  { city: "Columbus", lat: 39.9612, lng: -82.9988 },
  { city: "Charlotte", lat: 35.2271, lng: -80.8431 },
  { city: "Indianapolis", lat: 39.7684, lng: -86.1581 },
  { city: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { city: "Seattle", lat: 47.6062, lng: -122.3321 },
  { city: "Denver", lat: 39.7392, lng: -104.9903 },
  { city: "Washington", lat: 38.9072, lng: -77.0369 },
  { city: "Boston", lat: 42.3601, lng: -71.0589 },
  { city: "El Paso", lat: 31.7619, lng: -106.485 },
  { city: "Nashville", lat: 36.1627, lng: -86.7816 },
  { city: "Detroit", lat: 42.3314, lng: -83.0458 },
  { city: "Oklahoma City", lat: 35.4676, lng: -97.5164 },
  { city: "Portland", lat: 45.5152, lng: -122.6784 },
  { city: "Las Vegas", lat: 36.1699, lng: -115.1398 },
  { city: "Memphis", lat: 35.1495, lng: -90.049 },
  { city: "Louisville", lat: 38.2527, lng: -85.7585 },
  { city: "Baltimore", lat: 39.2904, lng: -76.6122 },
  { city: "Milwaukee", lat: 43.0389, lng: -87.9065 },
  { city: "Albuquerque", lat: 35.0844, lng: -106.6504 },
  { city: "Tucson", lat: 32.2226, lng: -110.9747 },
  { city: "Fresno", lat: 36.7378, lng: -119.7871 },
  { city: "Sacramento", lat: 38.5816, lng: -121.4944 },
  { city: "Atlanta", lat: 33.749, lng: -84.388 },
  { city: "Miami", lat: 25.7617, lng: -80.1918 },
  { city: "Tampa", lat: 27.9506, lng: -82.4572 },
  { city: "Orlando", lat: 28.5383, lng: -81.3792 },
  { city: "New Orleans", lat: 29.9511, lng: -90.0715 },
  { city: "Minneapolis", lat: 44.9778, lng: -93.265 },
  { city: "Cleveland", lat: 41.4993, lng: -81.6944 },
  { city: "Pittsburgh", lat: 40.4406, lng: -79.9959 },
  { city: "St. Louis", lat: 38.627, lng: -90.1994 },
  { city: "Cincinnati", lat: 39.1031, lng: -84.512 },
  { city: "Kansas City", lat: 39.0997, lng: -94.5786 },
  { city: "Omaha", lat: 41.2565, lng: -95.9345 },
  { city: "Honolulu", lat: 21.3069, lng: -157.8583 },
  { city: "Boise", lat: 43.615, lng: -116.2023 },
  { city: "Brooklyn", lat: 40.6782, lng: -73.9442 },
  { city: "Queens", lat: 40.7282, lng: -73.7949 },
  { city: "Bronx", lat: 40.8448, lng: -73.8648 },
  { city: "Newark", lat: 40.7128, lng: -74.2006 },
  { city: "Jersey City", lat: 40.7178, lng: -74.0431 },
];

// Returns { city, lat, lng } for the first known city that appears in the
// free-text location string, or null if no city matches.
export function matchDatingCity(location) {
  if (!location) return null;
  const lower = location.toLowerCase();
  for (const c of DATING_CITIES) {
    if (lower.includes(c.city.toLowerCase())) return c;
  }
  return null;
}

export { DATING_CITIES };