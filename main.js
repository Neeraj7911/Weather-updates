// main.js
// API Keys
const weatherApiKey = "9afd12a6a2414ab9d129d33d2f3726be";
const weatherApiUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric";
const forecastApiUrl =
  "https://api.openweathermap.org/data/2.5/forecast?units=metric";
const airQualityApiUrl =
  "https://api.openweathermap.org/data/2.5/air_pollution";

// DOM Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const cityElement = document.querySelector(".city");
const dateElement = document.querySelector(".date");
const tempElement = document.querySelector(".temp");
const feelsLikeElement = document.querySelector(".feels-like-temp");
const weatherIcon = document.querySelector(".weather-icon");
const weatherDescription = document.querySelector(".weather-description");
const humidityElement = document.querySelector(".humidity");
const windElement = document.querySelector(".wind");
const pressureElement = document.querySelector(".pressure");
const visibilityElement = document.querySelector(".visibility");
const forecastContainer = document.getElementById("forecastContainer");
const refreshNewsBtn = document.getElementById("refreshNews");
const loadingOverlay = document.getElementById("loadingOverlay");
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");
const dismissError = document.getElementById("dismissError");
const aqiNumber = document.getElementById("aqiNumber");
const aqiStatus = document.querySelector(".aqi-status");
const aqiDescription = document.querySelector(".aqi-description");
const unitToggleButtons = document.querySelectorAll(".weather-toggle button");
const userCountElement = document.getElementById("userCount");
const viewingCityElement = document.getElementById("viewingCity");
const modeToggle = document.getElementById("modeToggle");
const weatherAlerts = document.getElementById("weatherAlerts");
const savedLocationsContainer = document.getElementById(
  "savedLocationsContainer"
);

// Global variables
let currentCity = "";
let currentUnit = "celsius";
let currentWeatherData = null;
let autocomplete;

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  updateDate();
  setupEventListeners();
  getUserLocation();
  initActiveUsersCounter();
  addSVGGradient();
  loadSavedTheme();
  loadSavedLocations();
  displayMoonPhases(); // Initial moon phase display

  // Handle shared city from URL
  const urlParams = new URLSearchParams(window.location.search);
  const sharedCity = urlParams.get("city");
  if (sharedCity) {
    checkWeather(sharedCity);
  }
});

// Core Functions
function addSVGGradient() {
  const svg = document.querySelector(".aqi-gauge svg");
  if (!svg) return;
  const svgNS = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(svgNS, "defs");
  const gradient = document.createElementNS(svgNS, "linearGradient");
  gradient.setAttribute("id", "gradient");
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("y1", "0%");
  gradient.setAttribute("x2", "100%");
  gradient.setAttribute("y2", "0%");

  const stops = [
    { offset: "0%", color: "#4cc9f0" },
    { offset: "25%", color: "#4361ee" },
    { offset: "50%", color: "#3a0ca3" },
    { offset: "75%", color: "#7209b7" },
    { offset: "100%", color: "#f72585" },
  ];

  stops.forEach((stopData) => {
    const stop = document.createElementNS(svgNS, "stop");
    stop.setAttribute("offset", stopData.offset);
    stop.setAttribute("stop-color", stopData.color);
    gradient.appendChild(stop);
  });

  defs.appendChild(gradient);
  svg.insertBefore(defs, svg.firstChild);
}

async function getAirQuality(lat, lon) {
  try {
    const url = `${airQualityApiUrl}?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;
    console.log("Fetching AQI from:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Air quality API error: ${response.status} - ${response.statusText}`
      );
    }
    const data = await response.json();
    if (
      !data.list ||
      data.list.length === 0 ||
      !data.list[0].main ||
      typeof data.list[0].main.aqi !== "number"
    ) {
      throw new Error("No valid air quality data returned");
    }
    console.log("AQI data:", data);
    updateAirQualityUI(data.list[0]);
  } catch (error) {
    console.error("Air quality fetch error:", error.message);
    updateAirQualityUI(null);
  }
}

