// API Keys
const weatherApiKey = "9afd12a6a2414ab9d129d33d2f3726be";
const weatherApiUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric";
const forecastApiUrl =
  "https://api.openweathermap.org/data/2.5/forecast?units=metric";
const newsApiKey = "3adad365183e4b349fe63415313b1f9f"; // Replace with your News API key
const newsApiUrl =
  "https://newsapi.org/v2/everything?sortBy=publishedAt&pageSize=6";
const airQualityApiUrl = "http://api.openweathermap.org/data/2.5/air_pollution";

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
const newsContainer = document.getElementById("newsContainer");
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
});

// Add SVG gradient for AQI gauge
// Add SVG gradient for AQI gauge
function addSVGGradient() {
  const svg = document.querySelector(".aqi-gauge svg");
  if (!svg) {
    console.error("AQI Gauge SVG not found in DOM.");
    return;
  }
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

// Get air quality data
async function getAirQuality(lat, lon) {
  try {
    const url = `${airQualityApiUrl}?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;
    console.log("Fetching air quality from:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Air quality API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Air Quality API Response:", data);

    if (!data.list || data.list.length === 0) {
      throw new Error("No air quality data returned in 'list' array.");
    }

    const airData = data.list[0];
    if (!airData.main || typeof airData.main.aqi === "undefined") {
      throw new Error("AQI value missing in response.");
    }

    updateAirQualityUI(airData);
  } catch (error) {
    console.error("Air quality fetch error:", error.message);
    updateAirQualityUI({ main: { aqi: "N/A" } }); // Fallback UI update
  }
}

// Update air quality UI
function updateAirQualityUI(airData) {
  console.log("Updating AQI UI with data:", airData);

  const aqiElement = document.getElementById("aqiNumber");
  if (!aqiElement) {
    console.error("AQI Number element not found in DOM.");
    return;
  }

  const aqi = airData.main.aqi === "N/A" ? "N/A" : airData.main.aqi;
  console.log("Setting AQI value to:", aqi);

  aqiElement.textContent = aqi;

  // Update status and description
  if (aqi !== "N/A") {
    const aqiInfo = getAQIInfo(aqi);
    aqiStatus.textContent = aqiInfo.status;
    aqiStatus.style.color = aqiInfo.color;
    aqiDescription.textContent = aqiInfo.description;

    // Update gauge fill
    const gaugeFill = document.querySelector(".gauge-fill");
    if (gaugeFill) {
      const circumference = 2 * Math.PI * 54; // Approx 339.292
      const offset = circumference - (circumference * aqi) / 5;
      gaugeFill.style.strokeDasharray = `${circumference}`;
      gaugeFill.style.strokeDashoffset = `${offset}`;
      console.log("Gauge updated:", { circumference, offset });
    } else {
      console.warn("Gauge fill element not found.");
    }
  } else {
    aqiStatus.textContent = "Unavailable";
    aqiStatus.style.color = "#ffffff";
    aqiDescription.textContent = "Unable to retrieve air quality data.";
    const gaugeFill = document.querySelector(".gauge-fill");
    if (gaugeFill) {
      gaugeFill.style.strokeDashoffset = "339.292"; // Reset to empty
    }
  }
}

// Initialize Google Places Autocomplete
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

// Setup Event Listeners
function setupEventListeners() {
  searchBtn.addEventListener("click", () => {
    if (cityInput.value.trim()) checkWeather(cityInput.value);
  });

  cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && cityInput.value.trim())
      checkWeather(cityInput.value);
  });

  currentLocationBtn.addEventListener("click", getUserLocation);

  refreshNewsBtn.addEventListener("click", () => {
    if (currentCity) getNews(currentCity);
  });

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

// Get user's current location
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
      console.error(error);
    }
  );
}

// Check weather by city name
async function checkWeather(city) {
  showLoading();
  try {
    const response = await fetch(
      `${weatherApiUrl}&q=${city}&appid=${weatherApiKey}`
    );
    if (!response.ok)
      throw new Error(
        "City not found. Please check the spelling and try again."
      );
    const data = await response.json();
    currentCity = data.name;
    currentWeatherData = data;

    updateWeatherUI(data);
    getForecast(data.coord.lat, data.coord.lon);
    getAirQuality(data.coord.lat, data.coord.lon);
    getNews(data.name);
    updateViewingCity(data.name);
    getActivities(data.name);
    getHotels(data.name);
    checkWeatherAlerts(data);

    cityInput.value = "";
    hideLoading();
  } catch (error) {
    showError(error.message);
    hideLoading();
  }
}

// Check weather by coordinates
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
    getNews(data.name);
    updateViewingCity(data.name);
    getActivities(data.name);
    getHotels(data.name);
    checkWeatherAlerts(data);

    cityInput.value = "";
    hideLoading();
  } catch (error) {
    showError(error.message);
    hideLoading();
  }
}

// Get 5-day forecast
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

// Get air quality data
async function getAirQuality(lat, lon) {
  try {
    const url = `${airQualityApiUrl}?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;
    console.log("Fetching air quality from:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Air quality API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Air Quality API Response:", data);

    if (!data.list || data.list.length === 0) {
      throw new Error("No air quality data returned in 'list' array.");
    }

    const airData = data.list[0];
    if (!airData.main || typeof airData.main.aqi === "undefined") {
      throw new Error("AQI value missing in response.");
    }

    console.log("AQI value to update:", airData.main.aqi);
    updateAirQualityUI(airData);
  } catch (error) {
    console.error("Air quality fetch error:", error.message);
    updateAirQualityUI({ main: { aqi: null } }); // Null indicates failure
  }
}

// Update air quality UI
function updateAirQualityUI(airData) {
  console.log("Updating AQI UI with data:", airData);

  const aqiElement = document.getElementById("aqiNumber");
  const gaugeFill = document.querySelector(".gauge-fill");
  if (!aqiElement || !gaugeFill) {
    console.error("AQI UI elements missing:", {
      aqiElement: !!aqiElement,
      gaugeFill: !!gaugeFill,
    });
    return;
  }

  const aqi = airData.main.aqi;
  if (aqi && typeof aqi === "number" && aqi >= 1 && aqi <= 5) {
    // Valid AQI value
    aqiElement.textContent = aqi;
    console.log("AQI number set to:", aqi);

    const aqiInfo = getAQIInfo(aqi);
    aqiStatus.textContent = aqiInfo.status;
    aqiStatus.style.color = aqiInfo.color;
    aqiDescription.textContent = aqiInfo.description;

    const circumference = 2 * Math.PI * 54; // 339.292
    const offset = circumference - (circumference * aqi) / 5;
    gaugeFill.style.strokeDasharray = `${circumference}`;
    gaugeFill.style.strokeDashoffset = `${offset}`;
    console.log("Gauge updated:", { aqi, circumference, offset });
  } else {
    // Invalid or no data
    aqiElement.textContent = "N/A";
    aqiStatus.textContent = "Unavailable";
    aqiStatus.style.color = "#ffffff";
    aqiDescription.textContent = "Unable to retrieve air quality data.";
    gaugeFill.style.strokeDashoffset = `${2 * Math.PI * 54}`; // Reset to empty
    console.log("AQI set to N/A due to invalid data.");
  }
}

// AQI Info Mapping (unchanged, included for completeness)
function getAQIInfo(aqi) {
  const aqiData = [
    {
      status: "Good",
      color: "#4cc9f0",
      description:
        "Air quality is satisfactory, with little or no risk from pollution.",
    },
    {
      status: "Fair",
      color: "#4361ee",
      description:
        "Air quality is acceptable; minor concerns for sensitive individuals.",
    },
    {
      status: "Moderate",
      color: "#3a0ca3",
      description:
        "Sensitive groups may experience health effects; general public unaffected.",
    },
    {
      status: "Poor",
      color: "#7209b7",
      description:
        "Health effects possible for all; more serious for sensitive groups.",
    },
    {
      status: "Very Poor",
      color: "#f72585",
      description: "Serious health risks; emergency conditions may apply.",
    },
  ];
  return aqiData[aqi - 1] || aqiData[0];
}

// Get local news
async function getNews(city) {
  try {
    newsContainer.innerHTML = `<div class="loading-news"><div class="scanner"><div class="scanner-beam"></div></div><p>Loading local news...</p></div>`;
    setTimeout(() => {
      const mockNews = getMockNews(city);
      updateNewsUI(mockNews);
    }, 1000);
  } catch (error) {
    console.error("News error:", error);
    newsContainer.innerHTML =
      '<div class="loading-news">Could not load news. Please try again later.</div>';
  }
}

// Get hotels
function getHotels(city) {
  const hotelContainer = document.getElementById("hotelContainer");
  hotelContainer.innerHTML = `<div class="loading-hotels"><div class="scanner"><div class="scanner-beam"></div></div><p>Finding best hotels in ${city}...</p></div>`;
  setTimeout(() => {
    const mockHotels = getMockHotels(city);
    updateHotelsUI(mockHotels);
  }, 1500);
}

// Get activities
function getActivities(city) {
  const activitiesContainer = document.getElementById("activitiesContainer");
  setTimeout(() => {
    const mockActivities = getMockActivities(city);
    updateActivitiesUI(mockActivities);
  }, 1200);
}

// Update the weather UI
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
}

