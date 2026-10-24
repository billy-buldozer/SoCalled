
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
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import "./App.css";

type RoomIcon = "hash" | "game" | "code" | "music" | "camera" | "coffee" | "globe";
type MobileScreen = "rooms" | "chat" | "details";
type DetailsTab = "about" | "settings";

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
  mine?: boolean;
};

const initialRooms: Room[] = [
  {
    id: "general",
    name: "General",
    icon: "hash",
    description: "Główne miejsce spotkań społeczności SoCalled.",
    topic: "Wszystko zaczyna się od rozmowy.",
    members: 28,
    online: 8,
    lastMessage: "Widzimy się wieczorem!",
    lastTime: "14:28",
    unread: 3,
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
    lastMessage: "Kto dzisiaj gra?",
    lastTime: "13:48",
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
    lastMessage: "Nowy projekt na GitHubie.",
    lastTime: "12:17",
    unread: 2,
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
    lastMessage: "Ten album jest genialny.",
    lastTime: "11:52",
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
    lastMessage: "Sprawdźcie to ujęcie!",
    lastTime: "Wczoraj",
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
    lastMessage: "No i pięknie XDDD",
    lastTime: "Wczoraj",
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
    lastMessage: "Ale ciekawy artykuł.",
    lastTime: "Pon.",
    unread: 0,
    isPrivate: false,
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    roomId: "general",
    author: "Maja",
    time: "14:12",
    text: "Hej wszystkim! Co tam u was?",
  },
  {
    id: "2",
    roomId: "general",
    author: "Kuba",
    time: "14:14",
    text: "Właśnie testuję nową platformę. Wygląda obiecująco 👀",
  },
  {
    id: "3",
    roomId: "general",
    author: "Ola",
    time: "14:17",
    text: "Ten zielony motyw jest naprawdę świetny.",
  },
  {
    id: "4",
    roomId: "general",
    author: "Ty",
    time: "14:20",
    text: "Witajcie w SoCalled! 🌿",
    mine: true,
  },
  {
    id: "5",
    roomId: "general",
    author: "Maja",
    time: "14:25",
    text: "Ciekawe, jak będzie wyglądał cały portal, kiedy dodamy posty i profile.",
  },
  {
    id: "6",
    roomId: "general",
    author: "Kuba",
    time: "14:28",
    text: "Widzimy się wieczorem!",
  },
  {
    id: "7",
    roomId: "gaming",
    author: "Kuba",
    time: "13:45",
    text: "Kto chętny na wspólną rozgrywkę?",
  },
  {
    id: "8",
    roomId: "gaming",
    author: "Maja",
    time: "13:48",
    text: "Ja mogę dołączyć później!",
  },
  {
    id: "9",
    roomId: "dev",
    author: "Ola",
    time: "12:12",
    text: "Znalazłam ciekawy sposób na synchronizację wątków.",
  },
  {
    id: "10",
    roomId: "dev",
    author: "Kuba",
    time: "12:17",
    text: "Nowy projekt na GitHubie. Wrzucę link wieczorem.",
  },
  {
    id: "11",
    roomId: "music",
    author: "Maja",
    time: "11:52",
    text: "Polecam wam przesłuchać ten album od początku do końca.",
  },
  {
    id: "12",
    roomId: "photo",
    author: "Ola",
    time: "18:40",
    text: "Zrobiłam świetne zdjęcia podczas zachodu słońca.",
  },
  {
    id: "13",
    roomId: "offtopic",
    author: "Kuba",
    time: "20:10",
    text: "No i pięknie XDDD",
  },
  {
    id: "14",
    roomId: "world",
    author: "Maja",
    time: "10:08",
    text: "Znalazłam ciekawy artykuł, później go podeślę.",
  },
];

const themeOptions = [
  { id: "emerald", label: "Emerald", hex: "#55df91", rgb: "85, 223, 145" },
  { id: "mint", label: "Mint", hex: "#65dbc5", rgb: "101, 219, 197" },
  { id: "lime", label: "Lime", hex: "#b4db63", rgb: "180, 219, 99" },
] as const;

type ThemeId = (typeof themeOptions)[number]["id"];

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

