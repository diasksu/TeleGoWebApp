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

  }, 300);
});

// Остановить движение вручную
window.addEventListener("geosim:stop", () => {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
});


// -------------------------
// Override getCurrentPosition
// -------------------------
navigator.geolocation.getCurrentPosition = function (success) {
  if (!route.length) {
    success({
      coords: {
        latitude: 36.9110,
        longitude:30.72594,
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
