// Show loading state
function showLoading() {
    const weatherInfo = document.getElementById("weatherInfo");
    weatherInfo.innerHTML = `
        <div class="flex justify-center items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            <p class="ml-2 text-white text-lg">Fetching weather data...</p>
        </div>`;
}

// Hide loading state
function hideLoading() {
    const weatherInfo = document.getElementById("weatherInfo");
    weatherInfo.innerHTML = "";
}

// Show error message
function showError(message) {
    const weatherInfo = document.getElementById("weatherInfo");
    weatherInfo.innerHTML = `<p class="text-red-500 font-bold">${message}</p>`;
}

// Fetch current weather data
async function fetchCurrentWeather(latitude, longitude) {
    try {
        showLoading();
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );
        if (!response.ok) throw new Error("Failed to fetch current weather data.");
        const data = await response.json();
        return data;
    } catch (error) {
        showError(error.message || "An error occurred while fetching current weather.");
    } finally {
        hideLoading();
    }
}

// Fetch 5-day forecast data
async function fetchDailyForecast(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,relative_humidity_2m_max&timezone=auto`
        );
        if (!response.ok) throw new Error("Failed to fetch daily forecast data.");
        const data = await response.json();
        return data;
    } catch (error) {
        showError(error.message || "An error occurred while fetching the forecast.");
    }
}

// Get city coordinates
async function getCoordinates(city) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
        );
        if (!response.ok) throw new Error("Failed to fetch coordinates.");
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return {
                latitude: data.results[0].latitude,
                longitude: data.results[0].longitude,
            };
        } else {
            throw new Error("City not found.");
        }
    } catch (error) {
        showError(error.message || "An error occurred while fetching coordinates.");
    }
}

// Function to map weather codes to details
function getWeatherDetails(weathercode) {
    const weatherData = {
        0: { desc: "Clear Sky", icon: "fas fa-sun text-yellow-400" },
        1: { desc: "Mainly Clear", icon: "fas fa-cloud-sun text-yellow-400" },
        2: { desc: "Partly Cloudy", icon: "fas fa-cloud text-gray-500" },
        3: { desc: "Overcast", icon: "fas fa-cloud text-gray-400" },
        45: { desc: "Fog", icon: "fas fa-smog text-gray-500" },
        51: { desc: "Light Drizzle", icon: "fas fa-cloud-rain text-blue-300" },
        61: { desc: "Slight Rain", icon: "fas fa-cloud-showers-heavy text-blue-500" },
        65: { desc: "Heavy Rain", icon: "fas fa-cloud-rain text-blue-700" },
        71: { desc: "Slight Snow", icon: "fas fa-snowflake text-blue-300" },
        75: { desc: "Heavy Snow", icon: "fas fa-snowman text-blue-500" },
        95: { desc: "Thunderstorm", icon: "fas fa-bolt text-yellow-500" },
    };
    return weatherData[weathercode] || { desc: "Unknown", icon: "fas fa-question-circle text-gray-500" };
}

// Display current weather
function displayWeather(currentWeather, dailyForecast) {
    const weatherInfo = document.getElementById("weatherInfo");
    const weatherDetails = getWeatherDetails(currentWeather.current_weather.weathercode);

    weatherInfo.innerHTML = `
        <div class="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg shadow-md text-center">
            <h2 class="text-2xl font-bold">Current Weather</h2>
            <div class="text-6xl mt-3">
                <i class="${weatherDetails.icon}"></i>
            </div>
            <p class="text-lg font-semibold mt-2">${weatherDetails.desc}</p>
            <p class="text-xl mt-1">${currentWeather.current_weather.temperature}°C</p>
            <p class="text-gray-300">Wind: ${currentWeather.current_weather.windspeed} km/h</p>
        </div>
    `;

    displayForecast(dailyForecast);
}

// Display 5-day forecast
function displayForecast(dailyForecast) {
    const forecastInfo = document.getElementById("forecastInfo");
    forecastInfo.innerHTML = "<h2 class='text-xl font-bold mb-4 text-white'>5-Day Forecast</h2>";
    dailyForecast.daily.time.slice(0, 5).forEach((date, index) => {
        const weatherDetails = getWeatherDetails(dailyForecast.daily.weathercode[index]);
        forecastInfo.innerHTML += `
            <div class="bg-white bg-opacity-30 backdrop-blur-lg p-4 rounded-lg shadow-md text-center text-white">
                <p class="font-bold">${new Date(date).toDateString()}</p>
                <div class="text-4xl mt-2">
                    <i class="${weatherDetails.icon}"></i>
                </div>
                <p class="text-lg mt-1">${weatherDetails.desc}</p>
                <p class="mt-2">Max: ${dailyForecast.daily.temperature_2m_max[index]}°C</p>
                <p>Min: ${dailyForecast.daily.temperature_2m_min[index]}°C</p>
                <p>Humidity: ${dailyForecast.daily.relative_humidity_2m_max[index]}%</p>
                <p>Wind: ${dailyForecast.daily.windspeed_10m_max[index]} km/h</p>
            </div>`;
    });
}

// Event Listeners
document.getElementById("searchBtn").addEventListener("click", async () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) {
        const { latitude, longitude } = await getCoordinates(city);
        const currentWeather = await fetchCurrentWeather(latitude, longitude);
        const dailyForecast = await fetchDailyForecast(latitude, longitude);
        displayWeather(currentWeather, dailyForecast);
    } else {
        showError("Enter a valid city name.");
    }
});

document.getElementById("currentLocationBtn").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        const currentWeather = await fetchCurrentWeather(latitude, longitude);
        const dailyForecast = await fetchDailyForecast(latitude, longitude);
        displayWeather(currentWeather, dailyForecast);
    });
});
