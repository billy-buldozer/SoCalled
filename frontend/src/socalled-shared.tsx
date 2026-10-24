import { Camera, Code2, Coffee, Crown, Gamepad2, Globe2, Hash, LockKeyhole, Music2, ShieldCheck, UserRound } from "lucide-react";

export type RoomIcon =
  | "hash"
  | "game"
  | "code"
  | "music"
  | "camera"
  | "coffee"
  | "globe";

export type MobileScreen = "rooms" | "chat" | "details";

export type DetailsTab = "about" | "settings";

export type SocketStatus = "connecting" | "online" | "offline";

export type MemberRole = "owner" | "moderator" | "member";

export type ServerRoom = {
  id: string;
  name: string;
  icon: RoomIcon;
  description: string;
  topic: string;
  image: string | null;
  isPrivate: boolean;
  ownerId: string | null;
  memberCount: number;
  onlineCount: number;
};

export type Room = ServerRoom & {
  lastMessage: string;
  lastTime: string;
  unread: number;
};

export type RoomMember = {
  clientId: string;
  username: string;
  nickname: string | null;
  displayName: string;
  role: MemberRole;
  online: boolean;
};

export type ReplyPreview = {
  id: string;
  clientId: string;
  author: string;
  text: string;
  deleted: boolean;
};

export type ForwardOrigin = {
  roomId: string;
  roomName: string;
  author: string;
  messageId: string;
};

export type Reactions = Record<string, string[]>;

export type ChatMessage = {
  id: string;
  roomId: string;
  clientId: string;
  author: string;
  time: string;
  text: string;
  image: string | null;
  videoId: string | null;
  mine: boolean;
  editedAt: string | null;
  replyTo: ReplyPreview | null;
  reactions: Reactions;
  forwardedFrom: ForwardOrigin | null;
};

export type ServerMessage = {
  id: string;
  roomId: string;
  clientId: string;
  author: string;
  time: string;
  text: string;
  image?: string | null;
  videoId?: string | null;
  editedAt?: string | null;
  replyTo?: ReplyPreview | null;
  reactions?: Reactions;
  forwardedFrom?: ForwardOrigin | null;
};

export type TypingUser = {
  clientId: string;
  displayName: string;
};

export type ImageViewer = {
  image: string;
  author: string;
  messageId: string;
};

export type ForwardNotice = {
  roomId: string;
  roomName: string;
};

export type LastTap = {
  messageId: string;
  time: number;
  x: number;
  y: number;
};

export type TouchStart = {
  x: number;
  y: number;
};

export type HeartBurst = {
  messageId: string;
  sequence: number;
};

export type VideoUploadResponse = {
  id: string;
  url: string;
  size: number;
  mimeType: string;
};

