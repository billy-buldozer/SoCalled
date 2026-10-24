import { useSoCalled } from './hooks/useSoCalled';
import SoCalledView from './components/SoCalledView';
import "./App.css";
import "./message-actions.css";
import "./room-customization.css";
import "./room-members.css";
import "./message-social.css";
import "./message-images.css";
import "./message-forwarding.css";
import "./message-double-like.css";
import "./message-videos.css";

function App() {
  const model = useSoCalled();
  return <SoCalledView model={model} />;
}

export default App;
