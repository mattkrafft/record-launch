"use client";

import { useEffect, useRef, useState } from "react";

const TAU = Math.PI * 2;
const DISC = { x: 500, y: 380, r: 282 };
const BASKET = { x: 816, y: 120, w: 190, h: 142 };
const START = { x: 500, y: 205 };

type GameStatus = "ready" | "running" | "won";

function medalFor(time: number) {
  if (time <= 8) return "GOLD";
  if (time <= 12) return "SILVER";
  return "BRONZE";
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRpmRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const [targetRpm, setTargetRpm] = useState(0);
  const [actualRpm, setActualRpm] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [best, setBest] = useState<number | null>(null);
  const resetRef = useRef(0);

  const setSpeed = (value: number) => {
    const rpm = Math.max(0, Math.min(120, value));
    targetRpmRef.current = rpm;
    setTargetRpm(rpm);
  };

  const startAudio = () => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    audioRef.current.resume();
  };

  const spin = () => {
    startAudio();
    setStatus((current) => (current === "won" ? current : "running"));
    if (targetRpmRef.current < 45) setSpeed(72);
  };

  const reset = () => {
    setSpeed(0);
    setElapsed(0);
    setActualRpm(0);
    setStatus("ready");
    resetRef.current += 1;
  };

  useEffect(() => {
    const stored = localStorage.getItem("record-lab-best");
    if (stored) setBest(Number(stored));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let previous = performance.now();
    let lastReset = resetRef.current;
    let angle = 0;
    let omega = 0;
    let puck = { x: START.x, y: START.y, vx: 0, vy: 0, stuck: true };
    let gameTime = 0;
    let won = false;
    let beatAt = 0;

    const restore = () => {
      angle = 0;
      omega = 0;
      puck = { x: START.x, y: START.y, vx: 0, vy: 0, stuck: true };
      gameTime = 0;
      won = false;
    };

    const tone = (strength: number) => {
      const ac = audioRef.current;
      if (!ac || ac.state !== "running") return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "triangle";
      osc.frequency.value = 150 + strength * 2.2;
      gain.gain.setValueAtTime(0.0001, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, ac.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.09);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.1);
    };

    const circle = (x: number, y: number, r: number, fill: string, stroke?: string) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, 1100, 760);
      ctx.fillStyle = "#f6f3ea";
      ctx.fillRect(0, 0, 1100, 760);

      ctx.strokeStyle = "rgba(23,33,43,.07)";
      ctx.lineWidth = 1;
      for (let x = 10; x < 1100; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 760); ctx.stroke();
      }
      for (let y = 4; y < 760; y += 28) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1100, y); ctx.stroke();
      }

      ctx.save();
      ctx.translate(BASKET.x + BASKET.w / 2, BASKET.y + BASKET.h / 2);
      ctx.rotate(-0.12);
      ctx.fillStyle = won ? "#43c59e" : "#20bfd5";
      ctx.strokeStyle = "#087e91";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(-BASKET.w / 2, -BASKET.h / 2, BASKET.w, BASKET.h, 24);
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = .28;
      for (let x = -70; x <= 70; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, -48); ctx.lineTo(x, 48); ctx.stroke();
      }
      for (let y = -40; y <= 40; y += 20) {
        ctx.beginPath(); ctx.moveTo(-76, y); ctx.lineTo(76, y); ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(23,33,43,.24)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 9;
      circle(DISC.x, DISC.y, DISC.r + 14, "#d7d8d4", "#9aa1a6");
      ctx.shadowColor = "transparent";
      circle(DISC.x, DISC.y, DISC.r, "#20252b", "#11161b");
      ctx.translate(DISC.x, DISC.y);
      ctx.rotate(angle);
      for (let r = 72; r < DISC.r - 6; r += 7) {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
        ctx.strokeStyle = r % 21 === 0 ? "#3c434a" : "#292f35";
        ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,.12)";
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.arc(0, 0, 205, 3.6, 5.2); ctx.stroke();
      circle(0, 0, 88, "#ff5b55", "#e14642");
      ctx.fillStyle = "#fff7e9";
      ctx.textAlign = "center";
      ctx.font = "700 18px system-ui";
      ctx.fillText("RECORD LAB", 0, -17);
      ctx.font = "600 12px system-ui";
      ctx.fillText(`${Math.round(Math.abs(omega) * 60 / TAU)} RPM`, 0, 27);
      circle(0, 0, 9, "#e8d3ae", "#5f5142");
      ctx.restore();

      if (!won) {
        ctx.save();
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = "#20bfd5";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(puck.x, puck.y);
        ctx.quadraticCurveTo(720, 120, BASKET.x + 70, BASKET.y + 80);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.28)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 6;
        circle(puck.x, puck.y, 25, "#20bfd5", "#087e91");
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(puck.x - 5, puck.y - 5, 13, 3.5, 5.4); ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = "#17212b";
      ctx.font = "700 14px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("OBJECT 01", 28, 42);
      ctx.font = "500 13px system-ui";
      ctx.fillText("Mass 0.80 kg", 28, 66);
      ctx.fillText("Static friction 0.30", 28, 87);
      ctx.fillText("Kinetic friction 0.20", 28, 108);

      if (won) {
        ctx.fillStyle = "rgba(255,255,255,.94)";
        ctx.strokeStyle = "#43c59e";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.roundRect(300, 302, 400, 148, 24); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#17212b";
        ctx.textAlign = "center";
        ctx.font = "800 32px system-ui";
        ctx.fillText("TARGET CAPTURED", 500, 354);
        ctx.font = "700 22px system-ui";
        ctx.fillStyle = "#14866a";
        ctx.fillText(`${medalFor(gameTime)} • ${gameTime.toFixed(2)} s`, 500, 397);
      }
    };

    const update = (now: number) => {
      if (lastReset !== resetRef.current) { lastReset = resetRef.current; restore(); }
      const dt = Math.min((now - previous) / 1000, 0.025);
      previous = now;
      const targetOmega = targetRpmRef.current * TAU / 60;
      const priorOmega = omega;
      const acceleration = targetOmega > omega ? 2.8 : 5.4;
      omega += Math.sign(targetOmega - omega) * Math.min(Math.abs(targetOmega - omega), acceleration * dt);
      const alpha = (omega - priorOmega) / Math.max(dt, .001);
      angle = (angle + omega * dt) % TAU;

      if (!won && Math.abs(omega) > .05 && targetRpmRef.current > 0) {
        gameTime += dt;
        setElapsed(gameTime);
      }
      setActualRpm(Math.abs(omega) * 60 / TAU);

      if (!won) {
        const rx = puck.x - DISC.x;
        const ry = puck.y - DISC.y;
        const radius = Math.hypot(rx, ry);
        const surfaceVx = -omega * ry;
        const surfaceVy = omega * rx;
        const requiredAccel = Math.hypot(omega * omega * radius, alpha * radius);
        const muSg = 0.30 * 520;

        if (puck.stuck && requiredAccel <= muSg && radius < DISC.r - 20) {
          puck.vx = surfaceVx;
          puck.vy = surfaceVy;
          const da = omega * dt;
          const c = Math.cos(da), s = Math.sin(da);
          puck.x = DISC.x + rx * c - ry * s;
          puck.y = DISC.y + rx * s + ry * c;
        } else {
          puck.stuck = false;
          const relVx = puck.vx - surfaceVx;
          const relVy = puck.vy - surfaceVy;
          const relSpeed = Math.max(Math.hypot(relVx, relVy), 1);
          if (radius < DISC.r) {
            const frictionAccel = 0.20 * 520;
            puck.vx += (-relVx / relSpeed) * frictionAccel * dt;
            puck.vy += (-relVy / relSpeed) * frictionAccel * dt;
          }
          puck.x += puck.vx * dt;
          puck.y += puck.vy * dt;
        }

        if (puck.x > BASKET.x && puck.x < BASKET.x + BASKET.w && puck.y > BASKET.y && puck.y < BASKET.y + BASKET.h) {
          won = true;
          setStatus("won");
          setSpeed(0);
          setBest((old) => {
            const value = old === null ? gameTime : Math.min(old, gameTime);
            localStorage.setItem("record-lab-best", value.toString());
            return value;
          });
          tone(120);
        }
      }

      if (omega > .25 && now > beatAt) {
        tone(Math.abs(omega) * 60 / TAU);
        beatAt = now + Math.max(170, 9000 / Math.max(20, Math.abs(omega) * 60 / TAU));
      }

      draw();
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-disc">●</span><strong>RECORD LAB</strong><span className="level">LEVEL 01</span></div>
        <div className="medals"><span className="gold">● GOLD&nbsp; 8.00</span><span className="silver">● SILVER&nbsp; 12.00</span><span className="bronze">● BRONZE&nbsp; 18.00</span></div>
        <div className="clock">{elapsed.toFixed(2).padStart(5, "0")}</div>
      </header>

      <section className="workspace">
        <div className="board">
          <canvas ref={canvasRef} width={1100} height={760} aria-label="Record Lab game board" />
          <div className="instruction">ⓘ Match the cyan puck to the cyan basket</div>
        </div>

        <aside className="controls">
          <div className="rpm-card">
            <span>RPM</span>
            <strong>{Math.round(actualRpm)}</strong>
            <input aria-label="Target record speed" type="range" min="0" max="120" value={targetRpm} onChange={(e) => setSpeed(Number(e.target.value))} />
            <div className="range-labels"><span>0</span><span>120</span></div>
          </div>
          <button className="spin" onClick={spin}>▶ SPIN</button>
          <button className="brake" onClick={() => setSpeed(0)}>◉ BRAKE</button>
          <div className="object-card"><span className="puck-swatch"/><div><b>CYAN PUCK</b><small>μs 0.30 · μk 0.20</small></div></div>
          <div className="tips"><b>HOW TO PLAY</b><p>Raise the RPM until the puck slips. Brake at the right moment to curve it into the basket.</p></div>
          {best !== null && <div className="best">BEST&nbsp; {best.toFixed(2)} s</div>}
          <button className="reset" onClick={reset}>↻ RESET LEVEL</button>
          <div className={`status ${status}`}>{status === "ready" ? "READY TO TEST" : status === "running" ? "EXPERIMENT RUNNING" : "LEVEL COMPLETE"}</div>
        </aside>
      </section>
    </main>
  );
}
