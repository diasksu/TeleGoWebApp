// -------------------------
// Геосимулятор (контроллер)
// -------------------------
let route = [];       // [{ latitude, longitude }]
let idx = 0;          // текущий индекс
let intervalId = null;

// список watchPosition колбэков
const watchers = new Map();
let nextWatchId = 1;

// -------------------------
// Event handlers
// -------------------------

// Установить маршрут
window.addEventListener("geosim:setRoute", (e) => {
  route = e.detail.route || [];
  idx = 0;

  // Если уже был запущен старый интервал — убиваем его
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

// Начать движение
window.addEventListener("geosim:start", () => {
  if (!route.length) return;

  // на всякий случай чистим старый
  if (intervalId) clearInterval(intervalId);

  intervalId = setInterval(() => {
    const p = route[idx];
    if (!p) return;

    // Уведомляем всех watchers
    for (const cb of watchers.values()) {
      cb({
        coords: {
          latitude: p.latitude,
          longitude: p.longitude,
          accuracy: 5
        }
      });
    }

    // Двигаем индекс
    if (idx < route.length - 1) {
      idx++;
    } else {
      // достигли конца — стоп
      clearInterval(intervalId);
      intervalId = null;
    }

  }, 1000);
});

// Остановить движение вручную
window.addEventListener("geosim:stop", () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
});

// -------------------------
// Override getCurrentPosition
// -------------------------
// ~1 km in degrees
const MAX_OFFSET_METERS = 1000;
const METERS_IN_DEGREE = 111_320;

function randomOffset() {
  return (Math.random() * 2 - 1) * (MAX_OFFSET_METERS / METERS_IN_DEGREE);
}

const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(
  navigator.geolocation
);

let startLatitude;
let startLongitude;

originalGetCurrentPosition((pos) => {
  const baseLat = pos.coords.latitude;
  const baseLng = pos.coords.longitude;

  startLatitude = baseLat + randomOffset();
  startLongitude = baseLng + randomOffset() / Math.cos((baseLat * Math.PI) / 180);

  navigator.geolocation.getCurrentPosition = function (success) {
    if (!route.length) {
      success({
        coords: {
          latitude: startLatitude,
          longitude: startLongitude,
          accuracy: 5
        }
      });
      return;
    }

    const p = route[idx];
    success({
      coords: {
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: 5
      }
    });
  };
});

// -------------------------
// Override watchPosition
// -------------------------
navigator.geolocation.watchPosition = function (success) {
  const id = nextWatchId++;
  watchers.set(id, success);
  return id;
};

navigator.geolocation.clearWatch = function (id) {
  watchers.delete(id);
};