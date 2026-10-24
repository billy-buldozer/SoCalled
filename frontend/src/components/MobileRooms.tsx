import { ChevronRight, MessageCircle, Plus, Search } from "lucide-react";
import { RoomVisual } from '../socalled-shared';

import type { SoCalledModel } from '../hooks/useSoCalled';
export default function MobileRooms({ model }: { model: SoCalledModel }) {
  const { search, setSearch, setCreateOpen, setCreateError, filteredRooms, openRoom } = model;
  return (
<section className="mobile-room-screen">
        <header className="mobile-home-header">
          <div className="mobile-brand">
            <div className="brand-symbol">
              SO
            </div>

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
            <span className="accent-dot">
              .
            </span>
          </h1>

          <p>
            Znajdź swoją społeczność
            i zacznij rozmawiać.
          </p>
        </div>

        <label className="mobile-search">
          <Search size={19} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Szukaj pokoju..."
            aria-label="Szukaj pokoju"
          />
        </label>

        <div className="mobile-list-heading">
          <span>
            WSZYSTKIE POKOJE
          </span>

          <span>
            {filteredRooms.length}
          </span>
        </div>

        <div className="mobile-room-list">
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              className="mobile-room-item"
              type="button"
              onClick={() =>
                openRoom(room.id)
              }
            >
              <div className="mobile-room-icon">
                <RoomVisual room={room} />
              </div>

              <div className="mobile-room-copy">
                <div className="mobile-room-line">
                  <strong>
                    {room.name}
                  </strong>

                  <time>
                    {room.lastTime}
                  </time>
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
  );
}
