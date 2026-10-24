
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ChangeEvent } from "react";

import {
  ArrowLeft,
  Bell,
  BellOff,
  Camera,
  Check,
  ChevronRight,
  Code2,
  Coffee,
  Gamepad2,
  Globe2,
  Hash,
  ImagePlus,
  Info,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  WifiOff,
  X,
} from "lucide-react";

import "./App.css";
import "./message-actions.css";
import "./room-customization.css";

// ==========================================
// TYPY
// ==========================================

type RoomIcon =
  | "hash"
  | "game"
  | "code"
  | "music"
  | "camera"
  | "coffee"
  | "globe";

type MobileScreen = "rooms" | "chat" | "details";
type DetailsTab = "about" | "settings";
type SocketStatus = "connecting" | "online" | "offline";

type ServerRoom = {
  id: string;
  name: string;
  icon: RoomIcon;
  description: string;
  topic: string;
  image: string | null;
  isPrivate: boolean;
  ownerId: string | null;
};

type Room = ServerRoom & {
  members: number;
  online: number;
  lastMessage: string;
  lastTime: string;
  unread: number;
};

type ChatMessage = {
  id: string;
  roomId: string;
  author: string;
  time: string;
  text: string;
  mine: boolean;
  editedAt: string | null;
};

type ServerMessage = {
  id: string;
  roomId: string;
  clientId: string;
  author: string;
  time: string;
  text: string;
  editedAt?: string | null;
};

// ==========================================
// POKOJE POCZĄTKOWE
// ==========================================

const initialRooms: Room[] = [
  {
    id: "general",
    name: "General",
    icon: "hash",
    description: "Główne miejsce spotkań społeczności SoCalled.",
    topic: "Wszystko zaczyna się od rozmowy.",
    image: null,
    isPrivate: false,
    ownerId: null,
    members: 28,
    online: 8,
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
    members: 19,
    online: 6,
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
    members: 15,
    online: 5,
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
    members: 24,
    online: 4,
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
    members: 12,
    online: 3,
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
    members: 31,
    online: 9,
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
    members: 11,
    online: 2,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
  },
];

// ==========================================
// MOTYWY
// ==========================================

const themeOptions = [
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

type ThemeId = (typeof themeOptions)[number]["id"];

const availableIcons: RoomIcon[] = [
  "hash",
  "game",
  "code",
  "music",
  "camera",
  "coffee",
  "globe",
];

// ==========================================
// WEBSOCKET
// ==========================================

const RECONNECT_DELAY = 2000;
const CONNECT_TIMEOUT = 10000;
const HEARTBEAT_INTERVAL = 15000;
const HEARTBEAT_TIMEOUT = 10000;

// ==========================================
// POMOCNICZE FUNKCJE
// ==========================================

function makeRequestId(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

function formatMessageTime(value: string): string {
  return new Date(value).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mergeRoom(
  incoming: ServerRoom,
  existing?: Room
): Room {
  return {
    ...incoming,
    members: existing?.members ?? 1,
    online: existing?.online ?? 1,
    lastMessage: existing?.lastMessage ?? "Brak wiadomości",
    lastTime: existing?.lastTime ?? "—",
    unread: existing?.unread ?? 0,
  };
}

function RoomGlyph({ icon }: { icon: RoomIcon }) {
  const props = { size: 24, strokeWidth: 1.8 };

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

function RoomVisual({ room }: { room: Room }) {
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

// ==========================================
// KOMPRESJA ZDJĘCIA W PRZEGLĄDARCE
// ==========================================

function prepareRoomImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Zdjęcie może mieć maksymalnie 8 MB."));
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
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Nie można przetworzyć zdjęcia.");
        }

        // Zmniejszamy zdjęcie, aż zmieści się
        // w limicie pamięci backendu.
        for (const maxSize of [512, 400, 320, 256, 192]) {
          const scale = Math.min(
            1,
            maxSize / Math.max(image.width, image.height)
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
            0.72
          );

          // Safari lub starsza przeglądarka
          // może nie obsługiwać zapisu WEBP.
          if (!result.startsWith("data:image/webp;")) {
            result = canvas.toDataURL(
              "image/jpeg",
              0.72
            );
          }

          if (result.length <= 310_000) {
            resolve(result);
            return;
          }
        }

        reject(
          new Error(
            "Nie udało się wystarczająco zmniejszyć zdjęcia."
          )
        );
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Przeglądarka nie potrafi odczytać tego zdjęcia."
        )
      );
    };

    image.src = objectUrl;
  });
}

// ==========================================
// GŁÓWNA APLIKACJA
// ==========================================

