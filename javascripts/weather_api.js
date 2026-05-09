async function checkButtonClicked() {
    // The function will first fetch the location's latitude and longitude using OpenMeteo's Geocoding API.
    // Then use those data to fetch the location's weather data using OpenMeteo's Weather Forecast API.

    const searchBoxInput = document.getElementById("searchbox_input");
    const checkButton = document.getElementById("searchbox_check_button");

    var searchValue = searchBoxInput.value.trim();
    if (searchValue === "") {
        updateCheckStatusText("error", "Location name cannot be empty.");
    }
    else {
        searchBoxInput.disabled = true;
        checkButton.disabled = true;
        updateCheckStatusText("", `(1/2) Fetching coordinates of location "${searchValue}", please wait...`);
        // Fetch location's coordinates
        const resultDataLocationCoordinates = await fetchLocationCoordinates(searchValue);
        // console.log(resultDataLocationCoordinates);

        if (resultDataLocationCoordinates["errorMessage"] === null) {
            const locationName = resultDataLocationCoordinates["locationName"];
            const latitude = resultDataLocationCoordinates["latitude"];
            const longitude = resultDataLocationCoordinates["longitude"];

            updateCheckStatusText("", `(2/2) Fetching weather forecast of "${locationName}", please wait...`);
            const resultDataWeatherForecastData = await fetchWeatherForecastData(latitude, longitude);
            // console.log(resultDataWeatherForecastData);
            if (resultDataWeatherForecastData["errorMessage"] === null) {
                updateCheckStatusText("reset", "");
                const weatherForecastData = resultDataWeatherForecastData["weatherForecastData"];
                updateWeatherUI(locationName, weatherForecastData);
            }
            else {
                updateCheckStatusText("error", resultDataWeatherForecastData["errorMessage"]);
            }
        }
        else {
            updateCheckStatusText("error", resultDataLocationCoordinates["errorMessage"]);
        }



        searchBoxInput.disabled = false;
        checkButton.disabled = false;
    }
}

function updateCheckStatusText(statusTag, statusText) {
    // This function updates the status text (loading or error messages) while the website is fetching data from the APIs.
    const checkStatusText = document.getElementById("check_status_text");

    if (statusTag === "reset") {
        checkStatusText.className = "";
        checkStatusText.textContent = "";
    }
    else {
        checkStatusText.className = "active";
        if (statusTag === "error") {
            checkStatusText.classList.add("error");
        }
        checkStatusText.textContent = statusText;
    }
}