function updateAirQualityUI(airData) {
  const isValidAqi =
    airData && airData.main && typeof airData.main.aqi === "number";
  const rawAqi = isValidAqi ? airData.main.aqi : null;
  const displayAqi = rawAqi ? Math.round((rawAqi - 1) * 50) : "N/A"; // Map 1-5 to 0-200

  aqiNumber.textContent = displayAqi;

  if (displayAqi !== "N/A") {
    const aqiInfo = getAQIInfo(rawAqi);
    aqiStatus.textContent = aqiInfo.status;
    aqiStatus.style.color = aqiInfo.color;
    aqiDescription.textContent = aqiInfo.description;

    const gaugeFill = document.querySelector(".gauge-fill");
    if (gaugeFill) {
      const circumference = 2 * Math.PI * 54;
      const maxAqi = 200;
      const offset =
        circumference - (circumference * Math.min(displayAqi, maxAqi)) / maxAqi;
      gaugeFill.style.strokeDasharray = `${circumference}`;
      gaugeFill.style.strokeDashoffset = `${offset}`;
    }
  } else {
    aqiStatus.textContent = "Unavailable";
    aqiStatus.style.color = "#ffffff";
    aqiDescription.textContent = "Unable to retrieve air quality data.";
    const gaugeFill = document.querySelector(".gauge-fill");
    if (gaugeFill) {
      gaugeFill.style.strokeDasharray = `${2 * Math.PI * 54}`;
      gaugeFill.style.strokeDashoffset = `${2 * Math.PI * 54}`;
    }
  }
}

function getAQIInfo(aqi) {
  const aqiData = [
    {
      status: "Good",
      color: "#4cc9f0",
      description: "Air quality is satisfactory...",
    },
    {
      status: "Fair",
      color: "#4361ee",
      description: "Air quality is acceptable...",
    },
    {
      status: "Moderate",
      color: "#3a0ca3",
      description: "Sensitive groups may...",
    },
    {
      status: "Poor",
      color: "#7209b7",
      description: "Health effects possible...",
    },
    {
      status: "Very Poor",
      color: "#f72585",
      description: "Serious health risks...",
    },
  ];
  return aqiData[aqi - 1] || aqiData[0];
}

function initAutocomplete() {
  autocomplete = new google.maps.places.Autocomplete(cityInput, {
    types: ["(cities)"],
    fields: ["geometry", "name"],
  });
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      showError(`No details available for: ${place.name}`);
      return;
    }
    checkWeather(place.name);
  });
}

