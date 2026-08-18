"use client";

import { useRef, useState } from "react";

type Move = "up" | "down" | "left" | "right";
type CodeBlock = { id: number; move: Move; icon: string; label: string };
type Level = { name: string; hint: string; start: number; goal: number; openings: Set<string>; prize: string };

const moves: Omit<CodeBlock, "id">[] = [
  { move: "up", icon: "↑", label: "move up" },
  { move: "down", icon: "↓", label: "move down" },
  { move: "left", icon: "←", label: "move left" },
  { move: "right", icon: "→", label: "move right" },
];

const themes = [
  { place: "Meadow", prize: "⭐", hint: "Follow the hallways to reach the shining star!" },
  { place: "Woods", prize: "🍎", hint: "Navigate the woodland corridors to find the apple." },
  { place: "Garden", prize: "🦋", hint: "Turn through the garden maze to meet the butterfly." },
  { place: "Mountain", prize: "🏰", hint: "Climb the winding passages to reach the castle." },
  { place: "Pond", prize: "🐸", hint: "Follow the waterside halls to find the friendly frog." },
];
const adventures = ["Walk", "Trail", "Quest", "Crossing", "Puzzle", "Path", "Adventure", "Journey", "Challenge", "Maze"];

function randomFor(seed: number) {
  let value = seed;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

const edgeKey = (a: number, b: number) => a < b ? `${a}-${b}` : `${b}-${a}`;
const neighbors = (cell: number) => {
  const row = Math.floor(cell / 7), col = cell % 7;
  return [row > 0 ? cell - 7 : -1, row < 5 ? cell + 7 : -1, col > 0 ? cell - 1 : -1, col < 6 ? cell + 1 : -1].filter((next) => next >= 0);
};

function makeHallways(start: number, random: () => number, extraOpenings: number) {
  const visited = new Set([start]), stack = [start], openings = new Set<string>();
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const choices = neighbors(cell).filter((next) => !visited.has(next));
    if (!choices.length) { stack.pop(); continue; }
    const next = choices[Math.floor(random() * choices.length)];
    openings.add(edgeKey(cell, next)); visited.add(next); stack.push(next);
  }
  const closed: string[] = [];
  for (let cell = 0; cell < 42; cell++) for (const next of neighbors(cell)) {
    const edge = edgeKey(cell, next);
    if (!openings.has(edge) && !closed.includes(edge)) closed.push(edge);
  }
  for (let i = 0; i < extraOpenings && closed.length; i++) {
    const pick = Math.floor(random() * closed.length);
    openings.add(closed.splice(pick, 1)[0]);
  }
  return openings;
}

function makeLevels(): Level[] {
  return Array.from({ length: 50 }, (_, index) => {
    const theme = themes[index % themes.length];
    const random = randomFor(7001 + index * 97);
    const start = 35 + Math.floor(random() * 7);
    const goal = Math.floor(random() * 7);
    const extraOpenings = Math.max(1, 9 - Math.floor(index / 6));
    const openings = makeHallways(start, random, extraOpenings);
    return { name: `${theme.place} ${adventures[Math.floor(index / 5)]}`, hint: theme.hint, start, goal, openings, prize: theme.prize };
  });
}

