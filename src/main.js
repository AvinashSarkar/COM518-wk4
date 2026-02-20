"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const L = __importStar(require("leaflet"));
require("leaflet/dist/leaflet.css");
console.log("main.ts loaded");
function getEl(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Missing element: ${id}`);
    return el;
}
const attrib = "Map data copyright OpenStreetMap contributors, Open Database Licence";
const map = L.map("map1");
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: attrib,
}).addTo(map);
// Start view: Southampton Solent
map.setView(L.latLng(50.9079, -1.4015), 14);
// -------------------- Exercise 4 --------------------
// Click map -> prompt artist + hometown -> POST -> add marker ONLY if 200
let posting = false;
map.on("click", async (e) => {
    if (posting)
        return; // prevent spam clicks while a request is in progress
    const pos = e.latlng;
    const artist = prompt("Please enter an artist name");
    if (artist === null || artist.trim() === "")
        return;
    const town = prompt("Please enter the home town name");
    if (town === null || town.trim() === "")
        return;
    const payload = {
        name: artist.trim(),
        hometown: town.trim(),
        lat: pos.lat,
        lon: pos.lng,
    };
    posting = true;
    let resp;
    try {
        resp = await fetch("http://localhost:3000/hometown", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }
    catch {
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
    const saved = await resp.json();
    posting = false;
    // Only add marker AFTER success (200)
    const marker = L.marker(pos).addTo(map);
    marker.bindPopup(`${saved.name} — ${saved.hometown}`).openPopup();
});
// -------------------- Exercise 3 --------------------
let hometownMarker = null;
async function showArtistHometown() {
    const artist = getEl("artistBox").value.trim();
    if (artist === "") {
        alert("Please enter an artist name.");
        return;
    }
    const url = `http://localhost:3000/hometown/${encodeURIComponent(artist)}`;
    let resp;
    try {
        resp = await fetch(url);
    }
    catch {
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
    const data = await resp.json();
    const pos = L.latLng(data.lat, data.lng);
    map.setView(pos, 10);
    if (hometownMarker)
        map.removeLayer(hometownMarker);
    hometownMarker = L.marker(pos).addTo(map);
    hometownMarker.bindPopup(`${artist} is from ${data.hometown}`).openPopup();
}
function wireUpUI() {
    const btn = getEl("whereBtn");
    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        await showArtistHometown();
    });
}
window.addEventListener("DOMContentLoaded", () => {
    wireUpUI();
});
