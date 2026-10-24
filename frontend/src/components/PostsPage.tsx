
import { useEffect, useRef, useState } from "react";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  Check,
  Heart,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Send,
  Trash2,
  X,
  Images,
  MessageCircle,
} from "lucide-react";


type Post = {
  id: string;
  clientId: string;
  author: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  likes: string[];
};

type PostsPageProps = {
  clientId: string;
  nickname: string;
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;


// ==========================================
// FORMATOWANIE DATY
// ==========================================

function displayTime(value: string): string {
  return new Date(value).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}


// ==========================================
// ZAPYTANIA API
// ==========================================

async function apiJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const detail = (
      data &&
      typeof data === "object" &&
      "detail" in data
    )
      ? (data as { detail: unknown }).detail
      : null;

    throw new Error(
      typeof detail === "string"
        ? detail
        : `Błąd HTTP ${response.status}`
    );
  }

  return data as T;
}


// ==========================================
// PRZYGOTOWANIE ZDJĘCIA
// ==========================================

async function preparePostImage(
  file: File
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      "Wybierz zdjęcie, nie inny typ pliku."
    );
  }

  if (file.size > 25 * 1024 * 1024) {
    throw new Error(
      "Zdjęcie źródłowe jest za duże (maks. 25 MB)."
    );
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;

    await image.decode();

    const scale = Math.min(
      1,
      1600 /
        Math.max(
          image.naturalWidth,
          image.naturalHeight
        )
    );

    const canvas =
      document.createElement("canvas");

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

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Nie można przetworzyć zdjęcia."
      );
    }

    context.fillStyle = "#ffffff";

    context.fillRect(
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

    const blob = await new Promise<Blob>(
      (resolve, reject) => {
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(
                  new Error(
                    "Nie udało się przetworzyć zdjęcia."
                  )
                ),
          "image/jpeg",
          0.82
        );
      }
    );

    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error(
        "Zdjęcie jest za duże po kompresji."
      );
    }

    return new File(
      [blob],
      "socalled-post.jpg",
      { type: "image/jpeg" }
    );

  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}


// ==========================================
// EKRAN POSTÓW
// ==========================================

