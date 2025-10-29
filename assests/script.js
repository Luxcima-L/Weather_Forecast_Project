const apiKey = "d4fc0b2073a3639a2eceb605c41fbeb3";
const apiUrlCurrent = "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const apiUrlForecast = "https://api.openweathermap.org/data/2.5/forecast?units=metric&";


const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const currentLocationBtn = document.querySelector("#geoBtn");

function handleApiError(response) {
    // specific error code handling
    // 404 is returned for unknown city name input
    if (response.status == 404) {
        showToast('City not found. Enter valid city', 'error');
        return;
    }

    // Generic error toast for all other errors
    if (Math.floor(Number(response.status / 100)) === 4) {
        showToast('Temporary Error! Try again', 'warning');
    } else if (Math.floor(Number(response.status / 100)) === 5) {
        showToast('Server Error', 'error');
    }
}

// Function to check today weather 
async function checkWeather(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            handleApiError(response);
            return false;
        }
        const data = await response.json();

        const today = new Date();
        const options = { weekday: "long", day: "numeric", month: "short", year: "numeric" };
        const formattedDate = today.toLocaleDateString("en-US", options);
        const description = data.weather[0].description;

        document.querySelector(".city").innerHTML = data.name;
        document.querySelector("#temp").innerHTML = Math.round(data.main.temp) + "°c";
        document.querySelector(".description").innerHTML = description.charAt(0).toUpperCase() + description.slice(1);
        document.querySelector(".date").innerHTML = formattedDate;
        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = data.wind.speed + "m/s";

        const weather_icon = data.weather[0].icon;
        console.log('weather_icon', weather_icon);
        document.querySelector("#weather_icon").src = "https://openweathermap.org/img/wn/" + weather_icon + "@2x.png";
        console.log(data);


    } catch (e) {
        console.log(e);
        showToast('Api Processing Error', 'error');
        return false;
    }
    return true;
}

// Function to show 5 day forecast
async function getForecast(url) {

    try {
        const response = await fetch(url);
        if (!response.ok) {
            handleApiError(response);
            return;
        }
        const data = await response.json();

        const forecastContainer = document.querySelector("#forecast");
        forecastContainer.innerHTML = "";

        // Group forecast by date
        const grouped = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(" ")[0];
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        });

        // Get one forecast entry per day (12:00:00)
        // const dailyForecast = data.list.filter(item => item.dt_txt.includes("12:00:00"));

        // Extract one entry per day (closest to 12:00)
        const daily = Object.keys(grouped).map(date => {
            const items = grouped[date];
            return items.reduce((prev, curr) => {
                const prevDiff = Math.abs(new Date(prev.dt_txt).getHours() - 12);
                const currDiff = Math.abs(new Date(curr.dt_txt).getHours() - 12);
                return currDiff < prevDiff ? curr : prev;
            });
        });

        // Remove today's entry and show next 5
        daily.shift();
        const nextFive = daily.slice(0, 5);

        nextFive.forEach(day => {
            const date = new Date(day.dt_txt);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            const icon = day.weather[0].icon;
            const temp = Math.round(day.main.temp);
            const desc = day.weather[0].description;
            const humidity = day.main.humidity;
            const wind = day.wind.speed;

            const formattedDate = date.toLocaleDateString("en-US", { day: "numeric", month: "short" });

            const card = `
      <div class="bg-gradient-to-b from-blue-200 to-blue-400 text-white rounded-2xl p-4 shadow-lg transform transition hover:scale-105 backdrop-blur-md border border-white/20">
        <h3 class="text-lg font-semibold mb-1">${dayName}</h3>
        <p class="text-sm mb-2 opacity-90">${formattedDate}</p>
        <img class="mx-auto" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <p class="text-2xl font-bold">${temp}°C</p>
        <p class="text-sm capitalize mb-2">${desc}</p>
        <div class="flex justify-center gap-4 text-sm">
          <p>💧 ${humidity}%</p>
          <p>💨 ${wind} m/s</p>
        </div>
      </div>
    `;
            forecastContainer.innerHTML += card;
        });
    } catch (e) {
        console.log(e);
        showToast('Api error', 'error');
    }
}

// city caller
function checkWeatherForCity(city) {
    if (!city || !city.trim()) {
        showToast("City name cannot be empty", "warning");
        return;
    }
    const url = `${apiUrlCurrent}q=${encodeURIComponent(city)}&appid=${apiKey}`;
    checkWeather(url);
}
function getForecastForCity(city) {
    if (!city || !city.trim()) {
        showToast("City name cannot be empty", "warning");
        return;
    }
    const url = `${apiUrlForecast}q=${encodeURIComponent(city)}&appid=${apiKey}`;
    getForecast(url);
}

// coords caller
function checkWeatherForCoords(lat, lon) {
    const url = `${apiUrlCurrent}lat=${lat}&lon=${lon}&appid=${apiKey}`;
    checkWeather(url);
}
function getForecastForCoords(lat, lon) {
    const url = `${apiUrlForecast}lat=${lat}&lon=${lon}&appid=${apiKey}`;
    getForecast(url);
}

function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastMessage = document.getElementById("toast-message");

    // Set message text
    toastMessage.textContent = message;

    // Set icon based on type
    switch (type) {
        case "success":
            toastIcon.textContent = "✅";
            break;
        case "error":
            toastIcon.textContent = "❌";
            break;
        case "warning":
            toastIcon.textContent = "⚠️";
            break;
        default:
            toastIcon.textContent = "ℹ️";
    }

    // Show toast
    toast.classList.remove("hidden");
    toast.classList.add("opacity-100", "translate-y-0");

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add("opacity-0", "-translate-y-3");
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 5000);
}


// setting default location when page loads 
// done to make it prettier
window.addEventListener("load", function () {
    fetchData("Chennai");
});

searchBtn.addEventListener("click", () => {
const city = searchBox.value.trim();
  if (!city) return showToast("City name cannot be empty", "warning");
  checkWeatherForCity(city);         
  getForecastForCity(city);          
});

searchBox.addEventListener("keypress", e => {
    if (e.key === "Enter") {
     const city = searchBox.value.trim();
    if (!city) return showToast("City name cannot be empty", "warning");
    checkWeatherForCity(city);
    getForecastForCity(city);
  }
});

// currentLocationBtn.addEventListener("click", () => {
//     console.log("Button Clicked");
//     navigator.geolocation.getCurrentPosition(showLocation, showError);
// });

currentLocationBtn.addEventListener("click", () => {
    console.log(" Current Location Button Clicked");

    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by this browser.", "error");
        return;
    }

    // Show info toast while fetching
    showToast("Fetching your current location...", "info");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log("Location received:", lat, lon);
            showToast("Location detected successfully!", "success");

            //  URL-based functions
            checkWeatherForCoords(lat, lon);
            getForecastForCoords(lat, lon);
        },
        (error) => {
            console.error(" Location error:", error);

            //  Use toast for all errors
            const message =
                error.code === 1
                    ? "Permission denied. Please allow location access."
                    : error.code === 2
                        ? "Location information unavailable."
                        : error.code === 3
                            ? "Location request timed out. Try again."
                            : "An unknown error occurred while fetching location.";

            showToast(message, "error");
        },
        { timeout: 15000 }
    );
});

function fetchData(city) {
    checkWeatherForCity(city) 
    getForecastForCity(city);
}