// Update forecast UI
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

// Update news UI
function updateNewsUI(articles) {
  newsContainer.innerHTML = "";
  if (articles.length === 0) {
    newsContainer.innerHTML =
      '<div class="loading-news">No news found for this location.</div>';
    return;
  }

  articles.forEach((article) => {
    const newsItem = document.createElement("div");
    newsItem.className = "news-item";
    const imageUrl = article.urlToImage || "images/news-placeholder.jpg";
    newsItem.innerHTML = `
      <img src="${imageUrl}" class="news-image" alt="${article.title}">
      <div class="news-content">
        <h4 class="news-title">${article.title}</h4>
        <p class="news-source">${article.source.name} · ${formatNewsDate(
      article.publishedAt
    )}</p>
        <p class="news-description">${
          article.description || "No description available."
        }</p>
        <a href="${article.url}" target="_blank" class="news-link">Read more</a>
      </div>
    `;
    newsContainer.appendChild(newsItem);
  });
}

// Update hotels UI
function updateHotelsUI(hotels) {
  const hotelContainer = document.getElementById("hotelContainer");
  hotelContainer.innerHTML = "";
  hotels.forEach((hotel) => {
    const hotelItem = document.createElement("div");
    hotelItem.className = "hotel-item";
    hotelItem.innerHTML = `
      <img src="${hotel.image}" class="hotel-image" alt="${hotel.name}">
      ${hotel.badge ? `<div class="hotel-badge">${hotel.badge}</div>` : ""}
      <div class="hotel-content">
        <h4 class="hotel-name">${hotel.name}</h4>
        <div class="hotel-location">
          <span class="icon" id="hotel-location-${hotel.id}"></span>
          <span>${hotel.location}</span>
        </div>
        <div class="hotel-rating">
          <div class="stars">${getStarsHTML(hotel.rating)}</div>
          <span class="rating-count">(${hotel.reviewCount} reviews)</span>
        </div>
        <div class="hotel-features">
          ${hotel.features
            .map(
              (feature) =>
                `<div class="hotel-feature"><span class="icon" id="hotel-feature-${hotel.id}-${feature.id}"></span>${feature.name}</div>`
            )
            .join("")}
        </div>
        <div class="hotel-price">
          <div><span class="price-value">${
            hotel.price
          }</span><span class="price-period">/ night</span></div>
          <button class="book-now">Book Now</button>
        </div>
      </div>
    `;
    hotelContainer.appendChild(hotelItem);

    document.getElementById(`hotel-location-${hotel.id}`).innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `;

    hotel.features.forEach((feature) => {
      const iconId = `hotel-feature-${hotel.id}-${feature.id}`;
      let iconSvg = "";
      switch (feature.id) {
        case "wifi":
          iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>`;
          break;
        case "pool":
          iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M5 12v4a3 3 0 0 0 6 0v-4"/><path d="M19 12v4a3 3 0 0 1-6 0v-4"/><path d="m3 4 2 2"/><path d="m19 4 2 2"/><path d="m15 5 2-2"/><path d="m7 5 2-2"/></svg>`;
          break;
        case "breakfast":
          iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`;
          break;
        case "parking":
          iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v16"/><path d="M13 4v16"/><path d="M18 4v16"/></svg>`;
          break;
      }
      document.getElementById(iconId).innerHTML = iconSvg;
    });
  });
}

