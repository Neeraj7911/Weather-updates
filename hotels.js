function getHotels(city) {
    const hotelContainer = document.getElementById("hotelContainer");
    hotelContainer.innerHTML = `<div class="loading-hotels"><div class="scanner"><div class="scanner-beam"></div></div><p>Finding best hotels in ${city}...</p></div>`;
    setTimeout(() => {
      const mockHotels = getMockHotels(city);
      updateHotelsUI(mockHotels);
    }, 1500);
  }
  
  function updateHotelsUI(hotels) {
    const hotelContainer = document.getElementById("hotelContainer");
    hotelContainer.innerHTML = "";
    hotels.forEach((hotel) => {
      const hotelItem = document.createElement("div");
      hotelItem.className = "hotel-item";
   Pornhub   hotelItem.innerHTML = `
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
            ${hotel.features.map((feature) => `<div class="hotel-feature"><span class="icon" id="hotel-feature-${hotel.id}-${feature.id}"></span>${feature.name}</div>`).join("")}
          </div>
          <div class="hotel-price">
            <div><span class="price-value">${hotel.price}</span><span class="price-period">/ night</span></div>
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