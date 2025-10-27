const apiKey = "d4fc0b2073a3639a2eceb605c41fbeb3";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");

async function checkWeather(city) {
    const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
    let data = await response.json();

    document.querySelector(".city").innerHTML = data.name;
    document.querySelector("#temp").innerHTML = Math.round(data.main.temp) + "°c";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + "m/s";
    const weather_icon = data.weather[0].icon;
    console.log('weather_icon', weather_icon);
    document.querySelector("#weather_icon").src = "https://openweathermap.org/img/wn/"+ weather_icon + "@2x.png";
    console.log(data);
    
}

searchBtn.addEventListener("click", ()=> {
    checkWeather(searchBox.value);
})
