import type { Kind } from "./modes";
export const AVATARS = ["🌻", "🍓", "🐸", "🦊", "🐻", "🐱"];
export function Mole({ kind = "normal" }: { kind?: Kind }) {
  return (
    <svg
      viewBox="0 0 180 180"
      aria-hidden="true"
      className={`mole-art kind-${kind}`}
    >
      {kind === "bomb" ? (
        <>
          <path
            d="M96 55 Q128 16 140 45"
            fill="none"
            stroke="#e7bf6f"
            strokeWidth="9"
          />
          <path
            d="M138 28l6-11m-2 23 15-2m-17 1 9 11"
            stroke="#fce581"
            strokeWidth="5"
          />
          <circle cx="86" cy="109" r="56" fill="#2d4148" />
          <circle cx="68" cy="86" r="15" fill="#57717a" />
          <circle cx="88" cy="108" r="30" fill="#fff2ce" />
          <path
            d="M70 90l36 36m0-36-36 36"
            stroke="#bd4d39"
            strokeWidth="11"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse
            cx="90"
            cy="165"
            rx="72"
            ry="11"
            fill="#1f271e"
            opacity=".18"
          />
          <circle cx="41" cy="66" r="21" fill="#714b38" />
          <circle cx="139" cy="66" r="21" fill="#714b38" />
          <circle cx="41" cy="66" r="12" fill="#c98772" />
          <circle cx="139" cy="66" r="12" fill="#c98772" />
          <path
            d="M28 171V104C28 38 152 38 152 104v67"
            fill={
              kind === "golden"
                ? "#c9983d"
                : kind === "star"
                  ? "#9272ab"
                  : "#946443"
            }
          />
          <ellipse cx="90" cy="122" rx="46" ry="37" fill="#f5d7ae" />
          <ellipse cx="60" cy="101" rx="7" ry="10" fill="#283c35" />
          <ellipse cx="120" cy="101" rx="7" ry="10" fill="#283c35" />
          <circle cx="58" cy="98" r="2.5" fill="white" />
          <circle cx="118" cy="98" r="2.5" fill="white" />
          <ellipse cx="90" cy="117" rx="12" ry="9" fill="#71454a" />
          <path
            d="M75 133q15 17 30 0"
            fill="none"
            stroke="#714b38"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="49" cy="121" rx="9" ry="6" fill="#df9b87" />
          <ellipse cx="131" cy="121" rx="9" ry="6" fill="#df9b87" />
          <ellipse cx="30" cy="156" rx="19" ry="12" fill="#f5d7ae" />
          <ellipse cx="150" cy="156" rx="19" ry="12" fill="#f5d7ae" />
          {kind === "golden" && (
            <path
              d="M52 55l-5-31 25 15L90 13l18 26 25-15-5 31z"
              fill="#ffdc65"
              stroke="#b47728"
              strokeWidth="3"
            />
          )}
          {kind === "star" && (
            <>
              <path d="M51 58l39-44 39 44z" fill="#515f9c" />
              <path
                d="M90 20l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"
                fill="#ffe286"
              />
            </>
          )}
        </>
      )}
    </svg>
  );
}
