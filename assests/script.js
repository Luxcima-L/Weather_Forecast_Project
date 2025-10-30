const apiKey = "d4fc0b2073a3639a2eceb605c41fbeb3";
const apiUrlCurrent = "https://api.openweathermap.org/data/2.5/weather?units=metric&";
const apiUrlForecast = "https://api.openweathermap.org/data/2.5/forecast?units=metric&";


const searchBox = document.querySelector(".search input");
// const searchBtn = document.querySelector(".search button");
const currentLocationBtn = document.querySelector("#geoBtn");
const toggleBtn = document.getElementById("toggleBtn");
const toggleCircle = document.getElementById("toggleCircle");

const RECENT_KEY = "recentCities";
const MAX_RECENT = 8;

const searchInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const recentMenu = document.getElementById("recentMenu");
  
 

// Local storage  
function getRecentCities() {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch {
        return [];
    }
}

function saveRecentCity(city) {
    city = city.trim();
    if (!city) return;
    let arr = getRecentCities();
    // de-dupe case-insensitive
    arr = arr.filter(c => c.toLowerCase() !== city.toLowerCase());
    arr.unshift(city);
    if (arr.length > MAX_RECENT) arr = arr.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
}

//  Dropdown render 
function renderRecentDropdown(filter = "") {
    const menu = document.getElementById("recentMenu");
    let cities = getRecentCities();

    // Filter by input text
    const f = filter.trim().toLowerCase();
    if (f && f.length != 0) cities = cities.filter(c => c.toLowerCase().includes(f));

    if (!cities.length) {
        menu.classList.add("hidden");
        menu.innerHTML = "";
        return;
    }

    menu.innerHTML =
        cities
            .map(
                c => `<button type="button" data-city="${c}"
               class="w-full text-left px-3 py-2 hover:bg-slate-100">${c}</button>`
            )
            .join("") +
        `<div class="border-t border-slate-200">
       <button type="button" id="clearRecent"
               class=" text-left px-3 py-2 text-sm text-slate-500 hover:text-slate-700">
         Clear recent
       </button>
     </div>`;

    menu.classList.remove("hidden");
    // menu.classList.add("show");
}

// API errors
function handleApiError(response) {
    // specific error code handling
    // 404 is returned for unknown city name input
    if (response.status == 404) {
        showToast('city not found. Enter valid name', 'error');
        return;
    }

    // Generic error toast for all other errors
    if (Math.floor(Number(response.status / 100)) === 4) {
        showToast('Temporary Error! Try again', 'warning');
    } else if (Math.floor(Number(response.status / 100)) === 5) {
        showToast('Server Error', 'error');
    }
}

const rainOverlay = document.getElementById('rainOverlay');
 
// changing weather bg during rain
  function setRain(isRaining) {
    if (isRaining) {
      rainOverlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        rainOverlay.classList.remove('opacity-0');
      });
    } else {
      rainOverlay.classList.add('opacity-80');
      rainOverlay.addEventListener('transitionend', function handle() {
        rainOverlay.classList.add('hidden');
        rainOverlay.removeEventListener('transitionend', handle);
      }, { once: true });
    }
  }

  // check if rain should appear based on 'main' or 'description'
function isRainy(data) {
  const main = data?.weather?.[0]?.main?.toLowerCase() || "";
  const desc = data?.weather?.[0]?.description?.toLowerCase() || "";
  return (
    main.includes("Rain") ||
    main.includes("drizzle") ||
    main.includes("thunderstorm") ||
    desc.includes("rain") ||
    desc.includes("light rain") ||
    desc.includes("moderate rain") 
    // desc.includes("mist")
  );

}


let currentTempC = null;
let isCelsius = true;


