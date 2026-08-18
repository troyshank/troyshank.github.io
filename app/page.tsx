"use client";

import { useRef, useState } from "react";

type Move = "up" | "down" | "left" | "right";
type CodeBlock = { id: number; move: Move; icon: string; label: string };
type Level = { name: string; hint: string; start: number; goal: number; rocks: number[]; obstacle: string; prize: string };

const moves: Omit<CodeBlock, "id">[] = [
  { move: "up", icon: "↑", label: "move up" },
  { move: "down", icon: "↓", label: "move down" },
  { move: "left", icon: "←", label: "move left" },
  { move: "right", icon: "→", label: "move right" },
];

const themes = [
  { place: "Meadow", obstacle: "🪨", prize: "⭐", hint: "Go around the rocks to reach the shining star!" },
  { place: "Woods", obstacle: "🌲", prize: "🍎", hint: "Find a safe path between the trees." },
  { place: "Garden", obstacle: "🌻", prize: "🦋", hint: "Wind through the flowers to meet the butterfly." },
  { place: "Mountain", obstacle: "⛰️", prize: "🏰", hint: "Climb around the mountains to reach the castle." },
  { place: "Pond", obstacle: "💧", prize: "🐸", hint: "Keep your paws dry and find the friendly frog." },
];
const adventures = ["Walk", "Trail", "Quest", "Crossing", "Puzzle", "Path", "Adventure", "Journey", "Challenge", "Maze"];

