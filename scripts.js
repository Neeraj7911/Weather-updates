const apiKey = "9afd12a6a2414ab9d129d33d2f3726be";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?&units=metric";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");
const card = document.querySelector(".card");

async function checkWeather(location) {
    let url;
    if (typeof location === 'string') {
        url = apiUrl + `&q=${location}&appid=${apiKey}`;
    } else {
        const { latitude, longitude } = location.coords;
        url = apiUrl + `&lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
    }

    try {
        document.querySelector(".city").innerHTML = "Loading...";
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("City not found");
        }
        const data = await response.json();

        document.querySelector(".city").innerHTML = data.name;
        document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = data.wind.speed + " Km/h";

        updateWeatherIcon(data.weather[0].main);
    } catch (error) {
        alert(error.message);
        document.querySelector(".city").innerHTML = "City not found";
    }
}

function updateWeatherIcon(weatherCondition) {
    const iconMap = {
        "Clouds": "clouds.png",
        "Clear": "clear.png",
        "Rain": "rain.png",
        "Drizzle": "drizzle.png",
        "Mist": "mist.png"
    };

    const bgMap = {
        "Clouds": "linear-gradient(90deg, rgba(100, 100, 100, 1) 0%, rgba(150, 150, 150, 1) 100%)",
        "Clear": "linear-gradient(90deg, rgba(135, 206, 235, 1) 0%, rgba(0, 191, 255, 1) 100%)",
        "Rain": "linear-gradient(90deg, rgba(64, 64, 64, 1) 0%, rgba(85, 85, 85, 1) 100%)",
        "Drizzle": "linear-gradient(90deg, rgba(169, 169, 169, 1) 0%, rgba(192, 192, 192, 1) 100%)",
        "Mist": "linear-gradient(90deg, rgba(211, 211, 211, 1) 0%, rgba(240, 240, 240, 1) 100%)"
    };

    weatherIcon.src = iconMap[weatherCondition] || 'clear.png';
    card.style.background = bgMap[weatherCondition] || 'linear-gradient(90deg, rgba(135, 206, 235, 1) 0%, rgba(0, 191, 255, 1) 100%)';
}

searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
});

searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        checkWeather(searchBox.value);
    }
});

window.onload = () => {
    navigator.geolocation.getCurrentPosition(
        position => checkWeather(position),
        error => {
            console.error(error);
            alert("Geolocation not enabled or not supported.");
        }
    );
};