export const initialRooms: Room[] = [
  {
    id: "general",
    name: "General",
    icon: "hash",
    description: "Główne miejsce spotkań społeczności SoCalled.",
    topic: "Wszystko zaczyna się od rozmowy.",
    image: null,
    isPrivate: false,
    ownerId: null,
    memberCount: 0,
    onlineCount: 0,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
  {
    id: "gaming",
    name: "Gaming",
    icon: "game",
    description: "Gry, wspólne rozgrywki i dyskusje.",
    topic: "Jeszcze jeden mecz?",
    image: null,
    isPrivate: false,
    ownerId: null,
    memberCount: 0,
    onlineCount: 0,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
  {
    id: "dev",
    name: "Dev Zone",
    icon: "code",
    description: "Programowanie, projekty i nowe technologie.",
    topic: "Build something amazing.",
    image: null,
    isPrivate: false,
    ownerId: null,
    memberCount: 0,
    onlineCount: 0,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
  {
    id: "music",
    name: "Muzyka",
    icon: "music",
    description: "Dziel się ulubionymi utworami i albumami.",
    topic: "Co dzisiaj gra w słuchawkach?",
    image: null,
    isPrivate: false,
    ownerId: null,
    memberCount: 0,
    onlineCount: 0,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
  {
    id: "photo",
    name: "Fotografia",
    icon: "camera",
    description: "Zdjęcia, inspiracje i kreatywne pomysły.",
    topic: "Uchwyć chwilę.",
    image: null,
    isPrivate: false,
    ownerId: null,
    memberCount: 0,
    onlineCount: 0,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
  {
    id: "offtopic",
    name: "Off-topic",
    icon: "coffee",
    description: "Luźne rozmowy bez konkretnego tematu.",
    topic: "Po prostu porozmawiajmy.",
    image: null,
    isPrivate: false,
    ownerId: null,
    memberCount: 0,
    onlineCount: 0,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
  {
    id: "world",
    name: "Odkrycia",
    icon: "globe",
    description: "Ciekawe linki, miejsca i znaleziska z internetu.",
    topic: "Zawsze jest coś do odkrycia.",
    image: null,
    isPrivate: false,
    ownerId: null,
    memberCount: 0,
    onlineCount: 0,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
];

export const themeOptions = [
  {
    id: "emerald",
    label: "Emerald",
    hex: "#55df91",
    rgb: "85, 223, 145",
  },
  {
    id: "mint",
    label: "Mint",
    hex: "#65dbc5",
    rgb: "101, 219, 197",
  },
  {
    id: "lime",
    label: "Lime",
    hex: "#b4db63",
    rgb: "180, 219, 99",
  },
] as const;

export type ThemeId = (typeof themeOptions)[number]["id"];

export const availableIcons: RoomIcon[] = [
  "hash",
  "game",
  "code",
  "music",
  "camera",
  "coffee",
  "globe",
];

export const availableReactions = [
  "❤️", "😂", "🔥", "👍", "😮", "🎉",
];

export const RECONNECT_DELAY = 2000;

export const CONNECT_TIMEOUT = 10000;

export const HEARTBEAT_INTERVAL = 15000;

export const HEARTBEAT_TIMEOUT = 10000;

export const TYPING_STOP_DELAY = 1500;

export const DOUBLE_TAP_INTERVAL = 480;

export const DOUBLE_TAP_DISTANCE = 65;

export const MAX_TOUCH_MOVEMENT = 18;

export const SINGLE_IMAGE_CLICK_DELAY = 490;

export const HEART_ANIMATION_DURATION = 800;

export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

export function makeRequestId(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

export function formatMessageTime(value: string): string {
  return new Date(value).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mergeRoom(
  incoming: ServerRoom,
  existing?: Room
): Room {
  return {
    ...incoming,
    lastMessage:
      existing?.lastMessage ?? "Brak wiadomości",
    lastTime: existing?.lastTime ?? "—",
    unread: existing?.unread ?? 0,
  };
}

export function messagePreview(
  message: ServerMessage | null
): string {
  if (!message) {
    return "Brak wiadomości";
  }

  if (message.videoId) {
    return message.text
      ? `🎬 ${message.text}`
      : "🎬 Film";
  }

  if (message.image) {
    return message.text
      ? `📷 ${message.text}`
      : "📷 Zdjęcie";
  }

  return message.text;
}

export function roleLabel(role: MemberRole): string {
  if (role === "owner") return "Właściciel";
  if (role === "moderator") return "Moderator";
  return "Uczestnik";
}

export function RoleIcon({ role }: { role: MemberRole }) {
  if (role === "owner") return <Crown size={14} />;
  if (role === "moderator") return <ShieldCheck size={14} />;
  return <UserRound size={14} />;
}

export function RoomGlyph({ icon }: { icon: RoomIcon }) {
  const props = {
    size: 24,
    strokeWidth: 1.8,
  };

  switch (icon) {
    case "game":
      return <Gamepad2 {...props} />;
    case "code":
      return <Code2 {...props} />;
    case "music":
      return <Music2 {...props} />;
    case "camera":
      return <Camera {...props} />;
    case "coffee":
      return <Coffee {...props} />;
    case "globe":
      return <Globe2 {...props} />;
    default:
      return <Hash {...props} />;
  }
}

export function RoomVisual({ room }: { room: Room }) {
  if (room.image) {
    return (
      <img
        className="room-custom-image"
        src={room.image}
        alt=""
      />
    );
  }

  if (room.isPrivate) {
    return <LockKeyhole size={24} />;
  }

  return <RoomGlyph icon={room.icon} />;
}

export function videoUrl(id: string): string {
  return `/api/videos/${encodeURIComponent(id)}`;
}

export function formatFileSize(size: number): string {
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function videoMimeType(file: File): string | null {
  const mimeType = file.type.toLowerCase();

  if (
    mimeType === "video/mp4" ||
    mimeType === "video/webm" ||
    mimeType === "video/quicktime"
  ) {
    return mimeType;
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".mp4")) return "video/mp4";
  if (lowerName.endsWith(".webm")) return "video/webm";
  if (lowerName.endsWith(".mov")) return "video/quicktime";

  return null;
}

export async function downloadImage(
  imageData: string,
  messageId: string
): Promise<void> {
  const image = new Image();
  image.src = imageData;

  await image.decode();

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("Nieprawidłowe wymiary zdjęcia.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Nie można utworzyć obrazu.");
  }

  context.drawImage(image, 0, 0);

  const pngBlob = await new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.type !== "image/png") {
            reject(
              new Error("Nie udało się utworzyć PNG.")
            );
            return;
          }

          resolve(blob);
        },
        "image/png"
      );
    }
  );

  const objectUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download =
    `socalled-${messageId.slice(0, 8)}.png`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 4000);
}

export function prepareRoomImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) {
      reject(
        new Error("Zdjęcie może mieć maksymalnie 8 MB.")
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("Wybierz plik graficzny."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const canvas =
          document.createElement("canvas");

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Nie można przetworzyć zdjęcia."
          );
        }

        for (const maxSize of [
          512, 400, 320, 256, 192,
        ]) {
          const scale = Math.min(
            1,
            maxSize / Math.max(
              image.width,
              image.height
            )
          );

          canvas.width = Math.max(
            1,
            Math.round(image.width * scale)
          );

          canvas.height = Math.max(
            1,
            Math.round(image.height * scale)
          );

          context.clearRect(
            0, 0, canvas.width, canvas.height
          );

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          let result = canvas.toDataURL(
            "image/webp",
            0.72
          );

          if (!result.startsWith("data:image/webp;")) {
            result = canvas.toDataURL(
              "image/jpeg",
              0.72
            );
          }

          if (result.length <= 235_000) {
            resolve(result);
            return;
          }
        }

        reject(
          new Error("Nie udało się zmniejszyć zdjęcia.")
        );
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Nie można odczytać zdjęcia."));
    };

    image.src = objectUrl;
  });
}