const levels = makeLevels();
const displayTile = (cell: number) => (Math.floor(cell / 7) * 2 + 1) * 15 + ((cell % 7) * 2 + 1);
function hallwayTiles(level: Level) {
  const tiles = new Set<number>();
  for (let cell = 0; cell < 42; cell++) tiles.add(displayTile(cell));
  for (const opening of level.openings) {
    const [a, b] = opening.split("-").map(Number);
    tiles.add((displayTile(a) + displayTile(b)) / 2);
  }
  return tiles;
}

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
  const hallways = hallwayTiles(level);

  const add = (move: Omit<CodeBlock, "id">) => {
    if (running || blocks.length >= 60) return;
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
      if (!level.openings.has(edgeKey(current, next))) { setMessage("That way is blocked by a wall. Try another direction."); setRunning(false); setActive(null); return; }
      current = next; setPosition(current);
      await new Promise((r) => setTimeout(r, 520));
      if (current === level.goal) { setWon(true); setCompleted((old) => new Set(old).add(levelIndex)); setMessage("You reached the goal! Amazing coding! ⭐"); setRunning(false); setActive(null); return; }
    }
    setMessage("Almost! Add more blocks to reach the star."); setRunning(false); setActive(null);
  };

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">S</span><span><strong>SPROUT</strong><small>MAZE ACADEMY</small></span></a>
        <nav><button className="nav-active">Adventure</button><button>My progress</button><button>How to play</button></nav>
        <div className="player-stats"><span className="stat-pill"><i>★</i><b>{completed.size}</b> cleared</span><span className="avatar">🦊</span></div>
      </header>
      <section className="hero-card">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sprout-world.png`} alt="Pip overlooking an ancient maze" />
        <div className="hero-shade"></div>
        <div className="hero-copy"><span className="chapter">CHAPTER {Math.floor(levelIndex / 10) + 1} · THE ANCIENT PATHS</span><h1>{level.name}</h1><p>{level.hint}</p><div className="hero-tags"><span>MAP {String(levelIndex + 1).padStart(2, "0")}</span><span>CODE QUEST</span><span>{level.prize} GOAL</span></div></div>
        <div className="hero-progress"><div><span>Adventure progress</span><b>{levelIndex + 1} of {levels.length}</b></div><div className="progress-track"><i style={{ width: `${((levelIndex + 1) / levels.length) * 100}%` }}></i></div></div>
      </section>
      <section className="workspace">
        <section className="arena-card">
          <div className="card-heading"><div><span className="live-dot"></span><small>LIVE MAZE</small><h2>Navigate the stone halls</h2></div><div className="map-navigation"><button onClick={previousLevel}>←</button><select value={levelIndex} onChange={(event) => { const next = Number(event.target.value); setLevelIndex(next); setPosition(levels[next].start); setBlocks([]); setWon(false); setMessage("Map loaded. Build your path!"); }}>{levels.map((item, index) => <option value={index} key={index}>Map {index + 1} · {item.name}</option>)}</select><button onClick={nextLevel}>→</button></div></div>
          <div className="map-frame"><div className="map-board">{Array.from({ length: 195 }, (_, tile) => <div className={hallways.has(tile) ? "hallway-tile" : "stone-tile"} key={tile}>{tile === displayTile(level.goal) && <div className="goal">{level.prize}</div>}{tile === displayTile(position) && <div className={`map-pip ${running ? "walking" : ""}`}>🦊</div>}</div>)}{won && <div className="win-card"><span>🎉</span><b>Quest complete!</b><button onClick={nextLevel}>Next adventure →</button></div>}</div></div>
          <div className="arena-footer"><div className={`map-message ${won ? "success" : ""}`}><span>{won ? "✓" : running ? "●" : "i"}</span>{message}</div><div className="legend"><span>🦊 Pip</span><span>{level.prize} Goal</span><span>▰ Stone</span></div></div>
        </section>
        <aside className="code-console">
          <div className="console-heading"><div><small>CODE BUILDER</small><h2>Program Pip</h2></div><span>{blocks.length} / 60</span></div>
          <div className="command-dock">{moves.map((move) => <button key={move.move} className="direction-button" onClick={() => add(move)} disabled={running}><i>{move.icon}</i><span>{move.label.replace("move ", "")}</span><b>＋</b></button>)}</div>
          <div className="timeline-head"><span className="start-gem">▶</span><div><b>On adventure start</b><small>Runs from top to bottom</small></div></div>
          <div className="script-list">{!blocks.length && <div className="empty"><span>＋</span><b>Build your first route</b><p>Choose a direction above to add a command.</p></div>}{blocks.map((block, i) => <div className={`path-block ${active === block.id ? "active" : ""}`} key={block.id}><span>{String(i + 1).padStart(2, "0")}</span><i>{block.icon}</i><b>{block.label}</b><button disabled={running} onClick={() => setBlocks((old) => old.filter((b) => b.id !== block.id))}>×</button></div>)}</div>
          <div className="script-actions"><button disabled={!blocks.length || running} onClick={() => setBlocks((old) => old.slice(0, -1))}>↶ Undo</button><button disabled={!blocks.length || running} onClick={() => reset(true)}>Clear route</button></div>
          <div className="run-dock"><button className="play" onClick={play} disabled={!blocks.length || running}><span>▶</span>{running ? "Running…" : "Run my code"}</button><button className="reset" onClick={() => reset(false)} disabled={running}>↻</button></div>
          <div className="coach-tip"><span>✦</span><p><b>Pip&apos;s tip</b> Test a short route first, then add more commands.</p></div>
        </aside>
      </section>
      <footer><span>SPROUT MAZE ACADEMY</span><p>Learn to think like a coder — one adventure at a time.</p><b>50 handcrafted quests</b></footer>
    </main>
  );
}
