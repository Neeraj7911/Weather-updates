const newsApiKey = "pub_761374e96416f6e9c47afebf7ca4220041db8"; // Your NewsData.io API key
const newsApiUrl = "https://newsdata.io/api/1/news"; // News endpoint

async function getNews(city) {
  try {
    const newsContainer = document.getElementById("newsContainer");
    if (!newsContainer) throw new Error("News container not found in DOM");

    // Validate city input
    if (!city || typeof city !== "string" || city.trim().length < 3) {
      throw new Error(
        "Please provide a valid city name (minimum 3 characters)."
      );
    }
    const trimmedCity = city.trim();

    // Show loading state
    newsContainer.innerHTML = `
      <div class="loading-news">
        <div class="scanner"><div class="scanner-beam"></div></div>
        <p>Loading local news for ${trimmedCity}...</p>
      </div>
    `;

    // Base URL with only required parameters
    const url = `${newsApiUrl}?apikey=${newsApiKey}&q=${encodeURIComponent(
      trimmedCity
    )}`;
    console.log("Request URL:", url); // Log for debugging

    const response = await fetch(url);
    console.log("Response status:", response.status, "OK:", response.ok); // Log status

    if (!response.ok) {
      let errorDetail = "Unknown error";
      try {
        const errorData = await response.json();
        errorDetail =
          errorData.message ||
          JSON.stringify(errorData) ||
          "No detailed message";
      } catch (jsonError) {
        errorDetail =
          (await response.text()) || "Failed to parse error response";
      }
      throw new Error(
        `News API error: ${response.status} - ${response.statusText} (${errorDetail})`
      );
    }

    const data = await response.json();
    console.log("API response:", data); // Log full response

    if (
      data.status !== "success" ||
      !data.results ||
      data.results.length === 0
    ) {
      throw new Error("No news articles found for this location.");
    }

    // Map response to UI structure
    const articles = data.results.map((article) => ({
      title: article.title,
      source: { name: article.source_id || "Unknown Source" },
      publishedAt: article.pubDate,
      description:
        article.description ||
        article.content?.slice(0, 150) + "..." ||
        "No description available.",
      url: article.link,
      urlToImage: article.image_url || "images/news-placeholder.jpg",
    }));

    updateNewsUI(articles);
  } catch (error) {
    console.error("News error:", error.message);
    const newsContainer = document.getElementById("newsContainer");
    if (newsContainer) {
      newsContainer.innerHTML = `
        <div class="loading-news">Could not load news: ${error.message}</div>
      `;
    }
  }
}

function updateNewsUI(articles) {
  const newsContainer = document.getElementById("newsContainer");
  if (!newsContainer) return;

  newsContainer.innerHTML = "";
  if (articles.length === 0) {
    newsContainer.innerHTML = `<div class="loading-news">No news found for this location.</div>`;
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
        <p class="news-description">${article.description}</p>
        <a href="${article.url}" target="_blank" class="news-link">Read more</a>
      </div>
    `;
    newsContainer.appendChild(newsItem);
  });
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

// Event Listener for Refresh News
document.getElementById("refreshNews")?.addEventListener("click", () => {
  const defaultCity = window.currentCity || "Gautam Budh Nagar"; // Fallback city
  getNews(defaultCity);
});

// Test call (uncomment to test)
// getNews("Gautam Budh Nagar");