// Function to check today weather 
async function checkWeather(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            handleApiError(response);
            return false;
        }
        const data = await response.json();

        setRain(isRainy(data));


       
        // timezone logic
        const cityOffsetSec = data.timezone; // in seconds
        const browserOffsetSec = -new Date().getTimezoneOffset() * 60; // convert browser offset (min) → sec
        const utcTime = data.dt; // UTC timestamp from API
        const cityLocalTime = utcTime + cityOffsetSec - browserOffsetSec;

        const today = new Date(cityLocalTime * 1000);
        const options = { weekday: "long", day: "numeric", month: "short", year: "numeric" };
        const formattedDate = today.toLocaleDateString("en-US", options);
        const description = data.weather[0].description;
        document.querySelector(".description").innerHTML =
        currentTempC = data.main.temp;

        // weather alert
        if (currentTempC > 40) {
            showToast(`Heat Alert in ${data.name}: ${Math.round(currentTempC)}°C`, "warning");

        } else if (currentTempC < 10) {
            showToast(` Cold Alert in ${data.name}: ${Math.round(currentTempC)}°C`, "warning");
        }

        document.querySelector(".city").innerHTML = data.name;
        document.querySelector("#temp").textContent = `${Math.round(currentTempC)}°C`;
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
/*
TODO - timezone correction

response data has 'dt'(sec) already in UTC (00:00)

do 
hint : timeInIST = dt + 19800
calculate 'currentBrowserTime' -> get current browser time zone -> get offset of timezone -> convert to sec -> replace 19800 in prev formula
*/
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

        const cityOffsetSec = data.city.timezone; // seconds from UTC  ➜ OpenWeather gives this
        const browserOffsetSec = -new Date().getTimezoneOffset() * 60; // current browser offset (minutes → sec)


        const toCityDate = (utcSec) => new Date((utcSec + cityOffsetSec - browserOffsetSec) * 1000);

        const dateKey = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const da = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${da}`;
        };

        const utcNow = Math.floor(Date.now() / 1000);
        const cityNow = new Date((utcNow + cityOffsetSec - browserOffsetSec) * 1000);
        const todayKey = dateKey(cityNow);


        // Group forecast by date
        const grouped = {};
        data.list.forEach((item) => {
            const local = toCityDate(item.dt);
            const key = dateKey(local);
            (grouped[key] ??= []).push({ ...item, _localDate: local });
        });

        const orderedKeys = Object.keys(grouped).sort();
        const nextKeys = orderedKeys.filter((k) => k > todayKey).slice(0, 5);

        const nextFive = nextKeys.map((k) => {
            const arr = grouped[k];
            return arr.reduce((prev, curr) => {
                const prevDiff = Math.abs(prev._localDate.getHours() - 12);
                const currDiff = Math.abs(curr._localDate.getHours() - 12);
                return currDiff < prevDiff ? curr : prev;
            });
        });

        nextFive.forEach(day => {
            const d = day._localDate;
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const formattedDate = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
            const icon = day.weather[0].icon;
            const temp = Math.round(day.main.temp);
            const desc = day.weather[0].description;
            const humidity = day.main.humidity;
            const wind = day.wind.speed;

            //     const tempClass =
            // temp > 30
            //   ? "ring-2 ring-red-400 bg-red-500/10"
            //   : temp < 15
            //   ? "ring-2 ring-blue-400 bg-blue-500/10"
            //   : "";

            const card = `
      <div class="bg-gradient-to-b from-sky-400 to-blue-400 text-white rounded-3xl p-4 shadow-lg transform transition hover:scale-105 backdrop-blur-md border border-white/20 m-2.5 w-">
        <h3 class="text-lg font-semibold mb-1">${dayName}</h3>
        <p class="text-sm mb-2 opacity-90">${formattedDate}</p>
        <img class="mx-auto" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <p class="text-2xl font-bold">${temp}°C</p>
        <p class="text-sm capitalize mb-2">${desc}</p>
        <div class="flex justify-center gap-4 text-sm">
          <p> <i class="fa-2px fa-solid fa-droplet text-white"></i> ${humidity}%</p>
          <p> <i class="fa-solid fa-wind text-white"></i> ${wind} m/s</p>
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
            toastIcon.innerHTML = `<i class=" text-2xl text-green-500 fa-solid fa-circle-check"></i>`;
            break;
        case "error":
            toastIcon.innerHTML = '<i class=" text-2xl text-red-500 fa-solid fa-circle-xmark"></i>';
            break;
        case "warning":
            toastIcon.innerHTML = `<i class=" text-2xl fa-solid fa-triangle-exclamation text-yellow-500"></i>`;
            break;
        default:
            toastIcon.innerHTML = `<i class=" text-2xl fa-solid fa-circle-info text-blue-500"></i>`;
    }

    // Show toast
    toast.classList.remove("hidden");
    toast.classList.add("opacity-100", "translate-y-0");

    // Hide after 5 seconds
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

toggleBtn.addEventListener("click", () => {
    if (currentTempC === null) {
        showToast("No temperature data available yet!", "warning");
        return;
    }

    if (isCelsius) {
        // Convert to Fahrenheit
        const fahrenheit = (currentTempC * 9) / 5 + 32;
        document.querySelector("#temp").textContent = `${Math.round(fahrenheit)}°F`;
        toggleCircle.style.transform = "translateX(32px)";
        isCelsius = false;
        showToast("Switched to Fahrenheit (°F)", "info");
    } else {
        // Convert back to Celsius
        document.querySelector("#temp").textContent = `${Math.round(currentTempC)}°C`;
        toggleCircle.style.transform = "translateX(0)";
        isCelsius = true;
        showToast("Switched to Celsius (°C)", "info");
    }
});


searchBtn.addEventListener("click", () => {
    const city = searchBox.value.trim();
    if (!city) return showToast("City name cannot be empty", "warning");
    saveRecentCity(city);
    // renderRecentDropdown();
    checkWeatherForCity(city);
    getForecastForCity(city);

});

// Show dropdown only when typing and on focus

searchInput.addEventListener("input", () => {
    const value = searchInput.value.trim();

    if (value.length > 0) {
        renderRecentDropdown(value);
    }
    else {
        recentMenu.classList.add("hidden");
    }
});

searchInput.addEventListener("focus", () => {
    const value = searchInput.value.trim();
    renderRecentDropdown(value);
});

// Click on a recent item (event delegation)
recentMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-city]");
    if (btn) {
        const city = btn.dataset.city;
        searchInput.value = city;
        saveRecentCity(city);        // move to top
        renderRecentDropdown();      // re-render
        checkWeatherForCity(city);
        getForecastForCity(city);
        return;
    }
    if (e.target.id === "clearRecent") {
        localStorage.removeItem(RECENT_KEY);
        renderRecentDropdown();
    }
});

// Hide dropdown when clicking outside or pressing Esc
document.addEventListener("click", (e) => {
    if (!e.target.closest("#searchWrap")) recentMenu.classList.add("hidden");
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") recentMenu.classList.add("hidden");
});


document.addEventListener("DOMContentLoaded", () => {
    renderRecentDropdown();
});


searchBox.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        const city = searchBox.value.trim();
        if (!city) return showToast("City name cannot be empty", "warning");
        checkWeatherForCity(city);
        getForecastForCity(city);

    }
});

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

document.addEventListener("DOMContentLoaded", () => {
    recentMenu.classList.add("hidden");
    //   recentMenu.classList.add("show");
});


