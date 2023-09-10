const defaultSettings = [
  { key: 'lastUpdate', default: new Date().getTime() },
  { key: 'displayTeammates', default: false },
];

function updateSettings() { }

function initSettings() {
  window.settings = {};
  for (var setting of defaultSettings)
    window.settings[setting.key] = setting.default;
}