const geoapifyApiKey = "fc54a5144b00401088bcde5b7fd2b9eb"; // Replace with your Geoapify API key
const geoapifyApiUrl = "https://api.geoapify.com/v2/places";

async function getActivities(city) {
  try {
    const activitiesContainer = document.getElementById("activitiesContainer");
    if (!activitiesContainer)
      throw new Error("Activities container not found in DOM");

    // Show loading state
    activitiesContainer.innerHTML = `
      <div class="loading-activities">
        <div class="scanner"><div class="scanner-beam"></div></div>
        <p>Loading activities...</p>
      </div>
    `;

    // Fetch places (activities) for the city
    const url = `${geoapifyApiUrl}?categories=tourism.attraction,entertainment&filter=place:${await getCityPlaceId(
      city
    )}&limit=4&apiKey=${geoapifyApiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Geoapify API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      throw new Error("No activities found for this location.");
    }

    // Format the data to match your UI structure
    const activities = data.features.map((feature, index) => {
      const category = feature.properties.category || "activity";
      const lat = feature.geometry.coordinates[1]; // Latitude
      const lon = feature.geometry.coordinates[0]; // Longitude

      return {
        id: `activity${index + 1}`,
        name: feature.properties.name || "Unnamed Activity",
        type: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize category
        description: feature.properties.address_line2
          ? `Located at ${feature.properties.address_line2}.`
          : `Explore this point of interest in ${city}.`,
        image: "https://source.unsplash.com/600x400/?tourism", // Simplified, reliable Unsplash URL
        url: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}&query_place_id=${
          feature.properties.place_id || ""
        }`, // Google Maps link
      };
    });

    updateActivitiesUI(activities);
  } catch (error) {
    console.error("Activities error:", error.message);
    const activitiesContainer = document.getElementById("activitiesContainer");
    if (activitiesContainer) {
      activitiesContainer.innerHTML = `
        <div class="loading-activities">Could not load activities: ${error.message}</div>
      `;
    }
  }
}

// Helper function to get the OpenStreetMap 'place' ID for a city
async function getCityPlaceId(city) {
  const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
    city
  )}&type=city&limit=1&apiKey=${geoapifyApiKey}`;
  const response = await fetch(geocodeUrl);
  if (!response.ok) throw new Error("Could not geocode city name.");
  const data = await response.json();
  if (!data.features || data.features.length === 0)
    throw new Error("City not found.");
  return data.features[0].properties.place_id; // Returns OSM place ID
}

function updateActivitiesUI(activities) {
  const activitiesContainer = document.getElementById("activitiesContainer");
  if (!activitiesContainer) return;

  activitiesContainer.innerHTML = "";
  if (activities.length === 0) {
    activitiesContainer.innerHTML = `
      <div class="loading-activities">No activities found for this location.</div>
    `;
    return;
  }

  activities.forEach((activity) => {
    const activityItem = document.createElement("div");
    activityItem.className = "activity-item";
    activityItem.innerHTML = `
      <img src="${activity.image}" class="activity-image" alt="${activity.name}" 
           onerror="console.log('Image failed: ${activity.image}'); this.src='/images/activity-placeholder.jpg';">
      <div class="activity-content">
        <h4 class="activity-name">${activity.name}</h4>
        <span class="activity-type">${activity.type}</span>
        <p class="activity-description">${activity.description}</p>
        <a href="${activity.url}" target="_blank" class="activity-link">Learn more</a>
      </div>
    `;
    activitiesContainer.appendChild(activityItem);
  });
}