export function prepareMessageImage(
  file: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const acceptedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!acceptedTypes.includes(file.type)) {
      reject(
        new Error(
          "Obsługiwane formaty: JPG, PNG i WebP."
        )
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      reject(
        new Error(
          "Plik wejściowy może mieć maksymalnie 10 MB."
        )
      );
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        if (
          !image.naturalWidth ||
          !image.naturalHeight
        ) {
          throw new Error(
            "Nie udało się odczytać wymiarów zdjęcia."
          );
        }

        const canvas =
          document.createElement("canvas");

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Nie udało się przygotować zdjęcia."
          );
        }

        const sizes = [
          960, 800, 640, 512, 400, 320, 240,
        ];

        const qualities = [
          0.82, 0.72, 0.62, 0.5,
        ];

        for (const maxSize of sizes) {
          const scale = Math.min(
            1,
            maxSize / Math.max(
              image.naturalWidth,
              image.naturalHeight
            )
          );

          canvas.width = Math.max(
            1,
            Math.round(
              image.naturalWidth * scale
            )
          );

          canvas.height = Math.max(
            1,
            Math.round(
              image.naturalHeight * scale
            )
          );

          for (const quality of qualities) {
            context.clearRect(
              0,
              0,
              canvas.width,
              canvas.height
            );

            context.drawImage(
              image,
              0,
              0,
              canvas.width,
              canvas.height
            );

            let result = canvas.toDataURL(
              "image/webp",
              quality
            );

            if (
              !result.startsWith(
                "data:image/webp;"
              )
            ) {
              context.fillStyle = "#ffffff";

              context.globalCompositeOperation =
                "destination-over";

              context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
              );

              context.globalCompositeOperation =
                "source-over";

              result = canvas.toDataURL(
                "image/jpeg",
                quality
              );
            }

            if (result.length <= 235_000) {
              resolve(result);
              return;
            }
          }
        }

        reject(
          new Error(
            "Zdjęcie jest zbyt złożone do kompresji."
          )
        );
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Nie można odczytać zdjęcia."));
    };

    image.src = objectUrl;
  });
}