function setupEventListeners() {
  searchBtn.addEventListener("click", () => {
    if (cityInput.value.trim()) checkWeather(cityInput.value);
  });
  cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && cityInput.value.trim())
      checkWeather(cityInput.value);
  });
  currentLocationBtn.addEventListener("click", getUserLocation);
  dismissError.addEventListener("click", () => {
    errorMessage.style.display = "none";
  });
  unitToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const unit = button.dataset.unit;
      if (unit !== currentUnit) {
        currentUnit = unit;
        updateUnitDisplay();
        unitToggleButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
      }
    });
  });
  document.getElementById("shareWeather").addEventListener("click", () => {
    if (currentCity) openShareModal(currentCity);
  });
  document.getElementById("saveLocation").addEventListener("click", () => {
    if (currentWeatherData) saveLocation(currentWeatherData);
  });
  document.getElementById("closeShareModal").addEventListener("click", () => {
    document.getElementById("shareModal").style.display = "none";
  });
  document.getElementById("copyShareLink").addEventListener("click", () => {
    const shareLink = document.getElementById("shareLink");
    shareLink.select();
    document.execCommand("copy");
    const successMessage = document.getElementById("successMessage");
    const successText = document.getElementById("successText");
    successText.textContent = "Link copied to clipboard!";
    successMessage.style.display = "flex";
    setTimeout(() => (successMessage.style.display = "none"), 3000);
  });
  document.querySelectorAll(".share-option").forEach((option) => {
    option.addEventListener("click", () => {
      const platform = option.dataset.platform;
      const shareUrl = document.getElementById("shareLink").value;
      const shareText = `Check out the weather in ${currentCity}!`;
      let shareLink;
      switch (platform) {
        case "facebook":
          shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`;
          break;
        case "twitter":
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText
          )}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case "whatsapp":
          shareLink = `https://wa.me/?text=${encodeURIComponent(
            shareText + " " + shareUrl
          )}`;
          break;
        case "email":
          shareLink = `mailto:?subject=${encodeURIComponent(
            "Weather Update for " + currentCity
          )}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`;
          break;
      }
      if (shareLink) window.open(shareLink, "_blank");
    });
  });
  document.getElementById("downloadReport").addEventListener("click", () => {
    if (currentWeatherData) generateWeatherReport(currentWeatherData);
  });
  modeToggle.addEventListener("click", toggleMode);
}

function getUserLocation() {
  showLoading();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      checkWeatherByCoords(latitude, longitude);
    },
    (error) => {
      hideLoading();
      showError(
        "Couldn't get your location. Please search for a city instead."
      );
    }
  );
}

async function checkWeather(city) {
  showLoading();
  try {
    const response = await fetch(
      `${weatherApiUrl}&q=${city}&appid=${weatherApiKey}`
    );
    if (!response.ok) throw new Error("City not found.");
    const data = await response.json();
    currentCity = data.name;
    currentWeatherData = data;
    updateWeatherUI(data);
    getForecast(data.coord.lat, data.coord.lon);
    getAirQuality(data.coord.lat, data.coord.lon);
    getNews(data.name); // Assumes news.js
    updateViewingCity(data.name);
    getActivities(data.name); // Assumes activities.js
    getHotels(data.name); // Assumes hotels.js
    checkWeatherAlerts(data);
    cityInput.value = "";
    hideLoading();
  } catch (error) {
    showError(error.message);
    hideLoading();
  }
}

async function checkWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `${weatherApiUrl}&lat=${lat}&lon=${lon}&appid=${weatherApiKey}`
    );
    if (!response.ok)
      throw new Error("Couldn't get weather for your location.");
    const data = await response.json();
    currentCity = data.name;
    currentWeatherData = data;
    updateWeatherUI(data);
    getForecast(lat, lon);
    getAirQuality(lat, lon);
    getNews(data.name); // Assumes news.js
    updateViewingCity(data.name);
    getActivities(data.name); // Assumes activities.js
    getHotels(data.name); // Assumes hotels.js
    checkWeatherAlerts(data);
    cityInput.value = "";
    hideLoading();
  } catch (error) {
    showError(error.message);
    hideLoading();
  }
}

async function getForecast(lat, lon) {
  try {
    const response = await fetch(
      `${forecastApiUrl}&lat=${lat}&lon=${lon}&appid=${weatherApiKey}`
    );
    if (!response.ok) throw new Error("Couldn't get forecast data.");
    const data = await response.json();
    updateForecastUI(data.list);
  } catch (error) {
    console.error("Forecast error:", error);
  }
}

function updateWeatherUI(data) {
  cityElement.textContent = data.name;
  updateTemperatureDisplay(data.main.temp, data.main.feels_like);
  humidityElement.textContent = `${data.main.humidity}%`;
  windElement.textContent = `${Math.round(data.wind.speed)} km/h`;
  pressureElement.textContent = `${data.main.pressure} hPa`;
  visibilityElement.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  const weatherCondition = data.weather[0].main;
  weatherDescription.textContent = data.weather[0].description;
  updateWeatherIcon(weatherCondition);
  updateWeatherTheme(weatherCondition);
  displayMoonPhases(); // Update moon phases when weather updates
}

function updateForecastUI(forecastList) {
  forecastContainer.innerHTML = "";
  const dailyForecasts = forecastList
    .filter((item) => {
      const date = new Date(item.dt * 1000);
      return date.getHours() >= 12 && date.getHours() < 15;
    })
    .slice(0, 5);

  dailyForecasts.forEach((forecast) => {
    const date = new Date(forecast.dt * 1000);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const temp = Math.round(forecast.main.temp);
    const condition = forecast.weather[0].main;
    const description = forecast.weather[0].description;
    const forecastItem = document.createElement("div");
    forecastItem.className = "forecast-item";
    forecastItem.innerHTML = `
      <p class="forecast-day">${day}</p>
      <img src="images/${getWeatherIconFileName(
        condition
      )}" class="forecast-icon" alt="${description}">
      <p class="forecast-temp">${formatTemperature(temp)}</p>
      <p class="forecast-description">${description}</p>
    `;
    forecastContainer.appendChild(forecastItem);
  });
}

// Moon Phase Calculation using SunCalc
function calculateMoonPhase(date) {
  if (typeof SunCalc === "undefined") {
    console.error("SunCalc library not loaded. Please include suncalc.min.js.");
    return { name: "Unknown", key: "unknown" };
  }

  const moonData = SunCalc.getMoonIllumination(date);
  const phaseFraction = moonData.phase;
  console.log(`Date: ${date.toDateString()}, Phase Fraction: ${phaseFraction}`);

  // Refined phase ranges based on SunCalc's 0-1 cycle
  const phases = [
    { name: "New Moon", key: "new-moon", min: 0, max: 0.05 }, // 0–5%
    { name: "Waxing Crescent", key: "waxing-crescent", min: 0.05, max: 0.45 }, // 5–45%
    { name: "First Quarter", key: "first-quarter", min: 0.45, max: 0.55 }, // 45–55%
    { name: "Waxing Gibbous", key: "waxing-gibbous", min: 0.55, max: 0.95 }, // 55–95%
    { name: "Full Moon", key: "full-moon", min: 0.95, max: 1.0 }, // 95–100%
    { name: "Waning Gibbous", key: "waning-gibbous", min: 0.55, max: 0.95 }, // 55–95% (waning)
    { name: "Last Quarter", key: "last-quarter", min: 0.45, max: 0.55 }, // 45–55% (waning)
    { name: "Waning Crescent", key: "waning-crescent", min: 0.05, max: 0.45 }, // 5–45% (waning)
  ];

  // Determine waxing or waning using the angle
  const moonPosition = SunCalc.getMoonPosition(date, 0, 0);
  const isWaxing = moonData.angle > 0;

  // Filter phases based on waxing/waning
  let applicablePhases = phases.filter((phase) => {
    if (phase.name.includes("Waxing")) return isWaxing;
    if (phase.name.includes("Waning")) return !isWaxing;
    return true;
  });

  // Find the matching phase
  for (const phase of applicablePhases) {
    if (phaseFraction >= phase.min && phaseFraction < phase.max) {
      if (phase.name === "First Quarter" && !isWaxing) continue;
      if (phase.name === "Last Quarter" && isWaxing) continue;
      return phase;
    }
  }

  if (phaseFraction >= 0.95) {
    return phases[0]; // New Moon
  }

  return phases[0]; // Fallback
}

function displayMoonPhases() {
  const moonPhaseContainer = document.getElementById("moonPhaseContainer");
  if (!moonPhaseContainer) {
    console.error("Moon phase container not found in DOM");
    return;
  }
  moonPhaseContainer.innerHTML = "";

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const phase = calculateMoonPhase(date);

    const moonItem = document.createElement("div");
    moonItem.className = "moon-phase-item";
    moonItem.innerHTML = `
      <p>${date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}</p>
      <div class="moon-icon" data-phase="${phase.key}"></div>
      <p>${phase.name}</p>
    `;
    moonPhaseContainer.appendChild(moonItem);

    // Set the SVG for this moon phase
    const moonIcon = moonItem.querySelector(".moon-icon");
    if (window.setSVG && window.moonSVGs && window.moonSVGs[phase.key]) {
      window.setSVG([moonIcon], window.moonSVGs[phase.key]);
    } else {
      console.error(`SVG not found for phase: ${phase.key}`);
    }
  }
}

// Shared Helper Functions
function updateDate() {
  const now = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  dateElement.textContent = now.toLocaleDateString("en-US", options);
}

function updateWeatherIcon(condition) {
  weatherIcon.src = `images/${getWeatherIconFileName(condition)}`;
}

function getWeatherIconFileName(condition) {
  const iconMap = {
    Clear: "clear.png",
    Clouds: "clouds.png",
    Rain: "rain.png",
    Drizzle: "drizzle.png",
    Thunderstorm: "thunderstorm.png",
    Snow: "snow.png",
    Mist: "mist.png",
    Fog: "mist.png",
    Haze: "mist.png",
  };
  return iconMap[condition] || "clear.png";
}

function updateWeatherTheme(condition) {
  document.querySelector(".weather-card").className = "weather-card";
  const themeMap = {
    Clear: "theme-clear",
    Clouds: "theme-clouds",
    Rain: "theme-rain",
    Drizzle: "theme-rain",
    Thunderstorm: "theme-thunderstorm",
    Snow: "theme-snow",
    Mist: "theme-mist",
    Fog: "theme-mist",
    Haze: "theme-mist",
  };
  const themeClass = themeMap[condition] || "theme-clear";
  document.querySelector(".weather-card").classList.add(themeClass);
}

function updateTemperatureDisplay(temp, feelsLike) {
  const formattedTemp = formatTemperature(temp);
  const formattedFeelsLike = formatTemperature(feelsLike);
  tempElement.textContent = formattedTemp;
  feelsLikeElement.textContent = formattedFeelsLike;
}

function formatTemperature(temp) {
  const temperature = Math.round(temp);
  return currentUnit === "celsius"
    ? `${temperature}°`
    : `${Math.round((temperature * 9) / 5 + 32)}°`;
}

function updateUnitDisplay() {
  if (currentWeatherData) {
    updateTemperatureDisplay(
      currentWeatherData.main.temp,
      currentWeatherData.main.feels_like
    );
    if (document.querySelectorAll(".forecast-temp").length > 0) {
      getForecast(currentWeatherData.coord.lat, currentWeatherData.coord.lon);
    }
  }
}

function generateWeatherReport(weatherData) {
  const report = `
Weather Report for ${weatherData.name}, ${weatherData.sys.country}
Generated on: ${new Date().toLocaleString()}
Current Conditions:
- Temperature: ${formatTemperature(weatherData.main.temp)}
- Feels Like: ${formatTemperature(weatherData.main.feels_like)}
- Weather: ${weatherData.weather[0].description}
- Humidity: ${weatherData.main.humidity}%
- Wind Speed: ${Math.round(weatherData.wind.speed)} km/h
- Pressure: ${weatherData.main.pressure} hPa
- Visibility: ${(weatherData.visibility / 1000).toFixed(1)} km
Coordinates:
- Latitude: ${weatherData.coord.lat}
- Longitude: ${weatherData.coord.lon}
Sunrise: ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}
Sunset: ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}
Report provided by WeatherNow App
Visit us at: https://neeraj7911.github.io/Weather-updates/
  `;
  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `weather-report-${weatherData.name
    .toLowerCase()
    .replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  const successMessage = document.getElementById("successMessage");
  const successText = document.getElementById("successText");
  successText.textContent = "Weather report downloaded successfully!";
  successMessage.style.display = "flex";
  setTimeout(() => (successMessage.style.display = "none"), 3000);
}

