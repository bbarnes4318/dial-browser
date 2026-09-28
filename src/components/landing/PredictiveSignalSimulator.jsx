import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Gauge, Zap, Activity, Loader2, Wifi } from "lucide-react";

// Major US zip code prefixes mapped to approximate coordinates
// Coverage spans all US regions; latency/speed derived from nearest backbone node
const zipRegions = [
  { prefix: "005", lat: 40.78, lon: -73.4, area: "Long Island, NY" },
  { prefix: "010", lat: 42.37, lon: -72.52, area: "Springfield, MA" },
  { prefix: "020", lat: 41.86, lon: -70.78, area: "Cape Cod, MA" },
  { prefix: "029", lat: 41.82, lon: -71.41, area: "Providence, RI" },
  { prefix: "030", lat: 43.2, lon: -71.55, area: "Concord, NH" },
  { prefix: "040", lat: 43.66, lon: -70.26, area: "Portland, ME" },
  { prefix: "050", lat: 43.62, lon: -72.52, area: "White River Junction, VT" },
  { prefix: "060", lat: 41.76, lon: -72.69, area: "Hartford, CT" },
  { prefix: "070", lat: 40.73, lon: -74.07, area: "Newark, NJ" },
  { prefix: "080", lat: 39.87, lon: -75.03, area: "Camden, NJ" },
  { prefix: "088", lat: 40.49, lon: -74.44, area: "New Brunswick, NJ" },
  { prefix: "090", lat: 38.9, lon: -77.03, area: "Washington, DC" },
  { prefix: "100", lat: 40.78, lon: -73.97, area: "Manhattan, NY" },
  { prefix: "104", lat: 40.85, lon: -73.87, area: "Bronx, NY" },
  { prefix: "110", lat: 40.79, lon: -73.58, area: "Queens, NY" },
  { prefix: "112", lat: 40.65, lon: -73.95, area: "Brooklyn, NY" },
  { prefix: "114", lat: 40.68, lon: -73.76, area: "Jamaica, NY" },
  { prefix: "116", lat: 40.58, lon: -73.85, area: "Far Rockaway, NY" },
  { prefix: "120", lat: 42.66, lon: -73.78, area: "Albany, NY" },
  { prefix: "125", lat: 41.51, lon: -74.0, area: "Newburgh, NY" },
  { prefix: "130", lat: 43.05, lon: -76.15, area: "Syracuse, NY" },
  { prefix: "140", lat: 42.88, lon: -78.88, area: "Buffalo, NY" },
  { prefix: "150", lat: 40.44, lon: -80.0, area: "Pittsburgh, PA" },
  { prefix: "160", lat: 41.0, lon: -79.73, area: "Clarion, PA" },
  { prefix: "170", lat: 40.26, lon: -76.88, area: "Harrisburg, PA" },
  { prefix: "180", lat: 40.69, lon: -75.2, area: "Allentown, PA" },
  { prefix: "190", lat: 40.0, lon: -75.15, area: "Philadelphia, PA" },
  { prefix: "197", lat: 39.68, lon: -75.74, area: "Newark, DE" },
  { prefix: "200", lat: 38.9, lon: -77.03, area: "Washington, DC" },
  { prefix: "220", lat: 38.85, lon: -77.2, area: "Arlington, VA" },
  { prefix: "230", lat: 37.54, lon: -77.44, area: "Richmond, VA" },
  { prefix: "240", lat: 37.27, lon: -79.94, area: "Roanoke, VA" },
  { prefix: "250", lat: 38.35, lon: -81.63, area: "Charleston, WV" },
  { prefix: "270", lat: 36.1, lon: -80.26, area: "Winston-Salem, NC" },
  { prefix: "275", lat: 35.78, lon: -78.64, area: "Raleigh, NC" },
  { prefix: "280", lat: 35.59, lon: -80.83, area: "Salisbury, NC" },
  { prefix: "282", lat: 35.23, lon: -80.84, area: "Charlotte, NC" },
  { prefix: "290", lat: 34.0, lon: -81.04, area: "Columbia, SC" },
  { prefix: "294", lat: 32.78, lon: -79.93, area: "Charleston, SC" },
  { prefix: "300", lat: 33.77, lon: -84.4, area: "Atlanta, GA" },
  { prefix: "303", lat: 33.75, lon: -84.39, area: "Atlanta, GA" },
  { prefix: "309", lat: 33.47, lon: -82.02, area: "Augusta, GA" },
  { prefix: "320", lat: 30.34, lon: -81.69, area: "Jacksonville, FL" },
  { prefix: "322", lat: 30.33, lon: -81.66, area: "Jacksonville, FL" },
  { prefix: "328", lat: 28.54, lon: -81.37, area: "Orlando, FL" },
  { prefix: "330", lat: 25.79, lon: -80.22, area: "Miami, FL" },
  { prefix: "333", lat: 26.12, lon: -80.25, area: "Fort Lauderdale, FL" },
  { prefix: "341", lat: 26.14, lon: -81.79, area: "Naples, FL" },
  { prefix: "336", lat: 27.95, lon: -82.46, area: "Tampa, FL" },
  { prefix: "347", lat: 28.54, lon: -81.37, area: "Orlando, FL" },
  { prefix: "350", lat: 33.52, lon: -86.8, area: "Birmingham, AL" },
  { prefix: "368", lat: 32.36, lon: -85.05, area: "Auburn, AL" },
  { prefix: "370", lat: 36.16, lon: -86.78, area: "Nashville, TN" },
  { prefix: "372", lat: 36.16, lon: -86.78, area: "Nashville, TN" },
  { prefix: "379", lat: 35.96, lon: -83.92, area: "Knoxville, TN" },
  { prefix: "381", lat: 35.15, lon: -90.05, area: "Memphis, TN" },
  { prefix: "386", lat: 34.36, lon: -89.52, area: "Oxford, MS" },
  { prefix: "395", lat: 30.4, lon: -88.89, area: "Biloxi, MS" },
  { prefix: "397", lat: 33.5, lon: -88.43, area: "Columbus, MS" },
  { prefix: "400", lat: 38.25, lon: -85.76, area: "Louisville, KY" },
  { prefix: "405", lat: 38.03, lon: -84.5, area: "Lexington, KY" },
  { prefix: "410", lat: 39.1, lon: -84.51, area: "Covington, KY" },
  { prefix: "430", lat: 40.04, lon: -82.4, area: "Newark, OH" },
  { prefix: "432", lat: 39.96, lon: -82.99, area: "Columbus, OH" },
  { prefix: "435", lat: 41.24, lon: -83.65, area: "Bowling Green, OH" },
  { prefix: "441", lat: 41.5, lon: -81.69, area: "Cleveland, OH" },
  { prefix: "452", lat: 39.1, lon: -84.51, area: "Cincinnati, OH" },
  { prefix: "454", lat: 39.76, lon: -84.21, area: "Dayton, OH" },
  { prefix: "458", lat: 41.66, lon: -83.57, area: "Toledo, OH" },
  { prefix: "460", lat: 40.27, lon: -86.13, area: "Indianapolis, IN" },
  { prefix: "462", lat: 39.77, lon: -86.15, area: "Indianapolis, IN" },
  { prefix: "463", lat: 41.58, lon: -87.34, area: "Gary, IN" },
  { prefix: "468", lat: 41.08, lon: -85.14, area: "Fort Wayne, IN" },
  { prefix: "475", lat: 38.36, lon: -87.56, area: "Evansville, IN" },
  { prefix: "480", lat: 42.5, lon: -83.0, area: "Detroit Metro, MI" },
  { prefix: "482", lat: 42.33, lon: -83.05, area: "Detroit, MI" },
  { prefix: "490", lat: 42.29, lon: -85.6, area: "Kalamazoo, MI" },
  { prefix: "495", lat: 42.96, lon: -85.67, area: "Grand Rapids, MI" },
  { prefix: "500", lat: 41.59, lon: -93.62, area: "Des Moines, IA" },
  { prefix: "515", lat: 41.26, lon: -95.86, area: "Council Bluffs, IA" },
  { prefix: "530", lat: 43.04, lon: -87.91, area: "Milwaukee, WI" },
  { prefix: "532", lat: 43.04, lon: -87.91, area: "Milwaukee, WI" },
  { prefix: "549", lat: 44.02, lon: -88.54, area: "Oshkosh, WI" },
  { prefix: "554", lat: 44.98, lon: -93.27, area: "Minneapolis, MN" },
  { prefix: "559", lat: 44.02, lon: -92.48, area: "Rochester, MN" },
  { prefix: "566", lat: 47.47, lon: -94.88, area: "Bemidji, MN" },
  { prefix: "577", lat: 44.08, lon: -103.23, area: "Rapid City, SD" },
  { prefix: "581", lat: 46.88, lon: -96.79, area: "Fargo, ND" },
  { prefix: "590", lat: 45.78, lon: -108.5, area: "Billings, MT" },
  { prefix: "598", lat: 46.87, lon: -113.99, area: "Missoula, MT" },
  { prefix: "600", lat: 42.37, lon: -87.84, area: "Chicago Metro, IL" },
  { prefix: "606", lat: 41.88, lon: -87.63, area: "Chicago, IL" },
  { prefix: "611", lat: 42.27, lon: -89.09, area: "Rockford, IL" },
  { prefix: "616", lat: 40.49, lon: -89.64, area: "Springfield, IL" },
  { prefix: "620", lat: 38.63, lon: -90.2, area: "East St. Louis, IL" },
  { prefix: "631", lat: 38.63, lon: -90.25, area: "St. Louis, MO" },
  { prefix: "640", lat: 39.09, lon: -94.58, area: "Kansas City, MO" },
  { prefix: "641", lat: 39.1, lon: -94.58, area: "Kansas City, MO" },
  { prefix: "651", lat: 38.57, lon: -92.19, area: "Jefferson City, MO" },
  { prefix: "652", lat: 38.95, lon: -92.33, area: "Columbia, MO" },
  { prefix: "658", lat: 37.21, lon: -93.29, area: "Springfield, MO" },
  { prefix: "660", lat: 38.92, lon: -94.76, area: "Overland Park, KS" },
  { prefix: "672", lat: 37.69, lon: -97.34, area: "Wichita, KS" },
  { prefix: "680", lat: 41.26, lon: -96.01, area: "Omaha, NE" },
  { prefix: "681", lat: 41.26, lon: -95.94, area: "Omaha, NE" },
  { prefix: "691", lat: 40.86, lon: -100.8, area: "North Platte, NE" },
  { prefix: "700", lat: 30.0, lon: -90.07, area: "New Orleans, LA" },
  { prefix: "708", lat: 30.45, lon: -91.15, area: "Baton Rouge, LA" },
  { prefix: "711", lat: 32.47, lon: -93.79, area: "Shreveport, LA" },
  { prefix: "716", lat: 33.81, lon: -91.55, area: "Pine Bluff, AR" },
  { prefix: "722", lat: 34.75, lon: -92.29, area: "Little Rock, AR" },
  { prefix: "727", lat: 36.19, lon: -94.16, area: "Fayetteville, AR" },
  { prefix: "730", lat: 35.47, lon: -97.52, area: "Oklahoma City, OK" },
  { prefix: "740", lat: 36.16, lon: -95.99, area: "Tulsa, OK" },
  { prefix: "750", lat: 32.78, lon: -96.8, area: "Dallas Metro, TX" },
  { prefix: "752", lat: 32.78, lon: -96.8, area: "Dallas, TX" },
  { prefix: "760", lat: 32.73, lon: -97.33, area: "Fort Worth, TX" },
  { prefix: "765", lat: 31.06, lon: -97.36, area: "Fort Hood, TX" },
  { prefix: "770", lat: 29.76, lon: -95.37, area: "Houston, TX" },
  { prefix: "773", lat: 30.28, lon: -95.47, area: "Conroe, TX" },
  { prefix: "780", lat: 29.42, lon: -98.49, area: "San Antonio, TX" },
  { prefix: "785", lat: 26.16, lon: -97.69, area: "Harlingen, TX" },
  { prefix: "787", lat: 30.27, lon: -97.74, area: "Austin, TX" },
  { prefix: "790", lat: 35.19, lon: -101.84, area: "Amarillo, TX" },
  { prefix: "799", lat: 31.76, lon: -106.49, area: "El Paso, TX" },
  { prefix: "800", lat: 39.74, lon: -105.0, area: "Denver Metro, CO" },
  { prefix: "802", lat: 39.74, lon: -104.99, area: "Denver, CO" },
  { prefix: "809", lat: 38.85, lon: -104.76, area: "Colorado Springs, CO" },
  { prefix: "815", lat: 39.16, lon: -108.73, area: "Grand Junction, CO" },
  { prefix: "820", lat: 41.14, lon: -104.82, area: "Cheyenne, WY" },
  { prefix: "829", lat: 41.51, lon: -109.28, area: "Rock Springs, WY" },
  { prefix: "832", lat: 42.03, lon: -112.52, area: "Pocatello, ID" },
  { prefix: "836", lat: 43.6, lon: -116.39, area: "Boise, ID" },
  { prefix: "840", lat: 40.76, lon: -111.89, area: "Salt Lake City, UT" },
  { prefix: "841", lat: 40.76, lon: -111.89, area: "Salt Lake City, UT" },
  { prefix: "846", lat: 40.22, lon: -111.66, area: "Provo, UT" },
  { prefix: "850", lat: 33.45, lon: -112.07, area: "Phoenix, AZ" },
  { prefix: "857", lat: 32.22, lon: -110.93, area: "Tucson, AZ" },
  { prefix: "864", lat: 35.2, lon: -114.02, area: "Lake Havasu City, AZ" },
  { prefix: "870", lat: 35.33, lon: -103.4, area: "Tucumcari, NM" },
  { prefix: "875", lat: 35.69, lon: -105.94, area: "Santa Fe, NM" },
  { prefix: "880", lat: 32.31, lon: -106.78, area: "Las Cruces, NM" },
  { prefix: "881", lat: 33.4, lon: -103.6, area: "Portales, NM" },
  { prefix: "889", lat: 36.03, lon: -114.99, area: "Las Vegas, NV" },
  { prefix: "891", lat: 36.17, lon: -115.14, area: "Las Vegas, NV" },
  { prefix: "895", lat: 39.55, lon: -119.81, area: "Reno, NV" },
  { prefix: "900", lat: 34.05, lon: -118.24, area: "Los Angeles, CA" },
  { prefix: "902", lat: 33.95, lon: -118.34, area: "Inglewood, CA" },
  { prefix: "906", lat: 33.92, lon: -118.08, area: "Norwalk, CA" },
  { prefix: "908", lat: 33.78, lon: -118.2, area: "Long Beach, CA" },
  { prefix: "910", lat: 34.15, lon: -118.2, area: "Pasadena, CA" },
  { prefix: "913", lat: 34.22, lon: -118.6, area: "San Fernando Valley, CA" },
  { prefix: "917", lat: 34.11, lon: -117.72, area: "Pomona, CA" },
  { prefix: "920", lat: 33.12, lon: -117.08, area: "San Diego, CA" },
  { prefix: "921", lat: 32.72, lon: -117.16, area: "San Diego, CA" },
  { prefix: "925", lat: 33.75, lon: -117.27, area: "Riverside, CA" },
  { prefix: "930", lat: 34.28, lon: -119.29, area: "Ventura, CA" },
  { prefix: "933", lat: 35.37, lon: -119.01, area: "Bakersfield, CA" },
  { prefix: "934", lat: 35.28, lon: -120.66, area: "San Luis Obispo, CA" },
  { prefix: "936", lat: 36.74, lon: -119.79, area: "Fresno, CA" },
  { prefix: "939", lat: 36.6, lon: -121.85, area: "Salinas, CA" },
  { prefix: "940", lat: 37.49, lon: -122.23, area: "San Mateo, CA" },
  { prefix: "941", lat: 37.78, lon: -122.42, area: "San Francisco, CA" },
  { prefix: "943", lat: 37.44, lon: -122.16, area: "Palo Alto, CA" },
  { prefix: "945", lat: 37.72, lon: -122.09, area: "Oakland, CA" },
  { prefix: "946", lat: 37.77, lon: -122.23, area: "Oakland, CA" },
  { prefix: "950", lat: 37.0, lon: -121.56, area: "Gilroy, CA" },
  { prefix: "951", lat: 37.34, lon: -121.89, area: "San Jose, CA" },
  { prefix: "955", lat: 40.86, lon: -124.17, area: "Eureka, CA" },
  { prefix: "958", lat: 38.58, lon: -121.49, area: "Sacramento, CA" },
  { prefix: "960", lat: 40.59, lon: -122.39, area: "Redding, CA" },
  { prefix: "967", lat: 19.73, lon: -155.09, area: "Hilo, HI" },
  { prefix: "968", lat: 21.31, lon: -157.86, area: "Honolulu, HI" },
  { prefix: "970", lat: 45.52, lon: -122.68, area: "Portland, OR" },
  { prefix: "972", lat: 45.52, lon: -122.68, area: "Portland, OR" },
  { prefix: "974", lat: 44.05, lon: -123.09, area: "Eugene, OR" },
  { prefix: "977", lat: 44.06, lon: -121.31, area: "Bend, OR" },
  { prefix: "980", lat: 47.61, lon: -122.2, area: "Bellevue, WA" },
  { prefix: "981", lat: 47.61, lon: -122.33, area: "Seattle, WA" },
  { prefix: "984", lat: 47.25, lon: -122.44, area: "Tacoma, WA" },
  { prefix: "985", lat: 47.0, lon: -123.03, area: "Olympia, WA" },
  { prefix: "988", lat: 47.42, lon: -120.31, area: "Wenatchee, WA" },
  { prefix: "992", lat: 47.66, lon: -117.43, area: "Spokane, WA" },
  { prefix: "995", lat: 61.22, lon: -149.9, area: "Anchorage, AK" },
  { prefix: "997", lat: 64.84, lon: -147.72, area: "Fairbanks, AK" },
];

