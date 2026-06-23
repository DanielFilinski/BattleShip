import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface RoomQrButtonProps {
  roomId: string;
}

// Плавающая кнопка QR-кода для подключения к комнате (правый нижний угол).
// Используется в режиме наблюдателя: даёт открыть QR на весь экран, чтобы
// окружающие могли отсканировать его и зайти в комнату.
export function RoomQrButton({ roomId }: RoomQrButtonProps) {
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState(window.location.origin);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // В офлайн-режиме наблюдатель может быть открыт через localhost — тогда ссылка
  // бесполезна для телефонов. Спрашиваем у локального сервера его адрес в Wi-Fi.
  useEffect(() => {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return;
    fetch('/api/server-info')
      .then(r => (r.ok ? r.json() : null))
      .then(info => {
        if (info?.host) setOrigin(`${window.location.protocol}//${info.host}:${info.port}`);
      })
      .catch(() => {
        /* офлайн-сервер недоступен — оставляем как есть */
      });
  }, []);

  const shareUrl = `${origin}/room/${roomId}`;

  // QR генерируется локально (работает офлайн). Большое разрешение — чтобы
  // оставался чётким на весь экран.
  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 1024, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [shareUrl]);

  return (
    <>
      {/* Плавающая кнопка — правый нижний угол, не мешает полю и панели */}
      <button
        onClick={() => setShowQr(true)}
        className="fixed bottom-4 right-4 z-30 w-14 h-14 flex items-center justify-center rounded-full bg-ocean-600 hover:bg-ocean-500 text-white text-2xl shadow-xl active:scale-95 transition-transform"
        title="QR-код для подключения к комнате"
        aria-label="Показать QR-код для подключения"
      >
        📱
      </button>

      {/* QR на весь экран */}
      {showQr && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white p-4 sm:p-8"
          onClick={() => setShowQr(false)}
        >
          {/* Закрыть — в углу */}
          <button
            onClick={() => setShowQr(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-ocean-400 hover:text-ocean-700 text-4xl font-bold leading-none transition-colors"
            title="Закрыть"
            aria-label="Закрыть"
          >
            ✕
          </button>

          <div className="text-ocean-800 font-bold text-2xl sm:text-3xl mb-1">Отсканируй для входа</div>
          <div className="text-ocean-500 text-lg sm:text-xl mb-4 font-mono tracking-widest">{roomId}</div>

          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR код"
              className="w-[80vmin] h-[80vmin] max-w-[680px] max-h-[680px] object-contain rounded-2xl"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="w-[80vmin] h-[80vmin] max-w-[680px] max-h-[680px] rounded-2xl bg-ocean-50 flex items-center justify-center text-ocean-400 text-xl">
              Генерация QR…
            </div>
          )}

          <p className="mt-4 text-base sm:text-lg text-ocean-500 break-all text-center max-w-xl px-4">{shareUrl}</p>
          <div className="mt-2 text-ocean-400 text-sm">Нажми в любом месте, чтобы закрыть</div>
        </div>
      )}
    </>
  );
}