function showLoading() {
  loadingOverlay.style.display = "flex";
}

function hideLoading() {
  loadingOverlay.style.display = "none";
}

function showError(message) {
  errorText.textContent = message;
  errorMessage.style.display = "flex";
  setTimeout(() => (errorMessage.style.display = "none"), 5000);
}

function initActiveUsersCounter() {
  const targetValue = 53;
  let currentValue = 40;
  const updateCounter = () => {
    if (currentValue < targetValue) {
      currentValue += 1;
      userCountElement.textContent = currentValue;
      setTimeout(updateCounter, 100);
    } else {
      userCountElement.textContent = targetValue;
      setInterval(() => {
        const fluctuation = Math.floor(Math.random() * 5) - 2;
        userCountElement.textContent = targetValue + fluctuation;
      }, 5000);
    }
  };
  updateCounter();
}

function updateViewingCity(city) {
  viewingCityElement.textContent = city;
}

function openShareModal(city) {
  const shareModal = document.getElementById("shareModal");
  const shareCity = document.getElementById("shareCity");
  const shareLink = document.getElementById("shareLink");
  shareCity.textContent = city;
  shareLink.value = `https://neeraj7911.github.io/Weather-updates/?city=${encodeURIComponent(
    city
  )}`;
  shareModal.style.display = "flex";
}