// Network backbone nodes with base metrics (reuse from ActiveMap)
const backboneNodes = [
  { id: "us-east", name: "New York, NY", lat: 40.71, lon: -74.01, station_id: "NYC-01", speed: 10, baseLatency: 12, carrier: "1CALL Backbone" },
  { id: "us-west", name: "Los Angeles, CA", lat: 34.05, lon: -118.24, station_id: "LAX-02", speed: 10, baseLatency: 18, carrier: "1CALL Backbone" },
  { id: "mexico", name: "Mexico City, MX", lat: 19.43, lon: -99.13, station_id: "MEX-01", speed: 5, baseLatency: 33, carrier: "Telmex" },
  { id: "saopaulo", name: "São Paulo, BR", lat: -23.55, lon: -46.63, station_id: "GRU-01", speed: 5, baseLatency: 41, carrier: "Vivo Fibra" },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findZipRegion(zip) {
  if (!zip || zip.length < 3) return null;
  const prefix = zip.substring(0, 3);
  // Exact prefix match first
  const exact = zipRegions.find((r) => r.prefix === prefix);
  if (exact) return exact;
  // Fallback: find the numerically nearest known prefix so every zip gets a result
  const prefixNum = parseInt(prefix, 10);
  let nearest = null;
  let minDiff = Infinity;
  for (const r of zipRegions) {
    const diff = Math.abs(parseInt(r.prefix, 10) - prefixNum);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = r;
    }
  }
  return nearest;
}

