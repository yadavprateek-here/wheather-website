// Function to fetch current weather data from Open-Meteo API
async function fetchCurrentWeather(latitude, longitude) {
    try {
        showLoading();
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );
        if (!response.ok) throw new Error("Failed to fetch weather data");
        const data = await response.json();
        return data;
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Function to fetch daily forecast data from Open-Meteo API
async function fetchDailyForecast(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=auto`
        );
        if (!response.ok) throw new Error("Failed to fetch forecast data");
        const data = await response.json();
        return data;
    } catch (error) {
        showError(error.message);
    }
}

// Function to get latitude and longitude for a city using Open-Meteo Geocoding API
async function getCoordinates(city) {
    try {
        showLoading();
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
        );
        if (!response.ok) throw new Error("Failed to fetch coordinates");
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return {
                latitude: data.results[0].latitude,
                longitude: data.results[0].longitude,
            };
        } else {
            throw new Error("City not found");
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Function to convert weather code to human-readable description & icons
function getWeatherDetails(weathercode) {
    const weatherData = {
        0: { desc: "Clear sky ☀️", icon: "fas fa-sun text-yellow-400" },
        1: { desc: "Mainly clear 🌤", icon: "fas fa-cloud-sun text-yellow-400" },
        2: { desc: "Partly cloudy ⛅", icon: "fas fa-cloud text-gray-500" },
        3: { desc: "Overcast ☁️", icon: "fas fa-smog text-gray-400" },
        45: { desc: "Fog 🌫", icon: "fas fa-smog text-gray-400" },
        51: { desc: "Light drizzle 🌦", icon: "fas fa-cloud-rain text-blue-500" },
        61: { desc: "Slight rain 🌧", icon: "fas fa-cloud-showers-heavy text-blue-500" },
        65: { desc: "Heavy rain ⛈", icon: "fas fa-cloud-rain text-blue-700" },
        71: { desc: "Slight snow ❄️", icon: "fas fa-snowflake text-blue-300" },
        75: { desc: "Heavy snow 🌨", icon: "fas fa-snowman text-blue-500" },
        95: { desc: "Thunderstorm ⛈", icon: "fas fa-bolt text-yellow-600" },
    };
    return weatherData[weathercode] || { desc: "Unknown", icon: "fas fa-question-circle text-gray-500" };
}

// Function to display current weather
function displayWeather(currentWeather, dailyForecast) {
    const weatherInfo = document.getElementById("weatherInfo");
    const weatherDetails = getWeatherDetails(currentWeather.current_weather.weathercode);
    
    weatherInfo.innerHTML = `
        <div class="p-6 bg-white bg-opacity-30 backdrop-blur-lg rounded-lg text-center">
            <h2 class="text-2xl font-bold">Current Weather</h2>
            <div class="text-6xl mt-3">
                <i class="${weatherDetails.icon}"></i>
            </div>
            <p class="text-lg font-semibold">${weatherDetails.desc}</p>
            <p class="text-xl mt-2">${currentWeather.current_weather.temperature}°C</p>
            <p class="text-gray-300">Wind: ${currentWeather.current_weather.windspeed} km/h</p>
        </div>
    `;

    displayForecast(dailyForecast);
}

// Function to display 7-day forecast
function displayForecast(dailyForecast) {
    const forecastInfo = document.getElementById("forecastInfo");
    forecastInfo.innerHTML = "<h2 class='text-xl font-bold mb-4 text-white'>7-Day Forecast</h2>";

    dailyForecast.daily.time.forEach((date, index) => {
        const weatherDetails = getWeatherDetails(dailyForecast.daily.weathercode[index]);
        forecastInfo.innerHTML += `
            <div class="bg-white bg-opacity-30 backdrop-blur-lg p-4 rounded-lg text-center text-white mb-2">
                <p class="font-bold">${date}</p>
                <div class="text-4xl mt-2">
                    <i class="${weatherDetails.icon}"></i>
                </div>
                <p class="text-lg">${weatherDetails.desc}</p>
                <p>Max: ${dailyForecast.daily.temperature_2m_max[index]}°C</p>
                <p>Min: ${dailyForecast.daily.temperature_2m_min[index]}°C</p>
                <p>Wind: ${dailyForecast.daily.windspeed_10m_max[index]} km/h</p>
            </div>
        `;
    });
}

// Show loading state
function showLoading() {
    const weatherInfo = document.getElementById("weatherInfo");
    weatherInfo.innerHTML = `<p class="text-white text-lg">Fetching weather data...</p>`;
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

// Event listener for search button
document.getElementById("searchBtn").addEventListener("click", async () => {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        showError("Please enter a city name");
        return;
    }
    try {
        const { latitude, longitude } = await getCoordinates(city);
        const currentWeather = await fetchCurrentWeather(latitude, longitude);
        const dailyForecast = await fetchDailyForecast(latitude, longitude);
        displayWeather(currentWeather, dailyForecast);
    } catch (error) {
        showError(error.message);
    }
});

// Event listener for current location button
document.getElementById("currentLocationBtn").addEventListener("click", async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const currentWeather = await fetchCurrentWeather(latitude, longitude);
            const dailyForecast = await fetchDailyForecast(latitude, longitude);
            displayWeather(currentWeather, dailyForecast);
        }, () => {
            showError("Location access denied.");
        });
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});
