
import { Download } from "lucide-react";

import "../message-video-download.css";


type VideoDownloadButtonProps = {
  videoId: string;
};


export default function VideoDownloadButton({
  videoId,
}: VideoDownloadButtonProps) {
  // Backend używa 32-znakowych identyfikatorów
  // składających się z cyfr i liter a-f.

  if (!/^[a-f0-9]{32}$/.test(videoId)) {
    return null;
  }

  const downloadUrl =
    `/api/videos/${videoId}/download`;

  const filename =
    `socalled-${videoId.slice(0, 8)}.mp4`;

  return (
    <a
      className="socalled-video-download"
      href={downloadUrl}
      download={filename}
      onClick={(event) => {
        // Kliknięcie nie powinno uruchamiać
        // gestów przypisanych do wiadomości.
        event.stopPropagation();
      }}
      aria-label="Pobierz film w formacie MP4"
      title="Pobierz film jako MP4"
    >
      <Download size={16} />

      <span>
        Pobierz MP4
      </span>
    </a>
  );
}