function predictSignal(zip) {
  const region = findZipRegion(zip);
  if (!region) return null;

  let nearest = null;
  let nearestDist = Infinity;
  for (const node of backboneNodes) {
    const dist = haversineKm(region.lat, region.lon, node.lat, node.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = node;
    }
  }

  // Signal strength: strong within 500km, usable up to 5000km
  const maxRange = 5000;
  const signalStrength = Math.max(15, Math.round(Math.max(0, 1 - nearestDist / maxRange) * 100));

  // Predicted dial speed in Kbps: based on backbone speed minus distance degradation
  const baseDialSpeed = nearest.speed * 1000; // Gbps → Mbps base
  const speedDegradation = Math.min(0.9, nearestDist / 6000);
  const predictedDialSpeed = Math.round(baseDialSpeed * (1 - speedDegradation) * 0.15); // 0.15 factor for last-mile dial

  // Latency: base + distance penalty
  const predictedLatency = Math.round(nearest.baseLatency + nearestDist * 0.015);

  // Quality tier
  let quality;
  if (signalStrength >= 80) quality = { label: "Optimal", color: "#D1FF26" };
  else if (signalStrength >= 55) quality = { label: "Good", color: "#8A8F98" };
  else if (signalStrength >= 30) quality = { label: "Degraded", color: "#f59e0b" };
  else quality = { label: "Limited", color: "#ef4444" };

  return {
    area: region.area,
    coordinates: { lat: region.lat, lon: region.lon },
    nearestNode: nearest,
    distanceKm: Math.round(nearestDist),
    signalStrength,
    predictedDialSpeed,
    predictedLatency,
    quality,
  };
}

