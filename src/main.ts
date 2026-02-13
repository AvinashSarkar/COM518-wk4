import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

type HometownResult = {
  hometown: string;
  lat: number;
  lng: number;
};

type AddHometownResponse = {
  message: string;
  id: number;
  name: string;
  hometown: string;
  lat: number;
  lon: number;
};

console.log("main.ts loaded");

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el as T;
}

const attrib =
  "Map data copyright OpenStreetMap contributors, Open Database Licence";

const map = L.map("map1");

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: attrib,
}).addTo(map);

// Start view: Southampton Solent
map.setView(L.latLng(50.9079, -1.4015), 14);

// -------------------- Exercise 4 --------------------
// Click map -> prompt artist + hometown -> POST -> add marker ONLY if 200
let posting = false;

map.on("click", async (e: L.LeafletMouseEvent) => {
  if (posting) return; // prevent spam clicks while a request is in progress

  const pos = e.latlng;

  const artist = prompt("Please enter an artist name");
  if (artist === null || artist.trim() === "") return;

  const town = prompt("Please enter the home town name");
  if (town === null || town.trim() === "") return;

  const payload = {
    name: artist.trim(),
    hometown: town.trim(),
    lat: pos.lat,
    lon: pos.lng,
  };

  posting = true;

  let resp: Response;
  try {
    resp = await fetch("http://localhost:3000/hometown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    posting = false;
    alert("Cannot reach API on http://localhost:3000 (is `npm run api` running?)");
    return;
  }

  if (resp.status !== 200) {
    posting = false;
    const txt = await resp.text().catch(() => "");
    alert(`Failed to add hometown (HTTP ${resp.status}) ${txt}`);
    return;
  }

  const saved: AddHometownResponse = await resp.json();
  posting = false;

  // Only add marker AFTER success (200)
  const marker = L.marker(pos).addTo(map);
  marker.bindPopup(`${saved.name} — ${saved.hometown}`).openPopup();
});

// -------------------- Exercise 3 --------------------
let hometownMarker: L.Marker | null = null;

async function showArtistHometown(): Promise<void> {
  const artist = getEl<HTMLInputElement>("artistBox").value.trim();

  if (artist === "") {
    alert("Please enter an artist name.");
    return;
  }

  const url = `http://localhost:3000/hometown/${encodeURIComponent(artist)}`;

  let resp: Response;
  try {
    resp = await fetch(url);
  } catch {
    alert("Cannot reach API on http://localhost:3000 (is `npm run api` running?)");
    return;
  }

  if (resp.status === 404) {
    alert("Artist not found (404). Try a different artist.");
    return;
  }

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    alert(`Server error (HTTP ${resp.status}) ${txt}`);
    return;
  }

  const data: HometownResult = await resp.json();

  const pos = L.latLng(data.lat, data.lng);
  map.setView(pos, 10);

  if (hometownMarker) map.removeLayer(hometownMarker);

  hometownMarker = L.marker(pos).addTo(map);
  hometownMarker.bindPopup(`${artist} is from ${data.hometown}`).openPopup();
}

function wireUpUI(): void {
  const btn = getEl<HTMLButtonElement>("whereBtn");
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    await showArtistHometown();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  wireUpUI();
});