// Generate stars HTML
function getStarsHTML(rating) {
  let starsHTML = "";
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHTML += `<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>`;
    } else if (i === fullStars && halfStar) {
      starsHTML += `<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2L8.91 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77V2z"/><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>`;
    } else {
      starsHTML += `<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>`;
    }
  }
  return starsHTML;
}

// Update activities UI
function updateActivitiesUI(activities) {
  const activitiesContainer = document.getElementById("activitiesContainer");
  activitiesContainer.innerHTML = "";
  activities.forEach((activity) => {
    const activityItem = document.createElement("div");
    activityItem.className = "activity-item";
    activityItem.innerHTML = `
      <img src="${activity.image}" class="activity-image" alt="${activity.name}">
      <div class="activity-content">
        <h4 class="activity-name">${activity.name}</h4>
        <span class="activity-type">${activity.type}</span>
        <p class="activity-description">${activity.description}</p>
        <a href="${activity.url}" class="activity-link">Learn more</a>
      </div>
    `;
    activitiesContainer.appendChild(activityItem);
  });
}

// Helper Functions
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

function getAQIInfo(aqi) {
  const aqiData = [
    {
      status: "Good",
      color: "#4cc9f0",
      description:
        "Air quality is satisfactory, with little or no risk from pollution.",
    },
    {
      status: "Fair",
      color: "#4361ee",
      description:
        "Air quality is acceptable; minor concerns for sensitive individuals.",
    },
    {
      status: "Moderate",
      color: "#3a0ca3",
      description:
        "Sensitive groups may experience health effects; general public unaffected.",
    },
    {
      status: "Poor",
      color: "#7209b7",
      description:
        "Health effects possible for all; more serious for sensitive groups.",
    },
    {
      status: "Very Poor",
      color: "#f72585",
      description: "Serious health risks; emergency conditions may apply.",
    },
  ];
  return aqiData[aqi - 1] || aqiData[0];
}

function formatNewsDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Generate weather report
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
Visit us at: https://neeraj7911.github.io
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

// Mock news data
function getMockNews(city) {
  return [
    {
      title: `Local Festival Brings Community Together in ${city}`,
      description: `The annual cultural festival in ${city} attracted thousands of visitors this weekend, showcasing local art, music, and cuisine.`,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      urlToImage: "https://source.unsplash.com/random/300x200/?festival",
      source: { name: `${city} Times` },
      url: "#",
    },
    {
      title: `${city} Implements New Green Initiative`,
      description: `Local government announces ambitious plan to reduce carbon emissions by 30% over the next five years through sustainable energy projects.`,
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      urlToImage: "https://source.unsplash.com/random/300x200/?green",
      source: { name: "Environmental Daily" },
      url: "#",
    },
    {
      title: `Tech Conference Comes to ${city} Next Month`,
      description: `Leading technology companies will gather for the annual tech summit, bringing innovation and job opportunities to the region.`,
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      urlToImage: "https://source.unsplash.com/random/300x200/?technology",
      source: { name: "Tech Insider" },
      url: "#",
    },
    {
      title: `${city}'s Real Estate Market Shows Strong Growth`,
      description: `Housing prices in ${city} have increased by 15% in the last quarter, indicating a robust economic recovery in the region.`,
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      urlToImage: "https://source.unsplash.com/random/300x200/?realestate",
      source: { name: "Business Weekly" },
      url: "#",
    },
    {
      title: `New Restaurant Opens in Downtown ${city}`,
      description: `Award-winning chef opens fusion cuisine restaurant in the heart of ${city}, adding to the city's growing culinary scene.`,
      publishedAt: new Date(Date.now() - 432000000).toISOString(),
      urlToImage: "https://source.unsplash.com/random/300x200/?restaurant",
      source: { name: "Food & Dining" },
      url: "#",
    },
    {
      title: `${city} Public Transport System Gets Major Upgrade`,
      description: `City officials announce $50 million investment in public transportation infrastructure to improve connectivity and reduce traffic congestion.`,
      publishedAt: new Date(Date.now() - 518400000).toISOString(),
      urlToImage: "https://source.unsplash.com/random/300x200/?transport",
      source: { name: `${city} Daily News` },
      url: "#",
    },
  ];
}

