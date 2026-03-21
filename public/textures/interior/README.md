# Interior Textures

Drop texture image files here to test real interior design finishes.

## How to wire up a texture

In `src/components/ADUModel.jsx`, the `InteriorFloor` and wall components accept texture maps.

Example (hardwood floor):
```jsx
import { useTexture } from '@react-three/drei'

const floorMap = useTexture('/textures/interior/hardwood-floor.jpg')
<meshStandardMaterial map={floorMap} roughness={0.6} />
```

## Suggested files

| Filename                  | Used for                          |
|---------------------------|-----------------------------------|
| `hardwood-floor.jpg`      | Living area / bedroom floors      |
| `tile-bathroom.jpg`       | Bathroom tile floor               |
| `drywall.jpg`             | Interior wall paint/texture       |
| `kitchen-backsplash.jpg`  | Kitchen backsplash area           |
| `carpet.jpg`              | Optional bedroom carpet           |

## Tips

- Match UV repeat to room scale (e.g., a 4'×4' tile pattern needs repeat set to roomWidth/4)
- Use `roughnessMap` alongside `map` for more realistic results
- Free sources: [Poly Haven](https://polyhaven.com), [ambientCG](https://ambientcg.com)
