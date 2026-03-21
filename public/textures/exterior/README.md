# Exterior Textures

Drop texture image files here to override the default solid colors on the exterior of the house.

## How to wire up a texture

In `src/components/ADUModel.jsx`, update the `MAT` object or pass a `TextureLoader` map to any `meshStandardMaterial`.

Example:
```jsx
import { useTexture } from '@react-three/drei'

const sidingMap = useTexture('/textures/exterior/siding.jpg')
<meshStandardMaterial map={sidingMap} roughness={0.85} />
```

## Suggested files

| Filename              | Used for                        |
|-----------------------|---------------------------------|
| `siding.jpg`          | Horizontal vinyl/wood siding    |
| `siding-normal.jpg`   | Normal map for siding depth     |
| `roof-shingles.jpg`   | Asphalt shingle texture         |
| `concrete.jpg`        | Foundation & steps              |
| `trim.jpg`            | Window/door trim                |

## Tips

- Tileable textures work best (seamlessly repeatable)
- 1024×1024 or 2048×2048 PNG/JPG
- Pair with a matching normal map for extra realism
- Free sources: [Poly Haven](https://polyhaven.com), [ambientCG](https://ambientcg.com)