// Mock hotels data
function getMockHotels(city) {
  return [
    {
      id: "hotel1",
      name: `${city} Grand Hotel`,
      location: `Downtown ${city}`,
      rating: 4.7,
      reviewCount: 1243,
      price: "$189",
      image: "https://source.unsplash.com/random/600x400/?hotel",
      badge: "Best Seller",
      features: [
        { id: "wifi", name: "Free WiFi" },
        { id: "pool", name: "Pool" },
        { id: "breakfast", name: "Breakfast" },
        { id: "parking", name: "Parking" },
      ],
    },
    {
      id: "hotel2",
      name: `${city} Plaza Resort`,
      location: `${city} Beach`,
      rating: 4.5,
      reviewCount: 876,
      price: "$249",
      image: "https://source.unsplash.com/random/600x400/?resort",
      badge: null,
      features: [
        { id: "wifi", name: "Free WiFi" },
        { id: "pool", name: "Pool" },
        { id: "breakfast", name: "Breakfast" },
      ],
    },
    {
      id: "hotel3",
      name: `Boutique Hotel ${city}`,
      location: `Historic District, ${city}`,
      rating: 4.8,
      reviewCount: 532,
      price: "$179",
      image: "https://source.unsplash.com/random/600x400/?boutique-hotel",
      badge: "Top Rated",
      features: [
        { id: "wifi", name: "Free WiFi" },
        { id: "breakfast", name: "Breakfast" },
      ],
    },
    {
      id: "hotel4",
      name: `${city} Budget Inn`,
      location: `${city} Airport Area`,
      rating: 3.9,
      reviewCount: 1021,
      price: "$89",
      image: "https://source.unsplash.com/random/600x400/?motel",
      badge: "Best Value",
      features: [
        { id: "wifi", name: "Free WiFi" },
        { id: "parking", name: "Parking" },
      ],
    },
  ];
}

// Mock activities data
function getMockActivities(city) {
  return [
    {
      id: "activity1",
      name: `${city} Museum Tour`,
      type: "Cultural",
      description: `Explore the rich history and art of ${city} with a guided tour through the city's most famous museums.`,
      image: "https://source.unsplash.com/random/600x400/?museum",
      url: "#",
    },
    {
      id: "activity2",
      name: `${city} Food Tasting`,
      type: "Culinary",
      description: `Sample the local cuisine with a guided food tour through the best restaurants and street food vendors in ${city}.`,
      image: "https://source.unsplash.com/random/600x400/?food",
      url: "#",
    },
    {
      id: "activity3",
      name: `${city} Outdoor Adventure`,
      type: "Adventure",
      description: `Experience the natural beauty surrounding ${city} with hiking, kayaking, and other outdoor activities.`,
      image: "https://source.unsplash.com/random/600x400/?hiking",
      url: "#",
    },
    {
      id: "activity4",
      name: `${city} Nightlife Tour`,
      type: "Entertainment",
      description: `Discover the vibrant nightlife of ${city} with a guided tour of the best bars, clubs, and entertainment venues.`,
      image: "https://source.unsplash.com/random/600x400/?nightlife",
      url: "#",
    },
  ];
}

// UI Helper Functions
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

// Initialize active users counter
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

// Update viewing city
function updateViewingCity(city) {
  viewingCityElement.textContent = city;
}

