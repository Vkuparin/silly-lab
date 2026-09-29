import { useEffect, useState } from "react";

const HOLES = 9;
const ROUND_SECONDS = 30;
const MOLE = "🐹";

// Discrete pop intervals: the higher the score, the faster the mole hops.
const POP_INTERVALS_MS = [1200, 1000, 850, 700];

function popIntervalMs(score: number): number {
  if (score >= 20) return POP_INTERVALS_MS[3];
  if (score >= 12) return POP_INTERVALS_MS[2];
  if (score >= 5) return POP_INTERVALS_MS[1];
  return POP_INTERVALS_MS[0];
}

type Phase = "idle" | "playing" | "over";

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [moleHole, setMoleHole] = useState<number | null>(null);

  function start() {
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setMoleHole(null);
    setPhase("playing");
  }

  function whack(hole: number) {
    if (phase !== "playing" || hole !== moleHole) return;
    setScore((s) => s + 1);
    setMoleHole(null); // duck back down
  }

  // One-second countdown while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // When the clock runs out, end the round.
  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0) {
      setPhase("over");
      setMoleHole(null);
    }
  }, [phase, timeLeft]);

  // Keep hopping the mole to a random hole while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const hop = () =>
      setMoleHole((current) => {
        let next = Math.floor(Math.random() * HOLES);
        while (next === current) next = Math.floor(Math.random() * HOLES);
        return next;
      });
    hop();
    const id = setInterval(hop, popIntervalMs(score));
    return () => clearInterval(id);
  }, [phase, score]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 via-lime-100 to-lime-300 p-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-lime-900">
        Whack-a-Mole
      </h1>

      <div className="flex items-center gap-8 text-xl font-bold text-lime-950">
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>

      <main className="relative w-full max-w-md">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: HOLES }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => whack(i)}
              aria-label={`Hole ${i + 1}`}
              className="relative aspect-square w-full select-none overflow-hidden rounded-full bg-amber-950/90 shadow-[inset_0_8px_12px_rgba(0,0,0,0.6)]"
            >
              {moleHole === i && (
                <span className="absolute inset-x-0 bottom-0 animate-mole-pop text-center text-7xl leading-none">
                  {MOLE}
                </span>
              )}
            </button>
          ))}
        </div>

        {phase !== "playing" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-lime-950/60 backdrop-blur-sm">
            {phase === "over" ? (
              <>
                <p className="text-3xl font-extrabold text-white">
                  Time's up!
                </p>
                <p className="text-lg text-lime-100">Final score: {score}</p>
              </>
            ) : (
              <p className="px-6 text-center text-2xl font-bold text-white">
                Whack the mole for 30 seconds
              </p>
            )}
            <button
              type="button"
              onClick={start}
              className="mt-2 rounded-full bg-amber-400 px-8 py-2.5 text-lg font-bold text-amber-950 transition hover:bg-amber-300 active:scale-95"
            >
              {phase === "over" ? "Play again" : "Play"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
