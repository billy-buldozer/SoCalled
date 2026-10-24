import { ArrowLeft, Check, Clapperboard, CornerUpLeft, Download, Film, Forward, Heart, ImagePlus, Info, MessageCircle, MoreHorizontal, Pencil, RefreshCw, Search, Send, Settings2, SmilePlus, Trash2, WifiOff, X } from "lucide-react";
import { availableReactions, RoomVisual, videoUrl, formatFileSize } from '../socalled-shared';

import type { SoCalledModel } from '../hooks/useSoCalled';
export default function ChatPanel({ model }: { model: SoCalledModel }) {
  const { setMobileScreen, setDetailsTab, draft, socketStatus, chatScrollRef, composerInputRef, actionMenuId, setActionMenuId, editingId, editingText, setEditingText, pendingEditId, actionError, setActionError, replyTarget, setReplyTarget, reactionPickerId, setReactionPickerId, attachedImage, imagePreparing, imageError, setImageError, fileInputRef, attachedVideoId, attachedVideoName, attachedVideoSize, videoUploading, videoError, setVideoError, videoInputRef, forwardNotice, setForwardNotice, heartBurst, clientId, activeRoom, canModerateMessages, roomMessages, typingLabel, reconnectNow, stopTyping, handleDraftChange, handleMessageDoubleClick, handleMessageTouchStart, handleMessageTouchEnd, handleImageClick, handleMessageImageSelection, removeAttachedImage, removeAttachedVideo, handleVideoSelection, openRoom, replyToMessage, sendMessage, toggleReaction, saveMessageImage, startForward, toggleMessageMenu, startMessageEdit, cancelMessageEdit, saveMessageEdit, deleteMessage } = model;
  return (
<main className="chat-panel">
        <header className="chat-header">
          <button
            type="button"
            className="icon-button mobile-only"
            onClick={() => {
              stopTyping();
              setMobileScreen("rooms");
            }}
            aria-label="Powrót do pokojów"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="chat-header-icon">
            <RoomVisual room={activeRoom} />
          </div>

          <div className="chat-header-copy">
            <h1>
              {activeRoom.name}
            </h1>

            <span>
              {activeRoom.topic}
            </span>
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
            className="connection-warning"
            role="status"
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

            <span className="eyebrow">
              POKÓJ SOCALLED
            </span>

            <h2>
              Witaj w {activeRoom.name}.
            </h2>

            <p>
              {activeRoom.description}
            </p>
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

                <h3>
                  Jeszcze tu cicho.
                </h3>

                <p>
                  Napisz pierwszą wiadomość
                  albo prześlij zdjęcie lub film.
                </p>
              </div>
            ) : (
              roomMessages.map((message) => {
                const canDelete =
                  message.mine ||
                  canModerateMessages;

                const reactionEntries =
                  Object.entries(
                    message.reactions ?? {}
                  ).filter(
                    ([, users]) =>
                      users.length > 0
                  );

                return (
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

                    <div
                      className="message-body socalled-double-like-area"
                      onDoubleClick={(event) =>
                        handleMessageDoubleClick(
                          event,
                          message
                        )
                      }
                      onTouchStart={
                        handleMessageTouchStart
                      }
                      onTouchEnd={(event) =>
                        handleMessageTouchEnd(
                          event,
                          message
                        )
                      }
                    >
                      {/* NAGŁÓWEK WIADOMOŚCI */}

                      <div className="message-meta">
                        <strong>
                          {message.author}
                        </strong>

                        <time>
                          {message.time}
                        </time>

                        {message.editedAt && (
                          <span className="message-edited">
                            · edytowano
                          </span>
                        )}

                        {/* MENU WIADOMOŚCI */}

                        <div className="message-actions">
                          <button
                            type="button"
                            className="message-actions-trigger"
                            aria-label="Opcje wiadomości"
                            aria-expanded={
                              actionMenuId === message.id
                            }
                            onClick={() =>
                              toggleMessageMenu(
                                message.id
                              )
                            }
                          >
                            <MoreHorizontal size={19} />
                          </button>

                          {actionMenuId === message.id && (
                            <div className="message-actions-menu">
                              <button
                                type="button"
                                onClick={() =>
                                  replyToMessage(message)
                                }
                              >
                                <CornerUpLeft size={16} />
                                Odpowiedz
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  startForward(message)
                                }
                              >
                                <Forward size={16} />
                                Przekaż dalej
                              </button>

                              {message.image && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveMessageImage(
                                      message.image!,
                                      message.id
                                    )
                                  }
                                >
                                  <Download size={16} />
                                  Pobierz PNG
                                </button>
                              )}

                              {message.mine && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    startMessageEdit(message)
                                  }
                                >
                                  <Pencil size={16} />

                                  {message.image ||
                                  message.videoId
                                    ? "Edytuj podpis"
                                    : "Edytuj"}
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  className="delete-action"
                                  onClick={() =>
                                    deleteMessage(message)
                                  }
                                >
                                  <Trash2 size={16} />

                                  {message.mine
                                    ? "Usuń"
                                    : "Usuń (moderacja)"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PRZEKAZANA WIADOMOŚĆ */}

                      {message.forwardedFrom && (
                        <div className="socalled-forwarded-origin">
                          <Forward size={14} />

                          <div>
                            <span>
                              Przekazano z{" "}
                              <strong>
                                {message.forwardedFrom.roomName}
                              </strong>
                            </span>

                            <small>
                              Oryginalny autor:{" "}
                              {message.forwardedFrom.author}
                            </small>
                          </div>
                        </div>
                      )}

                      {/* CYTAT */}

                      {message.replyTo && (
                        <div className="socalled-reply-quote">
                          <CornerUpLeft size={14} />

                          <div className="socalled-reply-quote-copy">
                            <strong>
                              {message.replyTo.deleted
                                ? "Usunięta wiadomość"
                                : message.replyTo.author}
                            </strong>

                            <span>
                              {message.replyTo.text}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ZDJĘCIE */}

                      {message.image && (
                        <button
                          type="button"
                          className="socalled-chat-image-button"
                          onClick={(event) =>
                            handleImageClick(
                              event,
                              message
                            )
                          }
                          aria-label={
                            `Otwórz zdjęcie od ${message.author}`
                          }
                        >
                          <img
                            src={message.image}
                            alt={
                              `Zdjęcie wysłane przez ${message.author}`
                            }
                            loading="lazy"
                          />

                          <span className="socalled-image-zoom">
                            <Search size={15} />
                            Powiększ
                          </span>
                        </button>
                      )}

                      {/* NOWOŚĆ — ODTWARZACZ FILMU */}

                      {message.videoId && (
                        <div className="socalled-chat-video-wrap">
                          <div className="socalled-chat-video-label">
                            <Clapperboard size={15} />
                            Film w wiadomości
                          </div>

                          <video
                            key={message.videoId}
                            className="socalled-chat-video"
                            src={videoUrl(
                              message.videoId
                            )}
                            controls
                            playsInline
                            preload="metadata"
                            onDoubleClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            Twoja przeglądarka
                            nie obsługuje odtwarzania
                            tego filmu.
                          </video>
                        </div>
                      )}

                      {/* TEKST / EDYCJA PODPISU */}

                      {editingId === message.id ? (
                        <form
                          className="message-edit-form"
                          onSubmit={saveMessageEdit}
                        >
                          <textarea
                            value={editingText}
                            onChange={(event) =>
                              setEditingText(
                                event.target.value
                              )
                            }
                            maxLength={2000}
                            rows={3}
                            placeholder={
                              message.image ||
                              message.videoId
                                ? "Podpis (opcjonalny)"
                                : "Treść wiadomości"
                            }
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
                              onClick={
                                cancelMessageEdit
                              }
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
                                (
                                  !editingText.trim() &&
                                  !message.image &&
                                  !message.videoId
                                ) ||
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
                        message.text && (
                          <div className="message-bubble">
                            {message.text}
                          </div>
                        )
                      )}

                      {/* REAKCJE EMOJI */}

                      <div className="socalled-message-social">
                        {reactionEntries.map(
                          ([emoji, users]) => {
                            const mine =
                              users.includes(clientId);

                            return (
                              <button
                                type="button"
                                key={emoji}
                                className={`socalled-reaction-chip ${
                                  mine
                                    ? "socalled-reaction-mine"
                                    : ""
                                }`}
                                onClick={() =>
                                  toggleReaction(
                                    message.id,
                                    emoji
                                  )
                                }
                                disabled={
                                  socketStatus !== "online"
                                }
                                aria-pressed={mine}
                                aria-label={
                                  `${emoji}: ${users.length} reakcji`
                                }
                              >
                                <span>{emoji}</span>

                                <strong>
                                  {users.length}
                                </strong>
                              </button>
                            );
                          }
                        )}

                        <button
                          type="button"
                          className="socalled-reaction-add"
                          aria-label="Dodaj reakcję"
                          aria-expanded={
                            reactionPickerId === message.id
                          }
                          disabled={
                            socketStatus !== "online"
                          }
                          onClick={() => {
                            setActionMenuId(null);

                            setReactionPickerId(
                              (current) =>
                                current === message.id
                                  ? null
                                  : message.id
                            );
                          }}
                        >
                          <SmilePlus size={16} />
                        </button>
                      </div>

                      {reactionPickerId === message.id && (
                        <div className="socalled-reaction-picker">
                          {availableReactions.map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() =>
                                toggleReaction(
                                  message.id,
                                  emoji
                                )
                              }
                              aria-label={
                                `Reakcja ${emoji}`
                              }
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* SERDUSZKO DOUBLE TAP */}

                      {heartBurst?.messageId === message.id && (
                        <span
                          key={heartBurst.sequence}
                          className="socalled-double-heart"
                          aria-hidden="true"
                        >
                          <Heart
                            size={76}
                            fill="currentColor"
                            strokeWidth={1}
                          />
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* BŁĘDY OPERACJI */}

        {actionError && (
          <div
            className="message-operation-error"
            role="alert"
          >
            <span>
              {actionError}
            </span>

            <button
              type="button"
              onClick={() =>
                setActionError("")
              }
              aria-label="Zamknij komunikat"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* POTWIERDZENIE PRZEKAZANIA */}

        {forwardNotice && (
          <div
            className="socalled-forward-notice"
            role="status"
          >
            <Check size={17} />

            <span>
              Przekazano do{" "}
              <strong>
                {forwardNotice.roomName}
              </strong>
            </span>

            <button
              type="button"
              onClick={() => {
                const roomId =
                  forwardNotice.roomId;

                setForwardNotice(null);
                openRoom(roomId);
              }}
            >
              Otwórz pokój
            </button>

            <button
              type="button"
              className="socalled-notice-close"
              aria-label="Zamknij powiadomienie"
              onClick={() =>
                setForwardNotice(null)
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* WSKAŹNIK PISANIA */}

        {socketStatus === "online" &&
          typingLabel && (
          <div
            className="socalled-typing-indicator"
            role="status"
            aria-live="polite"
          >
            <span className="socalled-typing-dots">
              <i />
              <i />
              <i />
            </span>

            <span>
              {typingLabel}
            </span>
          </div>
        )}

        {/* ODPOWIEDŹ */}

        {replyTarget && (
          <div className="socalled-reply-composer">
            <CornerUpLeft size={17} />

            <div>
              <strong>
                Odpowiadasz: {replyTarget.author}
              </strong>

              <span>
                {replyTarget.videoId
                  ? "🎬 Film"
                  : replyTarget.image
                    ? "📷 Zdjęcie"
                    : replyTarget.text.slice(0, 140)}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setReplyTarget(null)
              }
              aria-label="Anuluj odpowiedź"
            >
              <X size={19} />
            </button>
          </div>
        )}

        {/* PODGLĄD ZDJĘCIA PRZED WYSŁANIEM */}

        {attachedImage && (
          <div className="socalled-image-attachment">
            <div className="socalled-attachment-thumbnail">
              <img
                src={attachedImage}
                alt="Zdjęcie przygotowane do wysłania"
              />
            </div>

            <div className="socalled-attachment-info">
              <strong>
                Zdjęcie gotowe do wysłania
              </strong>

              <span>
                Możesz dodać podpis lub wysłać
                samo zdjęcie.
              </span>
            </div>

            <button
              type="button"
              className="socalled-attachment-remove"
              onClick={
                removeAttachedImage
              }
              aria-label="Usuń załączone zdjęcie"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {imagePreparing && (
          <div
            className="socalled-image-processing"
            role="status"
          >
            <ImagePlus size={17} />
            Przygotowywanie zdjęcia...
          </div>
        )}

        {imageError && (
          <div
            className="socalled-image-error"
            role="alert"
          >
            <span>
              {imageError}
            </span>

            <button
              type="button"
              onClick={() =>
                setImageError("")
              }
              aria-label="Zamknij błąd"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* NOWOŚĆ — PRZESYŁANIE FILMU */}

        {videoUploading && (
          <div
            className="socalled-video-uploading"
            role="status"
          >
            <Clapperboard size={19} />

            <div>
              <strong>
                Przesyłanie filmu...
              </strong>

              <span>
                {attachedVideoName}
                {" · "}
                {formatFileSize(
                  attachedVideoSize
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={
                removeAttachedVideo
              }
              aria-label="Anuluj przesyłanie filmu"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* NOWOŚĆ — PODGLĄD FILMU */}

        {attachedVideoId &&
          !videoUploading && (
          <div className="socalled-video-attachment">
            <div className="socalled-video-attachment-heading">
              <Film size={19} />

              <div>
                <strong>
                  Film gotowy do wysłania
                </strong>

                <span>
                  {attachedVideoName}
                  {" · "}
                  {formatFileSize(
                    attachedVideoSize
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={
                  removeAttachedVideo
                }
                aria-label="Usuń załączony film"
              >
                <X size={18} />
              </button>
            </div>

            <video
              className="socalled-video-attachment-preview"
              src={videoUrl(
                attachedVideoId
              )}
              controls
              playsInline
              preload="metadata"
            />

            <p>
              Możesz dopisać tekst pod filmem
              albo wysłać go bez podpisu.
            </p>
          </div>
        )}

        {videoError && (
          <div
            className="socalled-video-error"
            role="alert"
          >
            <span>
              {videoError}
            </span>

            <button
              type="button"
              onClick={() =>
                setVideoError("")
              }
              aria-label="Zamknij błąd filmu"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* KOMPOZYTOR WIADOMOŚCI */}

        <div className="composer-area">
          <form
            className="message-composer"
            onSubmit={sendMessage}
          >
            {/* INPUT ZDJĘĆ */}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="socalled-hidden-file-input"
              onChange={
                handleMessageImageSelection
              }
              aria-label="Wybierz zdjęcie"
            />

            {/* NOWOŚĆ — INPUT FILMÓW */}

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="socalled-hidden-file-input"
              onChange={
                handleVideoSelection
              }
              aria-label="Wybierz film"
            />

            <button
              type="button"
              className="socalled-composer-attach"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                socketStatus !== "online" ||
                imagePreparing ||
                videoUploading
              }
              aria-label="Dodaj zdjęcie"
              title="Dodaj zdjęcie"
            >
              <ImagePlus size={20} />
            </button>

            {/* NOWOŚĆ — PRZYCISK FILMU */}

            <button
              type="button"
              className="socalled-composer-attach socalled-video-attach"
              onClick={() =>
                videoInputRef.current?.click()
              }
              disabled={
                socketStatus !== "online" ||
                imagePreparing ||
                videoUploading
              }
              aria-label="Dodaj film"
              title="Dodaj film"
            >
              <Clapperboard size={20} />
            </button>

            <input
              ref={composerInputRef}
              value={draft}
              onChange={(event) =>
                handleDraftChange(
                  event.target.value
                )
              }
              placeholder={
                socketStatus === "online"
                  ? attachedVideoId
                    ? "Dodaj podpis do filmu..."
                    : attachedImage
                      ? "Dodaj podpis do zdjęcia..."
                      : `Wiadomość do ${activeRoom.name}...`
                  : "Oczekiwanie na połączenie..."
              }
              aria-label="Treść wiadomości"
              maxLength={2000}
            />

            <button
              type="submit"
              className="send-button"
              disabled={
                (
                  !draft.trim() &&
                  !attachedImage &&
                  !attachedVideoId
                ) ||
                imagePreparing ||
                videoUploading ||
                socketStatus !== "online"
              }
              aria-label="Wyślij wiadomość"
            >
              <Send size={20} />
            </button>
          </form>

          <p className="composer-hint">
            {socketStatus === "online"
              ? "Połączono — tekst, zdjęcia i filmy na żywo."
              : "Przywracanie połączenia z serwerem..."}
          </p>
        </div>
      </main>
  );
}
