import SuturaMark from '@/components/brand/SuturaMark';

const PIN = 'M32 78C24 66 6 50 6 30a26 26 0 1 1 52 0c0 20-18 36-26 48Z';

function PinFace({ back = false }: Readonly<{ back?: boolean }>) {
  return (
    <div
      className="sutura-pin-face-wrap"
      style={{
        transform: back ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 80"
        className="h-full w-full drop-shadow-[0_4px_10px_rgba(45,42,38,0.25)]"
        aria-hidden
      >
        <path d={PIN} style={{ fill: 'var(--brand-taupe, #9A8073)' }} />
        <path d={PIN} fill="none" style={{ stroke: 'var(--nav-bar, #2D2A26)' }} strokeWidth="3" />
        <circle cx="32" cy="30" r="18" style={{ fill: 'var(--background, #FAF6F3)' }} />
        <SuturaMark x="16" y="14" width="32" height="32" detail="small" />
      </svg>
    </div>
  );
}

/** The spinning SUTURA pin & radar waves shown while the landing page finds the visitor. */
export default function SpinningPin() {
  return (
    <div className="sutura-pin-stage" aria-hidden>
      {/* Ground radar sonar ripples & dynamic shadow */}
      <div className="sutura-radar-anchor">
        <div className="sutura-radar-wave sutura-radar-wave-1" />
        <div className="sutura-radar-wave sutura-radar-wave-2" />
        <div className="sutura-radar-wave sutura-radar-wave-3" />
        <div className="sutura-pin-shadow" />
      </div>

      {/* Floating & rotating 3D pin */}
      <div className="sutura-pin-bob">
        <div className="sutura-pin-spin">
          <PinFace />
          <PinFace back />
        </div>
      </div>
    </div>
  );
}
