## Функционал
- Поиск достопримечательностей рядом с геолокацией пользователя.
- Отображение текущей погоды рядом с геолокацией пользователя (API ключ истекает 13.03.2025).
- Добавление пользовательских маркеров на карту с возможностью прикрепления изображения.
- Построение маршрутов к выбранным маркерам.

## Установка и запуск

1. При необходимости, установите node.js с официального сайта https://nodejs.org/

2. Перейдите в директорию проекта с помощью команды в терминале:
   cd адрес репозитория

3. При необходимости, установите зависимости:
   npm install express node-fetch

4. Добавьте поддержку CORS с помощью команды:
   npm install cors

5. Запустите прокси-сервер погоды с помощью команды:
   node start

6. Откройте index.html в браузере
