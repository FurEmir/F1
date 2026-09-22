// Immersive quantum-lab ambience: layered gradients, drifting tech grid, orbiting particles.
// Purely decorative (aria-hidden) and fixed behind the HUD; costs no layout.
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070A11]" aria-hidden>
      {/* deep lab gradients */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 12% -10%, rgba(16,185,129,0.16) 0%, transparent 60%)," +
            "radial-gradient(1000px 620px at 88% 8%, rgba(6,182,212,0.15) 0%, transparent 62%)," +
            "radial-gradient(900px 560px at 50% 112%, rgba(245,158,11,0.10) 0%, transparent 60%)," +
            "linear-gradient(180deg, #070A11 0%, #0A0F1A 55%, #070A11 100%)",
        }}
      />

      {/* drifting technological grid (perspective floor + fine mesh) */}
      <div className="absolute inset-0 opacity-[0.5]">
        <div
          className="absolute inset-x-0 top-0 h-full animate-grid-drift"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.09) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(148,163,184,0.09) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(180deg, transparent 0%, black 22%, black 72%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 22%, black 72%, transparent 100%)",
          }}
        />
      </div>

      {/* time-machine core: concentric orbits */}
      <div className="absolute left-1/2 top-[46%] h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-[0.35]">
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-orbit-slow">
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_14px_4px_rgba(16,185,129,0.65)]" />
        </div>
        <div className="absolute inset-16 rounded-full border border-cyan-500/20 animate-orbit-rev">
          <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_3px_rgba(6,182,212,0.6)]" />
        </div>
        <div className="absolute inset-36 rounded-full border border-amber-500/15 animate-orbit-slow">
          <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_12px_3px_rgba(245,158,11,0.55)]" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-xl" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/30 animate-pulse-ring" />
      </div>

      {/* floating quantum particles */}
      <div
        className="absolute inset-0 opacity-60 animate-sweep"
        style={{
          backgroundImage:
            "radial-gradient(1.6px 1.6px at 14% 22%, rgba(16,185,129,0.85) 0, transparent 100%)," +
            "radial-gradient(1.4px 1.4px at 76% 34%, rgba(6,182,212,0.8) 0, transparent 100%)," +
            "radial-gradient(1.8px 1.8px at 42% 76%, rgba(245,158,11,0.7) 0, transparent 100%)," +
            "radial-gradient(1.3px 1.3px at 88% 68%, rgba(56,189,248,0.75) 0, transparent 100%)," +
            "radial-gradient(1.5px 1.5px at 28% 54%, rgba(226,232,240,0.55) 0, transparent 100%)," +
            "radial-gradient(1.2px 1.2px at 62% 12%, rgba(16,185,129,0.6) 0, transparent 100%)",
        }}
      />

      {/* vignette + scanlines */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 40%, rgba(3,6,12,0.82) 100%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: "repeating-linear-gradient(rgba(16,185,129,0.035) 0px, transparent 2px, transparent 4px)",
        }}
      />
    </div>
  );
}
