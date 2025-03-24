const newsApiKey = "3adad365183e4b349fe63415313b1f9f";
const newsApiUrl =
  "https://newsapi.org/v2/everything?sortBy=publishedAt&pageSize=6";

async function getNews(city) {
  try {
    const newsContainer = document.getElementById("newsContainer");
    if (!newsContainer) throw new Error("News container not found in DOM");

    // Show loading state
    newsContainer.innerHTML = `
      <div class="loading-news">
        <div class="scanner"><div class="scanner-beam"></div></div>
        <p>Loading local news...</p>
      </div>
    `;

    // Construct the API URL with the city as a query parameter
    const url = `${newsApiUrl}&q=${encodeURIComponent(
      city
    )}&apiKey=${newsApiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `News API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.articles || data.articles.length === 0) {
      throw new Error("No news articles found for this location.");
    }

    updateNewsUI(data.articles);
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
    newsContainer.innerHTML = `
      <div class="loading-news">No news found for this location.</div>
    `;
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
  if (window.currentCity) getNews(window.currentCity); // Assumes currentCity is global
});
