import { useEffect, useState } from "react";

/**
 * Shows a gentle overlay on mobile devices in portrait orientation,
 * suggesting the user rotate their device for a better experience.
 * Only visible on screens narrower than 768px in portrait mode.
 */
export default function RotateScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 768;
      setShow(isPortrait && isMobile);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(6px)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        fontSize: "13px",
        lineHeight: "1.4",
      }}
    >
      {/* Rotate icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, animation: "spin-once 1.5s ease-in-out infinite" }}
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22h6" />
        <path d="M12 17v.01" />
      </svg>
      <span>
        <strong style={{ color: "#22c55e" }}>Vire seu celular</strong> para uma experiência melhor na plataforma.
      </span>
      <button
        onClick={() => setShow(false)}
        style={{
          marginLeft: "auto",
          background: "none",
          border: "none",
          color: "#aaa",
          fontSize: "18px",
          cursor: "pointer",
          padding: "0 4px",
          lineHeight: 1,
        }}
        aria-label="Fechar"
      >
        ×
      </button>
      <style>{`
        @keyframes spin-once {
          0%   { transform: rotate(0deg); }
          40%  { transform: rotate(90deg); }
          60%  { transform: rotate(90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
