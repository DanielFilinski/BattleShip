import { QuestionType } from '../types/question';

interface MediaPlayerProps {
  type: QuestionType;
  mediaPath?: string;
}

export function MediaPlayer({ type, mediaPath }: MediaPlayerProps) {
  if (!mediaPath || (type !== 'audio' && type !== 'video')) {
    return null;
  }

  const fullPath = `/media/${mediaPath}`;

  if (type === 'audio') {
    return (
      <div className="my-6 bg-ocean-50 rounded-xl p-6">
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="text-2xl">🎵</span>
          <span className="text-lg font-semibold text-ocean-700">
            Прослушайте аудио
          </span>
        </div>
        <audio
          controls
          className="w-full"
          src={fullPath}
          preload="metadata"
        >
          Ваш браузер не поддерживает аудио.
        </audio>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="my-6 bg-ocean-50 rounded-xl p-6">
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="text-2xl">🎬</span>
          <span className="text-lg font-semibold text-ocean-700">
            Посмотрите видео
          </span>
        </div>
        <video
          controls
          className="w-full rounded-lg max-h-96"
          src={fullPath}
          preload="metadata"
        >
          Ваш браузер не поддерживает видео.
        </video>
      </div>
    );
  }

  return null;
}
