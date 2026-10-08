import * as THREE from 'three'

function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  return tex
}

// One repeat = 24" × 8": two courses of 12" × 4" tile in running bond
export function makeTileTexture() {
  return canvasTexture(384, 128, (ctx, w, h) => {
    ctx.fillStyle = '#bdbab3'
    ctx.fillRect(0, 0, w, h)
    const g = 3
    const tw = w / 2
    const th = h / 2
    const tile = (x, y) => {
      const shade = 238 + Math.floor(Math.random() * 12)
      ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 6})`
      ctx.fillRect(x + g / 2, y + g / 2, tw - g, th - g)
    }
    for (let i = -1; i < 2; i++) {
      tile(i * tw, 0)
      tile(i * tw + tw / 2, th)
    }
  })
}

export function makeWoodTexture(base) {
  return canvasTexture(512, 64, (ctx, w, h) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * h
      ctx.strokeStyle = `rgba(70,40,15,${0.05 + Math.random() * 0.12})`
      ctx.lineWidth = 0.5 + Math.random() * 1.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 60 + i) * 2)
      ctx.stroke()
    }
  })
}

export function makeFlameTexture() {
  const tex = canvasTexture(512, 256, (ctx, w, h) => {
    const glow = ctx.createLinearGradient(0, h, 0, 0)
    glow.addColorStop(0, 'rgba(255,120,30,0.55)')
    glow.addColorStop(1, 'rgba(255,120,30,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 14; i++) {
      const x = 60 + (i / 13) * (w - 120) + (Math.random() - 0.5) * 20
      const fh = h * (0.45 + Math.random() * 0.45)
      const fw = 26 + Math.random() * 22
      const g = ctx.createRadialGradient(x, h - 10, 4, x, h - fh * 0.4, fh * 0.7)
      g.addColorStop(0, 'rgba(255,240,180,0.95)')
      g.addColorStop(0.35, 'rgba(255,160,50,0.8)')
      g.addColorStop(1, 'rgba(200,50,10,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x - fw, h)
      ctx.quadraticCurveTo(x - fw * 0.6, h - fh * 0.5, x, h - fh)
      ctx.quadraticCurveTo(x + fw * 0.6, h - fh * 0.5, x + fw, h)
      ctx.fill()
    }
    ctx.fillStyle = '#2a2420'
    ctx.fillRect(40, h - 18, w - 80, 18)
  })
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

// One repeat = 7" wide planks, 48" long
export function makeFloorTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const planks = 4
    const pw = w / planks
    for (let p = 0; p < planks; p++) {
      const offset = (p * 0.37 % 1) * h
      for (let k = -1; k < 2; k++) {
        const l = 120 + Math.floor(Math.random() * 30)
        ctx.fillStyle = `rgb(${l + 20},${l - 10},${l - 45})`
        ctx.fillRect(p * pw, offset + k * h, pw, h)
        ctx.fillStyle = 'rgba(40,25,10,0.5)'
        ctx.fillRect(p * pw, offset + k * h, pw, 2)
      }
      ctx.fillStyle = 'rgba(40,25,10,0.45)'
      ctx.fillRect(p * pw, 0, 2, h)
    }
  })
}