function App() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [activeRoomId, setActiveRoomId] = useState("general");
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>("rooms");
  const [detailsTab, setDetailsTab] = useState<DetailsTab>("about");

  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);

  const [themeId, setThemeId] = useState<ThemeId>("emerald");
  const [notifications, setNotifications] = useState(true);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0];
  const theme = themeOptions.find((item) => item.id === themeId) ?? themeOptions[0];

  const roomMessages = useMemo(
    () => messages.filter((message) => message.roomId === activeRoomId),
    [messages, activeRoomId]
  );

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.name.toLocaleLowerCase("pl-PL").includes(
          search.toLocaleLowerCase("pl-PL")
        )
      ),
    [rooms, search]
  );

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeRoomId, messages, mobileScreen]);

  function openRoom(roomId: string) {
    setActiveRoomId(roomId);
    setMobileScreen("chat");
    setDetailsTab("about");

    setRooms((previous) =>
      previous.map((room) =>
        room.id === roomId ? { ...room, unread: 0 } : room
      )
    );
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = draft.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message: ChatMessage = {
      id: `message-${Date.now()}-${Math.random()}`,
      roomId: activeRoomId,
      author: "Ty",
      time,
      text,
      mine: true,
    };

    setMessages((previous) => [...previous, message]);

    setRooms((previous) =>
      previous.map((room) =>
        room.id === activeRoomId
          ? { ...room, lastMessage: text, lastTime: time, unread: 0 }
          : room
      )
    );

    setDraft("");
  }

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
      lastMessage: "Pokój został utworzony.",
      lastTime: "Teraz",
      unread: 0,
      isPrivate: newRoomPrivate,
    };

    setRooms((previous) => [...previous, room]);
    setActiveRoomId(id);
    setMobileScreen("chat");
    setDetailsTab("about");
    setCreateOpen(false);
    setNewRoomName("");
    setNewRoomPrivate(false);
  }

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
      {/* DESKTOP — LEWY PANEL */}

      <aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <div className="brand-symbol">SO</div>
          <div>
            <div className="brand-name">
              So<span>Called</span>
            </div>
            <div className="brand-subtitle">YOUR SPACE. YOUR VOICE.</div>
          </div>
        </div>

        <div className="sidebar-section-title">
          <div>
            <span className="eyebrow">TWOJA PRZESTRZEŃ</span>
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
                  activeRoomId === room.id ? "hex-slot--active" : ""
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

                <span className="hex-tooltip">{room.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="community-status">
            <span className="status-dot" />
            <span>SoCalled jest online</span>
          </div>

          <div className="account-card">
            <div className="account-avatar">T</div>
            <div className="account-copy">
              <strong>Ty</strong>
              <span>Tryb demonstracyjny</span>
            </div>
            <Sparkles size={17} className="account-sparkle" />
          </div>
        </div>
      </aside>

      {/* MOBILE — LISTA POKOJÓW */}

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
          <h1>Twoje pokoje<span className="accent-dot">.</span></h1>
          <p>Znajdź swoją społeczność i zacznij rozmawiać.</p>
        </div>

        <label className="mobile-search">
          <Search size={19} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
                  <span className="mobile-preview">{room.lastMessage}</span>
                  {room.unread > 0 ? (
                    <span className="unread-badge">{room.unread}</span>
                  ) : (
                    <ChevronRight size={17} className="row-chevron" />
                  )}
                </div>
              </div>
            </button>
          ))}

          {filteredRooms.length === 0 && (
            <p className="empty-search">Nie znaleziono takiego pokoju.</p>
          )}
        </div>

        <nav className="mobile-bottom-nav" aria-label="Nawigacja">
          <button type="button" className="mobile-nav-active">
            <MessageCircle size={22} />
            <span>Pokoje</span>
          </button>
          <button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={22} />
            <span>Utwórz</span>
          </button>
        </nav>
      </section>

      {/* ŚRODEK — CZAT */}

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
              <span className="status-dot" />
              {activeRoom.online} online
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

        <div className="chat-scroll" ref={chatScrollRef}>
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
            <p>Przykładowa konwersacja</p>
            <span />
          </div>

          <div className="message-list">
            {roomMessages.length === 0 ? (
              <div className="empty-messages">
                <MessageCircle size={29} />
                <h3>Jeszcze tu cicho.</h3>
                <p>Napisz pierwszą wiadomość w tym pokoju.</p>
              </div>
            ) : (
              roomMessages.map((message) => (
                <article
                  key={message.id}
                  className={`message-row ${
                    message.mine ? "message-row--mine" : ""
                  }`}
                >
                  {!message.mine && (
                    <div className="message-avatar">
                      {message.author.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="message-body">
                    <div className="message-meta">
                      <strong>{message.author}</strong>
                      <time>{message.time}</time>
                    </div>
                    <div className="message-bubble">{message.text}</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="composer-area">
          <form className="message-composer" onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Wiadomość do ${activeRoom.name}...`}
              aria-label="Treść wiadomości"
              maxLength={2000}
            />

            <button
              type="submit"
              className="send-button"
              disabled={!draft.trim()}
              aria-label="Wyślij wiadomość"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="composer-hint">
            Wersja demonstracyjna — wiadomości są lokalne.
          </p>
        </div>
      </main>

      {/* PRAWY PANEL — INFORMACJE I USTAWIENIA */}

      <aside className="details-panel">
        <header className="details-header">
          <div>
            <span className="eyebrow">TWOJA SPOŁECZNOŚĆ</span>
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
              {activeRoom.isPrivate ? "Pokój prywatny" : "Pokój publiczny"}
            </span>
          </div>

          <div className="details-tabs">
            <button
              type="button"
              className={detailsTab === "about" ? "tab-active" : ""}
              onClick={() => setDetailsTab("about")}
            >
              O pokoju
            </button>
            <button
              type="button"
              className={detailsTab === "settings" ? "tab-active" : ""}
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
                  <span>Członków</span>
                </div>
                <div>
                  <span className="status-dot" />
                  <strong>{activeRoom.online}</strong>
                  <span>Online</span>
                </div>
              </div>

              <div className="details-section">
                <div className="section-heading-row">
                  <h4>PRZYKŁADOWI UCZESTNICY</h4>
                </div>

                {["Ty", "Maja", "Kuba", "Ola"].map((name, index) => (
                  <div className="member-row" key={name}>
                    <div className={`member-avatar member-avatar-${index}`}>
                      {name.slice(0, 1)}
                    </div>
                    <div>
                      <strong>{name}</strong>
                      <span>{index === 0 ? "Twój profil" : "Online"}</span>
                    </div>
                    <span className="member-online-dot" />
                  </div>
                ))}
              </div>

              <div className="details-notice">
                <ShieldCheck size={20} />
                <p>
                  To podgląd interfejsu. Prawdziwe uprawnienia
                  i członkostwo dodamy razem z backendem.
                </p>
              </div>
            </div>
          ) : (
            <div className="details-content">
              <div className="details-section">
                <h4>
                  <Palette size={16} /> MOTYW KOLORYSTYCZNY
                </h4>
                <p>Wybierz kolor akcentów aplikacji.</p>

                <div className="theme-options">
                  {themeOptions.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={`theme-option ${
                        themeId === option.id ? "theme-option--active" : ""
                      }`}
                      onClick={() => setThemeId(option.id)}
                      style={
                        { "--swatch": option.hex } as CSSProperties
                      }
                      aria-pressed={themeId === option.id}
                    >
                      <span className="theme-swatch">
                        {themeId === option.id && <Check size={16} />}
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
                  onClick={() => setNotifications((current) => !current)}
                  aria-pressed={notifications}
                >
                  {notifications ? <Bell size={19} /> : <BellOff size={19} />}
                  <span>Powiadomienia</span>
                  <span className={`toggle ${notifications ? "toggle-on" : ""}`}>
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
                  Ustawienia prywatności oraz zarządzanie użytkownikami
                  pojawią się w kolejnych etapach.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* OKNO TWORZENIA POKOJU */}

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

            <span className="eyebrow">NOWA PRZESTRZEŃ</span>
            <h2 id="create-room-title">Utwórz pokój</h2>
            <p className="modal-description">
              Każda społeczność zaczyna się od jednej rozmowy.
            </p>

            <form onSubmit={createRoom} className="create-form">
              <label htmlFor="room-name">Nazwa pokoju</label>
              <input
                id="room-name"
                value={newRoomName}
                onChange={(event) => setNewRoomName(event.target.value)}
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
                    setNewRoomPrivate(event.target.checked)
                  }
                />
                <LockKeyhole size={18} />
                <span>Pokój prywatny</span>
              </label>

              <p className="modal-hint">
                Prywatność jest na razie tylko oznaczeniem w interfejsie.
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
