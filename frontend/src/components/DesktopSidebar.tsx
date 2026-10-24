import { Plus, Sparkles } from "lucide-react";
import { roleLabel, RoomVisual } from '../socalled-shared';

import type { SoCalledModel } from '../hooks/useSoCalled';
export default function DesktopSidebar({ model }: { model: SoCalledModel }) {
  const { rooms, activeRoomId, setCreateOpen, setCreateError, socketStatus, nickname, myRole, openRoom } = model;
  return (
<aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <div className="brand-symbol">
            SO
          </div>

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

        <div className="hex-scroll">
          <div className="hex-grid">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`hex-slot ${
                  activeRoomId === room.id
                    ? "hex-slot--active"
                    : ""
                }`}
              >
                <button
                  className="hex-button"
                  type="button"
                  onClick={() =>
                    openRoom(room.id)
                  }
                  aria-label={
                    `Otwórz pokój ${room.name}`
                  }
                  aria-pressed={
                    activeRoomId === room.id
                  }
                >
                  <span className="hex-inside">
                    <RoomVisual room={room} />
                  </span>
                </button>

                {room.unread > 0 && (
                  <span className="socalled-hex-unread">
                    {room.unread > 9
                      ? "9+"
                      : room.unread}
                  </span>
                )}

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
              {nickname
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="account-copy">
              <strong>{nickname}</strong>

              <span>
                {roleLabel(myRole)} w pokoju
              </span>
            </div>

            <Sparkles
              size={17}
              className="account-sparkle"
            />
          </div>
        </div>
      </aside>
  );
}
