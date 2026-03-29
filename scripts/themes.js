export const themes = {
  mining: {
    name: "Crypto Miner 2077",
    emoji: "⛏️",
    resource: { name: "BTC", symbol: "₿", start: 0.01, decimals: 8 },
    secondary: { name: "chips", start: 0 },
    energy: { name: "energy", max: 100 },
    colors: { primary: "#ffaa33", secondary: "#1b2129", accent: "#44aaff" },
    equipment: [
      { id: "cpu", name: "CPU Miner", power: 2, cost: 0.001 },
      { id: "gpu", name: "GPU Rig", power: 45, cost: 0.025 },
      { id: "asic", name: "ASIC Miner", power: 95, cost: 0.085 }
    ],
    events: ["thunderstorm", "energyCrisis", "overheat", "hackerAttack"],
    description: "Добывай криптовалюту, улучшай оборудование, борись с конкурентами!"
  },
  farming: {
    name: "Farm Empire",
    emoji: "🌾",
    resource: { name: "wheat", symbol: "🌾", start: 100, decimals: 0 },
    secondary: { name: "seeds", start: 10 },
    energy: { name: "water", max: 100 },
    colors: { primary: "#6aab5a", secondary: "#1a2a1a", accent: "#88ff88" },
    equipment: [
      { id: "plow", name: "Hand Plow", power: 2, cost: 10 },
      { id: "tractor", name: "Tractor", power: 45, cost: 100 },
      { id: "combine", name: "Combine", power: 95, cost: 350 }
    ],
    events: ["drought", "pestAttack", "flood", "marketCrash"],
    description: "Выращивай урожай, покупай технику, защищай поля от вредителей!"
  },
  business: {
    name: "Startup Tycoon",
    emoji: "💼",
    resource: { name: "money", symbol: "$", start: 1000, decimals: 0 },
    secondary: { name: "patents", start: 0 },
    energy: { name: "staff", max: 100 },
    colors: { primary: "#5a8faa", secondary: "#1a2a3a", accent: "#88aaff" },
    equipment: [
      { id: "laptop", name: "Laptop", power: 2, cost: 500 },
      { id: "office", name: "Office", power: 45, cost: 5000 },
      { id: "corp", name: "Corporation", power: 95, cost: 25000 }
    ],
    events: ["recession", "competitor", "lawsuit", "investment"],
    description: "Строй бизнес-империю, нанимай сотрудников, побеждай конкурентов!"
  },
  space: {
    name: "Space Miner",
    emoji: "🚀",
    resource: { name: "fuel", symbol: "⛽", start: 50, decimals: 0 },
    secondary: { name: "nanites", start: 0 },
    energy: { name: "radiation", max: 100 },
    colors: { primary: "#aa66ff", secondary: "#0a0a2a", accent: "#ff66cc" },
    equipment: [
      { id: "drone", name: "Drone", power: 2, cost: 5 },
      { id: "miner", name: "Miner Ship", power: 45, cost: 50 },
      { id: "station", name: "Space Station", power: 95, cost: 200 }
    ],
    events: ["solarFlare", "pirateAttack", "asteroidField", "alienContact"],
    description: "Добывай ресурсы в космосе, исследуй астероиды, защищайся от пиратов!"
  },
  idle: {
    name: "Idle Clicker",
    emoji: "🖱️",
    resource: { name: "coins", symbol: "🪙", start: 0, decimals: 0 },
    secondary: { name: "gems", start: 0 },
    energy: { name: "clicks", max: 1000 },
    colors: { primary: "#ffaa66", secondary: "#2a1a0a", accent: "#ffaa44" },
    equipment: [
      { id: "finger", name: "Finger", power: 1, cost: 10 },
      { id: "auto", name: "Auto Clicker", power: 10, cost: 100 },
      { id: "macro", name: "Macro Bot", power: 50, cost: 1000 }
    ],
    events: ["bonusTime", "comboBreak", "doublePoints", "challenge"],
    description: "Кликай, нанимай помощников, открывай новые уровни!"
  }
};

export const getRandomTheme = () => {
  const themeNames = Object.keys(themes);
  return themeNames[Math.floor(Math.random() * themeNames.length)];
};