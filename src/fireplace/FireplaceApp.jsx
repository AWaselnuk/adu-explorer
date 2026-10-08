import { useState } from 'react'
import Elevation from './Elevation'
import WallScene, { VIEWS } from './WallScene'
import { PRESETS, OPENING, MANTEL_HEIGHT, requiredClearance, fmtIn, fmtFtIn } from './spec'

const DEPTHS = [3, 4.5, 6, 8]

export default function FireplaceApp() {
  const [material, setMaterial] = useState('masonry')
  const [clearance, setClearance] = useState(10)
  const [depth, setDepth] = useState(6)
  const [showArt, setShowArt] = useState(true)
  const [view, setView] = useState('seated')

  const woodMin = requiredClearance('wood', depth)
  const masonryMin = requiredClearance('masonry', depth)
  const min = material === 'wood' ? woodMin : masonryMin
  const ok = clearance >= min - 1e-6
  const underside = OPENING.height + clearance
  const activePreset = PRESETS.find((p) => p.material === material && p.clearance === clearance)

  const applyPreset = (p) => {
    setMaterial(p.material)
    setClearance(p.clearance)
  }

  return (
    <div className="page">
      <header>
        <div>
          <h1>Fireplace Wall</h1>
          <p className="sub">Grandview G800P · 13'1" × 8' wall · drawn at exact scale in inches</p>
        </div>
        <div className={ok ? 'status ok' : 'status bad'}>
          {ok ? 'Meets' : 'Fails'} {material} min of {fmtIn(min)} for a {fmtIn(depth)}-deep mantel
        </div>
      </header>

      <section className="controls">
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.id} className={activePreset?.id === p.id ? 'preset active' : 'preset'} onClick={() => applyPreset(p)}>
              <strong>{p.label}</strong>
              <span>{p.note}</span>
            </button>
          ))}
        </div>

        <aside className="explainer">
          <strong>What the 21" rule misses:</strong> the G800P manual ties the clearance to how far the mantel sticks
          out from the wall. 21" only covers a wood mantel 3" deep or less. The minimum grows to 25½" at 9" deep and
          30" at 15" deep. A 6×6 mantel sticks out 6", so real wood needs about <strong>23¼"</strong>, or 25½" if
          the inspector rounds up to the next row of the chart. A wood-look masonry mantel at 6" deep only needs
          about 7½", so the 10" gap in the drawing already passes.
        </aside>

        <div className="fine">
          <label className="slider">
            <span>Gap above opening: <strong>{fmtIn(clearance)}</strong></span>
            <input type="range" min={4} max={32} step={0.25} value={clearance}
              onChange={(e) => setClearance(Number(e.target.value))} />
          </label>
          <div className="seg" role="group" aria-label="Mantel material">
            {['masonry', 'wood'].map((m) => (
              <button key={m} className={material === m ? 'active' : ''} onClick={() => setMaterial(m)}>
                {m === 'wood' ? 'Real wood' : 'Wood-look masonry'}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Mantel depth">
            {DEPTHS.map((d) => (
              <button key={d} className={depth === d ? 'active' : ''} onClick={() => setDepth(d)}>
                {fmtIn(d)} deep
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={showArt} onChange={(e) => setShowArt(e.target.checked)} />
            Art above mantel
          </label>
        </div>

        <dl className="readout">
          <div><dt>Mantel underside</dt><dd>{fmtFtIn(underside)}</dd></div>
          <div><dt>Mantel top</dt><dd>{fmtFtIn(underside + MANTEL_HEIGHT)}</dd></div>
          <div><dt>Wall left above</dt><dd>{fmtIn(96 - underside - MANTEL_HEIGHT)}</dd></div>
          <div><dt>Wood min</dt><dd>{fmtIn(woodMin)}</dd></div>
          <div><dt>Masonry min</dt><dd>{fmtIn(masonryMin)}</dd></div>
        </dl>
      </section>

      <main>
        <figure className="panel">
          <figcaption>Elevation <span>dashed outline = your 10" drawing</span></figcaption>
          <Elevation clearance={clearance} material={material} woodMin={woodMin} masonryMin={masonryMin} showArt={showArt} />
        </figure>
        <figure className="panel">
          <figcaption>
            Perspective
            <span className="views">
              {Object.entries(VIEWS).map(([id, v]) => (
                <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>{v.label}</button>
              ))}
            </span>
          </figcaption>
          <div className="canvas-wrap">
            <WallScene clearance={clearance} depth={depth} material={material} showArt={showArt} view={view} />
          </div>
        </figure>
      </main>

      <footer>
        <p>
          <strong>Assumptions.</strong> The fireplace is centred in the 10' bump-out, and the glass opening sits on the floor.
          The shelf heights, art size, sofa and person are placeholders for scale. The vault rises from the wall face to 11' at mid-room.
          Clearances are interpolated linearly between rows of the G800P chart, following the slope its diagram shows.
        </p>
      </footer>
    </div>
  )
}
