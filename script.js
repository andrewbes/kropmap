// Глобальні змінні
let map;
let locations = [];

// Функції для роботи з модальним вікном
function openModal(title, content) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalContent").innerHTML = content;
  document.getElementById("locationModal").style.display = "block";
}

function closeModal() {
  document.getElementById("locationModal").style.display = "none";
}

function createLeafletDivIcon(type, text, size = 40) {
  const colors =
    type === "landmark"
      ? ["#4facfe", "#00f2fe"]
      : type === "user"
      ? ["#f093fb", "#f5576c"]
      : ["#667eea", "#764ba2"];

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${Math.floor(size * 0.4)}px;
      color: white;
      font-weight: bold;
    ">${text}</div>
  `;

  return L.divIcon({
    className: "custom-leaflet-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

async function loadLocations() {
  try {
    const response = await fetch("locations.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    locations = await response.json();
  } catch (error) {
    console.error("Не вдалося завантажити locations.json:", error);
    locations = [];
  }
}

async function initMap() {
  if (typeof L === "undefined") return;
  await loadLocations();

  const center = [48.5081, 32.2623];
  const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
  const initialZoom = isSmallScreen ? 12 : 14;

  map = L.map("map", {
    zoomControl: true,
  }).setView(center, initialZoom);

  // Тайли української спільноти OSM (кордони згідно з законодавством України).
  // Документація та стилі: https://tile.openstreetmap.org.ua/ · Проєкт: https://openstreetmap.org.ua/
  L.tileLayer("https://tiles.openstreetmap.org.ua/osm/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://openstreetmap.org.ua/" rel="noopener">OpenStreetMap Україна</a> · ' +
      '<a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);

  locations.forEach((location) => {
    const marker = L.marker([location.lat, location.lng], {
      icon: createLeafletDivIcon(location.type, location.icon || "📍", 50),
      title: location.title,
    }).addTo(map);

    marker.on("click", () => {
      const detailsPage = location.template || "streets/sampleStreet.html";
      const content = location.id
        ? `
          <iframe
            src="${detailsPage}?id=${encodeURIComponent(location.id)}"
            title="${location.title}"
            style="display:block;width:100%;height:100%;min-width:0;min-height:0;border:0;"
            loading="lazy">
          </iframe>
        `
        : `
          <p>Для цієї локації відсутній id у JSON.</p>
        `;
      openModal(location.title, content);
    });
  });

  // Тимчасово вимкнено додавання користувацьких міток по кліку на карту.
  // map.on("click", (e) => {
  //   const lat = e.latlng.lat;
  //   const lng = e.latlng.lng;
  //
  //   const userMarker = L.marker([lat, lng], {
  //     icon: createLeafletDivIcon("user", "📍", 45),
  //     title: "Користувацька мітка",
  //   }).addTo(map);
  //
  //   userMarker.on("click", () => {
  //     const content = `
  //       <p>Широта: ${lat.toFixed(5)}<br>Довгота: ${lng.toFixed(5)}</p>
  //       <p>Ви можете додати опис чи фото сюди вручну.</p>
  //     `;
  //     openModal("Користувацька мітка", content);
  //   });
  // });
}

// Ініціалізація при завантаженні сторінки
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("locationModal");
  const closeBtn = document.querySelector(".close");

  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }

  window.onclick = function (event) {
    if (event.target === modal) {
      closeModal();
    }
  };
  initMap();
});
