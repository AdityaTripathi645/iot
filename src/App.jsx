import React, { useState, useEffect, useRef, useCallback } from "react";
import { io as socketIO } from "socket.io-client";
import { API_URL, aiApi, authApi, projectApi } from "./api";

// ─── THEME DEFINITIONS ───────────────────────────────────────────────────────
const THEMES = {
  cyber: {
    name: "Nexus Light",
    emoji: "✦",
    bg0: "#f8fafc",
    bg1: "#ffffff",
    bg2: "#f1f5f9",
    bg3: "#e2e8f0",
    accent: "#2563eb",
    accentDim: "rgba(37,99,235,0.10)",
    accentBorder: "rgba(37,99,235,0.24)",
    magenta: "#0891b2",
    magentaDim: "rgba(8,145,178,0.10)",
    green: "#16a34a",
    greenDim: "rgba(22,163,74,0.10)",
    amber: "#d97706",
    text: "#0f172a",
    textMuted: "#64748b",
    textDim: "#94a3b8",
    sidebarBg: "#ffffff",
    sidebarBorder: "#e2e8f0",
    gridColor: "rgba(37,99,235,0.035)",
    orbColor1: "#bfdbfe",
    orbColor2: "#cffafe",
  },
  ocean: {
    name: "Ocean Light",
    emoji: "🌊",
    bg0: "#e8f4fd",
    bg1: "#d0e9fa",
    bg2: "#b8dcf7",
    bg3: "#9fcef4",
    accent: "#0077b6",
    accentDim: "rgba(0,119,182,0.15)",
    accentBorder: "rgba(0,119,182,0.4)",
    magenta: "#7209b7",
    magentaDim: "rgba(114,9,183,0.12)",
    green: "#06a77d",
    greenDim: "rgba(6,167,125,0.12)",
    amber: "#e76f51",
    text: "#023e58",
    textMuted: "#4a8fa8",
    textDim: "#90bcd4",
    sidebarBg: "rgba(208,233,250,0.97)",
    sidebarBorder: "rgba(0,119,182,0.2)",
    gridColor: "rgba(0,119,182,0.04)",
    orbColor1: "#0096c7",
    orbColor2: "#7209b7",
  },
  forest: {
    name: "Forest Light",
    emoji: "🌿",
    bg0: "#f0f7f0",
    bg1: "#dff0e0",
    bg2: "#c8e6ca",
    bg3: "#b0d9b3",
    accent: "#2d6a4f",
    accentDim: "rgba(45,106,79,0.15)",
    accentBorder: "rgba(45,106,79,0.4)",
    magenta: "#d62828",
    magentaDim: "rgba(214,40,40,0.12)",
    green: "#1b4332",
    greenDim: "rgba(27,67,50,0.12)",
    amber: "#e9c46a",
    text: "#1b3a2a",
    textMuted: "#4a7c59",
    textDim: "#8fb99a",
    sidebarBg: "rgba(223,240,224,0.97)",
    sidebarBorder: "rgba(45,106,79,0.2)",
    gridColor: "rgba(45,106,79,0.04)",
    orbColor1: "#40916c",
    orbColor2: "#d62828",
  },
  sunset: {
    name: "Sunset Warm",
    emoji: "🌅",
    bg0: "#fff8f0",
    bg1: "#fdecd8",
    bg2: "#fbd9b8",
    bg3: "#f9c698",
    accent: "#e76f51",
    accentDim: "rgba(231,111,81,0.15)",
    accentBorder: "rgba(231,111,81,0.4)",
    magenta: "#c1121f",
    magentaDim: "rgba(193,18,31,0.12)",
    green: "#588157",
    greenDim: "rgba(88,129,87,0.12)",
    amber: "#f4a261",
    text: "#3d1f0a",
    textMuted: "#a0522d",
    textDim: "#d4a574",
    sidebarBg: "rgba(253,236,216,0.97)",
    sidebarBorder: "rgba(231,111,81,0.2)",
    gridColor: "rgba(231,111,81,0.04)",
    orbColor1: "#e76f51",
    orbColor2: "#c1121f",
  },
  arctic: {
    name: "Arctic Clean",
    emoji: "❄️",
    bg0: "#f5f9ff",
    bg1: "#e8f2ff",
    bg2: "#d6e9ff",
    bg3: "#c2dcff",
    accent: "#3a86ff",
    accentDim: "rgba(58,134,255,0.15)",
    accentBorder: "rgba(58,134,255,0.4)",
    magenta: "#8338ec",
    magentaDim: "rgba(131,56,236,0.12)",
    green: "#06d6a0",
    greenDim: "rgba(6,214,160,0.12)",
    amber: "#ffbe0b",
    text: "#1a2040",
    textMuted: "#5a6a8a",
    textDim: "#a0b4d0",
    sidebarBg: "rgba(232,242,255,0.97)",
    sidebarBorder: "rgba(58,134,255,0.2)",
    gridColor: "rgba(58,134,255,0.04)",
    orbColor1: "#3a86ff",
    orbColor2: "#8338ec",
  },
};

// ─── COLOR PALETTE & DESIGN TOKENS (default - cyber dark) ────────────────────
const THEME = {
  bg0: "#f8fafc",
  bg1: "#ffffff",
  bg2: "#f1f5f9",
  bg3: "#e2e8f0",
  accent: "#2563eb",
  accentDim: "rgba(37,99,235,0.10)",
  accentBorder: "rgba(37,99,235,0.24)",
  magenta: "#0891b2",
  magentaDim: "rgba(8,145,178,0.10)",
  green: "#16a34a",
  greenDim: "rgba(22,163,74,0.10)",
  amber: "#d97706",
  text: "#0f172a",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  font: "'JetBrains Mono', 'Fira Code', monospace",
  fontDisplay: "'Rajdhani', 'Orbitron', monospace",
};

// ─── MODULES REGISTRY ────────────────────────────────────────────────────────
const MODULES = [
  {
    id: "esp32",
    label: "ESP32",
    category: "MCU",
    color: THEME.accent,
    icon: "⚡",
    desc: "Dual-core WiFi + BT",
  },
  {
    id: "esp8266",
    label: "ESP8266",
    category: "MCU",
    color: THEME.accent,
    icon: "📡",
    desc: "WiFi SoC, low-cost",
  },
  {
    id: "arduino",
    label: "Arduino Uno",
    category: "MCU",
    color: THEME.green,
    icon: "🔌",
    desc: "Classic AVR board",
  },
  {
    id: "pico",
    label: "Pico W",
    category: "MCU",
    color: THEME.accent,
    icon: "🎯",
    desc: "RP2040, WiFi",
  },
  {
    id: "stm32",
    label: "STM32",
    category: "MCU",
    color: THEME.magenta,
    icon: "💎",
    desc: "ARM Cortex-M",
  },
  {
    id: "lora32",
    label: "LoRa32",
    category: "MCU+Radio",
    color: THEME.magenta,
    icon: "📻",
    desc: "ESP32 + LoRa SX1276",
  },
  {
    id: "lora",
    label: "SX1278 LoRa",
    category: "Radio",
    color: THEME.magenta,
    icon: "🔊",
    desc: "433/868/915 MHz, 20km",
  },
  {
    id: "sx1262",
    label: "SX1262 LoRa",
    category: "Radio",
    color: THEME.magenta,
    icon: "📶",
    desc: "Sub-GHz, LoRaWAN",
  },
  {
    id: "rfm95",
    label: "RFM95W",
    category: "Radio",
    color: THEME.magenta,
    icon: "🌐",
    desc: "LoRa transceiver",
  },
  {
    id: "sim800",
    label: "SIM800L",
    category: "Cellular",
    color: THEME.amber,
    icon: "📱",
    desc: "GSM/GPRS 2G",
  },
  {
    id: "sim7600",
    label: "SIM7600",
    category: "Cellular",
    color: THEME.amber,
    icon: "📲",
    desc: "4G LTE + GPS",
  },
  {
    id: "zigbee",
    label: "Zigbee CC2530",
    category: "Mesh",
    color: THEME.green,
    icon: "🕸",
    desc: "IEEE 802.15.4 mesh",
  },
  {
    id: "nrf24",
    label: "nRF24L01",
    category: "RF",
    color: THEME.accent,
    icon: "🔗",
    desc: "2.4GHz, ultra-low power",
  },
  {
    id: "hcsr04",
    label: "HC-SR04",
    category: "Sensor",
    color: THEME.text,
    icon: "📏",
    desc: "Ultrasonic distance",
  },
  {
    id: "dht22",
    label: "DHT22",
    category: "Sensor",
    color: THEME.text,
    icon: "🌡",
    desc: "Temp + Humidity",
  },
  {
    id: "bmp280",
    label: "BMP280",
    category: "Sensor",
    color: THEME.text,
    icon: "🌬",
    desc: "Pressure + Altitude",
  },
  {
    id: "mpu6050",
    label: "MPU6050",
    category: "Sensor",
    color: THEME.text,
    icon: "🔄",
    desc: "6-axis IMU",
  },
  {
    id: "max30102",
    label: "MAX30102",
    category: "Sensor",
    color: THEME.magenta,
    icon: "❤️",
    desc: "Heart rate + SpO2",
  },
  {
    id: "gps",
    label: "NEO-6M GPS",
    category: "Sensor",
    color: THEME.amber,
    icon: "🗺",
    desc: "GPS positioning",
  },
  {
    id: "cam",
    label: "OV2640 Cam",
    category: "Sensor",
    color: THEME.accent,
    icon: "📷",
    desc: "2MP camera module",
  },
  {
    id: "relay",
    label: "Relay 4CH",
    category: "Actuator",
    color: THEME.amber,
    icon: "⚙",
    desc: "High-voltage control",
  },
  {
    id: "motor",
    label: "L298N Motor",
    category: "Actuator",
    color: THEME.amber,
    icon: "🔧",
    desc: "DC motor driver",
  },
  {
    id: "servo",
    label: "SG90 Servo",
    category: "Actuator",
    color: THEME.green,
    icon: "↔",
    desc: "Micro servo 180°",
  },
  {
    id: "oled",
    label: "OLED 128×64",
    category: "Display",
    color: THEME.accent,
    icon: "🖥",
    desc: "SSD1306 I2C/SPI",
  },
  {
    id: "tft",
    label: 'TFT 2.4"',
    category: "Display",
    color: THEME.accent,
    icon: "📺",
    desc: "ILI9341, 240×320",
  },
  {
    id: "epaper",
    label: "E-Paper",
    category: "Display",
    color: THEME.text,
    icon: "🗒",
    desc: 'Waveshare 2.9" 296×128',
  },
];

const CATEGORIES = [...new Set(MODULES.map((m) => m.category))];

