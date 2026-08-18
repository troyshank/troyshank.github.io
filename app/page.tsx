"use client";

import { useRef, useState } from "react";

type Move = "up" | "down" | "left" | "right";
type CodeBlock = { id: number; move: Move; icon: string; label: string };
type Level = { name: string; hint: string; start: number; goal: number; rocks: number[] };

const moves: Omit<CodeBlock, "id">[] = [
  { move: "up", icon: "↑", label: "move up" },
  { move: "down", icon: "↓", label: "move down" },
  { move: "left", icon: "←", label: "move left" },
  { move: "right", icon: "→", label: "move right" },
];

const levels: Level[] = [
  { name: "Meadow Walk", hint: "Go around the rock to reach the star!", start: 35, goal: 11, rocks: [28, 21, 22, 15] },
  { name: "Wiggly Woods", hint: "Find a safe path between the trees.", start: 36, goal: 5, rocks: [29, 30, 23, 16, 17, 10] },
  { name: "Castle Trail", hint: "Climb to the castle without bumping a rock.", start: 39, goal: 1, rocks: [32, 25, 24, 17, 10, 9] },
];

export default function Home() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [position, setPosition] = useState(levels[0].start);
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Build a path, then press Play!");
  const [won, setWon] = useState(false);
  const nextId = useRef(1);
  const level = levels[levelIndex];

  const add = (move: Omit<CodeBlock, "id">) => {
    if (running || blocks.length >= 18) return;
    setBlocks((old) => [...old, { ...move, id: nextId.current++ }]);
    setMessage("Great! Keep going or press Play.");
  };

  const reset = (clearCode = false) => {
    setPosition(level.start); setActive(null); setRunning(false); setWon(false);
    if (clearCode) setBlocks([]);
    setMessage(clearCode ? "Build a new path!" : "Ready to try again!");
  };

  const nextLevel = () => {
    const next = (levelIndex + 1) % levels.length;
    setLevelIndex(next); setPosition(levels[next].start); setBlocks([]); setActive(null); setRunning(false); setWon(false);
    setMessage("New map! Can you reach the goal?");
  };

  const destination = (from: number, move: Move) => {
    const row = Math.floor(from / 7), col = from % 7;
    if (move === "up" && row > 0) return from - 7;
    if (move === "down" && row < 5) return from + 7;
    if (move === "left" && col > 0) return from - 1;
    if (move === "right" && col < 6) return from + 1;
    return from;
  };

  const play = async () => {
    if (!blocks.length || running) return;
    setRunning(true); setWon(false); setPosition(level.start); setMessage("Pip is following your code…");
    let current = level.start;
    await new Promise((r) => setTimeout(r, 350));
    for (const block of blocks) {
      setActive(block.id);
      const next = destination(current, block.move);
      if (next === current) { setMessage("Oops—Pip reached the edge! Fix a block and try again."); setRunning(false); setActive(null); return; }
      if (level.rocks.includes(next)) { setMessage("Bonk! There’s a rock there. Try another direction."); setRunning(false); setActive(null); return; }
      current = next; setPosition(current);
      await new Promise((r) => setTimeout(r, 520));
      if (current === level.goal) { setWon(true); setMessage("You reached the goal! Amazing coding! ⭐"); setRunning(false); setActive(null); return; }
    }
    setMessage("Almost! Add more blocks to reach the star."); setRunning(false); setActive(null);
  };

  return (
    <main>
      <header>
        <a className="brand" href="#"><span className="brand-mark">S</span><strong>SPROUT</strong><em>code, play, grow!</em></a>
        <button className="pill ghost" onClick={nextLevel}>🗺️ Next map</button>
      </header>

      <section className="intro map-intro">
        <div><span className="eyebrow">MAP {levelIndex + 1} OF {levels.length}</span><h1>{level.name}</h1><p>{level.hint}</p></div>
        <div className="legend"><span>🦊 Start</span><span>⭐ Goal</span><span>🪨 Go around</span></div>
      </section>

      <section className="studio map-studio">
        <aside className="palette panel">
          <div className="panel-title"><span>1</span><div><b>Pick directions</b><small>Tap to add a move</small></div></div>
          <div className="direction-grid">{moves.map((move) => <button key={move.move} className="direction-button" onClick={() => add(move)} disabled={running}><i>{move.icon}</i><b>{move.label}</b><span>＋</span></button>)}</div>
          <div className="helper"><b>🌱 Start small</b><p>Add a few blocks, press Play, then fix your path.</p></div>
        </aside>

        <section className="script panel">
          <div className="panel-title"><span>2</span><div><b>Build your path</b><small>Moves run top to bottom</small></div></div>
          <div className="flag-block">🏁 <b>when Play is tapped</b></div>
          <div className="script-list">
            {!blocks.length && <div className="empty"><span>☝️</span><b>Your direction blocks go here</b><p>Which way should Pip move first?</p></div>}
            {blocks.map((block, i) => <div className={`path-block ${active === block.id ? "active" : ""}`} key={block.id}><span>{i + 1}</span><i>{block.icon}</i><b>{block.label}</b><button disabled={running} onClick={() => setBlocks((old) => old.filter((b) => b.id !== block.id))} aria-label={`Remove ${block.label}`}>×</button></div>)}
          </div>
          <div className="script-actions"><button disabled={!blocks.length || running} onClick={() => setBlocks((old) => old.slice(0, -1))}>↶ Undo</button><button disabled={!blocks.length || running} onClick={() => reset(true)}>Clear all</button></div>
        </section>

        <section className="stage-wrap panel map-panel">
          <div className="panel-title"><span>3</span><div><b>Reach the goal!</b><small>Watch Pip follow every move</small></div></div>
          <div className="map-board">
            {Array.from({ length: 42 }, (_, cell) => <div className={`map-cell ${(Math.floor(cell / 7) + cell) % 2 ? "grass-two" : ""}`} key={cell}>
              {cell === level.goal && <div className="goal" aria-label="Goal">{levelIndex === 2 ? "🏰" : "⭐"}</div>}
              {level.rocks.includes(cell) && <div className="rock" aria-label="Obstacle">{levelIndex === 1 ? "🌲" : "🪨"}</div>}
              {cell === position && <div className={`map-pip ${running ? "walking" : ""}`} aria-label="Pip">🦊</div>}
            </div>)}
            {won && <div className="win-card"><span>🎉</span><b>Goal reached!</b><button onClick={nextLevel}>Next map →</button></div>}
          </div>
          <div className={`map-message ${won ? "success" : ""}`}>{message}</div>
          <div className="play-row"><button className="play" onClick={play} disabled={!blocks.length || running}><span>▶</span>{running ? "Moving…" : "Play my path"}</button><button className="reset" onClick={() => reset(false)} disabled={running} aria-label="Reset Pip">↻</button></div>
        </section>
      </section>
    </main>
  );
}
