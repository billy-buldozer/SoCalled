
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

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
  Info,
  LockKeyhole,
  MessageCircle,
  Music2,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  WifiOff,
  X,
} from "lucide-react";

import "./App.css";

// ==========================================
// TYPY DANYCH
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

type Room = {
  id: string;
  name: string;
  icon: RoomIcon;
  description: string;
  topic: string;
  members: number;
  online: number;
  lastMessage: string;
  lastTime: string;
  unread: number;
  isPrivate: boolean;
};

type ChatMessage = {
  id: string;
  roomId: string;
  author: string;
  time: string;
  text: string;
  mine: boolean;
};

type ServerMessage = {
  id: string;
  roomId: string;
  clientId: string;
  author: string;
  time: string;
  text: string;
};

// ==========================================
// POKOJE DEMONSTRACYJNE
// ==========================================

const initialRooms: Room[] = [
  {
    id: "general",
    name: "General",
    icon: "hash",
    description: "Główne miejsce spotkań społeczności SoCalled.",
    topic: "Wszystko zaczyna się od rozmowy.",
    members: 28,
    online: 8,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
    isPrivate: false,
  },
  {
    id: "gaming",
    name: "Gaming",
    icon: "game",
    description: "Gry, wspólne rozgrywki i dyskusje.",
    topic: "Jeszcze jeden mecz?",
    members: 19,
    online: 6,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
    isPrivate: false,
  },
  {
    id: "dev",
    name: "Dev Zone",
    icon: "code",
    description: "Programowanie, projekty i nowe technologie.",
    topic: "Build something amazing.",
    members: 15,
    online: 5,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
    isPrivate: false,
  },
  {
    id: "music",
    name: "Muzyka",
    icon: "music",
    description: "Dziel się ulubionymi utworami i albumami.",
    topic: "Co dzisiaj gra w słuchawkach?",
    members: 24,
    online: 4,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
    isPrivate: false,
  },
  {
    id: "photo",
    name: "Fotografia",
    icon: "camera",
    description: "Zdjęcia, inspiracje i kreatywne pomysły.",
    topic: "Uchwyć chwilę.",
    members: 12,
    online: 3,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
    isPrivate: false,
  },
  {
    id: "offtopic",
    name: "Off-topic",
    icon: "coffee",
    description: "Luźne rozmowy bez konkretnego tematu.",
    topic: "Po prostu porozmawiajmy.",
    members: 31,
    online: 9,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
    isPrivate: false,
  },
  {
    id: "world",
    name: "Odkrycia",
    icon: "globe",
    description: "Ciekawe linki, miejsca i znaleziska z internetu.",
    topic: "Zawsze jest coś do odkrycia.",
    members: 11,
    online: 2,
    lastMessage: "Brak wiadomości",
    lastTime: "—",
    unread: 0,
    isPrivate: false,
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

// ==========================================
// USTAWIENIA WEBSOCKET
// ==========================================

const RECONNECT_DELAY = 2000;
const CONNECT_TIMEOUT = 10000;
const HEARTBEAT_INTERVAL = 15000;
const HEARTBEAT_TIMEOUT = 10000;

// ==========================================
// IKONY POKOJÓW
// ==========================================

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

// ==========================================
// GŁÓWNA APLIKACJA
// ==========================================

function App() {
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

  const [themeId, setThemeId] = useState<ThemeId>("emerald");
  const [notifications, setNotifications] = useState(true);

  const [socketStatus, setSocketStatus] =
    useState<SocketStatus>("connecting");

  // Pozwala wymusić nowe połączenie także wtedy,
  // gdy identyfikator pokoju się nie zmienia.
  const [connectionVersion, setConnectionVersion] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // ========================================
  // TYMCZASOWA TOŻSAMOŚĆ
  // ========================================

  const [clientId] = useState(() => {
    const saved = sessionStorage.getItem("socalled_client_id");

    if (saved) return saved;

    const generated =
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10);

    sessionStorage.setItem("socalled_client_id", generated);

    return generated;
  });

  const [nickname] = useState(() => {
    const saved = sessionStorage.getItem("socalled_nickname");

    if (saved) return saved;

    const generated =
      "Gosc-" + Math.random().toString(36).slice(2, 6);

    sessionStorage.setItem("socalled_nickname", generated);

    return generated;
  });

  // ========================================
  // AKTUALNY POKÓJ I WIADOMOŚCI
  // ========================================

  const activeRoom =
    rooms.find((room) => room.id === activeRoomId) ??
    rooms[0];

  const theme =
    themeOptions.find((item) => item.id === themeId) ??
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
  // RĘCZNE WYMUSZENIE POŁĄCZENIA
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

    // Lokalny dostęp z komputera i telefonu.
    // Backend musi działać na 0.0.0.0:8000.
    const protocol =
      window.location.protocol === "https:" ? "wss" : "ws";

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
        text: message.text,
        time: new Date(message.time).toLocaleTimeString(
          "pl-PL",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        mine: message.clientId === clientId,
      };
    }

    // ======================================
    // TIMERY
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
            console.warn(
              "[SoCalled] Brak odpowiedzi PONG."
            );

            socket.close(4000, "Heartbeat timeout");
          }
        }, HEARTBEAT_TIMEOUT);
      } catch (error) {
        console.error("[SoCalled] Błąd heartbeat:", error);
        socket.close();
      }
    }

    // ======================================
    // NAWIĄZANIE POŁĄCZENIA
    // ======================================

    function connect() {
      if (disposed) return;

      if (
        currentSocket &&
        (currentSocket.readyState === WebSocket.OPEN ||
          currentSocket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      clearReconnectTimer();
      clearConnectionTimers();

      setSocketStatus("connecting");

      console.log("[SoCalled] Łączenie:", url);

      let socket: WebSocket;

      try {
        socket = new WebSocket(url);
      } catch (error) {
        console.error(
          "[SoCalled] Nie udało się utworzyć WebSocket:",
          error
        );

        setSocketStatus("offline");
        scheduleReconnect();
        return;
      }

      currentSocket = socket;
      socketRef.current = socket;

      // Maksymalnie 10 sekund na otwarcie połączenia.
      connectTimer = window.setTimeout(() => {
        if (
          !disposed &&
          currentSocket === socket &&
          socket.readyState === WebSocket.CONNECTING
        ) {
          console.warn(
            "[SoCalled] Przekroczono czas połączenia."
          );

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

        // Sprawdzamy połączenie od razu.
        sendPing(socket);

        heartbeatTimer = window.setInterval(() => {
          sendPing(socket);
        }, HEARTBEAT_INTERVAL);
      };

      // ====================================
      // ZDARZENIA Z SERWERA
      // ====================================

      socket.onmessage = (event) => {
        if (disposed || currentSocket !== socket) return;

        try {
          const data = JSON.parse(event.data);

          // Odpowiedź heartbeat
          if (data.type === "pong") {
            if (pongTimer !== undefined) {
              window.clearTimeout(pongTimer);
              pongTimer = undefined;
            }

            return;
          }

          // Historia wiadomości
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

            const lastMessage =
              history[history.length - 1];

            setRooms((previous) =>
              previous.map((room) =>
                room.id === activeRoomId
                  ? {
                      ...room,
                      lastMessage:
                        lastMessage?.text ?? "Brak wiadomości",
                      lastTime:
                        lastMessage?.time ?? "—",
                    }
                  : room
              )
            );

            return;
          }

          // Nowa wiadomość
          if (
            data.type === "message_created" &&
            data.message
          ) {
            const message = convertMessage(
              data.message as ServerMessage
            );

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

            setRooms((previous) =>
              previous.map((room) =>
                room.id === activeRoomId
                  ? {
                      ...room,
                      lastMessage: message.text,
                      lastTime: message.time,
                    }
                  : room
              )
            );

            return;
          }

          if (data.type === "error") {
            console.warn(
              "[SoCalled] Błąd serwera:",
              data.message
            );
          }
        } catch (error) {
          console.error(
            "[SoCalled] Błąd przetwarzania wiadomości:",
            error
          );
        }
      };

      // ====================================
      // ZAMKNIĘCIE POŁĄCZENIA
      // ====================================

      socket.onclose = (event) => {
        if (disposed || currentSocket !== socket) return;

        clearConnectionTimers();

        currentSocket = null;

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        setSocketStatus("offline");

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
          "[SoCalled] Błąd WebSocket:",
          url
        );
      };
    }

    // ======================================
    // POWRÓT DO PRZEGLĄDARKI
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
        // Istnieje już timeout połączenia.
        return;
      }

      // CLOSED albo CLOSING.
      // Nie czekamy na przejście między pokojami.
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

    // AUTOMATYCZNE POŁĄCZENIE PO STARCIE
    connect();

    // ======================================
    // SPRZĄTANIE
    // ======================================

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
  // OTWIERANIE POKOJU
  // ========================================

  function openRoom(roomId: string) {
    setMobileScreen("chat");
    setDetailsTab("about");
    setDraft("");

    setRooms((previous) =>
      previous.map((room) =>
        room.id === roomId
          ? { ...room, unread: 0 }
          : room
      )
    );

    if (roomId !== activeRoomId) {
      // Zmiana pokoju uruchamia nowy WebSocket.
      setSocketStatus("connecting");
      setActiveRoomId(roomId);
      return;
    }

    // Kluczowa poprawka:
    // kliknięcie tego samego pokoju również
    // może odtworzyć utracone połączenie.
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
      console.warn(
        "[SoCalled] Brak aktywnego połączenia."
      );

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
      console.error(
        "[SoCalled] Nie udało się wysłać wiadomości:",
        error
      );

      reconnectNow();
    }
  }

  // ========================================
  // TWORZENIE POKOJU
  // ========================================

  function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newRoomName.trim();
    if (!name) return;

    const id = `room-${Date.now()}`;

    const room: Room = {
      id,
      name,
      icon: "hash",
      description: "Nowy pokój utworzony w SoCalled.",
      topic: "Tutaj zaczyna się nowa rozmowa.",
      members: 1,
      online: 1,
      lastMessage: "Brak wiadomości",
      lastTime: "—",
      unread: 0,
      isPrivate: newRoomPrivate,
    };

    setRooms((previous) => [...previous, room]);

    setActiveRoomId(id);
    setSocketStatus("connecting");
    setMobileScreen("chat");
    setDetailsTab("about");

    setCreateOpen(false);
    setNewRoomName("");
    setNewRoomPrivate(false);
    setDraft("");
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
            onClick={() => setCreateOpen(true)}
            aria-label="Utwórz pokój"
            title="Utwórz pokój"
          >
            <Plus size={19} />
          </button>
        </div>

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
                    {room.isPrivate ? (
                      <LockKeyhole size={23} />
                    ) : (
                      <RoomGlyph icon={room.icon} />
                    )}
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
            onClick={() => setCreateOpen(true)}
            aria-label="Utwórz pokój"
          >
            <Plus size={21} />
          </button>
        </header>

        <div className="mobile-welcome">
          <span className="eyebrow">WITAJ W SOCALLED</span>

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
                {room.isPrivate ? (
                  <LockKeyhole size={24} />
                ) : (
                  <RoomGlyph icon={room.icon} />
                )}
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
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={22} />
            <span>Utwórz</span>
          </button>
        </nav>
      </section>

      {/* ====================================
          GŁÓWNY CZAT
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
            <RoomGlyph icon={activeRoom.icon} />
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
          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
              padding: "10px 14px",
              background: "#35291a",
              color: "#f0cda6",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            <WifiOff size={16} />

            <span>
              {socketStatus === "connecting"
                ? "Łączenie z serwerem..."
                : "Połączenie przerwane. Ponawiam próbę..."}
            </span>

            <button
              type="button"
              onClick={reconnectNow}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                border: "1px solid #96724b",
                borderRadius: 8,
                background: "#493522",
                color: "#f0cda6",
                cursor: "pointer",
              }}
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
              <RoomGlyph icon={activeRoom.icon} />
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
                    </div>

                    <div className="message-bubble">
                      {message.text}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* WYSYŁANIE WIADOMOŚCI */}

        <div className="composer-area">
          <form
            className="message-composer"
            onSubmit={sendMessage}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
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
          <div className="room-identity">
            <div className="room-identity-icon">
              {activeRoom.isPrivate ? (
                <LockKeyhole size={31} />
              ) : (
                <RoomGlyph icon={activeRoom.icon} />
              )}
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
                ? "Pokój prywatny"
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
                      {name.slice(0, 1).toUpperCase()}
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
                  Czat działa przez WebSocket.
                  Członkostwo i uprawnienia dodamy
                  w kolejnych etapach.
                </p>
              </div>
            </div>
          ) : (
            <div className="details-content">
              <div className="details-section">
                <h4>
                  <Palette size={16} />
                  MOTYW KOLORYSTYCZNY
                </h4>

                <p>Wybierz kolor akcentów aplikacji.</p>

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
                      aria-pressed={themeId === option.id}
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
                      notifications ? "toggle-on" : ""
                    }`}
                  >
                    <span />
                  </span>
                </button>

                <p className="setting-hint">
                  Na razie to ustawienie demonstracyjne.
                </p>
              </div>

              <div className="details-notice">
                <ShieldCheck size={20} />

                <p>
                  Personalizację pokojów, zmianę nazwy,
                  zdjęcia i pseudonimy uczestników
                  dodamy w kolejnych wersjach.
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
                onClick={() => setCreateOpen(false)}
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
              Każda społeczność zaczyna się
              od jednej rozmowy.
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
                />

                <LockKeyhole size={18} />
                <span>Pokój prywatny</span>
              </label>

              <p className="modal-hint">
                Prywatność jest na razie tylko
                oznaczeniem demonstracyjnym.
              </p>

              <button
                type="submit"
                className="primary-button"
                disabled={!newRoomName.trim()}
              >
                <Plus size={19} />
                Utwórz pokój
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
