type WaveSegmentProps = {
  path: string;
  variant?: "fill" | "line";
};

function WaveSegment({ path, variant = "fill" }: WaveSegmentProps) {
  return (
    <svg
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      focusable="false"
      aria-hidden="true"
    >
      {variant === "fill" ? (
        <path className="hero-wave-fill" d={`${path} V320 H0 Z`} />
      ) : (
        <path
          className="hero-wave-line"
          d={path}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

const waves = [
  {
    className: "hero-wave-layer hero-wave-back",
    path: "M0 150 C120 60 240 60 360 150 S600 240 720 150 S960 60 1080 150 S1320 240 1440 150",
    variant: "fill" as const,
  },
  {
    className: "hero-wave-layer hero-wave-middle",
    path: "M0 175 C120 105 240 105 360 175 S600 245 720 175 S960 105 1080 175 S1320 245 1440 175",
    variant: "fill" as const,
  },
  {
    className: "hero-wave-layer hero-wave-front",
    path: "M0 205 C120 145 240 145 360 205 S600 265 720 205 S960 145 1080 205 S1320 265 1440 205",
    variant: "fill" as const,
  },
  {
    className: "hero-wave-layer hero-wave-gold",
    path: "M0 185 C90 85 270 85 360 185 S630 285 720 185 S990 85 1080 185 S1350 285 1440 185",
    variant: "line" as const,
  },
  {
    className: "hero-wave-layer hero-wave-gold-secondary",
    path: "M0 165 C100 245 260 245 360 165 S620 85 720 165 S980 245 1080 165 S1340 85 1440 165",
    variant: "line" as const,
  },
];

type MovingWavesProps = {
  placement?: "bottom" | "top";
};

export function MovingWaves({ placement = "bottom" }: MovingWavesProps) {
  return (
    <div className={`hero-waves hero-waves-${placement}`} aria-hidden="true">
      {waves.map((wave) => (
        <div className={wave.className} key={wave.className}>
          <div className="hero-wave-track">
            <WaveSegment path={wave.path} variant={wave.variant} />
            <WaveSegment path={wave.path} variant={wave.variant} />
          </div>
        </div>
      ))}
    </div>
  );
}
