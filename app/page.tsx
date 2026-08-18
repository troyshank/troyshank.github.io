"use client";

import { useEffect, useRef, useState } from "react";

type BlockKind = "move" | "turn" | "jump" | "say" | "sparkle" | "sound" | "repeat";
type Block = { id: number; kind: BlockKind; label: string; icon: string; color: string };

const blockMenu: Omit<Block, "id">[] = [
  { kind: "move", label: "move forward", icon: "➜", color: "blue" },
  { kind: "turn", label: "turn around", icon: "↻", color: "blue" },
  { kind: "jump", label: "jump", icon: "↥", color: "blue" },
  { kind: "say", label: "say hello!", icon: "●", color: "purple" },
  { kind: "sparkle", label: "make sparkles", icon: "✦", color: "purple" },
  { kind: "sound", label: "play pop sound", icon: "♪", color: "pink" },
  { kind: "repeat", label: "do it twice", icon: "2×", color: "orange" },
];

const starterIdeas = [
  { title: "Make a hello dance", prompt: "Try: say hello, jump, then turn!", blocks: ["say", "jump", "turn"] as BlockKind[] },
  { title: "Make some magic", prompt: "Try: move, sparkle, then play a sound!", blocks: ["move", "sparkle", "sound"] as BlockKind[] },
  { title: "Invent your own", prompt: "There is no wrong answer. What will Pip do?", blocks: [] as BlockKind[] },
];

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [x, setX] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [turn, setTurn] = useState(0);
  const [bubble, setBubble] = useState("");
  const [sparkles, setSparkles] = useState(false);
  const [idea, setIdea] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const nextId = useRef(1);
  const stopRun = useRef(false);

  const addBlock = (template: Omit<Block, "id">) => {
    if (running || blocks.length >= 12) return;
    setBlocks((old) => [...old, { ...template, id: nextId.current++ }]);
  };

  const resetStage = () => { setX(0); setTurn(0); setJumping(false); setBubble(""); setSparkles(false); };
  const clear = () => { stopRun.current = true; setRunning(false); setActive(null); setBlocks([]); resetStage(); };
  const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const playBlock = async (block: Block) => {
    if (block.kind === "move") setX((old) => old >= 104 ? -104 : old + 52);
    if (block.kind === "turn") setTurn((old) => old + 360);
    if (block.kind === "jump") { setJumping(true); await pause(330); setJumping(false); }
    if (block.kind === "say") { setBubble("Hello, coder! 👋"); }
    if (block.kind === "sparkle") { setSparkles(true); await pause(430); setSparkles(false); }
    if (block.kind === "sound") { setBubble("Pop! ♪"); playPop(); }
    await pause(520);
  };

  const run = async () => {
    if (!blocks.length || running) return;
    stopRun.current = false; setRunning(true); setCelebrate(false); resetStage();
    for (let i = 0; i < blocks.length; i++) {
      if (stopRun.current) return;
      setActive(blocks[i].id);
      if (blocks[i].kind === "repeat" && i > 0) await playBlock(blocks[i - 1]);
      else await playBlock(blocks[i]);
    }
    setActive(null); setRunning(false); setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 1800);
  };

  const playPop = () => {
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx(); const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.frequency.setValueAtTime(520, ctx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + .12);
      gain.gain.setValueAtTime(.12, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .16);
      oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + .17);
    } catch { /* sound is a bonus */ }
  };

  const loadIdea = () => {
    const next = (idea + 1) % starterIdeas.length; setIdea(next); clear();
    const chosen = starterIdeas[next].blocks.map((kind) => ({ ...blockMenu.find((b) => b.kind === kind)!, id: nextId.current++ }));
    setBlocks(chosen);
  };

  useEffect(() => () => { stopRun.current = true; }, []);

  return (
    <main>
      <header>
        <a className="brand" href="#" aria-label="Sprout home"><span className="brand-mark">S</span><strong>SPROUT</strong><em>code, play, grow!</em></a>
        <div className="header-actions"><button className="pill ghost" onClick={loadIdea}>💡 New idea</button><button className="avatar" aria-label="Your profile">⭐</button></div>
      </header>

      <section className="intro">
        <div><span className="eyebrow">TODAY&apos;S MINI MISSION</span><h1>{starterIdeas[idea].title}</h1><p>{starterIdeas[idea].prompt}</p></div>
        <div className="progress"><b>1</b><span></span><b>2</b><span></span><b>3</b><small>Pick</small><small>Stack</small><small>Play!</small></div>
      </section>

      <section className="studio">
        <aside className="palette panel">
          <div className="panel-title"><span>1</span><div><b>Pick a block</b><small>Tap to add it</small></div></div>
          <div className="block-list">{blockMenu.map((block) => <button key={block.kind} className={`code-block ${block.color}`} onClick={() => addBlock(block)} disabled={running}><i>{block.icon}</i>{block.label}<strong>＋</strong></button>)}</div>
        </aside>

        <section className="script panel">
          <div className="panel-title"><span>2</span><div><b>Stack your code</b><small>It runs top to bottom</small></div></div>
          <div className="flag-block">🏁 <b>when green flag is tapped</b></div>
          <div className="script-list">
            {!blocks.length && <div className="empty"><span>☝️</span><b>Your blocks go here</b><p>Start with any block you like.</p></div>}
            {blocks.map((block, index) => <div className={`code-block script-block ${block.color} ${active === block.id ? "active" : ""}`} key={block.id}><i>{block.icon}</i><span>{block.label}</span><button disabled={running} aria-label={`Remove ${block.label}`} onClick={() => setBlocks((old) => old.filter((b) => b.id !== block.id))}>×</button>{index < blocks.length - 1 && <u>⌄</u>}</div>)}
          </div>
          <div className="script-actions"><button disabled={!blocks.length || running} onClick={() => setBlocks((old) => old.slice(0, -1))}>↶ Undo</button><button disabled={!blocks.length || running} onClick={clear}>Clear all</button></div>
        </section>

        <section className="stage-wrap panel">
          <div className="panel-title"><span>3</span><div><b>Watch it go!</b><small>Your code comes alive</small></div></div>
          <div className="stage">
            <div className="cloud one"></div><div className="cloud two"></div><div className="sun">☀</div>
            <div className="hill hill-one"></div><div className="hill hill-two"></div>
            <div className="flowers">✿　❀　✿　❀　✿</div>
            {bubble && <div className="bubble">{bubble}</div>}
            {sparkles && <div className="sparkles">✦　✨　✦</div>}
            <div className={`pip ${jumping ? "jumping" : ""}`} style={{ transform: `translateX(${x}px) rotate(${turn}deg)` }}><div className="ear left"></div><div className="ear right"></div><div className="face"><span className="eye e1"></span><span className="eye e2"></span><span className="smile">⌣</span></div><div className="body">♥</div><div className="feet">●　●</div></div>
            {celebrate && <div className="celebrate">You made it! ⭐</div>}
          </div>
          <div className="play-row"><button className="play" onClick={run} disabled={!blocks.length || running}><span>▶</span>{running ? "Playing…" : "Play my code"}</button><button className="reset" onClick={resetStage} disabled={running} aria-label="Reset character">↻</button></div>
          <p className="tip">🌱 <b>Coder tip:</b> There&apos;s no wrong way to play. Change a block and try again!</p>
        </section>
      </section>
    </main>
  );
}