async function fetchLocationCoordinates(searchValueLocationName) {
    // This function fetches the location's latitude and longitude using OpenMeteo's Geocoding API.
    const resultData = {
        "errorMessage": null,
        locationName: null,
        latitude: null,
        longitude: null
    };
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${searchValueLocationName}&count=1&language=en&format=json`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if ("results" in data && data["results"].length > 0) {
                const coordinatesData = data.results[0];
                resultData.locationName = coordinatesData["name"];
                resultData.latitude = coordinatesData["latitude"];
                resultData.longitude = coordinatesData["longitude"];
            }
            else {
                resultData["errorMessage"] = `No result found for location "${locationName}."`;
            }
        }
        else {
            throw new Error(`HTTP Error! Status: ${response.status}.`);
        }


    }
    catch (error) {
        resultData["errorMessage"] = error;
    }

    return resultData;
}

async function fetchWeatherForecastData(latitude, longitude) {
    // This function fetches the weather forecast data using OpenMeteo's Weather Forecast API.
    const resultData = {
        "errorMessage": null,
        "weatherForecastData": null
    };
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_min,temperature_2m_max,wind_speed_10m_max,relative_humidity_2m_max,relative_humidity_2m_min,wind_speed_10m_min&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            resultData["weatherForecastData"] = data;
        }
        else {
            throw new Error(`HTTP Error! Status: ${response.status}.`);
        }
    }
    catch (error) {
        resultData["errorMessage"] = error;
    }
    return resultData;
}

function updateWeatherUI(locationName, weatherForecastData) {
    // This function updates the ui for the weather forecast data.
    const weatherMainDataContainer = document.getElementById("weather_main_data_container");
    weatherMainDataContainer.classList.add("active");

    // Location Name
    const locationNameText = document.getElementById("location_name_text");
    locationNameText.textContent = locationName;

    const currentWeatherForecastData = weatherForecastData["current"];
    const currentWeatherForecastDataUnits = weatherForecastData["current_units"];
    updateCurrentWeatherForecastUI(currentWeatherForecastData, currentWeatherForecastDataUnits);

    const dailyWeatherForecastData = weatherForecastData["daily"];
    const dailyWeatherForecastDataUnits = weatherForecastData["daily_units"];
    updateDailyWeatherForecastUI(dailyWeatherForecastData, dailyWeatherForecastDataUnits);
}

function updateCurrentWeatherForecastUI(currentWeatherForecastData, currentWeatherForecastDataUnits) {
    // This function updates the UI for the current forecast.

    const weatherCode = currentWeatherForecastData["weather_code"];
    const resultDataWeatherCode = fetchWeatherCodeData(weatherCode);

    // Current Weather Icon Container
    const currentWeatherIconContainer = document.getElementById("current_weather_icon_container");
    // Check if Current Weather Icon exists
    const tempCurrentWeatherIcon = document.getElementById("current_weather_icon");
    var currentWeatherIconImage = null;
    if (tempCurrentWeatherIcon) {
        currentWeatherIconImage = tempCurrentWeatherIcon;
    }
    else {
        currentWeatherIconImage = document.createElement("img");
        currentWeatherIconImage.id = "current_weather_icon";
        currentWeatherIconContainer.append(currentWeatherIconImage);
    }

    currentWeatherIconImage.src = resultDataWeatherCode["weatherIconSrcPath"];

    // Current Weather Text
    const currentWeatherText = document.getElementById("current_weather_text");
    currentWeatherText.textContent = resultDataWeatherCode["weatherText"];

    // Current Temperature
    const currentTemperatureText = document.getElementById("current_temperature_text");
    const currentTemperatureValue = currentWeatherForecastData["temperature_2m"];
    const currentTemperatureUnit = currentWeatherForecastDataUnits["temperature_2m"];
    currentTemperatureText.textContent = `${currentTemperatureValue} ${currentTemperatureUnit}`;

    // Current Humidity Text
    const currentHumidityText = document.getElementById("current_humidity_text");
    const currentHumidityValue = currentWeatherForecastData["relative_humidity_2m"];
    const currentHumidityUnit = currentWeatherForecastDataUnits["relative_humidity_2m"];
    currentHumidityText.textContent = `${currentHumidityValue} ${currentHumidityUnit}`;

    // Current Wind Speed Text
    const currentWindSpeedText = document.getElementById("current_wind_speed_text");
    const currentWindSpeedValue = currentWeatherForecastData["wind_speed_10m"];
    const currentWindSpeedUnit = currentWeatherForecastDataUnits["wind_speed_10m"];
    currentWindSpeedText.textContent = `${currentWindSpeedValue} ${currentWindSpeedUnit}`;
}

function updateDailyWeatherForecastUI(dailyWeatherForecastData, dailyWeatherForecastDataUnits) {
    // This function updates the UI for the daily forecast.
    const weatherDailyForecastCardContainer = document.getElementById("weather_daily_forecast_card_container");
    const dailyForecastCardsCount = weatherDailyForecastCardContainer.childElementCount;

    if (dailyForecastCardsCount > 0) {
        while (weatherDailyForecastCardContainer.firstChild) {
            weatherDailyForecastCardContainer.removeChild(weatherDailyForecastCardContainer.firstChild);
        }
    }

    // // Store data for daily forecasts
    // Min and Max Temperatures
    const listDailyForecastWeatherCodes = dailyWeatherForecastData["weather_code"];
    const listDailyTemperaturesMin = dailyWeatherForecastData["temperature_2m_min"];
    const listDailyTemperaturesMax = dailyWeatherForecastData["temperature_2m_max"];
    const dailyTemperatureUnit = dailyWeatherForecastDataUnits["temperature_2m_min"];
    // Min and Max Humidity
    const listDailyHumidityMin = dailyWeatherForecastData["relative_humidity_2m_min"];
    const listDailyHumidityMax = dailyWeatherForecastData["relative_humidity_2m_max"];
    const dailyHumidityUnit = dailyWeatherForecastDataUnits["relative_humidity_2m_min"];
    // Min and Max Wind Speed
    const listDailyWindSpeedMin = dailyWeatherForecastData["wind_speed_10m_min"];
    const listDailyWindSpeedMax = dailyWeatherForecastData["wind_speed_10m_max"];
    const dailyWindSpeedUnit = dailyWeatherForecastDataUnits["wind_speed_10m_min"];

    // Daily Forecast Dates
    const listDailyForecastDates = dailyWeatherForecastData["time"];

    //
    for (let i = 0; i < listDailyForecastWeatherCodes.length; i++) {
        const weatherCode = listDailyForecastWeatherCodes[i];

        // Create Daily Forecast Card
        const weatherDailyForecastCard = document.createElement("div");
        weatherDailyForecastCard.className = "weather_daily_forecast_card";

        // Add Daily Forecast Card
        weatherDailyForecastCardContainer.append(weatherDailyForecastCard);

        const resultDataWeatherCode = fetchWeatherCodeData(weatherCode);
        // Add Weather Icon
        const weatherIconImage = document.createElement("img");
        weatherIconImage.src = resultDataWeatherCode["weatherIconSrcPath"];
        weatherDailyForecastCard.append(weatherIconImage);


        // Initialize extra data
        // Min and Max Temperature
        const dailyTemperatureMinValue = listDailyTemperaturesMin[i];
        const dailyTemperatureMaxValue = listDailyTemperaturesMax[i];
        const dailyTemperatureValue = `${dailyTemperatureMinValue} ${dailyTemperatureUnit} - ${dailyTemperatureMaxValue} ${dailyTemperatureUnit}`;

        // Min and Max Humidity
        const dailyHumidityMinValue = listDailyHumidityMin[i];
        const dailyHumidityMaxValue = listDailyHumidityMax[i];
        const dailyHumidityValue = `${dailyHumidityMinValue} ${dailyHumidityUnit} - ${dailyHumidityMaxValue} ${dailyHumidityUnit}`;

        // Min and Max Humidity
        const dailyWindSpeedMinValue = listDailyWindSpeedMin[i];
        const dailyWindSpeedMaxValue = listDailyWindSpeedMax[i];
        const dailyWindSpeedValue = `${dailyWindSpeedMinValue} ${dailyWindSpeedUnit} - ${dailyWindSpeedMaxValue} ${dailyWindSpeedUnit}`;

        const listExtraDataIconClassNames = ["fa-solid fa-temperature-empty", "fa-solid fa-water", "fa-solid fa-wind"];
        const listExtraDataValues = [dailyTemperatureValue, dailyHumidityValue, dailyWindSpeedValue];

        // Create extra data container
        for (let j = 0; j < listExtraDataIconClassNames.length; j++) {
            const iconClassName = listExtraDataIconClassNames[j];
            const extraDataValue = listExtraDataValues[j];
            
            const dailyForecastExtraDataContainer = document.createElement("div");
            dailyForecastExtraDataContainer.className = "daily_forecast_extra_data_container";
            const icon = document.createElement("i");
            icon.className = iconClassName;

            const extraDataValueText = document.createElement("p");
            extraDataValueText.textContent = extraDataValue;

            dailyForecastExtraDataContainer.append(icon);
            dailyForecastExtraDataContainer.append(extraDataValueText);
            // Add extra data container to Card
            weatherDailyForecastCard.append(dailyForecastExtraDataContainer);
        }

        // Add daily forecast date
        const dailyWeatherForecastDateText = document.createElement("p");
        dailyWeatherForecastDateText.className = "daily_weather_forecast_date_text";
        const dailyForecastDate = listDailyForecastDates[i];
        dailyWeatherForecastDateText.textContent = dailyForecastDate;
        weatherDailyForecastCard.append(dailyWeatherForecastDateText);


    }

}

function fetchWeatherCodeData(weatherCode) {
    // This function returns the weather icon and text data based on the weather code.
    const resultData = { "weatherText": null, "weatherIconSrcPath": null };

    const weatherCodes = {
        0: "Clear Sky",
        1: "Mainly Clear",
        2: "Partly Cloudly",
        3: "Overcast",
        45: "Fog",
        48: "Depositing Rime Fog",
        51: "Light Drizzle",
        53: "Moderate Drizzle",
        55: "Dense Drizzle",
        56: "Light Freezing Drizzle",
        57: "Dense Freezing Drizzle",
        61: "Slight Rain",
        63: "Moderate Rain",
        65: "Heavy Rain",
        66: "Light Freezing Rain",
        67: "Heavy Freezing Rain",
        71: "Slight Snow Fall",
        73: "Moderate Snow Fall",
        75: "Heavy Snow Fall",
        77: "Snow Grains",
        80: "Slight Rain Showers",
        81: "Moderate Rain Showers",
        82: "Violent Rain Showers",
        85: "Slight Snow Showers",
        86: "Heavy Snow Showers",
        95: "Thunderstorm",
        96: "Thunderstorm with Slight Hail",
        97: "Thunderstorm with Heavy Hail"
    }

    resultData.weatherText = weatherCodes[weatherCode];

    var weatherIconName = null;
    const weatherIconsFolderPath = "./assets/images/weather_icons";

    if ([0, 1].includes(weatherCode)) {
        weatherIconName = "clear_sky.png";
    }
    else if ([2].includes(weatherCode)) {
        weatherIconName = "cloudy.png";
    }
    else if ([3, 45, 48].includes(weatherCode)) {
        weatherIconName = "cloud.png";
    }
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86].includes(weatherCode)) {
        weatherIconName = "rain.png";
    }
    else if ([71, 73, 75, 77].includes(weatherCode)) {
        weatherIconName = "snowflake.png";
    }
    else if ([95, 96, 97].includes(weatherCode)) {
        weatherIconName = "thunder.png";
    }

    resultData.weatherIconSrcPath = weatherIconsFolderPath + "/" + weatherIconName;


    return resultData;
}