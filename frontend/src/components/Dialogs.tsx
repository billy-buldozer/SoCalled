import { Clapperboard, Download, Forward, LockKeyhole, Plus, X } from "lucide-react";

import type { SoCalledModel } from '../hooks/useSoCalled';
export default function Dialogs({ model }: { model: SoCalledModel }) {
  const { createOpen, setCreateOpen, newRoomName, setNewRoomName, newRoomPrivate, setNewRoomPrivate, createBusy, createError, socketStatus, imageViewer, setImageViewer, forwardTarget, forwardRoomId, setForwardRoomId, forwardBusy, forwardError, forwardRooms, saveMessageImage, cancelForward, submitForward, createRoom } = model;
  return (
<>
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
                  setNewRoomName(
                    event.target.value
                  )
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

                <span>
                  Pokój prywatny (demo)
                </span>
              </label>

              <p className="modal-hint">
                Prywatność jest obecnie
                tylko oznaczeniem demonstracyjnym.
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
{forwardTarget && (
        <div className="modal-backdrop">
          <section
            className="create-modal socalled-forward-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forward-title"
          >
            <div className="modal-header">
              <div className="modal-icon">
                <Forward size={23} />
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={cancelForward}
                disabled={forwardBusy}
                aria-label="Zamknij"
              >
                <X size={21} />
              </button>
            </div>

            <span className="eyebrow">
              PRZEKAZYWANIE WIADOMOŚCI
            </span>

            <h2 id="forward-title">
              Przekaż dalej
            </h2>

            <p className="modal-description">
              Wybierz pokój, w którym ma
              pojawić się kopia tej wiadomości.
            </p>

            <div className="socalled-forward-preview">
              <div className="socalled-forward-preview-top">
                <Forward size={15} />

                <strong>
                  {forwardTarget.author}
                </strong>
              </div>

              {forwardTarget.image && (
                <img
                  src={forwardTarget.image}
                  alt="Podgląd przekazywanego zdjęcia"
                />
              )}

              {forwardTarget.videoId && (
                <div className="socalled-forward-video-preview">
                  <Clapperboard size={19} />

                  <span>
                    Przekazywany film
                  </span>
                </div>
              )}

              <p>
                {forwardTarget.text ||
                  (forwardTarget.videoId
                    ? "🎬 Film bez podpisu"
                    : forwardTarget.image
                      ? "📷 Zdjęcie bez podpisu"
                      : "")}
              </p>
            </div>

            <form
              className="socalled-forward-form"
              onSubmit={submitForward}
            >
              <label htmlFor="forward-room">
                Pokój docelowy
              </label>

              <select
                id="forward-room"
                value={forwardRoomId}
                onChange={(event) =>
                  setForwardRoomId(
                    event.target.value
                  )
                }
                disabled={forwardBusy}
                required
              >
                {forwardRooms.map((room) => (
                  <option
                    key={room.id}
                    value={room.id}
                  >
                    {room.name}
                  </option>
                ))}
              </select>

              {forwardRooms.length === 0 && (
                <p className="socalled-forward-hint">
                  Utwórz jeszcze jeden pokój,
                  żeby przekazywać wiadomości.
                </p>
              )}

              {forwardError && (
                <div
                  className="room-form-error"
                  role="alert"
                >
                  {forwardError}
                </div>
              )}

              <button
                type="submit"
                className="primary-button"
                disabled={
                  !forwardRoomId ||
                  forwardBusy ||
                  socketStatus !== "online"
                }
              >
                <Forward size={18} />

                {forwardBusy
                  ? "Przekazywanie..."
                  : "Przekaż wiadomość"}
              </button>
            </form>
          </section>
        </div>
      )}
{imageViewer && (
        <div
          className="socalled-image-lightbox"
          onClick={() =>
            setImageViewer(null)
          }
        >
          <section
            className="socalled-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-label={
              `Zdjęcie od ${imageViewer.author}`
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="socalled-lightbox-header">
              <span>
                Zdjęcie od {imageViewer.author}
              </span>

              <div className="socalled-lightbox-actions">
                <button
                  type="button"
                  className="socalled-download-button"
                  onClick={() =>
                    void saveMessageImage(
                      imageViewer.image,
                      imageViewer.messageId
                    )
                  }
                  title="Pobierz jako PNG"
                  aria-label="Pobierz jako PNG"
                >
                  <Download size={19} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setImageViewer(null)
                  }
                  aria-label="Zamknij zdjęcie"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <img
              src={imageViewer.image}
              alt={
                `Powiększone zdjęcie od ${imageViewer.author}`
              }
            />
          </section>
        </div>
      )}
</>
  );
}
