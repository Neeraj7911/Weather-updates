const GEOAPIFY_API_KEY = "fc54a5144b00401088bcde5b7fd2b9eb";
const PEXELS_API_KEY =
  "d4G3jdOaLNjowMn2zZA9saCVFPFGKqIGbzpqiRjnGNxg9mBXxLh45k9Z";

async function getHotels(city) {
  const hotelContainer = document.getElementById("hotelContainer");
  hotelContainer.innerHTML = `<div class="loading-hotels"><div class="scanner"><div class="scanner-beam"></div></div><p>Finding best hotels in ${city}...</p></div>`;

  try {
    const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      city
    )}&apiKey=${GEOAPIFY_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) throw new Error("Geocoding failed");
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.features || geocodeData.features.length === 0) {
      throw new Error("City not found");
    }

    const { lon, lat } = geocodeData.features[0].properties;

    const hotelsUrl = `https://api.geoapify.com/v2/places?categories=accommodation.hotel&filter=circle:${lon},${lat},5000&limit=4&apiKey=${GEOAPIFY_API_KEY}`;
    const hotelsResponse = await fetch(hotelsUrl);
    if (!hotelsResponse.ok) throw new Error("Failed to fetch hotels");
    const hotelsData = await hotelsResponse.json();

    const hotels = await Promise.all(
      hotelsData.features.map(async (feature) => {
        const hotelName = feature.properties.name || "Unnamed Hotel";
        const query = `${hotelName} ${city}`;
        const imageUrl = await getHotelImage(query, city);

        return {
          id:
            feature.properties.place_id ||
            `hotel-${Math.random().toString(36).substr(2, 9)}`,
          name: hotelName,
          location: feature.properties.address_line2 || `${city}`,
          city: city, // Store city for the redirect
          rating: feature.properties.rating || 4.0,
          reviewCount: feature.properties.review_count || 100,
          price: feature.properties.price || "$100",
          image: imageUrl,
          badge: feature.properties.badge || null,
          features: [
            { id: "wifi", name: "Free WiFi" },
            { id: "parking", name: "Parking" },
          ],
        };
      })
    );

    updateHotelsUI(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    hotelContainer.innerHTML = "<p>Unable to load hotels at this time.</p>";
  }
}

async function getHotelImage(query, city) {
  try {
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query
    )}&per_page=1`;
    const response = await fetch(pexelsUrl, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });
    if (!response.ok) throw new Error("Pexels API request failed");
    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium;
    } else {
      const fallbackUrl = `https://api.pexels.com/v1/search?query=hotels%20in%20${encodeURIComponent(
        city
      )}&per_page=1`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });
      const fallbackData = await fallbackResponse.json();
      return fallbackData.photos && fallbackData.photos.length > 0
        ? fallbackData.photos[0].src.medium
        : "https://via.placeholder.com/600x400?text=No+Image+Available";
    }
  } catch (error) {
    console.error("Error fetching image from Pexels:", error);
    return "https://via.placeholder.com/600x400?text=No+Image+Available";
  }
}

function updateHotelsUI(hotels) {
  const hotelContainer = document.getElementById("hotelContainer");
  hotelContainer.innerHTML = "";

  if (hotels.length === 0) {
    hotelContainer.innerHTML = "<p>No hotels found for this location.</p>";
    return;
  }

  hotels.forEach((hotel) => {
    const hotelItem = document.createElement("div");
    hotelItem.className = "hotel-item";

    const locationSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `;

    const featureIcons = {
      wifi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>`,
      pool: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M5 12v4a3 3 0 0 0 6 0v-4"/><path d="M19 12v4a3 3 0 0 1-6 0v-4"/><path d="m3 4 2 2"/><path d="m19 4 2 2"/><path d="m15 5 2-2"/><path d="m7 5 2-2"/></svg>`,
      breakfast: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
      parking: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 4v16"/><path d="M13 4v16"/><path d="M18 4v16"/></svg>`,
    };

    hotelItem.innerHTML = `
      <img src="${hotel.image}" class="hotel-image" alt="${
      hotel.name
    }" onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'">
      ${hotel.badge ? `<div class="hotel-badge">${hotel.badge}</div>` : ""}
      <div class="hotel-content">
        <h4 class="hotel-name">${hotel.name}</h4>
        <div class="hotel-location">
          <span class="icon">${locationSvg}</span>
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
                `<div class="hotel-feature"><span class="icon">${
                  featureIcons[feature.id]
                }</span>${feature.name}</div>`
            )
            .join("")}
        </div>
        <div class="hotel-price">
          <div><span class="price-value">${
            hotel.price
          }</span><span class="price-period">/ night</span></div>
          <button class="book-now" data-name="${encodeURIComponent(
            hotel.name
          )}" data-city="${encodeURIComponent(hotel.city)}">Book Now</button>
        </div>
      </div>
    `;

    hotelContainer.appendChild(hotelItem);
  });

  // Add event listeners to all "Book Now" buttons
  document.querySelectorAll(".book-now").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-name");
      const city = button.getAttribute("data-city");
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${name}+${city}`;
      window.open(googleMapsUrl, "_blank");
    });
  });
}

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
