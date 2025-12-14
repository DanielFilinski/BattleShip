# Аудио файлы для вопросов

Поместите аудио файлы для вопросов в эту папку.

## Формат
- Формат: MP3, WAV, OGG
- Название файлов должно совпадать с тем, что указано в `public/data/questions.json` в поле `mediaPath`

## Пример

В questions.json:
```json
{
  "id": "q30",
  "type": "audio",
  "mediaPath": "audio/song1.mp3"
}
```

Файл должен находиться: `public/media/audio/song1.mp3`
