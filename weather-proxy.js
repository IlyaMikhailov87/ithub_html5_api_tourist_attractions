import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());

const PORT = 3000;

app.get('/weather', async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = '319393e9-0738-44c5-8434-17efe5d02d50'; // API-ключ Яндекс.Погоды. Истекает 13 мар. 2025 г.

    try {
        const apiUrl = `https://api.weather.yandex.ru/v2/forecast?lat=${lat}&lon=${lon}&lang=ru_RU`;
        const response = await fetch(apiUrl, {
            headers: {
                'X-Yandex-API-Key': apiKey
            },
        })

        if (!response.ok) {
            throw new Error('Ошибка при получении данных о погоде');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Ошибка при получении данных о погоде:", error);
        res.status(500).json({ error: 'Не удалось получить данные о погоде' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