export default function PostsPage({
  clientId,
  nickname,
}: PostsPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");

  const [photo, setPhoto] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [preparingImage, setPreparingImage] =
    useState(false);

  const [error, setError] =
    useState("");

  const [pendingLikes, setPendingLikes] =
    useState<string[]>([]);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const imageVersion = useRef(0);

  const previewRef =
    useRef<string | null>(null);


  // ========================================
  // PODGLĄD ZDJĘCIA
  // ========================================

  function changePreview(
    file: File | null
  ) {
    if (previewRef.current) {
      URL.revokeObjectURL(
        previewRef.current
      );
    }

    const url = file
      ? URL.createObjectURL(file)
      : null;

    previewRef.current = url;

    setPreviewUrl(url);
    setPhoto(file);
  }


  // ========================================
  // ODŚWIEŻANIE FEEDU
  // ========================================

  async function refreshPosts(
    showSpinner = false
  ) {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      const result = await apiJson<{
        posts: Post[];
      }>("/api/posts");

      setPosts(result.posts);
      setError("");

    } catch (err) {
      if (
        showSpinner ||
        posts.length === 0
      ) {
        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać postów."
        );
      }

    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }


  // ========================================
  // SYNCHRONIZACJA CO 5 SEKUND
  // ========================================

  useEffect(() => {
    let active = true;

    async function load(
      silent = false
    ) {
      try {
        const result = await apiJson<{
          posts: Post[];
        }>("/api/posts");

        if (active) {
          setPosts(result.posts);
          setError("");
        }

      } catch (err) {
        if (active && !silent) {
          setError(
            err instanceof Error
              ? err.message
              : "Brak połączenia z postami."
          );
        }

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        void load(true);
      }
    }, 5000);

    const onFocus = () => {
      if (!document.hidden) {
        void load(true);
      }
    };

    window.addEventListener(
      "focus",
      onFocus
    );

    return () => {
      active = false;
      window.clearInterval(timer);

      window.removeEventListener(
        "focus",
        onFocus
      );

      if (previewRef.current) {
        URL.revokeObjectURL(
          previewRef.current
        );
      }
    };
  }, []);


  // ========================================
  // WYBÓR ZDJĘCIA
  // ========================================

  async function selectImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const version =
      ++imageVersion.current;

    setError("");
    setPreparingImage(true);

    try {
      const prepared =
        await preparePostImage(file);

      if (version === imageVersion.current) {
        changePreview(prepared);
      }

    } catch (err) {
      if (version === imageVersion.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się odczytać zdjęcia."
        );
      }

    } finally {
      if (version === imageVersion.current) {
        setPreparingImage(false);
      }
    }
  }

  function removePhoto() {
    imageVersion.current += 1;

    setPreparingImage(false);
    changePreview(null);
  }


  // ========================================
  // PUBLIKOWANIE POSTA
  // ========================================

  async function submitPost(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      sending ||
      preparingImage ||
      (!text.trim() && !photo)
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      let imageId: string | null = null;

      if (photo) {
        const uploaded = await apiJson<{
          imageId: string;
        }>("/api/posts/images", {
          method: "POST",
          headers: {
            "Content-Type": photo.type,
          },
          body: photo,
        });

        imageId = uploaded.imageId;
      }

      await apiJson("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          author: nickname,
          text: text.trim(),
          imageId,
        }),
      });

      setText("");
      removePhoto();

      await refreshPosts();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się opublikować posta."
      );

    } finally {
      setSending(false);
    }
  }


  // ========================================
  // POLUBIENIA
  // ========================================

  async function toggleLike(post: Post) {
    if (
      pendingLikes.includes(post.id)
    ) {
      return;
    }

    setPendingLikes(
      (previous) => [
        ...previous,
        post.id,
      ]
    );

    try {
      const result = await apiJson<{
        post: Post;
      }>(
        `/api/posts/${encodeURIComponent(post.id)}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId,
          }),
        }
      );

      setPosts(
        (previous) =>
          previous.map(
            (item) =>
              item.id === post.id
                ? result.post
                : item
          )
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się polubić posta."
      );

    } finally {
      setPendingLikes(
        (previous) =>
          previous.filter(
            (id) => id !== post.id
          )
      );
    }
  }


  // ========================================
  // USUWANIE WŁASNEGO POSTA
  // ========================================

  async function deletePost(post: Post) {
    if (
      post.clientId !== clientId ||
      !window.confirm("Usunąć ten post?")
    ) {
      return;
    }

    setDeletingId(post.id);

    try {
      await apiJson(
        `/api/posts/${encodeURIComponent(post.id)}?client_id=${encodeURIComponent(clientId)}`,
        {
          method: "DELETE",
        }
      );

      setPosts(
        (previous) =>
          previous.filter(
            (item) => item.id !== post.id
          )
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się usunąć posta."
      );

    } finally {
      setDeletingId(null);
    }
  }


  // ========================================
  // WIDOK POSTÓW
  // ========================================

  return (
    <main className="socalled-feed">
      <div className="socalled-feed-inner">

        <header className="feed-heading">
          <div>
            <span className="feed-eyebrow">
              S O C A L L E D · COMMUNITY
            </span>

            <h1>
              Posty<span>.</span>
            </h1>

            <p>
              Podziel się tym, co u Ciebie.
              Cała społeczność w jednym miejscu.
            </p>
          </div>

          <button
            className="feed-refresh"
            type="button"
            onClick={() =>
              void refreshPosts(true)
            }
            title="Odśwież posty"
          >
            <RefreshCw size={18} />
            <span>Odśwież</span>
          </button>
        </header>

        {/* NOWY POST */}

        <form
          className="feed-composer"
          onSubmit={(event) =>
            void submitPost(event)
          }
        >
          <div className="feed-composer-title">
            <span className="feed-avatar">
              {nickname
                .slice(0, 1)
                .toUpperCase()}
            </span>

            <div>
              <strong>{nickname}</strong>
              <small>Nowy post</small>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            placeholder="Co u Ciebie słychać?"
            rows={3}
            maxLength={2000}
            disabled={sending}
            aria-label="Treść posta"
          />

          {previewUrl && (
            <div className="feed-image-preview">
              <img
                src={previewUrl}
                alt="Zdjęcie do posta"
              />

              <button
                type="button"
                onClick={removePhoto}
                aria-label="Usuń zdjęcie"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="feed-composer-bottom">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) =>
                void selectImage(event)
              }
            />

            <button
              type="button"
              className="feed-attach"
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={
                sending ||
                preparingImage
              }
            >
              <ImagePlus size={18} />

              <span>
                {preparingImage
                  ? "Przygotowywanie..."
                  : "Dodaj zdjęcie"}
              </span>
            </button>

            <span className="feed-remaining">
              {text.length}/2000
            </span>

            <button
              className="feed-submit"
              type="submit"
              disabled={
                sending ||
                preparingImage ||
                (!text.trim() && !photo)
              }
            >
              {sending ? (
                <LoaderCircle
                  size={18}
                  className="feed-spin"
                />
              ) : (
                <Send size={17} />
              )}

              {sending
                ? "Publikowanie..."
                : "Opublikuj"}
            </button>
          </div>
        </form>

        {/* BŁĘDY */}

        {error && (
          <div
            className="feed-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Zamknij błąd"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* LISTA POSTÓW */}

        <div className="feed-list-heading">
          <span>NAJNOWSZE POSTY</span>
          <span>{posts.length}</span>
        </div>

        {loading && posts.length === 0 ? (
          <div className="feed-empty">
            <LoaderCircle
              className="feed-spin"
              size={29}
            />

            <p>Ładowanie postów...</p>
          </div>

        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <Images size={30} />

            <h2>
              Jeszcze nie ma postów
            </h2>

            <p>
              Opublikuj pierwszy wpis w SoCalled.
            </p>
          </div>

        ) : (
          <section
            className="feed-posts"
            aria-label="Lista postów"
          >
            {posts.map((post) => {
              const liked =
                post.likes.includes(clientId);

              return (
                <article
                  key={post.id}
                  className="feed-post"
                >
                  <div className="feed-post-header">
                    <span className="feed-avatar">
                      {post.author
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>

                    <div className="feed-post-author">
                      <strong>
                        {post.author}

                        {post.clientId === clientId && (
                          <em> · Ty</em>
                        )}
                      </strong>

                      <time dateTime={post.createdAt}>
                        {displayTime(post.createdAt)}
                      </time>
                    </div>

                    {post.clientId === clientId && (
                      <button
                        type="button"
                        className="feed-delete"
                        title="Usuń post"
                        aria-label="Usuń post"
                        disabled={
                          deletingId === post.id
                        }
                        onClick={() =>
                          void deletePost(post)
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>

                  {post.text && (
                    <p className="feed-post-text">
                      {post.text}
                    </p>
                  )}

                  {post.imageUrl && (
                    <img
                      className="feed-post-image"
                      src={post.imageUrl}
                      alt={
                        `Zdjęcie dodane przez ${post.author}`
                      }
                      loading="lazy"
                    />
                  )}

                  <div className="feed-post-footer">
                    <button
                      type="button"
                      className={`feed-like ${
                        liked
                          ? "feed-like-active"
                          : ""
                      }`}
                      onClick={() =>
                        void toggleLike(post)
                      }
                      disabled={
                        pendingLikes.includes(post.id)
                      }
                      aria-pressed={liked}
                    >
                      <Heart
                        size={19}
                        fill={
                          liked
                            ? "currentColor"
                            : "none"
                        }
                      />

                      <span>
                        {post.likes.length}
                      </span>

                      <span>
                        {liked
                          ? "Lubisz to"
                          : "Polub"}
                      </span>
                    </button>

                    <span className="feed-post-kind">
                      <MessageCircle size={15} />
                      SoCalled
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="feed-end">
          <Check size={15} />
          To wszystkie posty na teraz.
        </p>
      </div>
    </main>
  );
}
