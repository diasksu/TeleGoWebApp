interface DebugPanelProps {
  debug?: string;
  isVisible?: boolean;
}

export default function DebugPanel({ debug, isVisible = false }: DebugPanelProps) {
  if (!isVisible || !debug) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(0,0,0,0.8)",
        color: "lime",
        padding: "6px",
        fontSize: "10px",
        zIndex: 99999,
        maxHeight: "30%",
        overflowY: "auto"
      }}
    >
      {debug}
    </div>
  );
}