function saveLocation(weatherData) {
  let savedLocations = JSON.parse(localStorage.getItem("savedLocations")) || [];
  if (savedLocations.some((loc) => loc.name === weatherData.name)) {
    showError("This location is already saved.");
    return;
  }
  const newLocation = {
    name: weatherData.name,
    temp: Math.round(weatherData.main.temp),
    weather: weatherData.weather[0].main,
    time: new Date().toLocaleString(),
  };
  savedLocations.push(newLocation);
  localStorage.setItem("savedLocations", JSON.stringify(savedLocations));
  renderSavedLocations();
  showError("Location saved successfully!");
}

function loadSavedLocations() {
  const savedLocations =
    JSON.parse(localStorage.getItem("savedLocations")) || [];
  renderSavedLocations(savedLocations);
}

function renderSavedLocations(
  locations = JSON.parse(localStorage.getItem("savedLocations")) || []
) {
  savedLocationsContainer.innerHTML = "";
  if (locations.length === 0) {
    savedLocationsContainer.innerHTML = "<p>No saved locations yet.</p>";
    return;
  }
  locations.forEach((location) => {
    const locationDiv = document.createElement("div");
    locationDiv.className = "saved-location";
    locationDiv.innerHTML = `
      <span>${location.name} (${formatTemperature(location.temp)}) - ${
      location.weather
    }</span>
      <small>${location.time}</small>
      <button class="load-location">Load</button>
      <button class="remove-location">Remove</button>
    `;
    locationDiv
      .querySelector(".load-location")
      .addEventListener("click", () => {
        checkWeather(location.name);
      });
    locationDiv
      .querySelector(".remove-location")
      .addEventListener("click", () => {
        const updatedLocations = locations.filter(
          (loc) => loc.name !== location.name
        );
        localStorage.setItem(
          "savedLocations",
          JSON.stringify(updatedLocations)
        );
        renderSavedLocations(updatedLocations);
      });
    savedLocationsContainer.appendChild(locationDiv);
  });
}