function parseBlueprintJson(reply, boardType = "ESP32") {
  const cleaned = String(reply || "")
    .replace(/```(?:json)?/gi, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start)
    throw new Error("AI returned an incomplete blueprint. Please retry.");
  try {
    const blueprint = JSON.parse(cleaned.slice(start, end + 1));
    const projectName =
      blueprint.project_name || blueprint.projectName || blueprint.name;
    return {
      ...blueprint,
      project_name: String(projectName || `${boardType} IoT Blueprint`).trim(),
      summary:
        blueprint.summary || `A practical ${boardType} IoT project blueprint.`,
      difficulty: blueprint.difficulty || "Beginner",
      est_time: blueprint.est_time || "2-3 hours",
      cost: blueprint.cost || "Estimate unavailable",
      components: Array.isArray(blueprint.components)
        ? blueprint.components
        : [],
      wiring: Array.isArray(blueprint.wiring) ? blueprint.wiring : [],
      libraries: Array.isArray(blueprint.libraries) ? blueprint.libraries : [],
      safety: Array.isArray(blueprint.safety) ? blueprint.safety : [],
      next_steps: Array.isArray(blueprint.next_steps)
        ? blueprint.next_steps
        : [],
      code:
        typeof blueprint.code === "string"
          ? blueprint.code
          : "// Code was not returned for this blueprint.",
    };
  } catch {
    throw new Error("AI returned an invalid blueprint format. Please retry.");
  }
}

// ─── MOCK USERS FOR COLLAB ────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, name: "Arjun S.", avatar: "AS", color: "#ff3cac", status: "active" },
  { id: 2, name: "Priya R.", avatar: "PR", color: "#00e5ff", status: "idle" },
  { id: 3, name: "Dev K.", avatar: "DK", color: "#00ff94", status: "active" },
];

// ─── ONBOARDING FLOW ─────────────────────────────────────────────────────────

// ─── STYLES INJECTED ─────────────────────────────────────────────────────────
const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

* { margin:0; padding:0; box-sizing:border-box; }
html, body, #root { height:100%; }

:root {
  --bg0: #04050f;
  --bg1: #080c1e;
  --bg2: #0d1230;
  --bg3: #111840;
  --accent: #00e5ff;
  --magenta: #ff3cac;
  --green: #00ff94;
  --amber: #ffb800;
  --text: #c8d8e8;
  --muted: #5a7a94;
}

body {
  background: var(--bg0);
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
  overflow-x: hidden;
}

/* scrollbar */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg1); }
::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.3); border-radius: 2px; }

/* GRID PATTERN BG */
.grid-bg {
  position: fixed; inset:0; pointer-events:none; z-index:0;
  background-image:
    linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* scanline */
.grid-bg::after {
  content:'';
  position: absolute; inset:0;
  background: linear-gradient(180deg, transparent 0%, rgba(0,229,255,0.01) 50%, transparent 100%);
  animation: scanMove 8s linear infinite;
}
@keyframes scanMove {
  0%   { background-position: 0 -200%; }
  100% { background-position: 0 200%; }
}

/* GLOW ORBS */
.orb {
  position: fixed; border-radius:50%; pointer-events:none; z-index:0;
  filter: blur(80px); opacity: 0.15;
}
.orb1 { width:500px;height:500px; top:-100px;left:-100px; background: var(--accent); }
.orb2 { width:400px;height:400px; bottom:-100px;right:-100px; background: var(--magenta); }
.orb3 { width:300px;height:300px; top:50%;left:50%; background: rgba(0,255,148,0.5); animation: orbFloat 10s ease-in-out infinite; }

@keyframes orbFloat {
  0%,100% { transform: translate(-50%,-50%) scale(1); }
  50% { transform: translate(-50%,-55%) scale(1.2); }
}

/* PANELS */
.panel {
  background: rgba(8,12,30,0.7);
  border: 1px solid rgba(0,229,255,0.15);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}
.panel::before {
  content:'';
  position:absolute;top:0;left:0;right:0;height:1px;
  background: linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent);
}
.panel-magenta { border-color: rgba(255,60,172,0.2); }
.panel-magenta::before { background: linear-gradient(90deg, transparent, rgba(255,60,172,0.5), transparent); }
.panel-green { border-color: rgba(0,255,148,0.2); }

/* BUTTONS */
.btn {
  font-family: 'Rajdhani', monospace;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn::after {
  content:'';
  position:absolute; inset:0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}
.btn:hover::after { opacity:1; }

.btn-primary {
  background: linear-gradient(135deg, #00e5ff, #0099bb);
  color: #04050f;
  padding: 10px 20px;
  box-shadow: 0 0 20px rgba(0,229,255,0.35);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(0,229,255,0.5); }
.btn-primary:active { transform: scale(0.97); }

.btn-ghost {
  background: rgba(0,229,255,0.06);
  border: 1px solid rgba(0,229,255,0.25);
  color: var(--accent);
  padding: 8px 16px;
}
.btn-ghost:hover { background: rgba(0,229,255,0.12); border-color: rgba(0,229,255,0.5); }

.btn-magenta {
  background: linear-gradient(135deg, #ff3cac, #cc0077);
  color: white;
  padding: 10px 20px;
  box-shadow: 0 0 20px rgba(255,60,172,0.35);
}
.btn-magenta:hover { transform:translateY(-2px); box-shadow: 0 0 30px rgba(255,60,172,0.5); }

.btn-danger {
  background: rgba(255,60,60,0.1);
  border: 1px solid rgba(255,60,60,0.3);
  color: #ff6b6b;
  padding: 8px 14px;
}

/* INPUTS */
input[type=text], textarea, select {
  background: rgba(4,5,15,0.8);
  border: 1px solid rgba(0,229,255,0.2);
  border-radius: 8px;
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}
input[type=text]:focus, textarea:focus, select:focus {
  border-color: rgba(0,229,255,0.5);
  box-shadow: 0 0 16px rgba(0,229,255,0.15);
}
select option { background: #0d1230; }

/* BADGES */
.badge {
  display: inline-flex; align-items:center; gap:5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-family: 'Rajdhani', monospace;
}
.badge-cyan { background: rgba(0,229,255,0.1); border:1px solid rgba(0,229,255,0.3); color: var(--accent); }
.badge-magenta { background: rgba(255,60,172,0.1); border:1px solid rgba(255,60,172,0.3); color: var(--magenta); }
.badge-green { background: rgba(0,255,148,0.1); border:1px solid rgba(0,255,148,0.3); color: var(--green); }
.badge-amber { background: rgba(255,184,0,0.1); border:1px solid rgba(255,184,0,0.3); color: var(--amber); }
.badge-gray { background: rgba(90,122,148,0.15); border:1px solid rgba(90,122,148,0.3); color: var(--muted); }

/* TABS */
.tab-bar {
  display: flex; gap:4px;
  border-bottom: 1px solid rgba(0,229,255,0.1);
  padding-bottom: 0;
}
.tab {
  padding: 10px 18px;
  font-family: 'Rajdhani'; font-weight:600; font-size:12px;
  text-transform: uppercase; letter-spacing:1px;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  color: var(--muted);
  border: 1px solid transparent;
  border-bottom: none;
  transition: all 0.2s;
  background: transparent;
}
.tab:hover { color: var(--text); background: rgba(0,229,255,0.05); }
.tab.active {
  color: var(--accent);
  background: rgba(0,229,255,0.08);
  border-color: rgba(0,229,255,0.25);
}

/* CHAT BUBBLES */
.chat-user {
  background: rgba(0,229,255,0.08);
  border: 1px solid rgba(0,229,255,0.2);
  border-radius: 12px 12px 2px 12px;
  padding: 10px 14px;
  max-width: 80%;
  margin-left: auto;
  font-size: 13px;
  line-height: 1.5;
}
.chat-ai {
  background: rgba(255,60,172,0.06);
  border: 1px solid rgba(255,60,172,0.15);
  border-radius: 12px 12px 12px 2px;
  padding: 10px 14px;
  max-width: 90%;
  font-size: 13px;
  line-height: 1.6;
}
.chat-system {
  background: rgba(255,184,0,0.06);
  border: 1px solid rgba(255,184,0,0.15);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  color: rgba(255,184,0,0.8);
  text-align: center;
  margin: 4px auto;
}

/* MODULE CARDS */
.module-card {
  background: rgba(13,18,48,0.6);
  border: 1px solid rgba(0,229,255,0.12);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.module-card:hover {
  border-color: rgba(0,229,255,0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
}
.module-card.selected {
  border-color: rgba(0,229,255,0.6);
  background: rgba(0,229,255,0.06);
  box-shadow: 0 0 20px rgba(0,229,255,0.1);
}

/* SPINNER */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 18px; height:18px;
  border: 2px solid rgba(0,229,255,0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

/* TYPING DOTS */
@keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
.dot-typing span {
  display:inline-block;
  width:6px;height:6px;
  border-radius:50%;
  background: var(--accent);
  margin:0 2px;
  animation: blink 1.4s infinite;
}
.dot-typing span:nth-child(2) { animation-delay:0.2s; }
.dot-typing span:nth-child(3) { animation-delay:0.4s; }

/* WIRING TABLE */
.wire-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto 1fr;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0,229,255,0.06);
  font-size: 11px;
  align-items: center;
  transition: background 0.15s;
}
.wire-row:hover { background: rgba(0,229,255,0.03); }

/* COLLAB USERS */
.collab-dot {
  width:8px; height:8px; border-radius:50%;
  animation: glowPulse 2s ease-in-out infinite;
}
@keyframes glowPulse {
  0%,100% { opacity:1; box-shadow: none; }
  50% { opacity:0.6; box-shadow: 0 0 8px currentColor; }
}

/* ONBOARDING */
.onboard-card {
  background: rgba(8,12,30,0.95);
  border: 1px solid rgba(0,229,255,0.2);
  border-radius: 16px;
  padding: 32px;
  max-width: 520px;
  width: 90%;
  position: relative;
  overflow: hidden;
}
.onboard-card::before {
  content:'';
  position:absolute;top:0;left:0;right:0;height:2px;
  background: linear-gradient(90deg, #00e5ff, #ff3cac, #00ff94);
}
.onboard-opt {
  padding: 12px 16px;
  border: 1px solid rgba(0,229,255,0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: var(--text);
  text-align: left;
}
.onboard-opt:hover { border-color: rgba(0,229,255,0.4); background: rgba(0,229,255,0.05); color: var(--accent); }
.onboard-opt.selected { border-color: var(--accent); background: rgba(0,229,255,0.1); color: var(--accent); }

/* CODE BLOCK */
.code-block {
  background: rgba(4,5,15,0.9);
  border: 1px solid rgba(0,229,255,0.15);
  border-radius: 10px;
  padding: 20px;
  font-size: 12px;
  line-height: 1.8;
  color: #a0f0c0;
  overflow-x: auto;
  position: relative;
  font-family: 'JetBrains Mono', monospace;
  white-space: pre;
}
.code-block::before {
  content:'';
  position:absolute;left:0;top:0;bottom:0;width:3px;
  background: linear-gradient(180deg, var(--accent), var(--magenta));
}

/* TOPOLOGY CANVAS */
.topo-canvas {
  background: rgba(4,5,15,0.8);
  border: 1px solid rgba(0,229,255,0.15);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

/* NOTIFICATIONS */
.toast {
  position:fixed; bottom:24px; right:24px; z-index:9999;
  background: rgba(8,12,30,0.95);
  border: 1px solid rgba(0,229,255,0.3);
  border-radius: 10px;
  padding: 14px 18px;
  display:flex; align-items:center; gap:12px;
  font-size:13px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  animation: slideIn 0.3s ease;
  max-width: 320px;
}
@keyframes slideIn {
  from { opacity:0; transform:translateX(40px); }
  to { opacity:1; transform:translateX(0); }
}

/* PROGRESS RING */
@keyframes dash { to { stroke-dashoffset: 0; } }

/* SIDEBAR NAV */
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-family: 'Rajdhani'; font-weight:600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--muted);
  transition: all 0.2s;
  border: 1px solid transparent;
}
.nav-item:hover { color: var(--text); background: rgba(0,229,255,0.05); }
.nav-item.active { color: var(--accent); background: rgba(0,229,255,0.08); border-color: rgba(0,229,255,0.15); }
.nav-icon { font-size:16px; width:20px; text-align:center; }

/* STAT CARDS */
.stat-card {
  background: rgba(13,18,48,0.7);
  border: 1px solid rgba(0,229,255,0.12);
  border-radius: 10px;
  padding: 16px;
  flex: 1;
}

/* ACTIVITY LOG */
.activity-item {
  display: flex; gap: 10px; align-items:flex-start;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,229,255,0.05);
  font-size: 11px;
}
.activity-dot {
  width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px;
}

/* MODAL */
.modal-overlay {
  position: fixed; inset:0; z-index:1000;
  background: rgba(4,5,15,0.85);
  backdrop-filter: blur(8px);
  display:flex; align-items:center; justify-content:center;
}

/* COLLAB CURSOR */
.collab-cursor {
  position:absolute; pointer-events:none; z-index:100;
  transition: top 0.1s, left 0.1s;
}

/* SMOOTH TRANSITIONS */
.fade-in { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

/* GLOW TEXT */
.glow-text { text-shadow: 0 0 20px var(--accent); }
.glow-magenta { text-shadow: 0 0 20px var(--magenta); }

/* Shared product surface: calm engineering workspace, not a neon dashboard. */
body { font-family: 'Inter', 'Segoe UI', sans-serif; background: var(--bg0); }
.grid-bg { opacity: .45; background-size: 48px 48px; }
.orb { display: none; }
.panel, .stat-card, .module-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,.05); backdrop-filter: none; }
.panel::before { background: var(--accent); opacity: .25; }
.btn { border-radius: 7px; box-shadow: none; }
.btn-primary { background: #2563eb; color: #fff; box-shadow: 0 4px 10px rgba(37,99,235,.18); }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(37,99,235,.24); }
.btn-ghost { background: #f8fafc; border-color: #cbd5e1; color: #2563eb; }
.btn-magenta { background: #0891b2; box-shadow: 0 4px 10px rgba(8,145,178,.16); }
.nav-item { border-radius: 7px; }
input[type=text], textarea, select { background: #fff; border-color: #cbd5e1; color: #0f172a; }
input[type=text]:focus, textarea:focus, select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
@media (max-width: 800px) {
  .panel { border-radius: 8px; }
  .stat-card { min-width: calc(50% - 6px); }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

// ─── SIMULATION PAGE COMPONENT ───────────────────────────────────────────────
// Embeds the full IoT Virtual Lab (lab_enhanced.html) in an iframe,
// with a collab sync bar showing live connection status above it.

function SimulationPage({
  socketRef,
  socketConnected,
  collabActive,
  simRunning,
  setSimRunning,
  simSensorData,
  setSimSensorData,
  simOutputs,
  setSimOutputs,
  simLog,
  setSimLog,
  THEME,
}) {
  const iframeRef = React.useRef(null);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);

  // Listen for messages from the iframe (future extension point)
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data || e.data.source !== "nexus-lab") return;
      // Forward sim state to collab if connected
      if (socketConnected && socketRef.current && e.data.type === "sim:tick") {
        socketRef.current.emit("sim:sensor-tick", e.data.payload);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [socketConnected]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 0,
      }}
    >
      {/* ── Collab status bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
          background: "#080c1e",
          borderBottom: "1px solid rgba(0,229,255,0.12)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Rajdhani'",
            fontSize: 13,
            fontWeight: 800,
            color: THEME.accent,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          ▶ IoT Virtual Lab
        </span>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {collabActive && socketConnected && (
            <span
              style={{
                fontSize: 11,
                color: "#00ff94",
                background: "rgba(0,255,148,0.1)",
                padding: "3px 12px",
                borderRadius: 20,
                border: "1px solid rgba(0,255,148,0.25)",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              ⚡ Collab active — sim events sync to teammates
            </span>
          )}
          {!collabActive && (
            <span
              style={{
                fontSize: 11,
                color: "#5a7a94",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              Go to Collaborate tab to sync this lab with teammates
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: iframeLoaded ? "#00ff94" : "#ffb800",
                boxShadow: iframeLoaded ? "0 0 6px #00ff94" : "none",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: iframeLoaded ? "#00ff94" : "#ffb800",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {iframeLoaded ? "LAB READY" : "LOADING…"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Full-height iframe ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {!iframeLoaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#04050f",
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <div
              style={{
                fontFamily: "'Rajdhani'",
                fontSize: 20,
                fontWeight: 800,
                color: THEME.accent,
                textTransform: "uppercase",
                letterSpacing: 3,
                marginBottom: 8,
              }}
            >
              Loading IoT Virtual Lab
            </div>
            <div style={{ fontSize: 12, color: "#5a7a94" }}>
              Full circuit simulator · drag & drop · AI assistant
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="/lab_enhanced.html"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            opacity: iframeLoaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
          title="IoT Virtual Lab"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}

export default function NexusIoT() {
  const [page, setPage] = useState("login"); // login | dashboard | builder | modules | collab | history | docs | simulation
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      return localStorage.getItem("nexus-theme") || "cyber";
    } catch {
      return "cyber";
    }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [authRestoring, setAuthRestoring] = useState(true);
  const [loginMode, setLoginMode] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [catFilter, setCatFilter] = useState("All");
  const [projectData, setProjectData] = useState(null);
  const [projectIdea, setProjectIdea] = useState("");
  const [boardType, setBoardType] = useState("ESP32");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [collabActive, setCollabActive] = useState(false);
  const [sessionCode] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase(),
  );
  const [collabUsers] = useState(MOCK_USERS);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("code");
  const [dbHistory, setDbHistory] = useState([]);
  const [activityLog, setActivityLog] = useState([
    { type: "info", msg: "Session started", time: "just now" },
  ]);
  const chatEndRef = useRef(null);
  const [newUserChat, setNewUserChat] = useState([
    {
      role: "ai",
      text: "Hey! I'm Nexus AI — your IoT guide. I'll help you pick the right modules and design your first circuit. What do you want to build?",
    },
  ]);
  const [newUserInput, setNewUserInput] = useState("");
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [previewCode, setPreviewCode] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");

  // ── Socket.IO real-time collaboration ──────────────────────────────────────
  const socketRef = useRef(null);
  const [socketUrl, setSocketUrl] = useState(() => {
    try {
      return localStorage.getItem("nexus-server-url") || API_URL;
    } catch {
      return API_URL;
    }
  });
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketConnecting, setSocketConnecting] = useState(false);
  const [socketError, setSocketError] = useState("");
  const [realCollabUsers, setRealCollabUsers] = useState([]);
  const [realChatMessages, setRealChatMessages] = useState([]);
  const [realChatInput, setRealChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem("nexus-username") || "";
    } catch {
      return "";
    }
  });
  const [isHost, setIsHost] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const realChatEndRef = useRef(null);

  // ── Simulation state ───────────────────────────────────────────────────────
  const [simRunning, setSimRunning] = useState(false);
  const [simNodes] = useState([
    {
      id: "esp32",
      label: "ESP32",
      icon: "⚡",
      x: 330,
      y: 200,
      color: "#00e5ff",
      type: "mcu",
    },
    {
      id: "dht22",
      label: "DHT22",
      icon: "🌡",
      x: 100,
      y: 110,
      color: "#c8d8e8",
      type: "sensor",
    },
    {
      id: "relay",
      label: "Relay",
      icon: "⚙",
      x: 100,
      y: 300,
      color: "#ffb800",
      type: "actuator",
    },
    {
      id: "led",
      label: "LED",
      icon: "💡",
      x: 560,
      y: 110,
      color: "#00ff94",
      type: "output",
    },
    {
      id: "buzz",
      label: "Buzzer",
      icon: "🔔",
      x: 560,
      y: 300,
      color: "#ff3cac",
      type: "output",
    },
  ]);
  const [simConnections] = useState([
    { from: "dht22", to: "esp32" },
    { from: "esp32", to: "relay" },
    { from: "esp32", to: "led" },
    { from: "relay", to: "buzz" },
  ]);
  const [simSensorData, setSimSensorData] = useState({
    temperature: 24.5,
    humidity: 58,
    distance: 120,
    pressure: 1013,
  });
  const [simOutputs, setSimOutputs] = useState({
    led: false,
    buzz: false,
    relay: false,
  });
  const [simLog, setSimLog] = useState([
    {
      t: "00:00",
      msg: "Simulation ready. Press ▶ Run to start.",
      type: "info",
    },
  ]);
  const simIntervalRef = useRef(null);
  const simTickRef = useRef(0);

  useEffect(() => {
    Promise.all([authApi.me(), projectApi.list(), projectApi.history()])
      .then(([session, projects, history]) => {
        setCurrentUser(session.user);
        setDbHistory(projects.projects || []);
        setActivityLog(
          (history.history || []).map((item) => ({
            type: "info",
            msg: item.action,
            time: item.created_at,
          })),
        );
        setPage("dashboard");
      })
      .catch(() => {})
      .finally(() => setAuthRestoring(false));
  }, []);

  // scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const logActivity = useCallback((type, msg) => {
    const now = new Date().toLocaleTimeString();
    setActivityLog((prev) => [{ type, msg, time: now }, ...prev.slice(0, 49)]);
  }, []);

  // ── NEXUS AI — @ai collab chat integration ──────────────────────────────────
  const callNexusAI = useCallback(
    async (userQuery, chatHistory) => {
      setIsAiTyping(true);

      // Build conversation context from all chat messages
      const conversationContext = chatHistory
        .slice(-20) // last 20 messages for context window
        .map((m) => `[${m.userName}]: ${m.text}`)
        .join("\n");

      const systemPrompt = `You are Nexus AI — an expert IoT assistant embedded inside a real-time team collaboration workspace called Nexus IoT Platform.

Your role: help teammates understand IoT concepts, debug circuits, explain code, and answer technical questions — all based on their ongoing conversation.

TEAM CONVERSATION SO FAR:
${conversationContext}

Guidelines:
- Be concise but thorough (2–4 sentences per point max)
- Reference what teammates said by name when relevant
- Use ⚡ for key tips, ⚠ for warnings, 💡 for explanations
- Mention specific component names (ESP32, DHT22, HC-SR04, LoRa SX1278, etc.)
- If the question is about code, give a short snippet
- Always relate your answer back to what the team is actually discussing`;

      try {
        const data = await aiApi.chat(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery },
          ],
          600,
        );
        const reply =
          data.reply || "⚠ I couldn't generate a response. Try again!";

        // Inject AI reply as a special message into the chat (local + broadcast)
        const aiMsg = {
          id: `ai-${Date.now()}`,
          userId: "nexus-ai",
          userName: "Nexus AI",
          userColor: "#ff3cac",
          text: reply,
          ts: Date.now(),
          isAi: true,
        };

        setRealChatMessages((prev) => [...prev.slice(-99), aiMsg]);
        setTimeout(
          () => realChatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );

        // Also broadcast to all teammates via socket
        if (socketRef.current && socketConnected) {
          socketRef.current.emit("chat:ai-response", aiMsg);
        }
      } catch (err) {
        const errMsg = {
          id: `ai-err-${Date.now()}`,
          userId: "nexus-ai",
          userName: "Nexus AI",
          userColor: "#ff3cac",
          text: `⚠ ${err.message || "The AI service is unavailable."}`,
          ts: Date.now(),
          isAi: true,
        };
        setRealChatMessages((prev) => [...prev.slice(-99), errMsg]);
      }
      setIsAiTyping(false);
    },
    [socketConnected],
  );

  const sendNewUserMsg = async () => {
    if (!newUserInput.trim()) return;
    const msg = newUserInput.trim();
    setNewUserInput("");
    setNewUserChat((prev) => [...prev, { role: "user", text: msg }]);
    setNewUserLoading(true);
    try {
      const data = await aiApi.chat([
        {
          role: "user",
          content: `You are Nexus IoT Onboarding Bot — friendly, concise, expert. Help new users explore IoT project ideas. Keep replies under 3 sentences. Suggest specific modules by name when relevant (ESP32, LoRa SX1278, DHT22, etc). User says: "${msg}"`,
        },
      ]);
      const reply = data.reply || "Let me think about that...";
      setNewUserChat((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setNewUserChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: "API quota reached — but I'd suggest starting with ESP32 + your chosen sensors. What's the application?",
        },
      ]);
    }
    setNewUserLoading(false);
  };

  // ── GENERATE PROJECT ─────────────────────────────────────────────────────────
  const generateProject = async () => {
    if (!projectIdea.trim()) {
      showToast("Describe your project first", "warn");
      return;
    }
    setIsGenerating(true);
    logActivity("gen", `Generating: ${projectIdea.slice(0, 40)}...`);

    const modulesContext = selectedModules.length
      ? `\nSelected modules: ${selectedModules.map((m) => m.label).join(", ")}`
      : "";

    try {
      const data = await aiApi.chat(
        [
          {
            role: "user",
            content: `You are a senior IoT engineer. Generate a concise IoT blueprint JSON (no markdown).
Project: "${projectIdea}"
Board: ${boardType}${modulesContext}

Return ONLY valid JSON. Keep the Arduino code concise, under 35 lines, so the complete JSON fits in the response. Do not use markdown:
{
  "project_name": "string",
  "summary": "2 sentence summary",
  "difficulty": "Beginner|Intermediate|Advanced",
  "est_time": "e.g. 3-4 hours",
  "cost": "$XX",
  "components": [{"name":"","qty":1,"price":"$","purpose":"","pin":""}],
  "wiring": [{"from":"Component:Pin","to":"Board:Pin","type":"Power|Digital|Analog|I2C|SPI","note":""}],
  "libraries": [""],
  "code": "// Full commented code here",
  "safety": [""],
  "next_steps": [""]
}`,
          },
        ],
        1500,
        { type: "json_object" },
      );
      const parsed = parseBlueprintJson(data.reply, boardType);
      setProjectData(parsed);
      setPreviewCode(parsed.code || "");
      setChatHistory([
        {
          role: "system",
          content: `Expert IoT mentor. Project: ${parsed.project_name}. Board: ${boardType}. Components: ${parsed.components?.map((c) => c.name).join(", ")}. Be concise.`,
        },
      ]);
      const saved = await projectApi.create({
        name: parsed.project_name,
        board: boardType,
        idea: projectIdea.slice(0, 120),
        data: parsed,
      });
      setDbHistory((prev) => [saved.project, ...prev]);
      logActivity("success", `Blueprint ready: ${parsed.project_name}`);
      showToast(`Blueprint generated: ${parsed.project_name}`, "success");
      setPage("builder");
      setActiveTab("code");
    } catch (error) {
      showToast(
        error.message || "Generation failed — check API or retry",
        "error",
      );
    }
    setIsGenerating(false);
  };

  // ── AI MENTOR CHAT ───────────────────────────────────────────────────────────
  const sendMentorMsg = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newHistory = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);
    setIsChatLoading(true);
    logActivity("chat", `Q: ${msg.slice(0, 40)}...`);
    try {
      const data = await aiApi.chat(newHistory);
      const reply = data.reply || "...";
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
      logActivity("ai", `AI replied to: ${msg.slice(0, 30)}`);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "API limit reached — but happy to help if you describe the issue!",
        },
      ]);
    }
    setIsChatLoading(false);
  };

  // ─── THEME CSS VARIABLES ────────────────────────────────────────────────────
  const T = THEMES[activeTheme] || THEMES.cyber;
  const themeVars = `
    :root {
      --bg0: ${T.bg0}; --bg1: ${T.bg1}; --bg2: ${T.bg2}; --bg3: ${T.bg3};
      --accent: ${T.accent}; --magenta: ${T.magenta}; --green: ${T.green}; --amber: ${T.amber};
      --text: ${T.text}; --muted: ${T.textMuted};
    }
    body { background: ${T.bg0}; color: ${T.text}; }
    .grid-bg { background-image: linear-gradient(${T.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${T.gridColor} 1px, transparent 1px); background-size: 40px 40px; }
    .orb1 { background: ${T.orbColor1}; }
    .orb2 { background: ${T.orbColor2}; }
    input[type=text], textarea, select { background: ${T.bg1}; color: ${T.text}; border-color: ${T.accentBorder}; }
    .panel { background: ${T.bg1}cc; border-color: ${T.accentBorder}; }
    .nav-item { color: ${T.textMuted}; }
    .nav-item:hover, .nav-item.active { color: ${T.accent}; background: ${T.accentDim}; border-color: ${T.accentBorder}; }
  `;

  const handleLogin = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      if (
        !loginEmail ||
        !loginPassword ||
        (loginMode === "signup" && !loginName)
      )
        throw new Error("Please fill in all fields.");
      const result =
        loginMode === "signup"
          ? await authApi.register(loginName, loginEmail, loginPassword)
          : await authApi.login(loginEmail, loginPassword);
      setCurrentUser(result.user);
      setPage("dashboard");
      const projects = await projectApi.list();
      setDbHistory(projects.projects || []);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    try {
    } catch {}
    setCurrentUser(null);
    setPage("login");
    setLoginEmail("");
    setLoginPassword("");
    setLoginName("");
    setLoginError("");
  };

  const switchTheme = (themeKey) => {
    setActiveTheme(themeKey);
    try {
      localStorage.setItem("nexus-theme", themeKey);
    } catch {}
  };

  if (authRestoring)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Restoring your workspace...
      </div>
    );

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (page === "login" || !currentUser)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.bg0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <style>{globalCSS + themeVars}</style>
        <div className="grid-bg" />
        <div className="orb orb1" />
        <div className="orb orb2" />

        <div
          className="fade-in"
          style={{
            zIndex: 10,
            width: "100%",
            maxWidth: 440,
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg,${T.accent},${T.accentBorder})`,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontFamily: "'Rajdhani'",
                fontWeight: 900,
                color: T.bg0,
                boxShadow: `0 0 24px ${T.accent}55`,
                margin: "0 auto 12px",
              }}
            >
              N
            </div>
            <div
              style={{
                fontFamily: "'Rajdhani'",
                fontWeight: 900,
                fontSize: 26,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: T.text,
              }}
            >
              NEXUS<span style={{ color: T.accent }}>IOT</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: T.textMuted,
                letterSpacing: 1,
                marginTop: 4,
              }}
            >
              AI HARDWARE BUILDER
            </div>
          </div>

          {/* Card */}
          <div className="panel" style={{ padding: 32 }}>
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: 28,
                background: T.bg2,
                borderRadius: 10,
                padding: 3,
              }}
            >
              {["login", "signup"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setLoginMode(mode);
                    setLoginError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "'Rajdhani'",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                    background: loginMode === mode ? T.accent : "transparent",
                    color: loginMode === mode ? T.bg0 : T.textMuted,
                    boxShadow:
                      loginMode === mode ? `0 0 16px ${T.accent}55` : "none",
                  }}
                >
                  {mode === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {loginMode === "signup" && (
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      color: T.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      display: "block",
                      marginBottom: 6,
                      fontFamily: "'Rajdhani'",
                      fontWeight: 600,
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "block",
                    marginBottom: 6,
                    fontFamily: "'Rajdhani'",
                    fontWeight: 600,
                  }}
                >
                  Email
                </label>
                <input
                  type="text"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "block",
                    marginBottom: 6,
                    fontFamily: "'Rajdhani'",
                    fontWeight: 600,
                  }}
                >
                  Password
                </label>
                <input
                  type="text"
                  placeholder={
                    loginMode === "signup" ? "Min. 6 characters" : "••••••••"
                  }
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%" }}
                />
              </div>

              {loginError && (
                <div
                  style={{
                    background: "rgba(255,60,60,0.1)",
                    border: "1px solid rgba(255,60,60,0.3)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "#ff6b6b",
                    fontSize: 12,
                  }}
                >
                  {loginError}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleLogin}
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: 14,
                  marginTop: 4,
                  opacity: loginLoading ? 0.7 : 1,
                }}
                disabled={loginLoading}
              >
                {loginLoading
                  ? "⏳ Please wait…"
                  : loginMode === "login"
                    ? "Sign In →"
                    : "Create Account →"}
              </button>

              <div
                style={{
                  textAlign: "center",
                  color: T.textMuted,
                  fontSize: 11,
                  paddingTop: 4,
                }}
              >
                {loginMode === "login"
                  ? "No account? "
                  : "Already have an account? "}
                <span
                  style={{
                    color: T.accent,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    setLoginMode(loginMode === "login" ? "signup" : "login");
                    setLoginError("");
                  }}
                >
                  {loginMode === "login" ? "Sign up free" : "Sign in"}
                </span>
              </div>
            </div>
          </div>

          {/* Theme picker on login screen */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 20,
            }}
          >
            {Object.entries(THEMES).map(([key, th]) => (
              <button
                key={key}
                title={th.name}
                onClick={() => switchTheme(key)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border:
                    activeTheme === key
                      ? `2px solid ${T.accent}`
                      : "2px solid transparent",
                  background: `linear-gradient(135deg, ${th.accent}, ${th.magenta})`,
                  cursor: "pointer",
                  fontSize: 12,
                  boxShadow:
                    activeTheme === key ? `0 0 10px ${T.accent}` : "none",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 10,
              color: T.textMuted,
              marginTop: 8,
            }}
          >
            {T.emoji} {T.name}
          </div>
        </div>
      </div>
    );

  // ─── MAIN APP LAYOUT ─────────────────────────────────────────────────────────
  const menuItems = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "builder", icon: "⚡", label: "Builder" },
    { id: "modules", icon: "◉", label: "Modules" },
    { id: "collab", icon: "◎", label: "Collaborate" },
    { id: "history", icon: "◷", label: "History" },
    { id: "docs", icon: "◻", label: "Docs" },
    { id: "simulation", icon: "▶", label: "Simulation" },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{globalCSS + themeVars}</style>
      <div className="grid-bg" />
      <div className="orb orb1" />
      <div className="orb orb2" />

      {/* ── SIDEBAR ── */}
      <div
        style={{
          width: 220,
          background: T.sidebarBg,
          borderRight: `1px solid ${T.sidebarBorder}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          flexShrink: 0,
          padding: "16px 10px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg,#00e5ff,#0099bb)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontFamily: "'Rajdhani'",
              fontWeight: 900,
              color: "#04050f",
              boxShadow: "0 0 16px rgba(0,229,255,0.3)",
            }}
          >
            N
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Rajdhani'",
                fontWeight: 900,
                fontSize: 17,
                letterSpacing: 2,
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              NEXUS<span style={{ color: "#00e5ff" }}>IOT</span>
            </div>
            <div style={{ fontSize: 9, color: "#5a7a94", letterSpacing: 0.5 }}>
              AI HARDWARE BUILDER
            </div>
          </div>
        </div>

        {/* Nav */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "collab" && collabActive && (
                <span
                  className="badge badge-green"
                  style={{
                    marginLeft: "auto",
                    padding: "2px 6px",
                    fontSize: 9,
                  }}
                >
                  Live
                </span>
              )}
              {item.id === "history" && dbHistory.length > 0 && (
                <span
                  className="badge badge-cyan"
                  style={{
                    marginLeft: "auto",
                    padding: "2px 6px",
                    fontSize: 9,
                  }}
                >
                  {dbHistory.length}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Theme Switcher */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 9,
              color: T.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
              paddingLeft: 2,
              fontFamily: "'Rajdhani'",
              fontWeight: 600,
            }}
          >
            Theme
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {Object.entries(THEMES).map(([key, th]) => (
              <button
                key={key}
                title={th.name}
                onClick={() => switchTheme(key)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border:
                    activeTheme === key
                      ? `2px solid ${T.accent}`
                      : "2px solid transparent",
                  background: `linear-gradient(135deg, ${th.accent}, ${th.magenta})`,
                  cursor: "pointer",
                  fontSize: 10,
                  boxShadow:
                    activeTheme === key ? `0 0 8px ${T.accent}` : "none",
                  transition: "all 0.2s",
                  padding: 0,
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 9,
              color: T.accent,
              marginTop: 4,
              fontFamily: "'JetBrains Mono'",
            }}
          >
            {T.emoji} {T.name}
          </div>
        </div>

        {/* User + Session Info */}
        <div
          style={{
            padding: "12px",
            background: T.bg0 + "cc",
            borderRadius: 8,
            border: `1px solid ${T.accentBorder}`,
            fontSize: 11,
          }}
        >
          {currentUser && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: `1px solid ${T.accentBorder}`,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${T.accent}, ${T.magenta})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.bg0,
                  flexShrink: 0,
                }}
              >
                {(currentUser.name || "U")[0].toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    color: T.text,
                    fontWeight: 600,
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentUser.name}
                </div>
                <div
                  style={{
                    color: T.textMuted,
                    fontSize: 9,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentUser.email}
                </div>
              </div>
            </div>
          )}
          <div
            style={{
              color: T.textMuted,
              marginBottom: 4,
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Session
          </div>
          <div style={{ color: T.accent, fontWeight: 600, letterSpacing: 1 }}>
            {sessionCode}
          </div>
          <div style={{ color: T.textMuted, marginTop: 4 }}>
            {projectData
              ? projectData.project_name?.slice(0, 22) + "..."
              : "No project loaded"}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          flex: 1,
          overflow: page === "simulation" ? "hidden" : "auto",
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "rgba(4,5,15,0.9)",
            borderBottom: "1px solid rgba(0,229,255,0.1)",
            backdropFilter: "blur(12px)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: "'Rajdhani'",
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#c8d8e8",
            }}
          >
            {menuItems.find((m) => m.id === page)?.label}
            {projectData && page === "builder" && (
              <span
                style={{
                  color: "#5a7a94",
                  fontWeight: 400,
                  fontSize: 13,
                  marginLeft: 12,
                }}
              >
                / {projectData.project_name}
              </span>
            )}
          </div>
          {/* Collab users */}
          {collabActive && (
            <div style={{ display: "flex", gap: -6 }}>
              {collabUsers.map((u) => (
                <div
                  key={u.id}
                  title={u.name}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: u.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#04050f",
                    border: "2px solid #04050f",
                    marginLeft: -6,
                    boxShadow: `0 0 8px ${u.color}`,
                  }}
                >
                  {u.avatar}
                </div>
              ))}
            </div>
          )}
          <span className="badge badge-green">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00ff94",
              }}
            />
            PRO
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11 }}
            onClick={handleLogout}
          >
            ⏻ Logout
          </button>
        </div>

        <div
          style={{
            padding: page === "simulation" ? "0" : "24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
          className="fade-in"
        >
          {/* ═══════════════════════════════════════════════════════
              DASHBOARD
          ══════════════════════════════════════════════════════════ */}
          {page === "dashboard" && (
            <div>
              {/* Stats row */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                {[
                  {
                    label: "Projects Built",
                    val: dbHistory.length,
                    color: "#00e5ff",
                  },
                  {
                    label: "Modules Available",
                    val: MODULES.length,
                    color: "#ff3cac",
                  },
                  {
                    label: "Selected Modules",
                    val: selectedModules.length,
                    color: "#00ff94",
                  },
                  {
                    label: "Chat Messages",
                    val: chatHistory.filter((m) => m.role !== "system").length,
                    color: "#ffb800",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="stat-card"
                    style={{ textAlign: "center" }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        fontFamily: "'Rajdhani'",
                        color: s.color,
                        lineHeight: 1,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#5a7a94",
                        marginTop: 4,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {/* Quick Start */}
                <div className="panel" style={{ padding: 20 }}>
                  <div
                    style={{
                      marginBottom: 16,
                      fontFamily: "'Rajdhani'",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#00e5ff",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    ⚡ Quick Start
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[
                      {
                        label: "Build New Project",
                        icon: "◈",
                        action: () => setPage("builder"),
                      },
                      {
                        label: "Browse Modules",
                        icon: "◉",
                        action: () => setPage("modules"),
                      },
                      {
                        label: "Join Collab Session",
                        icon: "◎",
                        action: () => setPage("collab"),
                      },
                      {
                        label: "View Past Projects",
                        icon: "◷",
                        action: () => setPage("history"),
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="btn btn-ghost"
                        style={{
                          justifyContent: "flex-start",
                          padding: "10px 14px",
                        }}
                        onClick={item.action}
                      >
                        <span style={{ fontSize: 16 }}>{item.icon}</span>{" "}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Log */}
                <div className="panel" style={{ padding: 20 }}>
                  <div
                    style={{
                      marginBottom: 16,
                      fontFamily: "'Rajdhani'",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#ff3cac",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    ◎ Activity Log
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {activityLog.map((a, i) => (
                      <div key={i} className="activity-item">
                        <div
                          className="activity-dot"
                          style={{
                            background:
                              {
                                gen: "#ffb800",
                                success: "#00ff94",
                                error: "#ff4444",
                                chat: "#00e5ff",
                                ai: "#ff3cac",
                                nav: "#5a7a94",
                                info: "#5a7a94",
                              }[a.type] || "#5a7a94",
                          }}
                        />
                        <div
                          style={{ flex: 1, fontSize: 11, color: "#8aa8bc" }}
                        >
                          {a.msg}
                        </div>
                        <div style={{ fontSize: 10, color: "#2a4a64" }}>
                          {a.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Projects */}
                <div
                  className="panel"
                  style={{ padding: 20, gridColumn: "1/-1" }}
                >
                  <div
                    style={{
                      marginBottom: 16,
                      fontFamily: "'Rajdhani'",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#00ff94",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    ◷ Recent Projects
                  </div>
                  {dbHistory.length === 0 ? (
                    <div
                      style={{
                        color: "#5a7a94",
                        fontSize: 12,
                        textAlign: "center",
                        padding: "24px 0",
                      }}
                    >
                      No projects yet. Go to Builder to create your first one.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill,minmax(220px,1fr))",
                        gap: 10,
                      }}
                    >
                      {dbHistory.slice(0, 6).map((p) => (
                        <div
                          key={p.id}
                          className="module-card"
                          onClick={() => {
                            setProjectData(p.data);
                            setPreviewCode(p.data.code || "");
                            setPage("builder");
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'Rajdhani'",
                              fontWeight: 700,
                              color: "#00e5ff",
                              fontSize: 13,
                              marginBottom: 4,
                            }}
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#5a7a94",
                              marginBottom: 8,
                            }}
                          >
                            {p.idea}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span className="badge badge-cyan">{p.board}</span>
                            <span
                              style={{
                                fontSize: 10,
                                color: "#2a4a64",
                                marginLeft: "auto",
                              }}
                            >
                              {p.ts}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              BUILDER
          ══════════════════════════════════════════════════════════ */}
          {page === "builder" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {/* LEFT: Input + BOM */}
              <div>
                {/* Project Input */}
                <div
                  className="panel"
                  style={{ padding: 20, marginBottom: 16 }}
                >
                  <div
                    style={{
                      marginBottom: 16,
                      fontFamily: "'Rajdhani'",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#ff3cac",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    🧠 AI Architect
                    {selectedModules.length > 0 && (
                      <span
                        className="badge badge-magenta"
                        style={{ marginLeft: 10 }}
                      >
                        {selectedModules.length} modules pre-selected
                      </span>
                    )}
                  </div>
                  <textarea
                    placeholder={
                      'Describe your IoT idea...\nE.g. "Smart agriculture node using LoRa SX1278 with soil moisture, temperature, and GPS tracking. Battery-powered, sends data every 5 min to gateway."'
                    }
                    value={projectIdea}
                    onChange={(e) => setProjectIdea(e.target.value)}
                    style={{
                      minHeight: 110,
                      resize: "vertical",
                      marginBottom: 12,
                    }}
                  />
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <select
                      value={boardType}
                      onChange={(e) => setBoardType(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      {[
                        "ESP32",
                        "ESP8266",
                        "Arduino Uno",
                        "Arduino Nano",
                        "Raspberry Pi Pico",
                        "STM32",
                        "LoRa32",
                      ].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={generateProject}
                      disabled={isGenerating}
                      style={{ whiteSpace: "nowrap", padding: "10px 20px" }}
                    >
                      {isGenerating ? (
                        <>
                          <span className="spinner" /> Crafting...
                        </>
                      ) : (
                        "⚡ Generate"
                      )}
                    </button>
                  </div>
                  {selectedModules.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        padding: "8px 12px",
                        background: "rgba(0,229,255,0.04)",
                        borderRadius: 8,
                        border: "1px solid rgba(0,229,255,0.1)",
                      }}
                    >
                      {selectedModules.map((m) => (
                        <span key={m.id} className="badge badge-cyan">
                          {m.icon} {m.label}
                          <span
                            style={{
                              cursor: "pointer",
                              marginLeft: 4,
                              opacity: 0.6,
                            }}
                            onClick={() =>
                              setSelectedModules((prev) =>
                                prev.filter((x) => x.id !== m.id),
                              )
                            }
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOM */}
                {projectData && (
                  <>
                    <div
                      className="panel"
                      style={{ padding: 20, marginBottom: 16 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 16,
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: "'Rajdhani'",
                              fontSize: 20,
                              fontWeight: 800,
                              color: "#00e5ff",
                              letterSpacing: 1,
                              textTransform: "uppercase",
                            }}
                          >
                            {projectData.project_name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#8aa8bc",
                              marginTop: 4,
                              lineHeight: 1.6,
                            }}
                          >
                            {projectData.summary}
                          </div>
                        </div>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          <span className="badge badge-gray">
                            {projectData.difficulty}
                          </span>
                          <span className="badge badge-green">
                            ⏱ {projectData.est_time}
                          </span>
                          <span className="badge badge-magenta">
                            💰 {projectData.cost}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="panel"
                      style={{ padding: 20, marginBottom: 16 }}
                    >
                      <div
                        style={{
                          marginBottom: 14,
                          fontFamily: "'Rajdhani'",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#00e5ff",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        📦 Bill of Materials
                      </div>
                      {projectData.components?.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                            padding: "12px 0",
                            borderBottom: "1px solid rgba(0,229,255,0.06)",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              background:
                                "linear-gradient(135deg,#00e5ff,#0099bb)",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "'Rajdhani'",
                              fontWeight: 900,
                              color: "#04050f",
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontFamily: "'Rajdhani'",
                                fontWeight: 700,
                                fontSize: 14,
                                color: "#00e5ff",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#8aa8bc",
                                marginTop: 2,
                              }}
                            >
                              {c.purpose}
                            </div>
                            {c.pin && (
                              <span
                                className="badge badge-gray"
                                style={{ marginTop: 4 }}
                              >
                                Pin: {c.pin}
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div
                              style={{
                                color: "#00ff94",
                                fontWeight: 700,
                                fontFamily: "'Rajdhani'",
                                fontSize: 16,
                              }}
                            >
                              {c.price}
                            </div>
                            <div style={{ fontSize: 10, color: "#5a7a94" }}>
                              ×{c.qty}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Wiring */}
                    <div
                      className="panel"
                      style={{ padding: 20, marginBottom: 16 }}
                    >
                      <div
                        style={{
                          marginBottom: 14,
                          fontFamily: "'Rajdhani'",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#ff3cac",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        🔌 Pin Wiring
                      </div>
                      <div
                        style={{
                          background: "rgba(4,5,15,0.6)",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="wire-row"
                          style={{
                            background: "rgba(0,229,255,0.06)",
                            fontFamily: "'Rajdhani'",
                            fontWeight: 700,
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#5a7a94",
                          }}
                        >
                          <span>From</span>
                          <span>To Board</span>
                          <span>Type</span>
                          <span>Notes</span>
                        </div>
                        {projectData.wiring?.map((w, i) => (
                          <div key={i} className="wire-row">
                            <span style={{ color: "#00e5ff" }}>{w.from}</span>
                            <span style={{ color: "#ff3cac" }}>{w.to}</span>
                            <span
                              className={`badge ${w.type === "Power" ? "badge-amber" : w.type === "Ground" ? "badge-gray" : "badge-cyan"}`}
                              style={{ fontSize: 9 }}
                            >
                              {w.type}
                            </span>
                            <span style={{ color: "#5a7a94", fontSize: 10 }}>
                              {w.note}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Safety */}
                    {projectData.safety?.length > 0 && (
                      <div
                        className="panel panel-magenta"
                        style={{ padding: 16 }}
                      >
                        <div
                          style={{
                            marginBottom: 10,
                            fontFamily: "'Rajdhani'",
                            fontWeight: 700,
                            color: "#ff3cac",
                            fontSize: 13,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          ⚠ Safety Notes
                        </div>
                        {projectData.safety.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 8,
                              marginBottom: 6,
                              fontSize: 12,
                              color: "#ffb8d8",
                            }}
                          >
                            <span style={{ color: "#ff3cac", flexShrink: 0 }}>
                              ▸
                            </span>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT: Code + Chat + Topology */}
              <div>
                {projectData ? (
                  <>
                    <div className="panel" style={{ marginBottom: 16 }}>
                      <div className="tab-bar" style={{ padding: "0 16px" }}>
                        {[
                          ["code", "💻 Code"],
                          ["chat", "🤖 AI Mentor"],
                          ["topo", "🔌 Topology"],
                          ["docs", "📚 Docs"],
                        ].map(([id, label]) => (
                          <button
                            key={id}
                            className={`tab ${activeTab === id ? "active" : ""}`}
                            onClick={() => setActiveTab(id)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div style={{ padding: 16 }}>
                        {activeTab === "code" && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                {projectData.libraries?.map((lib) => (
                                  <span key={lib} className="badge badge-amber">
                                    {lib}
                                  </span>
                                ))}
                              </div>
                              <button
                                className="btn btn-ghost"
                                style={{ fontSize: 10 }}
                                onClick={() => {
                                  navigator.clipboard.writeText(previewCode);
                                  showToast("Code copied!", "success");
                                }}
                              >
                                📋 Copy
                              </button>
                            </div>
                            <div className="code-block">{previewCode}</div>
                          </div>
                        )}

                        {activeTab === "chat" && (
                          <div>
                            <div
                              style={{
                                height: 380,
                                overflowY: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                                paddingBottom: 8,
                              }}
                            >
                              {chatHistory.filter((m) => m.role !== "system")
                                .length === 0 ? (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "40px 20px",
                                    color: "#5a7a94",
                                  }}
                                >
                                  <div
                                    style={{ fontSize: 32, marginBottom: 8 }}
                                  >
                                    🤖
                                  </div>
                                  <div style={{ fontSize: 12 }}>
                                    Ask me anything about your project — wiring,
                                    code, components...
                                  </div>
                                </div>
                              ) : (
                                chatHistory
                                  .filter((m) => m.role !== "system")
                                  .map((m, i) => (
                                    <div key={i}>
                                      {m.role === "user" ? (
                                        <div className="chat-user">
                                          {m.content}
                                        </div>
                                      ) : (
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "flex-start",
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: 28,
                                              height: 28,
                                              background:
                                                "linear-gradient(135deg,#ff3cac,#cc0077)",
                                              borderRadius: "50%",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: 12,
                                              flexShrink: 0,
                                            }}
                                          >
                                            AI
                                          </div>
                                          <div className="chat-ai">
                                            {m.content}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                              )}
                              {isChatLoading && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 28,
                                      height: 28,
                                      background:
                                        "linear-gradient(135deg,#ff3cac,#cc0077)",
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 12,
                                    }}
                                  >
                                    AI
                                  </div>
                                  <div className="dot-typing">
                                    <span />
                                    <span />
                                    <span />
                                  </div>
                                </div>
                              )}
                              <div ref={chatEndRef} />
                            </div>
                            <div
                              style={{ display: "flex", gap: 8, marginTop: 8 }}
                            >
                              <input
                                type="text"
                                placeholder="Ask about wiring, code, components..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && sendMentorMsg()
                                }
                              />
                              <button
                                className="btn btn-magenta"
                                onClick={sendMentorMsg}
                                style={{ whiteSpace: "nowrap" }}
                              >
                                Send
                              </button>
                            </div>
                            {/* Quick asks */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                marginTop: 10,
                              }}
                            >
                              {[
                                "Explain wiring",
                                "Add WiFi OTA",
                                "Debug tips",
                                "Power optimization",
                              ].map((q) => (
                                <button
                                  key={q}
                                  className="badge badge-gray"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setChatInput(q);
                                  }}
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeTab === "topo" && (
                          <div>
                            <div
                              className="topo-canvas"
                              style={{ padding: 20, minHeight: 300 }}
                            >
                              {/* Visual topology SVG */}
                              <svg
                                width="100%"
                                height="280"
                                viewBox="0 0 480 280"
                              >
                                {/* Board center */}
                                <rect
                                  x="180"
                                  y="100"
                                  width="120"
                                  height="60"
                                  rx="8"
                                  fill="rgba(0,229,255,0.08)"
                                  stroke="rgba(0,229,255,0.5)"
                                  strokeWidth="1.5"
                                />
                                <text
                                  x="240"
                                  y="132"
                                  fill="#00e5ff"
                                  fontSize="12"
                                  fontFamily="Rajdhani"
                                  fontWeight="700"
                                  textAnchor="middle"
                                  textTransform="uppercase"
                                >
                                  {boardType}
                                </text>
                                <text
                                  x="240"
                                  y="148"
                                  fill="rgba(0,229,255,0.5)"
                                  fontSize="9"
                                  fontFamily="JetBrains Mono"
                                  textAnchor="middle"
                                >
                                  Main MCU
                                </text>

                                {projectData.components
                                  ?.slice(0, 6)
                                  .map((comp, i) => {
                                    const angle =
                                      (i /
                                        Math.min(
                                          projectData.components.length,
                                          6,
                                        )) *
                                      2 *
                                      Math.PI;
                                    const r = 110;
                                    const cx =
                                      240 + r * Math.cos(angle - Math.PI / 2);
                                    const cy =
                                      130 + r * Math.sin(angle - Math.PI / 2);
                                    return (
                                      <g key={i}>
                                        <line
                                          x1="240"
                                          y1="130"
                                          x2={cx}
                                          y2={cy}
                                          stroke="rgba(0,229,255,0.15)"
                                          strokeWidth="1"
                                          strokeDasharray="4,3"
                                        />
                                        <rect
                                          x={cx - 40}
                                          y={cy - 16}
                                          width="80"
                                          height="32"
                                          rx="6"
                                          fill="rgba(13,18,48,0.9)"
                                          stroke="rgba(255,60,172,0.4)"
                                          strokeWidth="1"
                                        />
                                        <text
                                          x={cx}
                                          y={cy + 5}
                                          fill="#ff3cac"
                                          fontSize="9"
                                          fontFamily="Rajdhani"
                                          fontWeight="600"
                                          textAnchor="middle"
                                        >
                                          {comp.name?.slice(0, 10)}
                                        </text>
                                      </g>
                                    );
                                  })}
                              </svg>
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#5a7a94",
                                textAlign: "center",
                                marginTop: 8,
                              }}
                            >
                              Logical topology — drag & drop in full simulator
                            </div>
                          </div>
                        )}

                        {activeTab === "docs" && (
                          <div
                            style={{
                              fontSize: 13,
                              lineHeight: 1.8,
                              color: "#8aa8bc",
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "'Rajdhani'",
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#00e5ff",
                                marginBottom: 12,
                                textTransform: "uppercase",
                              }}
                            >
                              🚀 Quick Start Guide
                            </div>
                            {[
                              "Install listed libraries via Arduino IDE Library Manager",
                              "Connect all components per pin mapping above",
                              "Power board via USB first to test",
                              "Open Serial Monitor at 115200 baud",
                              "Upload code and watch the logs",
                              "Customize thresholds in the code",
                            ].map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  marginBottom: 8,
                                }}
                              >
                                <span
                                  style={{ color: "#00e5ff", fontWeight: 700 }}
                                >
                                  {i + 1}.
                                </span>
                                <span>{s}</span>
                              </div>
                            ))}
                            {projectData.next_steps?.length > 0 && (
                              <>
                                <div
                                  style={{
                                    fontFamily: "'Rajdhani'",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#ff3cac",
                                    margin: "16px 0 10px",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  📍 Next Steps
                                </div>
                                {projectData.next_steps.map((s, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      marginBottom: 6,
                                    }}
                                  >
                                    <span style={{ color: "#ff3cac" }}>▸</span>
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    className="panel"
                    style={{
                      padding: 40,
                      textAlign: "center",
                      minHeight: 400,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{ fontSize: 64, marginBottom: 20, opacity: 0.5 }}
                    >
                      ⚡
                    </div>
                    <div
                      style={{
                        fontFamily: "'Rajdhani'",
                        fontSize: 22,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 2,
                        marginBottom: 10,
                      }}
                    >
                      Ready to Build
                    </div>
                    <div
                      style={{
                        color: "#5a7a94",
                        fontSize: 12,
                        maxWidth: 300,
                        lineHeight: 1.8,
                        marginBottom: 24,
                      }}
                    >
                      Describe your IoT project on the left and click Generate
                      to get a complete blueprint with code, wiring, and BOM.
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      {[
                        "🔌 Auto Wiring",
                        "💻 Code Gen",
                        "📦 BOM",
                        "🤖 AI Mentor",
                        "🛒 Buy Links",
                      ].map((t) => (
                        <span key={t} className="badge badge-cyan">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              MODULES
          ══════════════════════════════════════════════════════════ */}
          {page === "modules" && (
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 20,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  style={{ maxWidth: 250 }}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["All", ...CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      className={`badge ${catFilter === cat ? "badge-cyan" : "badge-gray"}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setCatFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {selectedModules.length > 0 && (
                  <button
                    className="btn btn-primary"
                    style={{ marginLeft: "auto" }}
                    onClick={() => setPage("builder")}
                  >
                    ⚡ Use {selectedModules.length} in Builder →
                  </button>
                )}
              </div>

              {/* LoRa highlight */}
              <div
                className="panel panel-magenta"
                style={{
                  padding: 16,
                  marginBottom: 20,
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 32 }}>📻</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'Rajdhani'",
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#ff3cac",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    LoRa Long-Range Modules
                  </div>
                  <div style={{ fontSize: 12, color: "#8aa8bc", marginTop: 4 }}>
                    SX1278 / SX1262 / RFM95W — up to 20km range, sub-GHz,
                    LoRaWAN compatible. Ideal for agriculture, tracking, smart
                    city deployments.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="badge badge-magenta">20km Range</span>
                  <span className="badge badge-amber">LoRaWAN</span>
                  <span className="badge badge-green">Ultra Low Power</span>
                </div>
              </div>

              {CATEGORIES.filter(
                (cat) => catFilter === "All" || cat === catFilter,
              ).map((cat) => {
                const filtered = MODULES.filter(
                  (m) =>
                    m.category === cat &&
                    m.label.toLowerCase().includes(moduleSearch.toLowerCase()),
                );
                if (filtered.length === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Rajdhani'",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#5a7a94",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {cat}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: "rgba(0,229,255,0.1)",
                        }}
                      />
                      <span className="badge badge-gray">
                        {filtered.length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill,minmax(200px,1fr))",
                        gap: 10,
                      }}
                    >
                      {filtered.map((mod) => {
                        const isSel = selectedModules.some(
                          (m) => m.id === mod.id,
                        );
                        return (
                          <div
                            key={mod.id}
                            className={`module-card ${isSel ? "selected" : ""}`}
                            onClick={() => {
                              setSelectedModules((prev) =>
                                isSel
                                  ? prev.filter((m) => m.id !== mod.id)
                                  : [...prev, mod],
                              );
                              showToast(
                                isSel
                                  ? `Removed ${mod.label}`
                                  : `Added ${mod.label}`,
                                "info",
                              );
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                              }}
                            >
                              <span style={{ fontSize: 20 }}>{mod.icon}</span>
                              <div>
                                <div
                                  style={{
                                    fontFamily: "'Rajdhani'",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: isSel ? "#00e5ff" : "#c8d8e8",
                                  }}
                                >
                                  {mod.label}
                                </div>
                                <span
                                  className="badge badge-gray"
                                  style={{ fontSize: 9 }}
                                >
                                  {mod.category}
                                </span>
                              </div>
                              {isSel && (
                                <span
                                  style={{
                                    marginLeft: "auto",
                                    color: "#00e5ff",
                                    fontSize: 16,
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#5a7a94" }}>
                              {mod.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              COLLAB
          ══════════════════════════════════════════════════════════ */}
          {page === "collab" && (
            <div style={{ maxWidth: 980 }}>
              {/* ── Server connection bar ── */}
              <div
                className="panel"
                style={{
                  padding: "12px 20px",
                  marginBottom: 16,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#5a7a94",
                    fontFamily: "'Rajdhani'",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    minWidth: 90,
                  }}
                >
                  Server URL
                </span>
                <input
                  type="text"
                  value={socketUrl}
                  onChange={(e) => setSocketUrl(e.target.value)}
                  placeholder="http://192.168.x.x:3001"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    fontSize: 12,
                    letterSpacing: 1,
                  }}
                  disabled={socketConnected}
                />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  style={{ width: 130, fontSize: 12 }}
                  disabled={socketConnected}
                />
                {!socketConnected ? (
                  <button
                    className="btn btn-primary"
                    style={{ opacity: socketConnecting ? 0.6 : 1 }}
                    disabled={socketConnecting}
                    onClick={() => {
                      if (!userName.trim()) {
                        showToast("Enter your name first", "error");
                        return;
                      }
                      try {
                        localStorage.setItem("nexus-server-url", socketUrl);
                        localStorage.setItem("nexus-username", userName);
                      } catch {}
                      // Connect via socket.io-client (from node_modules)
                      setSocketConnecting(true);
                      setSocketError("");
                      try {
                        if (socketRef.current) {
                          socketRef.current.disconnect();
                          socketRef.current = null;
                        }
                        // Normalize URL: socket.io-client needs http:// not ws://
                        const normalizedUrl = socketUrl
                          .replace(/^ws:\/\//i, "http://")
                          .replace(/^wss:\/\//i, "https://");
                        const s = socketIO(normalizedUrl, {
                          withCredentials: true,
                          transports: ["polling", "websocket"],
                          timeout: 8000,
                          reconnectionAttempts: 3,
                          reconnectionDelay: 1000,
                        });
                        socketRef.current = s;
                        s.on("connect", () => {
                          setSocketConnected(true);
                          setSocketConnecting(false);
                          setSocketError("");
                        });
                        s.on("connect_error", (err) => {
                          setSocketConnecting(false);
                          setSocketError(
                            `Cannot reach server: ${err.message}. Make sure server.js is running on port 3001.`,
                          );
                        });
                        s.on("disconnect", () => {
                          setSocketConnected(false);
                          setCollabActive(false);
                          setRealCollabUsers([]);
                          showToast("Disconnected from server", "info");
                        });
                        s.on(
                          "session:joined",
                          ({ user, users, chatHistory, isHost: host }) => {
                            setRealCollabUsers(
                              users.filter((u) => u.id !== s.id),
                            );
                            setRealChatMessages(chatHistory || []);
                            setIsHost(host);
                            setCollabActive(true);
                            logActivity(
                              "collab",
                              `Joined session as ${user.name}`,
                            );
                            showToast(`Joined session!`, "success");
                          },
                        );
                        s.on("session:user-joined", ({ users }) => {
                          setRealCollabUsers(
                            users.filter((u) => u.id !== s.id),
                          );
                          showToast("A teammate joined", "info");
                        });
                        s.on("session:user-left", ({ users }) => {
                          setRealCollabUsers(
                            users.filter((u) => u.id !== s.id),
                          );
                        });
                        s.on("chat:message", (msg) => {
                          setRealChatMessages((p) => [...p.slice(-99), msg]);
                          setTimeout(
                            () =>
                              realChatEndRef.current?.scrollIntoView({
                                behavior: "smooth",
                              }),
                            50,
                          );
                        });
                        s.on("chat:ai-response", (aiMsg) => {
                          setRealChatMessages((p) => {
                            if (p.find((m) => m.id === aiMsg.id)) return p;
                            return [...p.slice(-99), aiMsg];
                          });
                          setTimeout(
                            () =>
                              realChatEndRef.current?.scrollIntoView({
                                behavior: "smooth",
                              }),
                            50,
                          );
                        });
                        s.on("sim:update", ({ simState }) => {
                          setSimRunning(simState.running);
                          setSimSensorData(simState.sensorData || {});
                          setSimOutputs(simState.outputs || {});
                        });
                        s.on("sim:sensor-tick", (data) => {
                          setSimSensorData(data.sensors);
                          setSimOutputs(data.outputs);
                        });
                      } catch (err) {
                        setSocketConnecting(false);
                        setSocketError("Error: " + err.message);
                      }
                    }}
                  >
                    {socketConnecting ? "⏳ Connecting…" : "⚡ Connect"}
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      socketRef.current?.disconnect();
                      setSocketConnected(false);
                      setCollabActive(false);
                      setRealCollabUsers([]);
                    }}
                  >
                    ✕ Disconnect
                  </button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: socketConnected
                        ? "#00ff94"
                        : socketConnecting
                          ? "#ffb800"
                          : "#5a7a94",
                      boxShadow: socketConnected ? "0 0 8px #00ff94" : "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: socketConnected ? "#00ff94" : "#5a7a94",
                    }}
                  >
                    {socketConnected
                      ? "ONLINE"
                      : socketConnecting
                        ? "CONNECTING"
                        : "OFFLINE"}
                  </span>
                </div>
              </div>
              {socketError && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 16px",
                    background: "rgba(255,60,60,0.1)",
                    border: "1px solid rgba(255,60,60,0.3)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#ff6060",
                  }}
                >
                  ⚠ {socketError}
                </div>
              )}

              {!collabActive ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  {/* Start Session */}
                  <div
                    className="panel"
                    style={{ padding: 28, textAlign: "center" }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
                    <div
                      style={{
                        fontFamily: "'Rajdhani'",
                        fontSize: 20,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 10,
                        color: "#00e5ff",
                      }}
                    >
                      Start Session
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#5a7a94",
                        marginBottom: 24,
                        lineHeight: 1.8,
                      }}
                    >
                      Create a live room on your local network. Share the code
                      so teammates on the same WiFi can join.
                    </div>
                    <div
                      style={{
                        background: "rgba(0,229,255,0.06)",
                        border: "1px solid rgba(0,229,255,0.25)",
                        borderRadius: 10,
                        padding: "12px 20px",
                        marginBottom: 20,
                        fontFamily: "'Rajdhani'",
                        fontSize: 28,
                        fontWeight: 900,
                        letterSpacing: 4,
                        color: "#00e5ff",
                      }}
                    >
                      {sessionCode}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                      onClick={() => {
                        if (!socketConnected) {
                          showToast("Connect to server first", "error");
                          return;
                        }
                        socketRef.current?.emit("session:join", {
                          code: sessionCode,
                          userName: userName || "Host",
                        });
                      }}
                    >
                      ⚡ Start Live Session
                    </button>
                  </div>
                  {/* Join Session */}
                  <div
                    className="panel"
                    style={{ padding: 28, textAlign: "center" }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📥</div>
                    <div
                      style={{
                        fontFamily: "'Rajdhani'",
                        fontSize: 20,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 10,
                        color: "#ff3cac",
                      }}
                    >
                      Join Session
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#5a7a94",
                        marginBottom: 24,
                        lineHeight: 1.8,
                      }}
                    >
                      Enter a session code from a teammate on the same WiFi
                      network to collaborate in real time.
                    </div>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter code (e.g. A4X9KR)"
                      style={{
                        marginBottom: 12,
                        textAlign: "center",
                        letterSpacing: 4,
                        fontFamily: "'Rajdhani'",
                        fontSize: 18,
                      }}
                      maxLength={6}
                    />
                    <button
                      className="btn btn-magenta"
                      style={{ width: "100%" }}
                      onClick={() => {
                        if (!socketConnected) {
                          showToast("Connect to server first", "error");
                          return;
                        }
                        if (joinCode.length < 4) {
                          showToast("Enter a valid session code", "error");
                          return;
                        }
                        socketRef.current?.emit("session:join", {
                          code: joinCode,
                          userName: userName || "Guest",
                        });
                      }}
                    >
                      Join Session →
                    </button>
                  </div>
                  {/* Setup guide */}
                  <div
                    className="panel"
                    style={{ padding: 20, gridColumn: "1/-1" }}
                  >
                    <div
                      style={{
                        fontFamily: "'Rajdhani'",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#ffb800",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 12,
                      }}
                    >
                      ⚙ WiFi Setup Guide
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 12,
                      }}
                    >
                      {[
                        {
                          step: "1",
                          title: "Run the server",
                          desc: "On the host laptop: npm install && node server.js",
                          color: "#00e5ff",
                        },
                        {
                          step: "2",
                          title: "Find your IP",
                          desc: "Run: ipconfig (Windows) or ifconfig (Mac/Linux) — use the 192.168.x.x address",
                          color: "#ff3cac",
                        },
                        {
                          step: "3",
                          title: "Connect & share",
                          desc: "Enter http://192.168.x.x:3001 above (host's LAN IP, port 3001). Share your session code.",
                          color: "#00ff94",
                        },
                      ].map((s) => (
                        <div
                          key={s.step}
                          style={{
                            padding: "14px 16px",
                            background: "rgba(4,5,15,0.6)",
                            borderRadius: 8,
                            border: `1px solid ${s.color}22`,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'Rajdhani'",
                              fontSize: 24,
                              fontWeight: 900,
                              color: s.color,
                              marginBottom: 4,
                            }}
                          >
                            0{s.step}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#c8d8e8",
                              marginBottom: 4,
                            }}
                          >
                            {s.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#5a7a94",
                              lineHeight: 1.6,
                            }}
                          >
                            {s.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Active collab header */}
                  <div
                    className="panel panel-magenta"
                    style={{
                      padding: 16,
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#ff3cac",
                          animation: "glowPulse 2s infinite",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Rajdhani'",
                          fontWeight: 700,
                          color: "#ff3cac",
                          fontSize: 13,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        Live Collaboration Active
                      </span>
                    </div>
                    <span className="badge badge-cyan">
                      Code: {sessionCode || joinCode}
                    </span>
                    <span style={{ fontSize: 11, color: "#5a7a94" }}>
                      {isHost ? "👑 You are the host" : "👤 Guest"}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginLeft: "auto",
                        alignItems: "center",
                      }}
                    >
                      {realCollabUsers.map((u) => (
                        <div
                          key={u.id}
                          title={u.name}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: u.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#04050f",
                            border: "2px solid #04050f",
                            boxShadow: `0 0 8px ${u.color}66`,
                          }}
                        >
                          {u.avatar}
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        socketRef.current?.disconnect();
                        setCollabActive(false);
                        setRealCollabUsers([]);
                        showToast("Session ended", "info");
                      }}
                    >
                      End Session
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 280px",
                      gap: 16,
                    }}
                  >
                    {/* Live Chat */}
                    <div
                      className="panel"
                      style={{
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Chat header */}
                      <div
                        style={{
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Rajdhani'",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#00e5ff",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          💬 Team Chat
                        </span>
                        <div
                          style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "3px 10px",
                            background: "rgba(255,60,172,0.08)",
                            border: "1px solid rgba(255,60,172,0.2)",
                            borderRadius: 20,
                          }}
                        >
                          <span style={{ fontSize: 10, color: "#ff3cac" }}>
                            🤖
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "#ff3cac",
                              fontFamily: "'JetBrains Mono',monospace",
                              fontWeight: 700,
                            }}
                          >
                            Type @ai to summon Nexus AI
                          </span>
                        </div>
                      </div>

                      {/* Messages */}
                      <div
                        style={{
                          flex: 1,
                          height: 360,
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        {realChatMessages.length === 0 && (
                          <div
                            style={{
                              textAlign: "center",
                              color: "#5a7a94",
                              fontSize: 12,
                              marginTop: 40,
                            }}
                          >
                            No messages yet. Say hi! 👋
                            <br />
                            <span style={{ color: "#ff3cac", fontSize: 11 }}>
                              Tip: type @ai followed by your question to get AI
                              help
                            </span>
                          </div>
                        )}
                        {realChatMessages.map((m, i) => {
                          const isAiMsg = m.isAi || m.userId === "nexus-ai";
                          return (
                            <div key={m.id || i}>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#5a7a94",
                                  marginBottom: 3,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                {isAiMsg && (
                                  <span style={{ fontSize: 10 }}>🤖</span>
                                )}
                                <span
                                  style={{
                                    color: isAiMsg
                                      ? "#ff3cac"
                                      : m.userColor || "#00e5ff",
                                    fontWeight: 700,
                                  }}
                                >
                                  {m.userName}
                                </span>
                                {isAiMsg && (
                                  <span
                                    style={{
                                      fontSize: 9,
                                      color: "#ff3cac",
                                      background: "rgba(255,60,172,0.1)",
                                      padding: "1px 6px",
                                      borderRadius: 10,
                                      border: "1px solid rgba(255,60,172,0.2)",
                                    }}
                                  >
                                    AI
                                  </span>
                                )}
                                <span style={{ color: "#2a4a64" }}>
                                  ·{" "}
                                  {new Date(m.ts).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div
                                style={{
                                  background: isAiMsg
                                    ? "rgba(255,60,172,0.06)"
                                    : "rgba(13,18,48,0.7)",
                                  border: isAiMsg
                                    ? "1px solid rgba(255,60,172,0.25)"
                                    : "1px solid rgba(0,229,255,0.1)",
                                  borderRadius: isAiMsg
                                    ? "12px 12px 12px 4px"
                                    : "4px 12px 12px 12px",
                                  padding: "10px 14px",
                                  fontSize: 12,
                                  color: "#c8d8e8",
                                  lineHeight: 1.7,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {/* Highlight @ai mentions in user messages */}
                                {!isAiMsg && m.text.includes("@ai")
                                  ? m.text.split(/(@ai)/i).map((part, pi) =>
                                      /^@ai$/i.test(part) ? (
                                        <span
                                          key={pi}
                                          style={{
                                            color: "#ff3cac",
                                            fontWeight: 700,
                                            background: "rgba(255,60,172,0.1)",
                                            padding: "0 4px",
                                            borderRadius: 4,
                                          }}
                                        >
                                          @ai
                                        </span>
                                      ) : (
                                        part
                                      ),
                                    )
                                  : m.text}
                              </div>
                            </div>
                          );
                        })}
                        {/* AI typing indicator */}
                        {isAiTyping && (
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#5a7a94",
                                marginBottom: 3,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>🤖</span>
                              <span
                                style={{ color: "#ff3cac", fontWeight: 700 }}
                              >
                                Nexus AI
                              </span>
                              <span
                                style={{
                                  fontSize: 9,
                                  color: "#ff3cac",
                                  background: "rgba(255,60,172,0.1)",
                                  padding: "1px 6px",
                                  borderRadius: 10,
                                  border: "1px solid rgba(255,60,172,0.2)",
                                }}
                              >
                                AI
                              </span>
                            </div>
                            <div
                              style={{
                                background: "rgba(255,60,172,0.06)",
                                border: "1px solid rgba(255,60,172,0.25)",
                                borderRadius: "12px 12px 12px 4px",
                                padding: "10px 16px",
                                display: "flex",
                                gap: 5,
                                alignItems: "center",
                              }}
                            >
                              {[0, 1, 2].map((d) => (
                                <div
                                  key={d}
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "#ff3cac",
                                    opacity: 0.8,
                                    animation: `glowPulse 1s ease-in-out ${d * 0.2}s infinite`,
                                  }}
                                />
                              ))}
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#ff3cac",
                                  marginLeft: 6,
                                }}
                              >
                                Nexus AI is analysing your conversation…
                              </span>
                            </div>
                          </div>
                        )}
                        <div ref={realChatEndRef} />
                      </div>

                      {/* Input row */}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexDirection: "column",
                        }}
                      >
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            placeholder="Message team… or type @ai your question"
                            value={realChatInput}
                            onChange={(e) => setRealChatInput(e.target.value)}
                            style={{
                              width: "100%",
                              paddingRight: realChatInput
                                .toLowerCase()
                                .startsWith("@ai")
                                ? "90px"
                                : "12px",
                              borderColor: realChatInput
                                .toLowerCase()
                                .startsWith("@ai")
                                ? "rgba(255,60,172,0.5)"
                                : undefined,
                              boxShadow: realChatInput
                                .toLowerCase()
                                .startsWith("@ai")
                                ? "0 0 0 2px rgba(255,60,172,0.15)"
                                : undefined,
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" || !realChatInput.trim())
                                return;
                              const text = realChatInput.trim();
                              socketRef.current?.emit("chat:message", { text });
                              setRealChatInput("");
                              // @ai detection — anything after @ai is the query
                              const aiMatch = text.match(/^@ai\s+([\s\S]+)/i);
                              if (aiMatch) {
                                callNexusAI(
                                  aiMatch[1].trim(),
                                  realChatMessages,
                                );
                              }
                            }}
                          />
                          {realChatInput.toLowerCase().startsWith("@ai") && (
                            <span
                              style={{
                                position: "absolute",
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: 10,
                                color: "#ff3cac",
                                fontFamily: "'JetBrains Mono',monospace",
                                pointerEvents: "none",
                              }}
                            >
                              @ai active
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={() => {
                              const text = realChatInput.trim();
                              if (!text) return;
                              socketRef.current?.emit("chat:message", { text });
                              setRealChatInput("");
                              const aiMatch = text.match(/^@ai\s+([\s\S]+)/i);
                              if (aiMatch)
                                callNexusAI(
                                  aiMatch[1].trim(),
                                  realChatMessages,
                                );
                            }}
                          >
                            Send
                          </button>
                          <button
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid rgba(255,60,172,0.3)",
                              background: "rgba(255,60,172,0.06)",
                              color: "#ff3cac",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "'JetBrains Mono',monospace",
                              transition: "all 0.2s",
                            }}
                            title="Ask Nexus AI about the conversation"
                            onClick={() => {
                              const q =
                                realChatInput.trim() ||
                                "Summarise the conversation and explain the key IoT concepts being discussed.";
                              const text = `@ai ${q}`;
                              socketRef.current?.emit("chat:message", { text });
                              setRealChatInput("");
                              callNexusAI(q, realChatMessages);
                            }}
                          >
                            🤖 @ai
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Online users */}
                    <div className="panel" style={{ padding: 20 }}>
                      <div
                        style={{
                          marginBottom: 14,
                          fontFamily: "'Rajdhani'",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#ff3cac",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        👥 Team ({realCollabUsers.length + 1})
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {[
                          {
                            name: `${userName || "You"} ${isHost ? "(Host)" : ""}`,
                            avatar: (userName || "Y").slice(0, 2).toUpperCase(),
                            color: "#00e5ff",
                            status: "active",
                            role: isHost ? "Owner" : "Member",
                          },
                          ...realCollabUsers,
                        ].map((u, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              padding: 10,
                              background: "rgba(4,5,15,0.6)",
                              borderRadius: 8,
                              border: "1px solid rgba(0,229,255,0.08)",
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: u.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#04050f",
                                boxShadow: `0 0 10px ${u.color}44`,
                              }}
                            >
                              {u.avatar}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#c8d8e8",
                                }}
                              >
                                {u.name}
                              </div>
                              <div style={{ fontSize: 10, color: "#5a7a94" }}>
                                {u.role || "Member"}
                              </div>
                            </div>
                            <div
                              className="collab-dot"
                              style={{
                                background:
                                  u.status === "active" ? "#00ff94" : "#5a7a94",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          marginTop: 16,
                          padding: "10px 14px",
                          background: "rgba(0,229,255,0.04)",
                          borderRadius: 8,
                          border: "1px solid rgba(0,229,255,0.1)",
                          fontSize: 11,
                          color: "#5a7a94",
                        }}
                      >
                        Share code{" "}
                        <span style={{ color: "#00e5ff", fontWeight: 700 }}>
                          {sessionCode || joinCode}
                        </span>{" "}
                        with teammates on the same WiFi
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              HISTORY
          ══════════════════════════════════════════════════════════ */}
          {page === "history" && (
            <div>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Rajdhani'",
                    fontSize: 13,
                    color: "#5a7a94",
                  }}
                >
                  {dbHistory.length} project{dbHistory.length !== 1 ? "s" : ""}{" "}
                  saved locally
                </div>
                {dbHistory.length > 0 && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      setDbHistory([]);
                      showToast("History cleared", "info");
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              {dbHistory.length === 0 ? (
                <div
                  className="panel"
                  style={{ padding: 60, textAlign: "center" }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
                    ◷
                  </div>
                  <div style={{ color: "#5a7a94", fontSize: 13 }}>
                    No project history yet. Generate your first project in the
                    Builder.
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {dbHistory.map((p) => (
                    <div
                      key={p.id}
                      className="panel"
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => {
                        setProjectData(p.data);
                        setPreviewCode(p.data.code || "");
                        setPage("builder");
                        setChatHistory([]);
                        showToast(`Loaded: ${p.name}`, "success");
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "linear-gradient(135deg,#00e5ff,#0099bb)",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        ⚡
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "'Rajdhani'",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#00e5ff",
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#5a7a94",
                            marginTop: 3,
                          }}
                        >
                          {p.idea}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span className="badge badge-cyan">{p.board}</span>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#2a4a64",
                            marginTop: 4,
                          }}
                        >
                          {p.ts}
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 11, flexShrink: 0 }}
                      >
                        Load →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              DOCS
          ══════════════════════════════════════════════════════════ */}
          {page === "docs" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "240px 1fr",
                gap: 20,
              }}
            >
              <div
                className="panel"
                style={{ padding: 16, alignSelf: "start" }}
              >
                <div
                  style={{
                    marginBottom: 12,
                    fontFamily: "'Rajdhani'",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#5a7a94",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Contents
                </div>
                {[
                  "Getting Started",
                  "LoRa Guide",
                  "Module Reference",
                  "Wiring Best Practices",
                  "Code Templates",
                  "Troubleshooting",
                  "FAQ",
                ].map((section) => (
                  <div
                    key={section}
                    style={{
                      padding: "8px 10px",
                      fontSize: 12,
                      color: "#8aa8bc",
                      borderRadius: 6,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#00e5ff")}
                    onMouseLeave={(e) => (e.target.style.color = "#8aa8bc")}
                  >
                    ▸ {section}
                  </div>
                ))}
              </div>
              <div className="panel" style={{ padding: 28 }}>
                <div
                  style={{
                    fontFamily: "'Rajdhani'",
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#00e5ff",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    marginBottom: 8,
                  }}
                >
                  Getting Started
                </div>
                <div
                  style={{ fontSize: 12, color: "#5a7a94", marginBottom: 24 }}
                >
                  Nexus IoT v2.0 · AI Hardware Builder
                </div>

                {[
                  {
                    title: "1. Select Your Modules",
                    body: "Browse the Modules section to pick MCUs, radios, sensors, and actuators. LoRa modules (SX1278, SX1262) are available for long-range deployments up to 20km. Selected modules are automatically included in blueprint generation.",
                  },
                  {
                    title: "2. Describe Your Project",
                    body: "In the Builder, describe your project in plain English. Be specific: mention use case, environment, power constraints, and communication needs. The AI generates a complete, build-ready blueprint.",
                  },
                  {
                    title: "3. Review & Build",
                    body: "Your blueprint includes a full BOM with pricing, pin wiring table, complete source code with libraries, safety notes, and next steps. Use the AI Mentor chat to ask questions about your specific build.",
                  },
                  {
                    title: "4. Collaborate",
                    body: "Share your session code with teammates to co-design in real time. All users can chat with the AI Mentor simultaneously on the same project context.",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 24,
                      padding: "16px 20px",
                      background: "rgba(4,5,15,0.6)",
                      borderRadius: 10,
                      borderLeft: "2px solid rgba(0,229,255,0.4)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Rajdhani'",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#c8d8e8",
                        marginBottom: 8,
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#8aa8bc",
                        lineHeight: 1.8,
                      }}
                    >
                      {s.body}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: 8,
                    padding: "16px 20px",
                    background: "rgba(255,60,172,0.06)",
                    borderRadius: 10,
                    border: "1px solid rgba(255,60,172,0.2)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Rajdhani'",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#ff3cac",
                      marginBottom: 6,
                    }}
                  >
                    ⚡ LoRa Quick Reference
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 11,
                    }}
                  >
                    {[
                      ["SX1278", "433/868/915 MHz, 20km, -148dBm sensitivity"],
                      ["SX1262", "Sub-GHz, LoRaWAN, +22dBm TX power"],
                      ["RFM95W", "915MHz, LoRa, compact, 100mW"],
                      ["LoRa32", "ESP32 + SX1276 all-in-one, WiFi+LoRa"],
                    ].map(([name, desc]) => (
                      <div
                        key={name}
                        style={{
                          padding: "8px 10px",
                          background: "rgba(255,60,172,0.04)",
                          borderRadius: 6,
                          border: "1px solid rgba(255,60,172,0.1)",
                        }}
                      >
                        <div
                          style={{
                            color: "#ff3cac",
                            fontWeight: 600,
                            marginBottom: 2,
                          }}
                        >
                          {name}
                        </div>
                        <div style={{ color: "#8aa8bc" }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              SIMULATION
          ══════════════════════════════════════════════════════════ */}
          {page === "simulation" && (
            <SimulationPage
              socketRef={socketRef}
              socketConnected={socketConnected}
              collabActive={collabActive}
              simRunning={simRunning}
              setSimRunning={setSimRunning}
              simSensorData={simSensorData}
              setSimSensorData={setSimSensorData}
              simOutputs={simOutputs}
              setSimOutputs={setSimOutputs}
              simLog={simLog}
              setSimLog={setSimLog}
              THEME={THEME}
            />
          )}
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className="toast">
          <span style={{ fontSize: 16 }}>
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
                ? "✗"
                : "ℹ"}
          </span>
          <span style={{ fontSize: 13, color: "#c8d8e8" }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
