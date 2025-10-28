const apiKey = "d4fc0b2073a3639a2eceb605c41fbeb3";
const apiUrlCurrent = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const apiUrlForecast = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";


const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");

async function checkWeather(city) {
    console.log('city', city.length);
    if (city.length === 0) {
        showToast('City name cannot be empty', 'warning');
        return;
    }
    let data = null;
    try {
        const response = await fetch(apiUrlCurrent + city + `&appid=${apiKey}`);
        data = await response.json();

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

        getForecast(city);

    } catch (e) {
        console.log(e);
        showToast('Api Error', 'error');
    }

}

// Function to show 5 day forecast
async function getForecast(city) {
    const response = await fetch(apiUrlForecast + city + `&appid=${apiKey}`);
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
}
// const baseClasses = "fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all duration-300";

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const toastIcon = document.getElementById("toast-icon");
  const toastMessage = document.getElementById("toast-message");

  // Set message text
  toastMessage.textContent = message;

  // Set color and icon based on type
  switch (type) {
    case "success":
    //   toast.className = baseClasses + " bg-green-600";
      toastIcon.textContent = "✅";
      break;
    case "error":
    //   toast.className = baseClasses + " bg-red-600 text-white";
      toastIcon.textContent = "❌";
      break;
    case "warning":
    //   toast.className = baseClasses + " bg-yellow-500 text-black";
      toastIcon.textContent = "⚠️";
      break;
    default:
    //   toast.className = baseClasses + " bg-blue-600";
      toastIcon.textContent = "ℹ️";
  }

  // Show toast
  toast.classList.remove("hidden");
  toast.classList.add("opacity-100", "translate-y-0");

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.add("opacity-0", "-translate-y-3");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 3000);
}

window.addEventListener("load", function () {
    // setting default location when page loads 
    // done to make it prettier
    checkWeather("Bengaluru");
});

searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
});

searchBox.addEventListener("keypress", e => {
    if (e.key === "Enter") checkWeather(searchBox.value);
});