function toggleMode() {
  const body = document.body;
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode");
    body.classList.add("night-mode");
    localStorage.setItem("theme", "night");
  } else if (body.classList.contains("night-mode")) {
    body.classList.remove("night-mode");
    localStorage.setItem("theme", "light");
  } else {
    body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  }
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark-mode");
  else if (savedTheme === "night") document.body.classList.add("night-mode");
}

function checkWeatherAlerts(data) {
  weatherAlerts.innerHTML = "";
  const weatherCondition = data.weather[0].main.toLowerCase();
  let alertMessage = "";
  let alertType = "";
  if (weatherCondition.includes("thunderstorm")) {
    alertMessage =
      "Severe Thunderstorm Warning: Expect heavy rain and lightning.";
    alertType = "warning";
  } else if (weatherCondition.includes("snow") && data.main.temp < 0) {
    alertMessage = "Snow Advisory: Heavy snowfall expected.";
    alertType = "advisory";
  } else if (data.wind.speed > 15) {
    alertMessage = "High Wind Alert: Gusts exceeding 50 km/h possible.";
    alertType = "alert";
  } else if (data.main.temp > 35) {
    alertMessage = "Heat Warning: High temperatures may pose health risks.";
    alertType = "warning";
  }
  if (alertMessage) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `weather-alert ${alertType}`;
    alertDiv.innerHTML = `
      <span class="icon alert-icon"><svg>...</svg></span>
      <p>${alertMessage}</p>
      <button class="dismiss-alert">Dismiss</button>
    `;
    weatherAlerts.appendChild(alertDiv);
    alertDiv
      .querySelector(".dismiss-alert")
      .addEventListener("click", () => alertDiv.remove());
  }
}

var google;