function randomFor(seed: number) {
  let value = seed;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

function pathLength(start: number, goal: number, blocked: Set<number>) {
  const queue: [number, number][] = [[start, 0]], seen = new Set([start]);
  while (queue.length) {
    const [cell, distance] = queue.shift()!;
    if (cell === goal) return distance;
    const row = Math.floor(cell / 7), col = cell % 7;
    const nearby = [row > 0 ? cell - 7 : -1, row < 5 ? cell + 7 : -1, col > 0 ? cell - 1 : -1, col < 6 ? cell + 1 : -1];
    for (const next of nearby) if (next >= 0 && !blocked.has(next) && !seen.has(next)) { seen.add(next); queue.push([next, distance + 1]); }
  }
  return -1;
}

function makeLevels(): Level[] {
  return Array.from({ length: 50 }, (_, index) => {
    const theme = themes[index % themes.length];
    const random = randomFor(7001 + index * 97);
    const start = 35 + Math.floor(random() * 7);
    const goal = Math.floor(random() * 7);
    const obstacleCount = Math.min(13, 4 + Math.floor(index / 5));
    let rocks: number[] = [];
    for (let attempt = 0; attempt < 200; attempt++) {
      const picked = new Set<number>();
      while (picked.size < obstacleCount) {
        const cell = Math.floor(random() * 42);
        if (cell !== start && cell !== goal) picked.add(cell);
      }
      const distance = pathLength(start, goal, picked);
      if (distance >= 7 && distance <= 18) { rocks = [...picked]; break; }
    }
    return { name: `${theme.place} ${adventures[Math.floor(index / 5)]}`, hint: theme.hint, start, goal, rocks, obstacle: theme.obstacle, prize: theme.prize };
  });
}

const levels = makeLevels();

export default function Home() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [position, setPosition] = useState(levels[0].start);
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Build a path, then press Play!");
  const [won, setWon] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
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

  const previousLevel = () => {
    const previous = (levelIndex - 1 + levels.length) % levels.length;
    setLevelIndex(previous); setPosition(levels[previous].start); setBlocks([]); setActive(null); setRunning(false); setWon(false);
    setMessage("Map loaded. Build your path!");
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
      if (current === level.goal) { setWon(true); setCompleted((old) => new Set(old).add(levelIndex)); setMessage("You reached the goal! Amazing coding! ⭐"); setRunning(false); setActive(null); return; }
    }
    setMessage("Almost! Add more blocks to reach the star."); setRunning(false); setActive(null);
  };

  return (
    <main>
      <header className="app-header">
        <a className="brand" href="#"><span className="brand-mark">S</span><span><strong>Sprout</strong><small>CODE LAB</small></span></a>
        <div className="header-center"><span className="status-dot"></span>Map Studio</div>
        <div className="header-actions"><span className="score">★ {completed.size} complete</span><button className="icon-button" aria-label="Help">?</button></div>
      </header>

      <section className="mission-bar">
        <div className="mission-copy"><span className="eyebrow">CHALLENGE {String(levelIndex + 1).padStart(2, "0")}</span><h1>{level.name}</h1><p>{level.hint}</p></div>
        <div className="level-progress"><div className="progress-meta"><b>Course progress</b><span>{levelIndex + 1} / {levels.length}</span></div><div className="progress-track"><i style={{ width: `${((levelIndex + 1) / levels.length) * 100}%` }}></i></div></div>
        <div className="map-navigation"><button onClick={previousLevel} aria-label="Previous map">←</button><select value={levelIndex} onChange={(event) => { const next = Number(event.target.value); setLevelIndex(next); setPosition(levels[next].start); setBlocks([]); setWon(false); setMessage("Map loaded. Build your path!"); }} aria-label="Choose map">{levels.map((item, index) => <option value={index} key={index}>Map {index + 1}: {item.name}</option>)}</select><button onClick={nextLevel} aria-label="Next map">→</button></div>
      </section>

      <section className="studio map-studio">
        <aside className="palette panel">
          <div className="panel-title"><span>01</span><div><b>Command library</b><small>Choose a movement block</small></div></div>
          <div className="direction-grid">{moves.map((move) => <button key={move.move} className="direction-button" onClick={() => add(move)} disabled={running}><i>{move.icon}</i><b>{move.label}</b><span>＋</span></button>)}</div>
          <div className="helper"><span>i</span><div><b>Build, test, improve</b><p>Start with a few moves. Run your code and adjust the path.</p></div></div>
        </aside>

        <section className="script panel">
          <div className="panel-title"><span>02</span><div><b>Program</b><small>Commands run top to bottom</small></div></div>
          <div className="flag-block"><span>▶</span><b>When program starts</b></div>
          <div className="script-list">
            {!blocks.length && <div className="empty"><span>☝️</span><b>Your direction blocks go here</b><p>Which way should Pip move first?</p></div>}
            {blocks.map((block, i) => <div className={`path-block ${active === block.id ? "active" : ""}`} key={block.id}><span>{i + 1}</span><i>{block.icon}</i><b>{block.label}</b><button disabled={running} onClick={() => setBlocks((old) => old.filter((b) => b.id !== block.id))} aria-label={`Remove ${block.label}`}>×</button></div>)}
          </div>
          <div className="script-actions"><button disabled={!blocks.length || running} onClick={() => setBlocks((old) => old.slice(0, -1))}>↶ Undo</button><button disabled={!blocks.length || running} onClick={() => reset(true)}>Clear all</button></div>
        </section>

        <section className="stage-wrap panel map-panel">
          <div className="panel-title stage-title"><span>03</span><div><b>Live preview</b><small>Guide Pip to {level.prize}</small></div><div className="legend"><span>🦊 Pip</span><span>{level.prize} Goal</span><span>{level.obstacle} Blocked</span></div></div>
          <div className="map-board">
            {Array.from({ length: 42 }, (_, cell) => <div className={`map-cell ${(Math.floor(cell / 7) + cell) % 2 ? "grass-two" : ""}`} key={cell}>
              {cell === level.goal && <div className="goal" aria-label="Goal">{level.prize}</div>}
              {level.rocks.includes(cell) && <div className="rock" aria-label="Obstacle">{level.obstacle}</div>}
              {cell === position && <div className={`map-pip ${running ? "walking" : ""}`} aria-label="Pip">🦊</div>}
            </div>)}
            {won && <div className="win-card"><span>🎉</span><b>Goal reached!</b><button onClick={nextLevel}>Next map →</button></div>}
          </div>
          <div className={`map-message ${won ? "success" : ""}`}><span>{won ? "✓" : running ? "●" : "i"}</span>{message}</div>
          <div className="play-row"><button className="play" onClick={play} disabled={!blocks.length || running}><span>▶</span>{running ? "Running program…" : "Run program"}</button><button className="reset" onClick={() => reset(false)} disabled={running}><span>↻</span> Reset</button></div>
        </section>
      </section>
    </main>
  );
}
