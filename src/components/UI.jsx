const styles = {
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    pointerEvents: 'none',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  title: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: '15px',
    fontWeight: 600,
    textShadow: '0 1px 4px rgba(0,0,0,0.7)',
    lineHeight: 1.4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: 400,
    marginTop: '2px',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end',
    pointerEvents: 'all',
  },
  modeToggle: {
    display: 'flex',
    gap: '6px',
  },
  btn: (active) => ({
    padding: '7px 14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.15s',
    background: active ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.45)',
    color: active ? '#1a1a1a' : 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(8px)',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
  }),
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '11px',
    textAlign: 'right',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    maxWidth: '200px',
    lineHeight: 1.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    color: 'rgba(255,255,255,0.45)',
    fontSize: '11px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    textAlign: 'center',
    pointerEvents: 'none',
  },
}

export default function UI({ mode, setMode }) {
  const isWalk = mode === 'walk'

  return (
    <>
      <div style={styles.wrapper}>
        {/* Title */}
        <div>
          <div style={styles.title}>112 Allissia</div>
          <div style={styles.subtitle}>Coach House · 795 sq ft</div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.modeToggle}>
            <button style={styles.btn(!isWalk)} onClick={() => setMode('orbit')}>
              Orbit
            </button>
            <button style={styles.btn(isWalk)} onClick={() => setMode('walk')}>
              Walk
            </button>
          </div>
          <div style={styles.hint}>
            {isWalk
              ? 'Click to capture mouse · WASD to move · ESC to release'
              : 'Drag to rotate · Scroll to zoom · Right-drag to pan'}
          </div>
        </div>
      </div>

      <div style={styles.bottomBar}>
        Evolution Design &amp; Drafting · March 2026
      </div>
    </>
  )
}
