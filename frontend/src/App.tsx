
import { useState } from "react";

import {
  MessageCircle,
  Newspaper,
} from "lucide-react";

import { useSoCalled } from "./hooks/useSoCalled";
import SoCalledView from "./components/SoCalledView";
import PostsPage from "./components/PostsPage";

import "./App.css";
import "./message-actions.css";
import "./room-customization.css";
import "./room-members.css";
import "./message-social.css";
import "./message-images.css";
import "./message-forwarding.css";
import "./message-double-like.css";
import "./message-videos.css";
import "./posts.css";


type MainTab = "chats" | "posts";


function App() {
  const model = useSoCalled();

  const [tab, setTab] =
    useState<MainTab>("chats");

  return (
    <div className="socalled-root">
      <nav
        className="socalled-main-tabs"
        aria-label="Główne zakładki SoCalled"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chats"}
          onClick={() => setTab("chats")}
        >
          <MessageCircle size={18} />
          Pokoje
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === "posts"}
          onClick={() => setTab("posts")}
        >
          <Newspaper size={18} />
          Posty
        </button>
      </nav>

      {tab === "chats" ? (
        <SoCalledView model={model} />
      ) : (
        <PostsPage
          clientId={model.clientId}
          nickname={model.nickname}
        />
      )}
    </div>
  );
}

export default App;
