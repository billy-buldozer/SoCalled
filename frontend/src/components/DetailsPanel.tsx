import type { CSSProperties } from "react";
import { Bell, BellOff, Check, Globe2, ImagePlus, LockKeyhole, Palette, Pencil, Save, Settings2, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { themeOptions, availableIcons, roleLabel, RoleIcon, RoomGlyph, RoomVisual } from '../socalled-shared';

import type { SoCalledModel } from '../hooks/useSoCalled';
export default function DetailsPanel({ model }: { model: SoCalledModel }) {
  const { setMobileScreen, detailsTab, setDetailsTab, themeId, setThemeId, notifications, setNotifications, socketStatus, roomName, setRoomName, roomDescription, setRoomDescription, roomTopic, setRoomTopic, roomIcon, setRoomIcon, roomImage, setRoomImage, roomSaving, imageBusy, roomError, roomSuccess, editingMemberId, memberNickname, setMemberNickname, memberSaving, memberError, memberSuccess, clientId, activeRoom, activeMembers, myRole, isRoomOwner, canEditRoom, handleRoomImage, saveRoomSettings, startMemberEdit, cancelMemberEdit, saveMemberNickname, changeMemberRole } = model;
  return (
<aside className="details-panel">
        <header className="details-header">
          <div>
            <span className="eyebrow">
              TWOJA SPOŁECZNOŚĆ
            </span>

            <h2>
              Informacje
            </h2>
          </div>

          <button
            type="button"
            className="icon-button mobile-only"
            onClick={() =>
              setMobileScreen("chat")
            }
            aria-label="Wróć do czatu"
          >
            <X size={22} />
          </button>
        </header>

        <div className="details-scroll">
          <div className="room-identity">
            <div className="room-identity-icon">
              <RoomVisual room={activeRoom} />
            </div>

            <h3>
              {activeRoom.name}
            </h3>

            <p>
              {activeRoom.topic}
            </p>

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

          {/* ZAKŁADKI */}

          <div className="details-tabs">
            <button
              type="button"
              className={
                detailsTab === "about"
                  ? "tab-active"
                  : ""
              }
              onClick={() =>
                setDetailsTab("about")
              }
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
              onClick={() =>
                setDetailsTab("settings")
              }
            >
              Ustawienia
            </button>
          </div>

          {/* O POKOJU */}

          {detailsTab === "about" ? (
            <div className="details-content">
              <div className="details-section">
                <h4>
                  OPIS POKOJU
                </h4>

                <p>
                  {activeRoom.description}
                </p>
              </div>

              <div className="room-stats">
                <div>
                  <Users size={19} />

                  <strong>
                    {activeRoom.memberCount}
                  </strong>

                  <span>
                    Uczestników
                  </span>
                </div>

                <div>
                  <span className="status-dot" />

                  <strong>
                    {activeRoom.onlineCount}
                  </strong>

                  <span>
                    Online
                  </span>
                </div>
              </div>

              {/* TWOJA ROLA */}

              <div className="details-section">
                <h4>
                  TWOJA ROLA
                </h4>

                <div className="socalled-my-role">
                  <RoleIcon role={myRole} />

                  <strong>
                    {roleLabel(myRole)}
                  </strong>
                </div>

                <p>
                  {myRole === "owner"
                    ? "Zarządzasz pokojem, moderatorami i nickami uczestników."
                    : myRole === "moderator"
                      ? "Możesz moderować wiadomości oraz zmieniać swój nick."
                      : "Możesz wysyłać wiadomości, zdjęcia i filmy oraz reagować na wpisy."}
                </p>
              </div>

              {/* UCZESTNICY */}

              <div className="details-section">
                <div className="section-heading-row">
                  <h4>
                    UCZESTNICY POKOJU
                  </h4>
                </div>

                {activeMembers.length === 0 ? (
                  <p className="socalled-members-empty">
                    Oczekiwanie na listę uczestników...
                  </p>
                ) : (
                  <div className="socalled-members-list">
                    {activeMembers.map((member) => {
                      const canEditNickname =
                        member.clientId === clientId ||
                        isRoomOwner;

                      const canChangeRole =
                        isRoomOwner &&
                        member.role !== "owner";

                      return (
                        <div
                          className="socalled-member-entry"
                          key={member.clientId}
                        >
                          <div className="socalled-member-main">
                            <div className="socalled-member-avatar">
                              {member.displayName
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>

                            <div className="socalled-member-info">
                              <strong>
                                {member.displayName}

                                {member.clientId === clientId && (
                                  <span className="socalled-you-label">
                                    {" "}(Ty)
                                  </span>
                                )}
                              </strong>

                              {member.nickname && (
                                <span className="socalled-member-username">
                                  @{member.username}
                                </span>
                              )}

                              <div className="socalled-member-status">
                                <span
                                  className={
                                    member.online
                                      ? "socalled-presence online"
                                      : "socalled-presence offline"
                                  }
                                />

                                <span>
                                  {member.online
                                    ? "Online"
                                    : "Offline"}
                                </span>
                              </div>

                              <span
                                className={`socalled-role-badge role-${member.role}`}
                              >
                                <RoleIcon
                                  role={member.role}
                                />

                                {roleLabel(member.role)}
                              </span>
                            </div>

                            {canEditNickname && (
                              <button
                                type="button"
                                className="socalled-member-edit-button"
                                aria-label={
                                  `Edytuj nick ${member.displayName}`
                                }
                                onClick={() =>
                                  startMemberEdit(member)
                                }
                                disabled={memberSaving}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                          </div>

                          {/* EDYCJA NICKU */}

                          {editingMemberId === member.clientId && (
                            <form
                              className="socalled-nickname-form"
                              onSubmit={saveMemberNickname}
                            >
                              <label>
                                Nick w tym pokoju
                              </label>

                              <input
                                value={memberNickname}
                                onChange={(event) =>
                                  setMemberNickname(
                                    event.target.value
                                  )
                                }
                                maxLength={32}
                                placeholder={member.username}
                                disabled={memberSaving}
                                autoFocus
                              />

                              <small>
                                Puste pole przywraca
                                podstawową nazwę.
                              </small>

                              <div className="socalled-nickname-actions">
                                <button
                                  type="button"
                                  onClick={cancelMemberEdit}
                                  disabled={memberSaving}
                                >
                                  Anuluj
                                </button>

                                <button
                                  type="submit"
                                  className="socalled-nickname-save"
                                  disabled={
                                    memberSaving ||
                                    socketStatus !== "online"
                                  }
                                >
                                  <Check size={15} />

                                  {memberSaving
                                    ? "Zapisywanie..."
                                    : "Zapisz"}
                                </button>
                              </div>
                            </form>
                          )}

                          {canChangeRole && (
                            <button
                              type="button"
                              className="socalled-role-control"
                              onClick={() =>
                                changeMemberRole(member)
                              }
                              disabled={
                                memberSaving ||
                                socketStatus !== "online"
                              }
                            >
                              <ShieldCheck size={15} />

                              {member.role === "moderator"
                                ? "Odbierz moderatora"
                                : "Nadaj moderatora"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {memberError && (
                  <div
                    className="room-form-error"
                    role="alert"
                  >
                    {memberError}
                  </div>
                )}

                {memberSuccess && (
                  <div
                    className="room-form-success"
                    role="status"
                  >
                    <Check size={16} />
                    {memberSuccess}
                  </div>
                )}
              </div>

              <div className="details-notice">
                <ShieldCheck size={20} />

                <p>
                  Uczestnicy, wiadomości, zdjęcia
                  i reakcje synchronizują się
                  w czasie rzeczywistym.
                </p>
              </div>
            </div>
          ) : (
            /* USTAWIENIA */

            <div className="details-content">
              <div className="details-section">
                <h4>
                  <Settings2 size={16} />
                  PERSONALIZACJA POKOJU
                </h4>

                <p>
                  Dostosuj nazwę, opis,
                  ikonę i zdjęcie pokoju.
                </p>

                {!canEditRoom && (
                  <div className="room-editor-locked">
                    <LockKeyhole size={18} />

                    Tylko właściciel może
                    zmieniać ustawienia pokoju.
                  </div>
                )}

                <form
                  className="room-custom-form"
                  onSubmit={saveRoomSettings}
                >
                  <label htmlFor="custom-room-name">
                    Nazwa pokoju
                  </label>

                  <input
                    id="custom-room-name"
                    value={roomName}
                    onChange={(event) =>
                      setRoomName(
                        event.target.value
                      )
                    }
                    maxLength={28}
                    required
                    disabled={
                      !canEditRoom ||
                      roomSaving
                    }
                  />

                  <label htmlFor="custom-room-topic">
                    Temat pokoju
                  </label>

                  <input
                    id="custom-room-topic"
                    value={roomTopic}
                    onChange={(event) =>
                      setRoomTopic(
                        event.target.value
                      )
                    }
                    maxLength={100}
                    placeholder="O czym rozmawiamy?"
                    disabled={
                      !canEditRoom ||
                      roomSaving
                    }
                  />

                  <label htmlFor="custom-room-description">
                    Opis pokoju
                  </label>

                  <textarea
                    id="custom-room-description"
                    value={roomDescription}
                    onChange={(event) =>
                      setRoomDescription(
                        event.target.value
                      )
                    }
                    maxLength={300}
                    rows={3}
                    placeholder="Opisz społeczność..."
                    disabled={
                      !canEditRoom ||
                      roomSaving
                    }
                  />

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
                        aria-pressed={
                          roomIcon === icon
                        }
                        disabled={
                          !canEditRoom ||
                          roomSaving
                        }
                      >
                        <RoomGlyph icon={icon} />
                      </button>
                    ))}
                  </div>

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
                          !canEditRoom ||
                          roomSaving ||
                          imageBusy
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
                        pomniejszone.
                      </small>
                    </div>
                  </div>

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

              {/* MOTYW */}

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
                      style={{
                        "--swatch": option.hex,
                      } as CSSProperties}
                      aria-pressed={
                        themeId === option.id
                      }
                    >
                      <span className="theme-swatch">
                        {themeId === option.id && (
                          <Check size={16} />
                        )}
                      </span>

                      <span>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* POWIADOMIENIA */}

              <div className="details-section">
                <h4>
                  POWIADOMIENIA
                </h4>

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

                  <span>
                    Powiadomienia
                  </span>

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
                  Ustawienia pokoju są wspólne
                  dla uczestników. Motyw kolorystyczny
                  jest indywidualny.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
  );
}