// Open share modal
function openShareModal(city) {
  const shareModal = document.getElementById("shareModal");
  const shareCity = document.getElementById("shareCity");
  const shareLink = document.getElementById("shareLink");
  shareCity.textContent = city;
  shareLink.value = `https://neeraj7911.github.io/share?city=${encodeURIComponent(
    city
  )}`;
  shareModal.style.display = "flex";
}

// Save location
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

  const noSavedLocations = document.querySelector(".no-saved-locations");
  if (noSavedLocations) noSavedLocations.remove();

  const locationItem = document.createElement("div");
  locationItem.className = "saved-location-item";
  locationItem.setAttribute("data-city", weatherData.name);
  locationItem.innerHTML = `
    <div class="saved-location-name">${weatherData.name}</div>
    <div class="saved-location-temp">
      <img src="images/${getWeatherIconFileName(
        weatherData.weather[0].main
      )}" alt="${weatherData.weather[0].description}">
      ${formatTemperature(weatherData.main.temp)}
    </div>
    <div class="saved-location-time">Saved: ${new Date().toLocaleString()}</div>
    <button class="remove-location">
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
    </button>
  `;

  locationItem.addEventListener("click", (e) => {
    if (!e.target.closest(".remove-location")) checkWeather(weatherData.name);
  });

  const removeBtn = locationItem.querySelector(".remove-location");
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    savedLocations = savedLocations.filter(
      (loc) => loc.name !== weatherData.name
    );
    localStorage.setItem("savedLocations", JSON.stringify(savedLocations));
    locationItem.remove();
    if (savedLocationsContainer.children.length === 0) {
      savedLocationsContainer.innerHTML =
        '<p class="no-saved-locations">You haven\'t saved any locations yet.</p>';
    }
  });

  savedLocationsContainer.appendChild(locationItem);

  const successMessage = document.getElementById("successMessage");
  const successText = document.getElementById("successText");
  successText.textContent = `${weatherData.name} has been added to your saved locations.`;
  successMessage.style.display = "flex";
  setTimeout(() => (successMessage.style.display = "none"), 3000);
}

// Load saved locations
function loadSavedLocations() {
  const savedLocations =
    JSON.parse(localStorage.getItem("savedLocations")) || [];
  savedLocationsContainer.innerHTML = "";
  if (savedLocations.length === 0) {
    savedLocationsContainer.innerHTML =
      '<p class="no-saved-locations">You haven\'t saved any locations yet.</p>';
    return;
  }

  savedLocations.forEach((location) => {
    const locationItem = document.createElement("div");
    locationItem.className = "saved-location-item";
    locationItem.setAttribute("data-city", location.name);
    locationItem.innerHTML = `
      <div class="saved-location-name">${location.name}</div>
      <div class="saved-location-temp">
        <img src="images/${getWeatherIconFileName(location.weather)}" alt="${
      location.weather
    }">
        ${formatTemperature(location.temp)}
      </div>
      <div class="saved-location-time">Saved: ${location.time}</div>
      <button class="remove-location">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
      </button>
    `;

    locationItem.addEventListener("click", (e) => {
      if (!e.target.closest(".remove-location")) checkWeather(location.name);
    });

    const removeBtn = locationItem.querySelector(".remove-location");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const updatedLocations = savedLocations.filter(
        (loc) => loc.name !== location.name
      );
      localStorage.setItem("savedLocations", JSON.stringify(updatedLocations));
      locationItem.remove();
      if (savedLocationsContainer.children.length === 0) {
        savedLocationsContainer.innerHTML =
          '<p class="no-saved-locations">You haven\'t saved any locations yet.</p>';
      }
    });

    savedLocationsContainer.appendChild(locationItem);
  });
}

// Toggle Mode
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

// Load saved theme
function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark-mode");
  else if (savedTheme === "night") document.body.classList.add("night-mode");
}

// Check for weather alerts
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
    alertMessage =
      "Snow Advisory: Heavy snowfall expected. Travel caution advised.";
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
      <span class="icon alert-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </span>
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
