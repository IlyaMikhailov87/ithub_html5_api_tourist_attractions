let defaultCenter = [55.751244, 37.618423]; // Центр Москвы (по умолчанию)
let isAddingMarker = false; // Флаг для отслеживания режима добавления маркера

// Функция для проверки поддежки необходимых спецификаций HTML5 браузером пользователя
function checkHTML5Support() {
    const features = {
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        canvas: !!document.createElement('canvas').getContext,
        geolocation: 'geolocation' in navigator,
    };

    for (const [feature, isSupported] of Object.entries(features)) {
        console.log(`${feature}: ${isSupported ? 'Supported' : 'Not supported'}`);
    }
}

//Функция поиска достопримечательностей
function findTouristAttractions(userLocation, map) {
    let searchControl = new ymaps.control.SearchControl({
        options: {
            provider: 'yandex#search',
            results: 50,
            noPlacemark: true,
            boundedBy: map.getBounds(),
            strictBounds: false
        }
    });
    map.controls.add(searchControl);
    searchControl.search("Достопримечательность");
}

// Функция для определения локации пользователя
function getUserLocation(myMap, routePanelControl) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = [position.coords.latitude, position.coords.longitude];
                myMap.setCenter(userLocation, 15);
                let currentLocationMarker = new ymaps.Placemark(userLocation, {
                    balloonContent: 'Вы здесь!',
                });
                myMap.geoObjects.add(currentLocationMarker);
                localStorage.setItem('lastLocation', JSON.stringify(userLocation));
                routePanelControl.routePanel.state.set({
                    from: userLocation,
                    toEnabled: true
                });
                findTouristAttractions(userLocation, myMap);
                displayWeather(userLocation);
            },
            (error) => {
                alert("Не удалось определить ваше местоположение. Карта покажет общую область.");
                console.error("Геолокация: ошибка определения местоположения", error);
                myMap.setCenter(defaultCenter, 12);
                findTouristAttractions(defaultCenter, myMap);
                displayWeather(defaultCenter);
            }
        );
    } else {
        alert("Ваш браузер не поддерживает геолокацию. Карта покажет общую область.");
        myMap.setCenter(defaultCenter, 12);
        findTouristAttractions(defaultCenter, myMap);
        displayWeather(defaultCenter);
    }
}

// Функция для отображения погоды
function displayWeather(coords) {
    const apiUrl = `http://localhost:3000/weather?lat=${coords[0]}&lon=${coords[1]}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении данных о погоде');
            }
            return response.json();
        })
        .then(data => {

            const date_time = new Date(data.now_dt).toLocaleString();
            const abbr = data.info.tzinfo.abbr;
            const temperature = data.fact.temp;
            const humidity = data.fact.humidity;
            const picture = data.fact.icon;
            const weatherData = `Температура: ${temperature}°C;   Влажность: ${humidity}%`;

            document.getElementById('weather-picture').src = `https://yastatic.net/weather/i/icons/funky/dark/${picture}.svg`
            document.getElementById('weather-datе').innerHTML = `Погода на ${date_time} ${abbr}:`;
            document.getElementById('weather-data').innerHTML = weatherData;
        })
        .catch(error => console.error("Ошибка при получении данных о погоде:", error));
}

//Функция добавления маркера на карту, построения маршрута до маркера 
function addMarkerToMap(marker, map, routePanelControl) {
    const currentTime = new Date().toLocaleString();
    let placemarkContent = `<b>${marker.name}</b><br>${currentTime}`;
    if (marker.photo) {
        placemarkContent += `<br><img src="${marker.photo}" alt="Фото маркера" style="width:100px;height:auto;">`;
    }

    let placemark = new ymaps.Placemark(marker.coords, {
        balloonContent: placemarkContent,
        hintContent: "Нажмите, чтобы построить маршрут"
    });

    placemark.events.add('click', function () {
        routePanelControl.routePanel.state.set({
            to: marker.coords
        });
    });

    map.geoObjects.add(placemark);
}

// Функция сохранения маркера в localStorage
function saveMarker(marker) {
    let markers = JSON.parse(localStorage.getItem('markers')) || [];
    markers.push(marker);
    localStorage.setItem('markers', JSON.stringify(markers));
}

// Функция добавления маркеров из localStorage на карту
function loadMarkers(map, routePanelControl) {
    let markers = JSON.parse(localStorage.getItem('markers')) || [];
    markers.forEach(marker => {
        addMarkerToMap(marker, map, routePanelControl);
    });
}

function init() {
    checkHTML5Support();
    let myMap = new ymaps.Map('map-test', {
        center: defaultCenter,
        zoom: 12,
        controls: ['routePanelControl', 'zoomControl']
    });

    myMap.controls.get('zoomControl').options.set({
        position: { right: 10, top: 50 }
    });

    let routePanelControl = myMap.controls.get('routePanelControl');
    routePanelControl.routePanel.options.set({
        types: { auto: true, masstransit: true, bicycle: true, pedestrian: true }
    });

    loadMarkers(myMap, routePanelControl);

    const lastLocation = JSON.parse(localStorage.getItem('lastLocation'));
    if (lastLocation) {
        myMap.setCenter(lastLocation, 15);
        let currentLocationMarker = new ymaps.Placemark(lastLocation, {
            balloonContent: 'Последнее известное местоположение',
        });
        myMap.geoObjects.add(currentLocationMarker);
        findTouristAttractions(lastLocation, myMap);
        displayWeather(lastLocation);
    } else {
        getUserLocation(myMap, routePanelControl);
    }

    document.getElementById('add-marker').onclick = () => {
        isAddingMarker = !isAddingMarker;
        const button = document.getElementById('add-marker');
        button.style.backgroundColor = isAddingMarker ? 'lightgreen' : '';
        button.textContent = isAddingMarker ? 'Закончить добавление маркера' : 'Добавить маркер';
        alert(isAddingMarker ? 'Кликните на карту, чтобы добавить маркер.' : 'Режим добавления маркера отключен.');
    };

    myMap.events.add('click', function (e) {
        if (isAddingMarker) {
            let coords = e.get('coords');
            let name = prompt("Введите название маркера:");
            const fileInput = document.getElementById('imageUpload');
            const file = fileInput.files[0];

            if (name) {
                const reader = new FileReader();
                reader.onload = function () {
                    // Вывод в консоль результата чтения файла
                    console.log("Файл загружен:", reader.result);

                    // Добавление маркера на карту с изображением
                    addMarkerToMap({ coords: coords, name: name, photo: reader.result }, myMap, routePanelControl);
                    saveMarker({ coords: coords, name: name, photo: reader.result });
                };

                if (file) {
                    reader.readAsDataURL(file);
                } else {
                    // Если файл не выбран, добавляем маркер без фото
                    addMarkerToMap({ coords: coords, name: name, photo: null }, myMap, routePanelControl);
                    saveMarker({ coords: coords, name: name, photo: null });
                }

                isAddingMarker = false;
                const button = document.getElementById('add-marker');
                button.style.backgroundColor = '';
                button.textContent = 'Добавить маркер';
            }
        }
    });
}

ymaps.ready(init);