function App() {
  // ========================================
  // GŁÓWNY STAN
  // ========================================

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState("general");

  const [mobileScreen, setMobileScreen] =
    useState<MobileScreen>("rooms");

  const [detailsTab, setDetailsTab] =
    useState<DetailsTab>("about");

  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  const [themeId, setThemeId] = useState<ThemeId>("emerald");
  const [notifications, setNotifications] = useState(true);

  // ========================================
  // WEBSOCKET
  // ========================================

  const [socketStatus, setSocketStatus] =
    useState<SocketStatus>("connecting");

  const [connectionVersion, setConnectionVersion] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const createRequestRef = useRef<string | null>(null);
  const saveRequestRef = useRef<string | null>(null);

  // ========================================
  // EDYCJA WIADOMOŚCI
  // ========================================

  const [actionMenuId, setActionMenuId] =
    useState<string | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingText, setEditingText] = useState("");

  const [pendingEditId, setPendingEditId] =
    useState<string | null>(null);

  const [actionError, setActionError] = useState("");

  // ========================================
  // PERSONALIZACJA POKOJU
  // ========================================

  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
  const [roomIcon, setRoomIcon] = useState<RoomIcon>("hash");
  const [roomImage, setRoomImage] = useState<string | null>(null);

  const [roomSaving, setRoomSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [roomSuccess, setRoomSuccess] = useState("");

  // ========================================
  // TYMCZASOWA TOŻSAMOŚĆ
  // ========================================

  const [clientId] = useState(() => {
    const saved = sessionStorage.getItem(
      "socalled_client_id"
    );

    if (saved) return saved;

    const generated = makeRequestId();

    sessionStorage.setItem(
      "socalled_client_id",
      generated
    );

    return generated;
  });

  const [nickname] = useState(() => {
    const saved = sessionStorage.getItem(
      "socalled_nickname"
    );

    if (saved) return saved;

    const generated =
      "Gosc-" + Math.random().toString(36).slice(2, 6);

    sessionStorage.setItem(
      "socalled_nickname",
      generated
    );

    return generated;
  });

  // ========================================
  // AKTUALNY POKÓJ
  // ========================================

  const activeRoom =
    rooms.find((room) => room.id === activeRoomId) ??
    rooms[0];

  const canEditRoom =
    activeRoom.ownerId === null ||
    activeRoom.ownerId === clientId;

  const theme =
    themeOptions.find((option) => option.id === themeId) ??
    themeOptions[0];

  const roomMessages = useMemo(
    () =>
      messages.filter(
        (message) => message.roomId === activeRoomId
      ),
    [messages, activeRoomId]
  );

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.name
          .toLocaleLowerCase("pl-PL")
          .includes(search.toLocaleLowerCase("pl-PL"))
      ),
    [rooms, search]
  );

  // ========================================
  // SYNCHRONIZACJA EDYTORA Z POKOJEM
  // ========================================

  useEffect(() => {
    setRoomName(activeRoom.name);
    setRoomDescription(activeRoom.description);
    setRoomTopic(activeRoom.topic);
    setRoomIcon(activeRoom.icon);
    setRoomImage(activeRoom.image);
    setRoomError("");
    setRoomSuccess("");
  }, [
    activeRoom.id,
    activeRoom.name,
    activeRoom.description,
    activeRoom.topic,
    activeRoom.icon,
    activeRoom.image,
  ]);

  // ========================================
  // PONOWNE POŁĄCZENIE
  // ========================================

  function reconnectNow() {
    setSocketStatus("connecting");
    setConnectionVersion((previous) => previous + 1);
  }

  // ========================================
  // WEBSOCKET
  // ========================================

  useEffect(() => {
    let disposed = false;
    let currentSocket: WebSocket | null = null;

    let reconnectTimer: number | undefined;
    let connectTimer: number | undefined;
    let heartbeatTimer: number | undefined;
    let pongTimer: number | undefined;

    const params = new URLSearchParams({
      client_id: clientId,
      nickname,
    });

    const protocol =
      window.location.protocol === "https:" ? "wss" : "ws";

    // Lokalny serwer na laptopie.
    // Telefon korzysta z adresu IP laptopa.
    const url =
      `${protocol}://${window.location.hostname}:8000` +
      `/ws/rooms/${encodeURIComponent(activeRoomId)}` +
      `?${params.toString()}`;

    function convertMessage(
      message: ServerMessage
    ): ChatMessage {
      return {
        id: message.id,
        roomId: message.roomId,
        author: message.author,
        time: formatMessageTime(message.time),
        text: message.text,
        mine: message.clientId === clientId,
        editedAt: message.editedAt ?? null,
      };
    }

    function updateRoomPreview(
      latest: ServerMessage | null
    ) {
      setRooms((previous) =>
        previous.map((room) =>
          room.id === activeRoomId
            ? {
                ...room,
                lastMessage:
                  latest?.text ?? "Brak wiadomości",
                lastTime:
                  latest
                    ? formatMessageTime(latest.time)
                    : "—",
              }
            : room
        )
      );
    }

    function upsertRoom(incoming: ServerRoom) {
      setRooms((previous) => {
        const existing = previous.find(
          (room) => room.id === incoming.id
        );

        if (existing) {
          return previous.map((room) =>
            room.id === incoming.id
              ? mergeRoom(incoming, room)
              : room
          );
        }

        return [
          ...previous,
          mergeRoom(incoming),
        ];
      });
    }

    // ======================================
    // CZYSZCZENIE TIMERÓW
    // ======================================

    function clearConnectionTimers() {
      if (connectTimer !== undefined) {
        window.clearTimeout(connectTimer);
        connectTimer = undefined;
      }

      if (heartbeatTimer !== undefined) {
        window.clearInterval(heartbeatTimer);
        heartbeatTimer = undefined;
      }

      if (pongTimer !== undefined) {
        window.clearTimeout(pongTimer);
        pongTimer = undefined;
      }
    }

    function clearReconnectTimer() {
      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
    }

    // ======================================
    // PONAWIANIE POŁĄCZENIA
    // ======================================

    function scheduleReconnect() {
      if (disposed || reconnectTimer !== undefined) return;

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, RECONNECT_DELAY);
    }

    // ======================================
    // HEARTBEAT
    // ======================================

    function sendPing(socket: WebSocket) {
      if (disposed || document.hidden) return;
      if (currentSocket !== socket) return;
      if (socket.readyState !== WebSocket.OPEN) return;
      if (pongTimer !== undefined) return;

      try {
        socket.send(
          JSON.stringify({
            type: "ping",
          })
        );

        pongTimer = window.setTimeout(() => {
          pongTimer = undefined;

          if (
            !disposed &&
            currentSocket === socket &&
            socket.readyState === WebSocket.OPEN
          ) {
            socket.close(
              4000,
              "Heartbeat timeout"
            );
          }
        }, HEARTBEAT_TIMEOUT);
      } catch (error) {
        console.error("[SoCalled] Heartbeat:", error);
        socket.close();
      }
    }

    // ======================================
    // NAWIĄZYWANIE POŁĄCZENIA
    // ======================================

    function connect() {
      if (disposed) return;

      if (
        currentSocket &&
        (
          currentSocket.readyState === WebSocket.OPEN ||
          currentSocket.readyState === WebSocket.CONNECTING
        )
      ) {
        return;
      }

      clearReconnectTimer();
      clearConnectionTimers();

      setSocketStatus("connecting");

      let socket: WebSocket;

      try {
        socket = new WebSocket(url);
      } catch (error) {
        console.error("[SoCalled] WebSocket:", error);
        setSocketStatus("offline");
        scheduleReconnect();
        return;
      }

      currentSocket = socket;
      socketRef.current = socket;

      connectTimer = window.setTimeout(() => {
        if (
          !disposed &&
          currentSocket === socket &&
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      }, CONNECT_TIMEOUT);

      // ====================================
      // POŁĄCZONO
      // ====================================

      socket.onopen = () => {
        if (disposed || currentSocket !== socket) return;

        if (connectTimer !== undefined) {
          window.clearTimeout(connectTimer);
          connectTimer = undefined;
        }

        setSocketStatus("online");

        console.log(
          "[SoCalled] Połączono:",
          activeRoomId
        );

        sendPing(socket);

        heartbeatTimer = window.setInterval(() => {
          sendPing(socket);
        }, HEARTBEAT_INTERVAL);
      };

      // ====================================
      // ODBIERANIE ZDARZEŃ
      // ====================================

      socket.onmessage = (event) => {
        if (disposed || currentSocket !== socket) return;

        try {
          const data = JSON.parse(event.data);

          // HEARTBEAT
          if (data.type === "pong") {
            if (pongTimer !== undefined) {
              window.clearTimeout(pongTimer);
              pongTimer = undefined;
            }
            return;
          }

          // =================================
          // LISTA POKOJÓW Z SERWERA
          // =================================

          if (
            data.type === "rooms_snapshot" &&
            Array.isArray(data.rooms)
          ) {
            const incoming = data.rooms as ServerRoom[];

            setRooms((previous) =>
              incoming.map((item) => {
                const existing = previous.find(
                  (room) => room.id === item.id
                );

                return mergeRoom(item, existing);
              })
            );

            return;
          }

          // =================================
          // NOWY POKÓJ
          // =================================

          if (
            data.type === "room_created" &&
            data.room
          ) {
            const incoming = data.room as ServerRoom;

            upsertRoom(incoming);

            // Tylko osoba, która wysłała
            // to konkretne żądanie, przechodzi
            // automatycznie do nowego pokoju.
            if (
              data.requestId &&
              data.requestId === createRequestRef.current &&
              data.createdBy === clientId
            ) {
              createRequestRef.current = null;

              setCreateBusy(false);
              setCreateOpen(false);
              setCreateError("");

              setNewRoomName("");
              setNewRoomPrivate(false);

              setActiveRoomId(incoming.id);
              setMobileScreen("chat");
              setDetailsTab("about");
              setSocketStatus("connecting");
              setDraft("");
            }

            return;
          }

          // =================================
          // AKTUALIZACJA POKOJU
          // =================================

          if (
            data.type === "room_updated" &&
            data.room
          ) {
            const updated = data.room as ServerRoom;

            upsertRoom(updated);

            if (
              data.requestId &&
              data.requestId === saveRequestRef.current &&
              data.updatedBy === clientId
            ) {
              saveRequestRef.current = null;
              setRoomSaving(false);
              setRoomError("");
              setRoomSuccess(
                "Zmiany zapisane i wysłane do uczestników."
              );
            }

            return;
          }

          // =================================
          // HISTORIA WIADOMOŚCI
          // =================================

          if (
            data.type === "history" &&
            Array.isArray(data.messages)
          ) {
            const history = (
              data.messages as ServerMessage[]
            ).map(convertMessage);

            setMessages((previous) => [
              ...previous.filter(
                (message) => message.roomId !== activeRoomId
              ),
              ...history,
            ]);

            const latest =
              data.messages.length > 0
                ? (data.messages[
                    data.messages.length - 1
                  ] as ServerMessage)
                : null;

            updateRoomPreview(latest);
            return;
          }

          // =================================
          // NOWA WIADOMOŚĆ
          // =================================

          if (
            data.type === "message_created" &&
            data.message
          ) {
            const serverMessage =
              data.message as ServerMessage;

            const message = convertMessage(serverMessage);

            setMessages((previous) => {
              if (
                previous.some(
                  (item) => item.id === message.id
                )
              ) {
                return previous;
              }

              return [...previous, message];
            });

            updateRoomPreview(serverMessage);
            return;
          }

          // =================================
          // EDYTOWANA WIADOMOŚĆ
          // =================================

          if (
            data.type === "message_updated" &&
            data.message
          ) {
            const updated = convertMessage(
              data.message as ServerMessage
            );

            setMessages((previous) =>
              previous.map((message) =>
                message.id === updated.id
                  ? updated
                  : message
              )
            );

            updateRoomPreview(
              (data.lastMessage as ServerMessage | null) ??
                null
            );

            setEditingId((current) =>
              current === updated.id ? null : current
            );

            setPendingEditId((current) =>
              current === updated.id ? null : current
            );

            setActionMenuId(null);
            setActionError("");
            return;
          }

          // =================================
          // USUNIĘTA WIADOMOŚĆ
          // =================================

          if (
            data.type === "message_deleted" &&
            typeof data.messageId === "string"
          ) {
            const removedId = data.messageId as string;

            setMessages((previous) =>
              previous.filter(
                (message) => message.id !== removedId
              )
            );

            updateRoomPreview(
              (data.lastMessage as ServerMessage | null) ??
                null
            );

            setEditingId((current) =>
              current === removedId ? null : current
            );

            setPendingEditId((current) =>
              current === removedId ? null : current
            );

            setActionMenuId(null);
            setActionError("");
            return;
          }

          // =================================
          // BŁĄD SERWERA
          // =================================

          if (data.type === "error") {
            const message =
              typeof data.message === "string"
                ? data.message
                : "Nie udało się wykonać operacji.";

            console.warn("[SoCalled]", message);

            if (createRequestRef.current) {
              createRequestRef.current = null;
              setCreateBusy(false);
              setCreateError(message);
            } else if (saveRequestRef.current) {
              saveRequestRef.current = null;
              setRoomSaving(false);
              setRoomError(message);
            } else {
              setActionError(message);
            }

            setPendingEditId(null);
          }
        } catch (error) {
          console.error(
            "[SoCalled] Błąd przetwarzania:",
            error
          );
        }
      };

      // ====================================
      // ROZŁĄCZENIE
      // ====================================

      socket.onclose = (event) => {
        if (disposed || currentSocket !== socket) return;

        clearConnectionTimers();

        currentSocket = null;

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        setSocketStatus("offline");
        setPendingEditId(null);
        setCreateBusy(false);
        setRoomSaving(false);

        createRequestRef.current = null;
        saveRequestRef.current = null;

        console.warn(
          "[SoCalled] Rozłączono:",
          event.code,
          event.reason
        );

        scheduleReconnect();
      };

      socket.onerror = () => {
        if (disposed || currentSocket !== socket) return;

        console.warn(
          "[SoCalled] Problem z WebSocket:",
          url
        );
      };
    }

    // ======================================
    // WZNOWIENIE POŁĄCZENIA
    // ======================================

    function checkConnection() {
      if (disposed || document.hidden) return;

      const socket = currentSocket;

      if (!socket) {
        clearReconnectTimer();
        connect();
        return;
      }

      if (socket.readyState === WebSocket.OPEN) {
        sendPing(socket);
        return;
      }

      if (socket.readyState === WebSocket.CONNECTING) {
        return;
      }

      currentSocket = null;

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      clearReconnectTimer();
      connect();
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        checkConnection();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener("focus", checkConnection);
    window.addEventListener("pageshow", checkConnection);
    window.addEventListener("online", checkConnection);

    connect();

    return () => {
      disposed = true;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener("focus", checkConnection);
      window.removeEventListener("pageshow", checkConnection);
      window.removeEventListener("online", checkConnection);

      clearReconnectTimer();
      clearConnectionTimers();

      if (currentSocket) {
        currentSocket.close();
      }

      socketRef.current = null;
    };
  }, [
    activeRoomId,
    clientId,
    nickname,
    connectionVersion,
  ]);

  // ========================================
  // PRZEWIJANIE CZATU
  // ========================================

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop =
        chatScrollRef.current.scrollHeight;
    }
  }, [activeRoomId, messages, mobileScreen]);

  // ========================================
  // WYBÓR POKOJU
  // ========================================

  function openRoom(roomId: string) {
    setMobileScreen("chat");
    setDetailsTab("about");
    setDraft("");
    setActionMenuId(null);
    setEditingId(null);
    setPendingEditId(null);
    setActionError("");

    setRooms((previous) =>
      previous.map((room) =>
        room.id === roomId
          ? { ...room, unread: 0 }
          : room
      )
    );

    if (roomId !== activeRoomId) {
      setSocketStatus("connecting");
      setActiveRoomId(roomId);
      return;
    }

    if (
      socketStatus !== "online" ||
      socketRef.current?.readyState !== WebSocket.OPEN
    ) {
      reconnectNow();
    }
  }

  // ========================================
  // WYSYŁANIE WIADOMOŚCI
  // ========================================

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = draft.trim();
    const socket = socketRef.current;

    if (!text) return;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      reconnectNow();
      return;
    }

    try {
      socket.send(
        JSON.stringify({
          type: "send_message",
          text,
        })
      );

      setDraft("");
    } catch (error) {
      console.error("[SoCalled] Wysyłanie:", error);
      reconnectNow();
    }
  }

  // ========================================
  // EDYCJA I USUWANIE WIADOMOŚCI
  // ========================================

  function toggleMessageMenu(messageId: string) {
    setActionMenuId((current) =>
      current === messageId ? null : messageId
    );

    setActionError("");
  }

  function startMessageEdit(message: ChatMessage) {
    if (!message.mine) return;

    setEditingId(message.id);
    setEditingText(message.text);
    setActionMenuId(null);
    setActionError("");
  }

  function cancelMessageEdit() {
    if (pendingEditId) return;

    setEditingId(null);
    setEditingText("");
    setActionError("");
  }

  function saveMessageEdit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingId || pendingEditId) return;

    const text = editingText.trim();
    const socket = socketRef.current;

    if (!text || text.length > 2000) {
      setActionError(
        "Wiadomość musi mieć od 1 do 2000 znaków."
      );
      return;
    }

    const original = messages.find(
      (message) => message.id === editingId
    );

    if (!original || !original.mine) return;

    if (original.text === text) {
      cancelMessageEdit();
      return;
    }

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setActionError("Brak połączenia z serwerem.");
      reconnectNow();
      return;
    }

    socket.send(
      JSON.stringify({
        type: "edit_message",
        message_id: editingId,
        text,
      })
    );

    setPendingEditId(editingId);
    setActionError("");
  }

  function deleteMessage(message: ChatMessage) {
    if (!message.mine) return;

    setActionMenuId(null);

    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć tę wiadomość?\n" +
      "Zniknie również u pozostałych uczestników."
    );

    if (!confirmed) return;

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setActionError("Brak połączenia z serwerem.");
      reconnectNow();
      return;
    }

    socket.send(
      JSON.stringify({
        type: "delete_message",
        message_id: message.id,
      })
    );
  }

  // ========================================
  // TWORZENIE POKOJU NA SERWERZE
  // ========================================

  function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newRoomName.trim();
    const socket = socketRef.current;

    if (!name || createBusy) return;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setCreateError(
        "Najpierw połącz się z serwerem."
      );
      return;
    }

    const requestId = makeRequestId();

    createRequestRef.current = requestId;
    setCreateBusy(true);
    setCreateError("");

    try {
      socket.send(
        JSON.stringify({
          type: "create_room",
          requestId,
          name,
          isPrivate: newRoomPrivate,
        })
      );
    } catch (error) {
      console.error("[SoCalled] Tworzenie pokoju:", error);
      createRequestRef.current = null;
      setCreateBusy(false);
      setCreateError("Nie udało się utworzyć pokoju.");
    }
  }

  // ========================================
  // WCZYTYWANIE ZDJĘCIA POKOJU
  // ========================================

  async function handleRoomImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !canEditRoom) return;

    setImageBusy(true);
    setRoomError("");
    setRoomSuccess("");

    try {
      const imageData = await prepareRoomImage(file);
      setRoomImage(imageData);
    } catch (error) {
      setRoomError(
        error instanceof Error
          ? error.message
          : "Nie udało się wczytać zdjęcia."
      );
    } finally {
      setImageBusy(false);
    }
  }

  // ========================================
  // ZAPIS PERSONALIZACJI POKOJU
  // ========================================

  function saveRoomSettings(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canEditRoom || roomSaving || imageBusy) return;

    const name = roomName.trim();

    if (!name || name.length > 28) {
      setRoomError(
        "Nazwa musi mieć od 1 do 28 znaków."
      );
      return;
    }

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setRoomError("Brak połączenia z serwerem.");
      reconnectNow();
      return;
    }

    const requestId = makeRequestId();

    saveRequestRef.current = requestId;

    setRoomSaving(true);
    setRoomError("");
    setRoomSuccess("");

    try {
      socket.send(
        JSON.stringify({
          type: "update_room",
          requestId,
          roomId: activeRoomId,
          name,
          description: roomDescription.trim(),
          topic: roomTopic.trim(),
          icon: roomIcon,
          image: roomImage,
        })
      );
    } catch (error) {
      console.error(
        "[SoCalled] Zapis pokoju:",
        error
      );

      saveRequestRef.current = null;
      setRoomSaving(false);
      setRoomError("Nie udało się zapisać zmian.");
    }
  }

  // ========================================
  // INTERFEJS
  // ========================================

  return (
    <div
      className={`app-shell mobile-${mobileScreen}`}
      style={
        {
          "--accent": theme.hex,
          "--accent-rgb": theme.rgb,
        } as CSSProperties
      }
    >
      {/* ====================================
          DESKTOP — LEWY PANEL
          ==================================== */}

      <aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <div className="brand-symbol">SO</div>

          <div>
            <div className="brand-name">
              So<span>Called</span>
            </div>

            <div className="brand-subtitle">
              YOUR SPACE. YOUR VOICE.
            </div>
          </div>
        </div>

        <div className="sidebar-section-title">
          <div>
            <span className="eyebrow">
              TWOJA PRZESTRZEŃ
            </span>
            <h2>Pokoje</h2>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={() => {
              setCreateError("");
              setCreateOpen(true);
            }}
            aria-label="Utwórz pokój"
            title="Utwórz pokój"
          >
            <Plus size={19} />
          </button>
        </div>

        {/* HEKSAGONY */}

        <div className="hex-scroll">
          <div className="hex-grid">
            {rooms.map((room) => (
              <div
                className={`hex-slot ${
                  activeRoomId === room.id
                    ? "hex-slot--active"
                    : ""
                }`}
                key={room.id}
              >
                <button
                  className="hex-button"
                  type="button"
                  onClick={() => openRoom(room.id)}
                  aria-label={`Otwórz pokój ${room.name}`}
                  aria-pressed={activeRoomId === room.id}
                >
                  <span className="hex-inside">
                    <RoomVisual room={room} />
                  </span>
                </button>

                <span className="hex-tooltip">
                  {room.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="community-status">
            <span
              className="status-dot"
              style={{
                background:
                  socketStatus === "online"
                    ? undefined
                    : "#d68c72",
              }}
            />

            <span>
              {socketStatus === "online"
                ? "SoCalled jest online"
                : "Przywracanie połączenia..."}
            </span>
          </div>

          <div className="account-card">
            <div className="account-avatar">
              {nickname.slice(0, 1).toUpperCase()}
            </div>

            <div className="account-copy">
              <strong>{nickname}</strong>
              <span>Tryb demonstracyjny</span>
            </div>

            <Sparkles
              size={17}
              className="account-sparkle"
            />
          </div>
        </div>
      </aside>

      {/* ====================================
          MOBILE — LISTA POKOJÓW
          ==================================== */}

      <section className="mobile-room-screen">
        <header className="mobile-home-header">
          <div className="mobile-brand">
            <div className="brand-symbol">SO</div>

            <div className="brand-name">
              So<span>Called</span>
            </div>
          </div>

          <button
            type="button"
            className="icon-button icon-button--accent"
            onClick={() => {
              setCreateError("");
              setCreateOpen(true);
            }}
            aria-label="Utwórz pokój"
          >
            <Plus size={21} />
          </button>
        </header>

        <div className="mobile-welcome">
          <span className="eyebrow">
            WITAJ W SOCALLED
          </span>

          <h1>
            Twoje pokoje
            <span className="accent-dot">.</span>
          </h1>

          <p>
            Znajdź swoją społeczność i zacznij rozmawiać.
          </p>
        </div>

        <label className="mobile-search">
          <Search size={19} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Szukaj pokoju..."
            aria-label="Szukaj pokoju"
          />
        </label>

        <div className="mobile-list-heading">
          <span>WSZYSTKIE POKOJE</span>
          <span>{filteredRooms.length}</span>
        </div>

        <div className="mobile-room-list">
          {filteredRooms.map((room) => (
            <button
              className="mobile-room-item"
              key={room.id}
              type="button"
              onClick={() => openRoom(room.id)}
            >
              <div className="mobile-room-icon">
                <RoomVisual room={room} />
              </div>

              <div className="mobile-room-copy">
                <div className="mobile-room-line">
                  <strong>{room.name}</strong>
                  <time>{room.lastTime}</time>
                </div>

                <div className="mobile-room-line">
                  <span className="mobile-preview">
                    {room.lastMessage}
                  </span>

                  {room.unread > 0 ? (
                    <span className="unread-badge">
                      {room.unread}
                    </span>
                  ) : (
                    <ChevronRight
                      size={17}
                      className="row-chevron"
                    />
                  )}
                </div>
              </div>
            </button>
          ))}

          {filteredRooms.length === 0 && (
            <p className="empty-search">
              Nie znaleziono takiego pokoju.
            </p>
          )}
        </div>

        <nav
          className="mobile-bottom-nav"
          aria-label="Nawigacja"
        >
          <button
            type="button"
            className="mobile-nav-active"
          >
            <MessageCircle size={22} />
            <span>Pokoje</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateError("");
              setCreateOpen(true);
            }}
          >
            <Plus size={22} />
            <span>Utwórz</span>
          </button>
        </nav>
      </section>

      {/* ====================================
          ŚRODEK — CZAT
          ==================================== */}

      <main className="chat-panel">
        <header className="chat-header">
          <button
            type="button"
            className="icon-button mobile-only"
            onClick={() => setMobileScreen("rooms")}
            aria-label="Powrót do pokojów"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="chat-header-icon">
            <RoomVisual room={activeRoom} />
          </div>

          <div className="chat-header-copy">
            <h1>{activeRoom.name}</h1>
            <span>{activeRoom.topic}</span>
          </div>

          <div className="chat-header-actions">
            <span className="online-indicator">
              <span
                className="status-dot"
                style={{
                  background:
                    socketStatus === "online"
                      ? undefined
                      : "#d68c72",
                }}
              />

              {socketStatus === "online"
                ? "Połączono"
                : socketStatus === "connecting"
                  ? "Łączenie..."
                  : "Offline"}
            </span>

            <button
              type="button"
              className="icon-button"
              aria-label="Informacje o pokoju"
              title="Informacje o pokoju"
              onClick={() => {
                setDetailsTab("about");
                setMobileScreen("details");
              }}
            >
              <Info size={21} />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label="Ustawienia pokoju"
              title="Ustawienia pokoju"
              onClick={() => {
                setDetailsTab("settings");
                setMobileScreen("details");
              }}
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>

        {/* STATUS POŁĄCZENIA */}

        {socketStatus !== "online" && (
          <div className="connection-warning" role="status">
            <WifiOff size={16} />

            <span>
              {socketStatus === "connecting"
                ? "Łączenie z serwerem..."
                : "Połączenie przerwane. Ponawiam próbę..."}
            </span>

            <button
              type="button"
              onClick={reconnectNow}
            >
              <RefreshCw size={14} />
              Połącz ponownie
            </button>
          </div>
        )}

        {/* HISTORIA WIADOMOŚCI */}

        <div
          className="chat-scroll"
          ref={chatScrollRef}
        >
          <div className="chat-intro">
            <div className="chat-intro-icon">
              <RoomVisual room={activeRoom} />
            </div>

            <span className="eyebrow">POKÓJ SOCALLED</span>

            <h2>Witaj w {activeRoom.name}.</h2>
            <p>{activeRoom.description}</p>
          </div>

          <div className="date-divider">
            <span />
            <p>Historia rozmowy</p>
            <span />
          </div>

          <div className="message-list">
            {roomMessages.length === 0 ? (
              <div className="empty-messages">
                <MessageCircle size={29} />
                <h3>Jeszcze tu cicho.</h3>
                <p>
                  Napisz pierwszą wiadomość w tym pokoju.
                </p>
              </div>
            ) : (
              roomMessages.map((message) => (
                <article
                  key={message.id}
                  className={`message-row ${
                    message.mine
                      ? "message-row--mine"
                      : ""
                  }`}
                >
                  {!message.mine && (
                    <div className="message-avatar">
                      {message.author
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="message-body">
                    <div className="message-meta">
                      <strong>{message.author}</strong>
                      <time>{message.time}</time>

                      {message.editedAt && (
                        <span className="message-edited">
                          · edytowano
                        </span>
                      )}

                      {message.mine && (
                        <div className="message-actions">
                          <button
                            type="button"
                            className="message-actions-trigger"
                            aria-label="Opcje wiadomości"
                            aria-expanded={
                              actionMenuId === message.id
                            }
                            onClick={() =>
                              toggleMessageMenu(message.id)
                            }
                          >
                            <MoreHorizontal size={19} />
                          </button>

                          {actionMenuId === message.id && (
                            <div className="message-actions-menu">
                              <button
                                type="button"
                                onClick={() =>
                                  startMessageEdit(message)
                                }
                              >
                                <Pencil size={16} />
                                Edytuj
                              </button>

                              <button
                                type="button"
                                className="delete-action"
                                onClick={() =>
                                  deleteMessage(message)
                                }
                              >
                                <Trash2 size={16} />
                                Usuń
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {editingId === message.id ? (
                      <form
                        className="message-edit-form"
                        onSubmit={saveMessageEdit}
                      >
                        <textarea
                          value={editingText}
                          onChange={(event) =>
                            setEditingText(event.target.value)
                          }
                          maxLength={2000}
                          rows={3}
                          aria-label="Edytuj wiadomość"
                          autoFocus
                          disabled={
                            pendingEditId === message.id
                          }
                        />

                        <div className="message-edit-controls">
                          <button
                            type="button"
                            className="edit-cancel"
                            onClick={cancelMessageEdit}
                            disabled={
                              pendingEditId === message.id
                            }
                          >
                            <X size={15} />
                            Anuluj
                          </button>

                          <button
                            type="submit"
                            className="edit-save"
                            disabled={
                              !editingText.trim() ||
                              pendingEditId === message.id ||
                              socketStatus !== "online"
                            }
                          >
                            <Check size={15} />

                            {pendingEditId === message.id
                              ? "Zapisywanie..."
                              : "Zapisz"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="message-bubble">
                        {message.text}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {actionError && (
          <div
            className="message-operation-error"
            role="alert"
          >
            <span>{actionError}</span>

            <button
              type="button"
              onClick={() => setActionError("")}
              aria-label="Zamknij komunikat"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* WYSYŁANIE WIADOMOŚCI */}

        <div className="composer-area">
          <form
            className="message-composer"
            onSubmit={sendMessage}
          >
            <input
              value={draft}
              onChange={(event) =>
                setDraft(event.target.value)
              }
              placeholder={
                socketStatus === "online"
                  ? `Wiadomość do ${activeRoom.name}...`
                  : "Oczekiwanie na połączenie..."
              }
              aria-label="Treść wiadomości"
              maxLength={2000}
            />

            <button
              type="submit"
              className="send-button"
              disabled={
                !draft.trim() ||
                socketStatus !== "online"
              }
              aria-label="Wyślij wiadomość"
            >
              <Send size={20} />
            </button>
          </form>

          <p className="composer-hint">
            {socketStatus === "online"
              ? "Połączono z SoCalled — wiadomości na żywo."
              : "Przywracanie połączenia z serwerem..."}
          </p>
        </div>
      </main>

      {/* ====================================
          PRAWY PANEL — INFORMACJE
          ==================================== */}

      <aside className="details-panel">
        <header className="details-header">
          <div>
            <span className="eyebrow">
              TWOJA SPOŁECZNOŚĆ
            </span>
            <h2>Informacje</h2>
          </div>

          <button
            type="button"
            className="icon-button mobile-only"
            onClick={() => setMobileScreen("chat")}
            aria-label="Wróć do czatu"
          >
            <X size={22} />
          </button>
        </header>

        <div className="details-scroll">
          {/* ZDJĘCIE I NAZWA POKOJU */}

          <div className="room-identity">
            <div className="room-identity-icon">
              <RoomVisual room={activeRoom} />
            </div>

            <h3>{activeRoom.name}</h3>
            <p>{activeRoom.topic}</p>

            <span className="room-type-pill">
              {activeRoom.isPrivate ? (
                <LockKeyhole size={13} />
              ) : (
                <Globe2 size={13} />
              )}

              {activeRoom.isPrivate
                ? "Pokój prywatny (demo)"
                : "Pokój publiczny"}
            </span>
          </div>

          <div className="details-tabs">
            <button
              type="button"
              className={
                detailsTab === "about"
                  ? "tab-active"
                  : ""
              }
              onClick={() => setDetailsTab("about")}
            >
              O pokoju
            </button>

            <button
              type="button"
              className={
                detailsTab === "settings"
                  ? "tab-active"
                  : ""
              }
              onClick={() => setDetailsTab("settings")}
            >
              Ustawienia
            </button>
          </div>

          {/* ==================================
              O POKOJU
              ================================== */}

          {detailsTab === "about" ? (
            <div className="details-content">
              <div className="details-section">
                <h4>OPIS POKOJU</h4>
                <p>{activeRoom.description}</p>
              </div>

              <div className="room-stats">
                <div>
                  <Users size={19} />
                  <strong>{activeRoom.members}</strong>
                  <span>Członków (demo)</span>
                </div>

                <div>
                  <span className="status-dot" />
                  <strong>{activeRoom.online}</strong>
                  <span>Online (demo)</span>
                </div>
              </div>

              <div className="details-section">
                <h4>WŁASNOŚĆ POKOJU</h4>

                <p>
                  {activeRoom.ownerId === clientId
                    ? "Jesteś właścicielem tego pokoju."
                    : activeRoom.ownerId === null
                      ? "Pokój demonstracyjny. Pierwsza osoba, która zapisze ustawienia, przejmie rolę właściciela."
                      : "Ten pokój należy do innego użytkownika."}
                </p>
              </div>

              <div className="details-section">
                <div className="section-heading-row">
                  <h4>PRZYKŁADOWI UCZESTNICY</h4>
                </div>

                {[
                  nickname,
                  "Maja",
                  "Kuba",
                  "Ola",
                ].map((name, index) => (
                  <div
                    className="member-row"
                    key={`${index}-${name}`}
                  >
                    <div
                      className={`member-avatar member-avatar-${index}`}
                    >
                      {name
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>{name}</strong>

                      <span>
                        {index === 0
                          ? "Twój profil"
                          : "Przykładowy użytkownik"}
                      </span>
                    </div>

                    <span className="member-online-dot" />
                  </div>
                ))}
              </div>

              <div className="details-notice">
                <ShieldCheck size={20} />
                <p>
                  Ustawienia pokojów synchronizujemy
                  na żywo. Prawdziwe uprawnienia
                  użytkowników dodamy wraz z logowaniem.
                </p>
              </div>
            </div>
          ) : (
            /* ==================================
               USTAWIENIA I PERSONALIZACJA
               ================================== */

            <div className="details-content">
              <div className="details-section">
                <h4>
                  <Settings2 size={16} />
                  PERSONALIZACJA POKOJU
                </h4>

                <p>
                  Dostosuj nazwę, opis, ikonę
                  i zdjęcie wybranego pokoju.
                </p>

                {!canEditRoom && (
                  <div className="room-editor-locked">
                    <LockKeyhole size={18} />
                    Tylko właściciel może zmieniać
                    ustawienia tego pokoju.
                  </div>
                )}

                <form
                  className="room-custom-form"
                  onSubmit={saveRoomSettings}
                >
                  {/* NAZWA */}

                  <label htmlFor="custom-room-name">
                    Nazwa pokoju
                  </label>

                  <input
                    id="custom-room-name"
                    value={roomName}
                    onChange={(event) =>
                      setRoomName(event.target.value)
                    }
                    maxLength={28}
                    required
                    disabled={!canEditRoom || roomSaving}
                  />

                  {/* TEMAT */}

                  <label htmlFor="custom-room-topic">
                    Temat pokoju
                  </label>

                  <input
                    id="custom-room-topic"
                    value={roomTopic}
                    onChange={(event) =>
                      setRoomTopic(event.target.value)
                    }
                    maxLength={100}
                    placeholder="O czym dzisiaj rozmawiamy?"
                    disabled={!canEditRoom || roomSaving}
                  />

                  {/* OPIS */}

                  <label htmlFor="custom-room-description">
                    Opis pokoju
                  </label>

                  <textarea
                    id="custom-room-description"
                    value={roomDescription}
                    onChange={(event) =>
                      setRoomDescription(event.target.value)
                    }
                    maxLength={300}
                    rows={3}
                    placeholder="Opisz swoją społeczność..."
                    disabled={!canEditRoom || roomSaving}
                  />

                  {/* WYBÓR IKONY */}

                  <span className="room-custom-label">
                    Ikona pokoju
                  </span>

                  <div className="room-icon-picker">
                    {availableIcons.map((icon) => (
                      <button
                        type="button"
                        key={icon}
                        className={
                          roomIcon === icon
                            ? "room-icon-option selected"
                            : "room-icon-option"
                        }
                        onClick={() =>
                          setRoomIcon(icon)
                        }
                        aria-label={`Wybierz ikonę ${icon}`}
                        aria-pressed={roomIcon === icon}
                        disabled={
                          !canEditRoom || roomSaving
                        }
                      >
                        <RoomGlyph icon={icon} />
                      </button>
                    ))}
                  </div>

                  {/* ZDJĘCIE POKOJU */}

                  <span className="room-custom-label">
                    Zdjęcie główne
                  </span>

                  <div className="room-image-editor">
                    <div className="room-image-preview">
                      {roomImage ? (
                        <img
                          src={roomImage}
                          alt="Podgląd zdjęcia pokoju"
                        />
                      ) : (
                        <RoomGlyph icon={roomIcon} />
                      )}
                    </div>

                    <div className="room-image-actions">
                      <label
                        className={`room-upload-button ${
                          !canEditRoom || roomSaving || imageBusy
                            ? "room-upload-disabled"
                            : ""
                        }`}
                      >
                        <ImagePlus size={16} />

                        {imageBusy
                          ? "Przetwarzanie..."
                          : "Wybierz zdjęcie"}

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRoomImage}
                          disabled={
                            !canEditRoom ||
                            roomSaving ||
                            imageBusy
                          }
                        />
                      </label>

                      {roomImage && (
                        <button
                          type="button"
                          className="room-remove-image"
                          onClick={() =>
                            setRoomImage(null)
                          }
                          disabled={
                            !canEditRoom ||
                            roomSaving ||
                            imageBusy
                          }
                        >
                          <Trash2 size={15} />
                          Usuń zdjęcie
                        </button>
                      )}

                      <small>
                        Zdjęcie zostanie automatycznie
                        pomniejszone przed wysłaniem.
                      </small>
                    </div>
                  </div>

                  {/* KOMUNIKATY */}

                  {roomError && (
                    <div
                      className="room-form-error"
                      role="alert"
                    >
                      {roomError}
                    </div>
                  )}

                  {roomSuccess && (
                    <div
                      className="room-form-success"
                      role="status"
                    >
                      <Check size={16} />
                      {roomSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="room-save-button"
                    disabled={
                      !canEditRoom ||
                      roomSaving ||
                      imageBusy ||
                      socketStatus !== "online" ||
                      !roomName.trim()
                    }
                  >
                    <Save size={17} />

                    {roomSaving
                      ? "Zapisywanie..."
                      : "Zapisz zmiany"}
                  </button>
                </form>
              </div>

              {/* MOTYW APLIKACJI */}

              <div className="details-section">
                <h4>
                  <Palette size={16} />
                  MOTYW KOLORYSTYCZNY
                </h4>

                <p>
                  Kolor akcentów tej przeglądarki.
                </p>

                <div className="theme-options">
                  {themeOptions.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={`theme-option ${
                        themeId === option.id
                          ? "theme-option--active"
                          : ""
                      }`}
                      onClick={() =>
                        setThemeId(option.id)
                      }
                      style={
                        {
                          "--swatch": option.hex,
                        } as CSSProperties
                      }
                      aria-pressed={
                        themeId === option.id
                      }
                    >
                      <span className="theme-swatch">
                        {themeId === option.id && (
                          <Check size={16} />
                        )}
                      </span>

                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* POWIADOMIENIA */}

              <div className="details-section">
                <h4>POWIADOMIENIA</h4>

                <button
                  type="button"
                  className="settings-row"
                  onClick={() =>
                    setNotifications(
                      (current) => !current
                    )
                  }
                  aria-pressed={notifications}
                >
                  {notifications ? (
                    <Bell size={19} />
                  ) : (
                    <BellOff size={19} />
                  )}

                  <span>Powiadomienia</span>

                  <span
                    className={`toggle ${
                      notifications
                        ? "toggle-on"
                        : ""
                    }`}
                  >
                    <span />
                  </span>
                </button>

                <p className="setting-hint">
                  Na razie ustawienie demonstracyjne.
                </p>
              </div>

              <div className="details-notice">
                <ShieldCheck size={20} />
                <p>
                  Zmiany pokoju są wspólne dla
                  uczestników. Motyw kolorystyczny
                  jest na razie indywidualny.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ====================================
          TWORZENIE POKOJU
          ==================================== */}

      {createOpen && (
        <div className="modal-backdrop">
          <section
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-room-title"
          >
            <div className="modal-header">
              <div className="modal-icon">
                <Plus size={24} />
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Zamknij"
                onClick={() => {
                  if (!createBusy) {
                    setCreateOpen(false);
                  }
                }}
                disabled={createBusy}
              >
                <X size={21} />
              </button>
            </div>

            <span className="eyebrow">
              NOWA PRZESTRZEŃ
            </span>

            <h2 id="create-room-title">
              Utwórz pokój
            </h2>

            <p className="modal-description">
              Nowy pokój pojawi się u wszystkich
              połączonych uczestników SoCalled.
            </p>

            <form
              onSubmit={createRoom}
              className="create-form"
            >
              <label htmlFor="room-name">
                Nazwa pokoju
              </label>

              <input
                id="room-name"
                value={newRoomName}
                onChange={(event) =>
                  setNewRoomName(event.target.value)
                }
                maxLength={28}
                placeholder="np. Nasza ekipa"
                required
                autoFocus
                disabled={createBusy}
              />

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={newRoomPrivate}
                  onChange={(event) =>
                    setNewRoomPrivate(
                      event.target.checked
                    )
                  }
                  disabled={createBusy}
                />

                <LockKeyhole size={18} />
                <span>Pokój prywatny (demo)</span>
              </label>

              <p className="modal-hint">
                Prywatność jest obecnie tylko
                oznaczeniem. Dostęp zabezpieczymy
                w wersji z kontami użytkowników.
              </p>

              {createError && (
                <div
                  className="room-form-error"
                  role="alert"
                >
                  {createError}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={
                  !newRoomName.trim() ||
                  createBusy ||
                  socketStatus !== "online"
                }
              >
                <Plus size={19} />

                {createBusy
                  ? "Tworzenie..."
                  : "Utwórz pokój"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
