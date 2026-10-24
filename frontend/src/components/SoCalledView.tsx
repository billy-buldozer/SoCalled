import type { CSSProperties } from "react";

import type { SoCalledModel } from '../hooks/useSoCalled';
import DesktopSidebar from './DesktopSidebar';
import MobileRooms from './MobileRooms';
import ChatPanel from './ChatPanel';
import DetailsPanel from './DetailsPanel';
import Dialogs from './Dialogs';

export default function SoCalledView({ model }: { model: SoCalledModel }) {
  const { mobileScreen, theme } = model;
  return (
<div
      className={`app-shell mobile-${mobileScreen}`}
      style={{
        "--accent": theme.hex,
        "--accent-rgb": theme.rgb,
      } as CSSProperties}
    >
    <DesktopSidebar model={model} />
    <MobileRooms model={model} />
    <ChatPanel model={model} />
    <DetailsPanel model={model} />
    <Dialogs model={model} />
</div>
  );
}