function SignalBars({ strength }) {
  const bars = 5;
  const filled = Math.ceil((strength / 100) * bars);
  const color = strength >= 80 ? "#D1FF26" : strength >= 55 ? "#8A8F98" : strength >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-end gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const ratio = (i + 1) / bars;
        const active = i < filled;
        return (
          <div
            key={i}
            className="w-2.5 transition-all duration-700"
            style={{
              height: `${ratio * 100}%`,
              background: active ? color : "rgba(138,143,152,0.15)",
              boxShadow: active ? `0 0 8px ${color}80` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

export default function PredictiveSignalSimulator() {
  const [zip, setZip] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [scanning, setScanning] = useState(false);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const reading = useMemo(() => predictSignal(submitted), [submitted]);

  const handlePredict = () => {
    if (zip.length < 5) return;
    setScanning(true);
    setSubmitted("");
    setTimeout(() => {
      setSubmitted(zip);
      setScanning(false);
    }, 1600);
  };

  const formatSpeed = (kbps) => {
    if (kbps >= 1000) return { value: (kbps / 1000).toFixed(1), unit: "Mbps" };
    return { value: kbps, unit: "Kbps" };
  };

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 text-center">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>
            // PREDICTIVE SIGNAL ESTIMATOR
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Check Your <span style={{ color: "#D1FF26" }}>Dial Speed</span>
          </h2>
          <p className="text-base font-light max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            Enter your zip code to get a predictive estimate of local dial speed, signal strength, and latency based on our nearest backbone node.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                onKeyDown={(e) => e.key === "Enter" && zip.length >= 5 && handlePredict()}
                placeholder="Enter 5-digit zip code..."
                inputMode="numeric"
                className="w-full pl-12 pr-4 py-3.5 text-sm outline-none transition-all tracking-widest font-mono"
                style={{
                  background: "rgba(16,20,29,0.8)",
                  border: zip.length >= 3 ? "0.5px solid rgba(209,255,38,0.4)" : "0.5px solid rgba(138,143,152,0.15)",
                  color: "#F5F5F7",
                  boxShadow: zip.length >= 3 ? "0 0 20px rgba(209,255,38,0.08)" : "none",
                }}
              />
            </div>
            <button
              onClick={handlePredict}
              disabled={zip.length < 5 || scanning}
              className="flex items-center justify-center gap-2 px-6 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
              style={{
                background: "rgba(209,255,38,0.12)",
                border: "0.5px solid rgba(209,255,38,0.4)",
                color: "#D1FF26",
                boxShadow: !scanning && zip.length >= 5 ? "0 0 20px rgba(209,255,38,0.15)" : "none",
              }}
            >
              {scanning ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
              {scanning ? "Predicting..." : "Predict Signal"}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {scanning && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(209,255,38,0.15)" }} />
                  <div className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(209,255,38,0.2)" }} />
                  <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "2px solid transparent", borderTopColor: "#D1FF26", boxShadow: "0 0 12px rgba(209,255,38,0.4)" }} />
                  <Wifi size={20} className="absolute inset-0 m-auto" style={{ color: "#D1FF26" }} />
                </div>
                <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>ANALYZING NEAREST BACKBONE NODE...</p>
              </div>
            </motion.div>
          )}

          {!scanning && reading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Location header */}
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={14} style={{ color: "#D1FF26" }} />
                <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{reading.area}</p>
                <span className="font-mono text-[9px] tracking-widest px-2 py-1 ml-auto" style={{ background: `${reading.quality.color}1a`, color: reading.quality.color, border: `0.5px solid ${reading.quality.color}40` }}>
                  {reading.quality.label.toUpperCase()}
                </span>
              </div>

              {/* Metrics grid */}
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                {/* Dial Speed */}
                <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>DIAL SPEED</p>
                  </div>
                  {(() => {
                    const s = formatSpeed(reading.predictedDialSpeed);
                    return (
                      <p className="font-heading font-black text-3xl" style={{ color: "#D1FF26" }}>
                        {s.value}<span className="text-sm ml-1" style={{ color: "#8A8F98" }}>{s.unit}</span>
                      </p>
                    );
                  })()}
                  <div className="mt-3 h-1.5" style={{ background: "rgba(138,143,152,0.15)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((reading.predictedDialSpeed / 1500) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full"
                      style={{ background: "#D1FF26", boxShadow: "0 0 10px rgba(209,255,38,0.5)" }}
                    />
                  </div>
                </div>

                {/* Signal Strength */}
                <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${reading.quality.color}40` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi size={14} style={{ color: reading.quality.color }} />
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>SIGNAL</p>
                  </div>
                  <div className="flex items-end justify-between mb-3">
                    <p className="font-heading font-black text-3xl" style={{ color: reading.quality.color }}>
                      {reading.signalStrength}<span className="text-sm ml-1" style={{ color: "#8A8F98" }}>%</span>
                    </p>
                    <SignalBars strength={reading.signalStrength} />
                  </div>
                  <div className="h-1.5" style={{ background: "rgba(138,143,152,0.15)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${reading.signalStrength}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
                      className="h-full"
                      style={{ background: reading.quality.color, boxShadow: `0 0 10px ${reading.quality.color}80` }}
                    />
                  </div>
                </div>

                {/* Latency */}
                <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>LATENCY</p>
                  </div>
                  <p className="font-heading font-black text-3xl" style={{ color: "#D1FF26" }}>
                    {reading.predictedLatency}<span className="text-sm ml-1" style={{ color: "#8A8F98" }}>ms</span>
                  </p>
                  <div className="mt-3 h-1.5" style={{ background: "rgba(138,143,152,0.15)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((reading.predictedLatency / 120) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      className="h-full"
                      style={{ background: "#D1FF26", boxShadow: "0 0 10px rgba(209,255,38,0.5)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Nearest node info */}
              <div className="p-5" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={12} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>// NEAREST BACKBONE NODE</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-heading font-bold text-base mb-0.5" style={{ color: "#F5F5F7" }}>{reading.nearestNode.name}</p>
                    <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
                      {reading.nearestNode.station_id} · {reading.distanceKm.toLocaleString()} km away
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="text-right">
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>CAPACITY</p>
                      <p className="font-mono text-xs font-bold" style={{ color: "#D1FF26" }}>{reading.nearestNode.speed} Gbps</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>CARRIER</p>
                      <p className="font-mono text-xs font-bold" style={{ color: "#F5F5F7" }}>{reading.nearestNode.carrier}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="font-mono text-[8px] tracking-wider mt-4 text-center" style={{ color: "rgba(138,143,152,0.6)" }}>
                ▸ PREDICTIVE ESTIMATE BASED ON GEOGRAPHIC PROXIMITY TO NEAREST NODE · ACTUAL PERFORMANCE MAY VARY
              </p>
            </motion.div>
          )}

          {!scanning && !reading && submitted && (
            <motion.div key="noresult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
              <p className="font-heading font-bold text-lg mb-2" style={{ color: "#F5F5F7" }}>Zip code not found</p>
              <p className="font-mono text-xs" style={{ color: "#8A8F98" }}>We don't have coverage data for this zip code yet. Try another US zip code.</p>
            </motion.div>
          )}

          {!scanning && !submitted && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
              <div className="inline-flex items-center gap-2 px-4 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <Zap size={12} style={{ color: "#D1FF26" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>AWAITING ZIP CODE INPUT</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}