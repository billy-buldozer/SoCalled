import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { initialRooms, themeOptions, RECONNECT_DELAY, CONNECT_TIMEOUT, HEARTBEAT_INTERVAL, HEARTBEAT_TIMEOUT, TYPING_STOP_DELAY, DOUBLE_TAP_INTERVAL, DOUBLE_TAP_DISTANCE, MAX_TOUCH_MOVEMENT, SINGLE_IMAGE_CLICK_DELAY, HEART_ANIMATION_DURATION, MAX_VIDEO_BYTES, makeRequestId, formatMessageTime, mergeRoom, messagePreview, videoMimeType, downloadImage, prepareRoomImage, prepareMessageImage } from '../socalled-shared';
import type { RoomIcon, MobileScreen, DetailsTab, SocketStatus, MemberRole, ServerRoom, Room, RoomMember, ReplyPreview, Reactions, ChatMessage, ServerMessage, TypingUser, ImageViewer, ForwardNotice, LastTap, TouchStart, HeartBurst, VideoUploadResponse, ThemeId } from '../socalled-shared';

export function useSoCalled() {
  // ========================================
  // POKOJE I WIADOMOŚCI
  // ========================================

  const [rooms, setRooms] =
    useState<Room[]>(initialRooms);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [activeRoomId, setActiveRoomId] =
    useState("general");

  const [membersByRoom, setMembersByRoom] =
    useState<Record<string, RoomMember[]>>({});

  const [mobileScreen, setMobileScreen] =
    useState<MobileScreen>("rooms");

  const [detailsTab, setDetailsTab] =
    useState<DetailsTab>("about");

  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  // ========================================
  // TWORZENIE POKOJU
  // ========================================

  const [createOpen, setCreateOpen] =
    useState(false);

  const [newRoomName, setNewRoomName] =
    useState("");

  const [newRoomPrivate, setNewRoomPrivate] =
    useState(false);

  const [createBusy, setCreateBusy] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  // ========================================
  // USTAWIENIA
  // ========================================

  const [themeId, setThemeId] =
    useState<ThemeId>("emerald");

  const [notifications, setNotifications] =
    useState(true);

  // ========================================
  // WEBSOCKET
  // ========================================

  const [socketStatus, setSocketStatus] =
    useState<SocketStatus>("connecting");

  const [connectionVersion, setConnectionVersion] =
    useState(0);

  const socketRef = useRef<WebSocket | null>(null);

  const chatScrollRef =
    useRef<HTMLDivElement | null>(null);

  const composerInputRef =
    useRef<HTMLInputElement | null>(null);

  const createRequestRef =
    useRef<string | null>(null);

  const saveRequestRef =
    useRef<string | null>(null);

  const memberRequestRef =
    useRef<string | null>(null);

  // ========================================
  // WIADOMOŚCI I REAKCJE
  // ========================================

  const [actionMenuId, setActionMenuId] =
    useState<string | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingText, setEditingText] =
    useState("");

  const [pendingEditId, setPendingEditId] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState("");

  const [replyTarget, setReplyTarget] =
    useState<ChatMessage | null>(null);

  const [reactionPickerId, setReactionPickerId] =
    useState<string | null>(null);

  // ========================================
  // WSKAŹNIK PISANIA
  // ========================================

  const [typingUsers, setTypingUsers] =
    useState<TypingUser[]>([]);

  const typingSentRef = useRef(false);

  const typingTimerRef =
    useRef<number | undefined>(undefined);

  // ========================================
  // ZDJĘCIA
  // ========================================

  const [attachedImage, setAttachedImage] =
    useState<string | null>(null);

  const [imagePreparing, setImagePreparing] =
    useState(false);

  const [imageError, setImageError] =
    useState("");

  const [imageViewer, setImageViewer] =
    useState<ImageViewer | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const imagePrepareVersionRef = useRef(0);

  // ========================================
  // NOWOŚĆ — FILMY
  // ========================================

  const [attachedVideoId, setAttachedVideoId] =
    useState<string | null>(null);

  const [attachedVideoName, setAttachedVideoName] =
    useState("");

  const [attachedVideoSize, setAttachedVideoSize] =
    useState(0);

  const [videoUploading, setVideoUploading] =
    useState(false);

  const [videoError, setVideoError] =
    useState("");

  const videoInputRef =
    useRef<HTMLInputElement | null>(null);

  const videoAbortRef =
    useRef<AbortController | null>(null);

  const videoUploadVersionRef = useRef(0);

  // ========================================
  // PRZEKAZYWANIE
  // ========================================

  const [forwardTarget, setForwardTarget] =
    useState<ChatMessage | null>(null);

  const [forwardRoomId, setForwardRoomId] =
    useState("");

  const [forwardBusy, setForwardBusy] =
    useState(false);

  const [forwardError, setForwardError] =
    useState("");

  const [forwardNotice, setForwardNotice] =
    useState<ForwardNotice | null>(null);

  const forwardRequestRef =
    useRef<string | null>(null);

  // ========================================
  // PODWÓJNE TAPNIĘCIE ❤️
  // ========================================

  const lastTapRef =
    useRef<LastTap | null>(null);

  const touchStartRef =
    useRef<TouchStart | null>(null);

  const lastTouchAtRef = useRef(0);

  const imageClickTimerRef =
    useRef<number | undefined>(undefined);

  const suppressImageClickRef = useRef<{
    messageId: string;
    until: number;
  } | null>(null);

  const heartPendingRef =
    useRef<Set<string>>(new Set());

  const [heartBurst, setHeartBurst] =
    useState<HeartBurst | null>(null);

  // ========================================
  // PERSONALIZACJA POKOJU
  // ========================================

  const [roomName, setRoomName] =
    useState("");

  const [roomDescription, setRoomDescription] =
    useState("");

  const [roomTopic, setRoomTopic] =
    useState("");

  const [roomIcon, setRoomIcon] =
    useState<RoomIcon>("hash");

  const [roomImage, setRoomImage] =
    useState<string | null>(null);

  const [roomSaving, setRoomSaving] =
    useState(false);

  const [imageBusy, setImageBusy] =
    useState(false);

  const [roomError, setRoomError] =
    useState("");

  const [roomSuccess, setRoomSuccess] =
    useState("");

  // ========================================
  // UCZESTNICY
  // ========================================

  const [editingMemberId, setEditingMemberId] =
    useState<string | null>(null);

  const [memberNickname, setMemberNickname] =
    useState("");

  const [memberSaving, setMemberSaving] =
    useState(false);

  const [memberError, setMemberError] =
    useState("");

  const [memberSuccess, setMemberSuccess] =
    useState("");

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
      "Gosc-" +
      Math.random().toString(36).slice(2, 6);

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
    rooms.find(
      (room) => room.id === activeRoomId
    ) ?? rooms[0];

  const activeMembers =
    membersByRoom[activeRoomId] ?? [];

  const currentMember = activeMembers.find(
    (member) => member.clientId === clientId
  );

  const myRole: MemberRole =
    currentMember?.role ??
    (activeRoom.ownerId === clientId
      ? "owner"
      : "member");

  const isRoomOwner =
    activeRoom.ownerId === clientId;

  const canEditRoom =
    activeRoom.ownerId === null ||
    isRoomOwner;

  const canModerateMessages =
    myRole === "owner" ||
    myRole === "moderator";

  const theme =
    themeOptions.find(
      (option) => option.id === themeId
    ) ?? themeOptions[0];

  // ========================================
  // FILTROWANIE
  // ========================================

  const roomMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.roomId === activeRoomId
      ),
    [messages, activeRoomId]
  );

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.name
          .toLocaleLowerCase("pl-PL")
          .includes(
            search.toLocaleLowerCase("pl-PL")
          )
      ),
    [rooms, search]
  );

  const forwardRooms = rooms.filter(
    (room) => room.id !== activeRoomId
  );

  const otherTypingUsers = typingUsers.filter(
    (user) => user.clientId !== clientId
  );

  const typingLabel =
    otherTypingUsers.length === 1
      ? `${otherTypingUsers[0].displayName} pisze...`
      : otherTypingUsers.length === 2
        ? `${otherTypingUsers[0].displayName} i ${otherTypingUsers[1].displayName} piszą...`
        : otherTypingUsers.length > 2
          ? "Kilka osób pisze..."
          : "";

  // ========================================
  // EFEKTY
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

  useEffect(() => {
    setEditingMemberId(null);
    setMemberNickname("");
    setMemberError("");
    setMemberSuccess("");
  }, [activeRoomId]);

  useEffect(() => {
    if (!imageViewer) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setImageViewer(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [imageViewer]);

  useEffect(() => {
    if (!heartBurst) return;

    const timer = window.setTimeout(() => {
      setHeartBurst(null);
    }, HEART_ANIMATION_DURATION);

    return () => window.clearTimeout(timer);
  }, [heartBurst]);

  useEffect(() => {
    return () => {
      if (imageClickTimerRef.current !== undefined) {
        window.clearTimeout(
          imageClickTimerRef.current
        );
      }

      videoAbortRef.current?.abort();
    };
  }, []);

  function cancelPendingImageOpen() {
    if (imageClickTimerRef.current !== undefined) {
      window.clearTimeout(
        imageClickTimerRef.current
      );

      imageClickTimerRef.current = undefined;
    }
  }

  function reconnectNow() {
    setSocketStatus("connecting");

    setConnectionVersion(
      (previous) => previous + 1
    );
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
      window.location.protocol === "https:"
        ? "wss"
        : "ws";

    const url =
      `${protocol}://${window.location.hostname}:8000` +
      `/ws/rooms/${encodeURIComponent(activeRoomId)}` +
      `?${params.toString()}`;

    // ======================================
    // KONWERSJA WIADOMOŚCI
    // ======================================

    function convertMessage(
      message: ServerMessage
    ): ChatMessage {
      return {
        id: message.id,
        roomId: message.roomId,
        clientId: message.clientId,
        author: message.author,
        time: formatMessageTime(message.time),
        text: message.text,
        image: message.image ?? null,
        videoId: message.videoId ?? null,
        mine: message.clientId === clientId,
        editedAt: message.editedAt ?? null,
        replyTo: message.replyTo ?? null,
        reactions: message.reactions ?? {},
        forwardedFrom:
          message.forwardedFrom ?? null,
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
                lastMessage: messagePreview(latest),
                lastTime: latest
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

    function scheduleReconnect() {
      if (
        disposed ||
        reconnectTimer !== undefined
      ) {
        return;
      }

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, RECONNECT_DELAY);
    }

    function sendPing(socket: WebSocket) {
      if (disposed || document.hidden) return;
      if (currentSocket !== socket) return;

      if (
        socket.readyState !== WebSocket.OPEN
      ) {
        return;
      }

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
        console.error(
          "[SoCalled] Heartbeat:",
          error
        );

        socket.close();
      }
    }

    // ======================================
    // ŁĄCZENIE
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
        console.error(
          "[SoCalled] WebSocket:",
          error
        );

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

      socket.onopen = () => {
        if (
          disposed ||
          currentSocket !== socket
        ) {
          return;
        }

        if (connectTimer !== undefined) {
          window.clearTimeout(connectTimer);
          connectTimer = undefined;
        }

        setSocketStatus("online");
        typingSentRef.current = false;

        console.log(
          "[SoCalled] Połączono:",
          activeRoomId
        );

        sendPing(socket);

        heartbeatTimer = window.setInterval(
          () => sendPing(socket),
          HEARTBEAT_INTERVAL
        );
      };

      // ====================================
      // ZDARZENIA Z SERWERA
      // ====================================

      socket.onmessage = (event) => {
        if (
          disposed ||
          currentSocket !== socket
        ) {
          return;
        }

        try {
          const data = JSON.parse(event.data);

          // PING / PONG

          if (data.type === "pong") {
            if (pongTimer !== undefined) {
              window.clearTimeout(pongTimer);
              pongTimer = undefined;
            }
            return;
          }

          // LISTA POKOJÓW

          if (
            data.type === "rooms_snapshot" &&
            Array.isArray(data.rooms)
          ) {
            const incoming =
              data.rooms as ServerRoom[];

            setRooms((previous) =>
              incoming.map((item) => {
                const existing = previous.find(
                  (room) => room.id === item.id
                );

                return mergeRoom(
                  item,
                  existing
                );
              })
            );

            return;
          }

          // NOWY POKÓJ

          if (
            data.type === "room_created" &&
            data.room
          ) {
            const incoming =
              data.room as ServerRoom;

            upsertRoom(incoming);

            if (
              data.requestId &&
              data.requestId ===
                createRequestRef.current &&
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
              setReplyTarget(null);
              setAttachedImage(null);
              setAttachedVideoId(null);
              setReactionPickerId(null);
              setImageError("");
              setVideoError("");
              setForwardTarget(null);
              setForwardNotice(null);
            }

            return;
          }

          // AKTUALIZACJA POKOJU

          if (
            data.type === "room_updated" &&
            data.room
          ) {
            upsertRoom(
              data.room as ServerRoom
            );

            if (
              data.requestId &&
              data.requestId ===
                saveRequestRef.current &&
              data.updatedBy === clientId
            ) {
              saveRequestRef.current = null;

              setRoomSaving(false);
              setRoomError("");

              setRoomSuccess(
                "Zmiany zapisane i zsynchronizowane."
              );
            }

            return;
          }

          // UCZESTNICY

          if (
            data.type === "room_presence" &&
            typeof data.roomId === "string" &&
            Array.isArray(data.members)
          ) {
            const roomId =
              data.roomId as string;

            setMembersByRoom((previous) => ({
              ...previous,
              [roomId]: data.members as RoomMember[],
            }));

            setRooms((previous) =>
              previous.map((room) =>
                room.id === roomId
                  ? {
                      ...room,
                      memberCount:
                        Number(data.memberCount) || 0,
                      onlineCount:
                        Number(data.onlineCount) || 0,
                    }
                  : room
              )
            );

            if (
              data.requestId &&
              data.requestId ===
                memberRequestRef.current &&
              data.updatedBy === clientId
            ) {
              memberRequestRef.current = null;

              setMemberSaving(false);
              setEditingMemberId(null);
              setMemberError("");

              setMemberSuccess(
                "Zmiana została zapisana."
              );
            }

            return;
          }

          // ZMIANA NICKU AUTORA

          if (
            data.type === "message_author_changed" &&
            typeof data.roomId === "string" &&
            typeof data.clientId === "string" &&
            typeof data.author === "string"
          ) {
            setMessages((previous) =>
              previous.map((message) => {
                if (message.roomId !== data.roomId) {
                  return message;
                }

                const updatedReply =
                  message.replyTo &&
                  message.replyTo.clientId === data.clientId &&
                  !message.replyTo.deleted
                    ? {
                        ...message.replyTo,
                        author: data.author as string,
                      }
                    : message.replyTo;

                return {
                  ...message,
                  author:
                    message.clientId === data.clientId
                      ? data.author
                      : message.author,
                  replyTo: updatedReply,
                };
              })
            );

            return;
          }

          // WSKAŹNIK PISANIA

          if (
            data.type === "typing_status" &&
            data.roomId === activeRoomId &&
            Array.isArray(data.users)
          ) {
            setTypingUsers(
              (data.users as TypingUser[]).filter(
                (user) => user.clientId !== clientId
              )
            );

            return;
          }

          // AKTYWNOŚĆ INNEGO POKOJU

          if (
            data.type === "room_activity" &&
            typeof data.roomId === "string"
          ) {
            setRooms((previous) =>
              previous.map((room) => {
                if (room.id !== data.roomId) {
                  return room;
                }

                const isCurrent =
                  room.id === activeRoomId;

                return {
                  ...room,
                  lastMessage:
                    typeof data.preview === "string"
                      ? data.preview
                      : room.lastMessage,
                  lastTime:
                    typeof data.time === "string"
                      ? formatMessageTime(data.time)
                      : room.lastTime,
                  unread: isCurrent
                    ? room.unread
                    : room.unread + 1,
                };
              })
            );

            return;
          }

          // POTWIERDZENIE PRZEKAZANIA

          if (
            data.type === "message_forwarded" &&
            data.requestId ===
              forwardRequestRef.current
          ) {
            forwardRequestRef.current = null;

            setForwardBusy(false);
            setForwardError("");
            setForwardTarget(null);

            setForwardNotice({
              roomId: data.targetRoomId,
              roomName: data.targetRoomName,
            });

            return;
          }

          // HISTORIA WIADOMOŚCI

          if (
            data.type === "history" &&
            Array.isArray(data.messages)
          ) {
            const history = (
              data.messages as ServerMessage[]
            ).map(convertMessage);

            setMessages((previous) => [
              ...previous.filter(
                (message) =>
                  message.roomId !== activeRoomId
              ),
              ...history,
            ]);

            const latest =
              data.messages.length > 0
                ? data.messages[
                    data.messages.length - 1
                  ] as ServerMessage
                : null;

            updateRoomPreview(latest);

            return;
          }

          // NOWA WIADOMOŚĆ

          if (
            data.type === "message_created" &&
            data.message
          ) {
            const serverMessage =
              data.message as ServerMessage;

            const message =
              convertMessage(serverMessage);

            setMessages((previous) => {
              if (
                previous.some(
                  (item) => item.id === message.id
                )
              ) {
                return previous;
              }

              return [
                ...previous,
                message,
              ];
            });

            updateRoomPreview(serverMessage);

            return;
          }

          // EDYCJA WIADOMOŚCI

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
              current === updated.id
                ? null
                : current
            );

            setPendingEditId((current) =>
              current === updated.id
                ? null
                : current
            );

            setActionMenuId(null);
            setActionError("");

            return;
          }

          // USUNIĘTA WIADOMOŚĆ

          if (
            data.type === "message_deleted" &&
            typeof data.messageId === "string"
          ) {
            const removedId =
              data.messageId as string;

            setMessages((previous) =>
              previous.filter(
                (message) =>
                  message.id !== removedId
              )
            );

            updateRoomPreview(
              (data.lastMessage as ServerMessage | null) ??
                null
            );

            setEditingId((current) =>
              current === removedId
                ? null
                : current
            );

            setPendingEditId((current) =>
              current === removedId
                ? null
                : current
            );

            setReplyTarget((current) =>
              current?.id === removedId
                ? null
                : current
            );

            heartPendingRef.current.delete(
              removedId
            );

            setReactionPickerId(null);
            setActionMenuId(null);
            setActionError("");

            return;
          }

          // REAKCJE

          if (
            data.type === "message_reactions_updated" &&
            typeof data.messageId === "string"
          ) {
            const messageId =
              data.messageId as string;

            setMessages((previous) =>
              previous.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      reactions:
                        (data.reactions as Reactions) ?? {},
                    }
                  : message
              )
            );

            heartPendingRef.current.delete(
              messageId
            );

            return;
          }

          // AKTUALIZACJA CYTATU

          if (
            data.type === "message_reply_updated" &&
            typeof data.messageId === "string"
          ) {
            setMessages((previous) =>
              previous.map((message) =>
                message.id === data.messageId
                  ? {
                      ...message,
                      replyTo:
                        (data.replyTo as ReplyPreview) ??
                        null,
                    }
                  : message
              )
            );

            return;
          }

          // BŁĄD SERWERA

          if (data.type === "error") {
            const message =
              typeof data.message === "string"
                ? data.message
                : "Nie udało się wykonać operacji.";

            console.warn(
              "[SoCalled]",
              message
            );

            if (createRequestRef.current) {
              createRequestRef.current = null;
              setCreateBusy(false);
              setCreateError(message);

            } else if (saveRequestRef.current) {
              saveRequestRef.current = null;
              setRoomSaving(false);
              setRoomError(message);

            } else if (memberRequestRef.current) {
              memberRequestRef.current = null;
              setMemberSaving(false);
              setMemberError(message);

            } else if (forwardRequestRef.current) {
              forwardRequestRef.current = null;
              setForwardBusy(false);
              setForwardError(message);

            } else {
              setActionError(message);
            }

            heartPendingRef.current.clear();
            setPendingEditId(null);
          }

        } catch (error) {
          console.error(
            "[SoCalled] Błąd zdarzenia:",
            error
          );
        }
      };

      // ROZŁĄCZENIE

      socket.onclose = (event) => {
        if (
          disposed ||
          currentSocket !== socket
        ) {
          return;
        }

        clearConnectionTimers();

        currentSocket = null;

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        setSocketStatus("offline");
        setTypingUsers([]);
        typingSentRef.current = false;
        heartPendingRef.current.clear();

        setPendingEditId(null);
        setCreateBusy(false);
        setRoomSaving(false);
        setMemberSaving(false);
        setForwardBusy(false);

        createRequestRef.current = null;
        saveRequestRef.current = null;
        memberRequestRef.current = null;
        forwardRequestRef.current = null;

        console.warn(
          "[SoCalled] Rozłączono:",
          event.code,
          event.reason
        );

        scheduleReconnect();
      };

      socket.onerror = () => {
        if (
          disposed ||
          currentSocket !== socket
        ) {
          return;
        }

        console.warn(
          "[SoCalled] Problem z WebSocket:",
          url
        );
      };
    }

    function checkConnection() {
      if (
        disposed ||
        document.hidden
      ) {
        return;
      }

      const socket = currentSocket;

      if (!socket) {
        clearReconnectTimer();
        connect();
        return;
      }

      if (
        socket.readyState === WebSocket.OPEN
      ) {
        sendPing(socket);
        return;
      }

      if (
        socket.readyState === WebSocket.CONNECTING
      ) {
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

    window.addEventListener(
      "focus",
      checkConnection
    );

    window.addEventListener(
      "pageshow",
      checkConnection
    );

    window.addEventListener(
      "online",
      checkConnection
    );

    connect();

    return () => {
      disposed = true;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        checkConnection
      );

      window.removeEventListener(
        "pageshow",
        checkConnection
      );

      window.removeEventListener(
        "online",
        checkConnection
      );

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
  // RESETY I PRZEWIJANIE
  // ========================================

  useEffect(() => {
    setTypingUsers([]);
    typingSentRef.current = false;

    return () => {
      if (
        typingTimerRef.current !== undefined
      ) {
        window.clearTimeout(
          typingTimerRef.current
        );

        typingTimerRef.current = undefined;
      }

      typingSentRef.current = false;
    };
  }, [activeRoomId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop =
        chatScrollRef.current.scrollHeight;
    }
  }, [
    activeRoomId,
    messages,
    mobileScreen,
  ]);

  // ========================================
  // WSKAŹNIK PISANIA
  // ========================================

  function stopTyping() {
    if (
      typingTimerRef.current !== undefined
    ) {
      window.clearTimeout(
        typingTimerRef.current
      );

      typingTimerRef.current = undefined;
    }

    if (!typingSentRef.current) return;

    typingSentRef.current = false;

    const socket = socketRef.current;

    if (
      socket?.readyState === WebSocket.OPEN
    ) {
      socket.send(
        JSON.stringify({
          type: "typing",
          isTyping: false,
        })
      );
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);

    if (!value.trim()) {
      stopTyping();
      return;
    }

    const socket = socketRef.current;

    if (
      socket?.readyState === WebSocket.OPEN &&
      !typingSentRef.current
    ) {
      socket.send(
        JSON.stringify({
          type: "typing",
          isTyping: true,
        })
      );

      typingSentRef.current = true;
    }

    if (
      typingTimerRef.current !== undefined
    ) {
      window.clearTimeout(
        typingTimerRef.current
      );
    }

    typingTimerRef.current = window.setTimeout(
      () => stopTyping(),
      TYPING_STOP_DELAY
    );
  }

  // ========================================
  // SZYBKIE SERDUSZKO
  // ========================================

  function addHeartToMessage(
    message: ChatMessage
  ) {
    cancelPendingImageOpen();

    setHeartBurst({
      messageId: message.id,
      sequence: Date.now(),
    });

    const alreadyLiked =
      message.reactions["❤️"]?.includes(
        clientId
      ) ?? false;

    if (alreadyLiked) return;

    if (
      heartPendingRef.current.has(
        message.id
      )
    ) {
      return;
    }

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setActionError(
        "Brak połączenia z serwerem."
      );
      return;
    }

    heartPendingRef.current.add(message.id);

    try {
      socket.send(
        JSON.stringify({
          type: "toggle_reaction",
          message_id: message.id,
          emoji: "❤️",
        })
      );

      window.setTimeout(() => {
        heartPendingRef.current.delete(
          message.id
        );
      }, 2000);
    } catch (error) {
      heartPendingRef.current.delete(
        message.id
      );

      console.error(
        "[SoCalled] Szybkie serce:",
        error
      );

      setActionError(
        "Nie udało się dodać serduszka."
      );
    }
  }

  // ========================================
  // ELEMENTY INTERAKTYWNE
  // ========================================

  function isOtherInteractiveElement(
    target: EventTarget
  ): boolean {
    if (!(target instanceof Element)) {
      return false;
    }

    const control = target.closest(
      "button, input, textarea, select, a, video"
    );

    if (!control) return false;

    // Zdjęcia nadal obsługują double tap.
    // Filmy mają własne natywne sterowanie.
    return !control.classList.contains(
      "socalled-chat-image-button"
    );
  }

  // ========================================
  // KOMPUTER — DOUBLE CLICK
  // ========================================

  function handleMessageDoubleClick(
    event: ReactMouseEvent<HTMLDivElement>,
    message: ChatMessage
  ) {
    if (
      Date.now() -
      lastTouchAtRef.current < 900
    ) {
      return;
    }

    if (
      isOtherInteractiveElement(
        event.target
      )
    ) {
      return;
    }

    event.preventDefault();

    suppressImageClickRef.current = {
      messageId: message.id,
      until: Date.now() + 900,
    };

    addHeartToMessage(message);
  }

  // ========================================
  // TELEFON — TOUCH START
  // ========================================

  function handleMessageTouchStart(
    event: ReactTouchEvent<HTMLDivElement>
  ) {
    if (event.touches.length !== 1) {
      touchStartRef.current = null;
      lastTapRef.current = null;
      return;
    }

    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  // ========================================
  // TELEFON — TOUCH END
  // ========================================

  function handleMessageTouchEnd(
    event: ReactTouchEvent<HTMLDivElement>,
    message: ChatMessage
  ) {
    lastTouchAtRef.current = Date.now();

    if (
      event.changedTouches.length !== 1 ||
      isOtherInteractiveElement(
        event.target
      )
    ) {
      lastTapRef.current = null;
      touchStartRef.current = null;
      return;
    }

    const touch = event.changedTouches[0];
    const start = touchStartRef.current;

    touchStartRef.current = null;

    if (!start) {
      lastTapRef.current = null;
      return;
    }

    const movementX = Math.abs(
      touch.clientX - start.x
    );

    const movementY = Math.abs(
      touch.clientY - start.y
    );

    if (
      movementX > MAX_TOUCH_MOVEMENT ||
      movementY > MAX_TOUCH_MOVEMENT
    ) {
      lastTapRef.current = null;
      return;
    }

    const now = Date.now();
    const previous = lastTapRef.current;

    const isDoubleTap =
      previous !== null &&
      previous.messageId === message.id &&
      now - previous.time <= DOUBLE_TAP_INTERVAL &&
      Math.abs(touch.clientX - previous.x) <=
        DOUBLE_TAP_DISTANCE &&
      Math.abs(touch.clientY - previous.y) <=
        DOUBLE_TAP_DISTANCE;

    if (isDoubleTap) {
      lastTapRef.current = null;

      if (event.cancelable) {
        event.preventDefault();
      }

      suppressImageClickRef.current = {
        messageId: message.id,
        until: now + 900,
      };

      cancelPendingImageOpen();
      addHeartToMessage(message);
      return;
    }

    lastTapRef.current = {
      messageId: message.id,
      time: now,
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  // ========================================
  // POJEDYNCZE KLIKNIĘCIE ZDJĘCIA
  // ========================================

  function handleImageClick(
    event: ReactMouseEvent<HTMLButtonElement>,
    message: ChatMessage
  ) {
    if (!message.image) return;

    if (event.detail > 1) {
      cancelPendingImageOpen();
      return;
    }

    const suppressed =
      suppressImageClickRef.current;

    if (
      suppressed?.messageId === message.id &&
      Date.now() < suppressed.until
    ) {
      cancelPendingImageOpen();
      return;
    }

    cancelPendingImageOpen();

    imageClickTimerRef.current = window.setTimeout(
      () => {
        imageClickTimerRef.current = undefined;

        const currentSuppression =
          suppressImageClickRef.current;

        if (
          currentSuppression?.messageId === message.id &&
          Date.now() < currentSuppression.until
        ) {
          return;
        }

        setImageViewer({
          image: message.image!,
          author: message.author,
          messageId: message.id,
        });
      },
      SINGLE_IMAGE_CLICK_DELAY
    );
  }

  // ========================================
  // ZDJĘCIA — WYBÓR
  // ========================================

  async function handleMessageImageSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    // Jeden załącznik na wiadomość.
    removeAttachedVideo();

    const version =
      ++imagePrepareVersionRef.current;

    setImagePreparing(true);
    setImageError("");

    try {
      const prepared =
        await prepareMessageImage(file);

      if (
        version !== imagePrepareVersionRef.current
      ) {
        return;
      }

      setAttachedImage(prepared);
    } catch (error) {
      if (
        version !== imagePrepareVersionRef.current
      ) {
        return;
      }

      setImageError(
        error instanceof Error
          ? error.message
          : "Nie udało się przygotować zdjęcia."
      );
    } finally {
      if (
        version === imagePrepareVersionRef.current
      ) {
        setImagePreparing(false);
      }
    }
  }

  function removeAttachedImage() {
    imagePrepareVersionRef.current += 1;

    setAttachedImage(null);
    setImagePreparing(false);
    setImageError("");
  }

  // ========================================
  // NOWOŚĆ — USUWANIE WYBRANEGO FILMU
  // ========================================

  function removeAttachedVideo() {
    videoUploadVersionRef.current += 1;
    videoAbortRef.current?.abort();
    videoAbortRef.current = null;

    setAttachedVideoId(null);
    setAttachedVideoName("");
    setAttachedVideoSize(0);
    setVideoUploading(false);
    setVideoError("");
  }

  // ========================================
  // NOWOŚĆ — PRZESYŁANIE FILMU HTTP
  // ========================================

  async function handleVideoSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const mimeType = videoMimeType(file);

    if (!mimeType) {
      setVideoError(
        "Wybierz film MP4, WebM lub MOV."
      );
      return;
    }

    if (file.size === 0) {
      setVideoError("Film jest pusty.");
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      setVideoError(
        "Film może mieć maksymalnie 40 MB."
      );
      return;
    }

    removeAttachedImage();
    removeAttachedVideo();

    const version =
      ++videoUploadVersionRef.current;

    const controller = new AbortController();
    videoAbortRef.current = controller;

    setVideoUploading(true);
    setVideoError("");

    setAttachedVideoName(file.name);
    setAttachedVideoSize(file.size);

    try {
      const response = await fetch(
        "/api/videos",
        {
          method: "POST",
          headers: {
            "Content-Type": mimeType,
          },
          body: file,
          signal: controller.signal,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Nie udało się przesłać filmu."
        );
      }

      if (
        typeof result.id !== "string" ||
        !/^[a-f0-9]{32}$/.test(result.id)
      ) {
        throw new Error(
          "Serwer zwrócił nieprawidłową odpowiedź."
        );
      }

      if (
        version !== videoUploadVersionRef.current
      ) {
        return;
      }

      const uploaded =
        result as VideoUploadResponse;

      setAttachedVideoId(uploaded.id);
    } catch (error) {
      if (
        version !== videoUploadVersionRef.current
      ) {
        return;
      }

      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      setAttachedVideoId(null);

      setVideoError(
        error instanceof Error
          ? error.message
          : "Nie udało się przesłać filmu."
      );
    } finally {
      if (
        version === videoUploadVersionRef.current
      ) {
        setVideoUploading(false);
        videoAbortRef.current = null;
      }
    }
  }

  // ========================================
  // ZMIANA POKOJU
  // ========================================

  function openRoom(roomId: string) {
    stopTyping();
    removeAttachedImage();
    removeAttachedVideo();
    cancelPendingImageOpen();

    lastTapRef.current = null;
    touchStartRef.current = null;
    setHeartBurst(null);

    setMobileScreen("chat");
    setDetailsTab("about");
    setDraft("");
    setReplyTarget(null);
    setReactionPickerId(null);
    setTypingUsers([]);

    setActionMenuId(null);
    setEditingId(null);
    setPendingEditId(null);
    setActionError("");
    setForwardTarget(null);
    setForwardNotice(null);

    setRooms((previous) =>
      previous.map((room) =>
        room.id === roomId
          ? {
              ...room,
              unread: 0,
            }
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
  // ODPOWIADANIE NA WIADOMOŚCI
  // ========================================

  function replyToMessage(
    message: ChatMessage
  ) {
    setReplyTarget(message);
    setActionMenuId(null);
    setReactionPickerId(null);

    composerInputRef.current?.focus();
  }

  // ========================================
  // WYSYŁANIE WIADOMOŚCI
  // ========================================

  function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = draft.trim();
    const socket = socketRef.current;

    if (
      !text &&
      !attachedImage &&
      !attachedVideoId
    ) {
      return;
    }

    if (
      imagePreparing ||
      videoUploading
    ) {
      return;
    }

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      reconnectNow();
      return;
    }

    try {
      stopTyping();

      socket.send(
        JSON.stringify({
          type: "send_message",
          text,
          image: attachedImage,
          video_id: attachedVideoId,
          reply_to: replyTarget?.id ?? null,
        })
      );

      setDraft("");
      setReplyTarget(null);
      removeAttachedImage();
      removeAttachedVideo();
    } catch (error) {
      console.error(
        "[SoCalled] Wysyłanie:",
        error
      );

      setActionError(
        "Nie udało się wysłać wiadomości."
      );

      reconnectNow();
    }
  }

  // ========================================
  // REAKCJE EMOJI
  // ========================================

  function toggleReaction(
    messageId: string,
    emoji: string
  ) {
    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setActionError(
        "Brak połączenia z serwerem."
      );
      reconnectNow();
      return;
    }

    try {
      socket.send(
        JSON.stringify({
          type: "toggle_reaction",
          message_id: messageId,
          emoji,
        })
      );

      setReactionPickerId(null);
    } catch (error) {
      console.error(
        "[SoCalled] Reakcja:",
        error
      );

      setActionError(
        "Nie udało się dodać reakcji."
      );
    }
  }

  // ========================================
  // POBIERANIE PNG
  // ========================================

  async function saveMessageImage(
    image: string,
    messageId: string
  ) {
    try {
      await downloadImage(image, messageId);

      setActionMenuId(null);
      setActionError("");
    } catch (error) {
      console.error(
        "[SoCalled] Pobieranie zdjęcia:",
        error
      );

      setActionError(
        "Nie udało się pobrać zdjęcia jako PNG."
      );
    }
  }

  // ========================================
  // PRZEKAZYWANIE WIADOMOŚCI
  // ========================================

  function startForward(
    message: ChatMessage
  ) {
    setForwardTarget(message);

    const firstOtherRoom = rooms.find(
      (room) => room.id !== activeRoomId
    );

    setForwardRoomId(
      firstOtherRoom?.id ?? ""
    );

    setForwardError("");
    setForwardNotice(null);
    setActionMenuId(null);
    setReactionPickerId(null);
  }

  function cancelForward() {
    if (forwardBusy) return;

    setForwardTarget(null);
    setForwardRoomId("");
    setForwardError("");
  }

  function submitForward(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !forwardTarget ||
      forwardBusy
    ) {
      return;
    }

    if (
      !forwardRoomId ||
      forwardRoomId === activeRoomId
    ) {
      setForwardError(
        "Wybierz inny pokój."
      );
      return;
    }

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setForwardError(
        "Brak połączenia z serwerem."
      );
      return;
    }

    const requestId = makeRequestId();

    forwardRequestRef.current = requestId;
    setForwardBusy(true);
    setForwardError("");

    try {
      socket.send(
        JSON.stringify({
          type: "forward_message",
          requestId,
          message_id: forwardTarget.id,
          target_room_id: forwardRoomId,
        })
      );
    } catch (error) {
      console.error(
        "[SoCalled] Przekazywanie:",
        error
      );

      forwardRequestRef.current = null;
      setForwardBusy(false);

      setForwardError(
        "Nie udało się przekazać wiadomości."
      );
    }
  }

  // ========================================
  // EDYCJA WIADOMOŚCI
  // ========================================

  function toggleMessageMenu(
    messageId: string
  ) {
    setActionMenuId((current) =>
      current === messageId
        ? null
        : messageId
    );

    setReactionPickerId(null);
    setActionError("");
  }

  function startMessageEdit(
    message: ChatMessage
  ) {
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

    if (
      !editingId ||
      pendingEditId
    ) {
      return;
    }

    const text = editingText.trim();
    const socket = socketRef.current;

    const original = messages.find(
      (message) =>
        message.id === editingId
    );

    if (
      !original ||
      !original.mine
    ) {
      return;
    }

    if (
      (
        !text &&
        !original.image &&
        !original.videoId
      ) ||
      text.length > 2000
    ) {
      setActionError(
        "Wiadomość musi mieć treść, zdjęcie lub film."
      );
      return;
    }

    if (original.text === text) {
      cancelMessageEdit();
      return;
    }

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setActionError(
        "Brak połączenia z serwerem."
      );

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

  // ========================================
  // USUWANIE WIADOMOŚCI
  // ========================================

  function deleteMessage(
    message: ChatMessage
  ) {
    if (
      !message.mine &&
      !canModerateMessages
    ) {
      return;
    }

    setActionMenuId(null);

    const question = message.mine
      ? "Czy na pewno chcesz usunąć tę wiadomość?"
      : "Czy jako moderator chcesz usunąć tę wiadomość?";

    if (!window.confirm(question)) return;

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setActionError(
        "Brak połączenia z serwerem."
      );

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
  // TWORZENIE POKOJU
  // ========================================

  function createRoom(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name = newRoomName.trim();
    const socket = socketRef.current;

    if (
      !name ||
      createBusy
    ) {
      return;
    }

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
      console.error(
        "[SoCalled] Tworzenie pokoju:",
        error
      );

      createRequestRef.current = null;
      setCreateBusy(false);

      setCreateError(
        "Nie udało się utworzyć pokoju."
      );
    }
  }

  // ========================================
  // ZDJĘCIE GŁÓWNE POKOJU
  // ========================================

  async function handleRoomImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (
      !file ||
      !canEditRoom
    ) {
      return;
    }

    setImageBusy(true);
    setRoomError("");
    setRoomSuccess("");

    try {
      const imageData =
        await prepareRoomImage(file);

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
  // PERSONALIZACJA POKOJU
  // ========================================

  function saveRoomSettings(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canEditRoom ||
      roomSaving ||
      imageBusy
    ) {
      return;
    }

    const name = roomName.trim();

    if (
      !name ||
      name.length > 28
    ) {
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
      setRoomError(
        "Brak połączenia z serwerem."
      );

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

      setRoomError(
        "Nie udało się zapisać zmian."
      );
    }
  }

  // ========================================
  // NICKI UCZESTNIKÓW
  // ========================================

  function startMemberEdit(
    member: RoomMember
  ) {
    if (
      member.clientId !== clientId &&
      !isRoomOwner
    ) {
      return;
    }

    setEditingMemberId(member.clientId);
    setMemberNickname(member.nickname ?? "");
    setMemberError("");
    setMemberSuccess("");
  }

  function cancelMemberEdit() {
    if (memberSaving) return;

    setEditingMemberId(null);
    setMemberNickname("");
    setMemberError("");
  }

  function saveMemberNickname(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !editingMemberId ||
      memberSaving
    ) {
      return;
    }

    const value =
      memberNickname.trim();

    if (value.length > 32) {
      setMemberError(
        "Nick może mieć maksymalnie 32 znaki."
      );
      return;
    }

    const member = activeMembers.find(
      (item) =>
        item.clientId === editingMemberId
    );

    if (!member) {
      setMemberError(
        "Nie znaleziono uczestnika."
      );
      return;
    }

    if (
      member.clientId !== clientId &&
      !isRoomOwner
    ) {
      setMemberError(
        "Nie masz uprawnień do tej zmiany."
      );
      return;
    }

    if (
      (member.nickname ?? "") === value
    ) {
      cancelMemberEdit();
      return;
    }

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setMemberError(
        "Brak połączenia z serwerem."
      );

      reconnectNow();
      return;
    }

    const requestId = makeRequestId();

    memberRequestRef.current = requestId;
    setMemberSaving(true);
    setMemberError("");
    setMemberSuccess("");

    try {
      socket.send(
        JSON.stringify({
          type: "set_room_nickname",
          requestId,
          targetId: editingMemberId,
          nickname: value,
        })
      );
    } catch (error) {
      console.error(
        "[SoCalled] Zmiana nicku:",
        error
      );

      memberRequestRef.current = null;
      setMemberSaving(false);

      setMemberError(
        "Nie udało się zmienić nicku."
      );
    }
  }

  // ========================================
  // ROLE UCZESTNIKÓW
  // ========================================

  function changeMemberRole(
    member: RoomMember
  ) {
    if (
      !isRoomOwner ||
      member.role === "owner" ||
      memberSaving
    ) {
      return;
    }

    const nextRole: MemberRole =
      member.role === "moderator"
        ? "member"
        : "moderator";

    const socket = socketRef.current;

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== "online"
    ) {
      setMemberError(
        "Brak połączenia z serwerem."
      );

      reconnectNow();
      return;
    }

    const requestId = makeRequestId();

    memberRequestRef.current = requestId;
    setMemberSaving(true);
    setMemberError("");
    setMemberSuccess("");

    try {
      socket.send(
        JSON.stringify({
          type: "set_member_role",
          requestId,
          targetId: member.clientId,
          role: nextRole,
        })
      );
    } catch (error) {
      console.error(
        "[SoCalled] Zmiana roli:",
        error
      );

      memberRequestRef.current = null;
      setMemberSaving(false);

      setMemberError(
        "Nie udało się zmienić roli."
      );
    }
  }

  // ========================================
  // INTERFEJS SOCALLED
  // ========================================

  
  return {
    rooms,
    activeRoomId,
    mobileScreen,
    setMobileScreen,
    detailsTab,
    setDetailsTab,
    draft,
    search,
    setSearch,
    createOpen,
    setCreateOpen,
    newRoomName,
    setNewRoomName,
    newRoomPrivate,
    setNewRoomPrivate,
    createBusy,
    createError,
    setCreateError,
    themeId,
    setThemeId,
    notifications,
    setNotifications,
    socketStatus,
    chatScrollRef,
    composerInputRef,
    actionMenuId,
    setActionMenuId,
    editingId,
    editingText,
    setEditingText,
    pendingEditId,
    actionError,
    setActionError,
    replyTarget,
    setReplyTarget,
    reactionPickerId,
    setReactionPickerId,
    attachedImage,
    imagePreparing,
    imageError,
    setImageError,
    imageViewer,
    setImageViewer,
    fileInputRef,
    attachedVideoId,
    attachedVideoName,
    attachedVideoSize,
    videoUploading,
    videoError,
    setVideoError,
    videoInputRef,
    forwardTarget,
    forwardRoomId,
    setForwardRoomId,
    forwardBusy,
    forwardError,
    forwardNotice,
    setForwardNotice,
    heartBurst,
    roomName,
    setRoomName,
    roomDescription,
    setRoomDescription,
    roomTopic,
    setRoomTopic,
    roomIcon,
    setRoomIcon,
    roomImage,
    setRoomImage,
    roomSaving,
    imageBusy,
    roomError,
    roomSuccess,
    editingMemberId,
    memberNickname,
    setMemberNickname,
    memberSaving,
    memberError,
    memberSuccess,
    clientId,
    nickname,
    activeRoom,
    activeMembers,
    myRole,
    isRoomOwner,
    canEditRoom,
    canModerateMessages,
    theme,
    roomMessages,
    filteredRooms,
    forwardRooms,
    typingLabel,
    reconnectNow,
    stopTyping,
    handleDraftChange,
    handleMessageDoubleClick,
    handleMessageTouchStart,
    handleMessageTouchEnd,
    handleImageClick,
    handleMessageImageSelection,
    removeAttachedImage,
    removeAttachedVideo,
    handleVideoSelection,
    openRoom,
    replyToMessage,
    sendMessage,
    toggleReaction,
    saveMessageImage,
    startForward,
    cancelForward,
    submitForward,
    toggleMessageMenu,
    startMessageEdit,
    cancelMessageEdit,
    saveMessageEdit,
    deleteMessage,
    createRoom,
    handleRoomImage,
    saveRoomSettings,
    startMemberEdit,
    cancelMemberEdit,
    saveMemberNickname,
    changeMemberRole,
  };
}

export type SoCalledModel = ReturnType<typeof useSoCalled>;
