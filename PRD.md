# PRD: Relativistic Space Travel Simulator

## Overview

A browser-based interactive simulator that visualizes and calculates the effects of special relativity on interstellar travel. The user configures a journey between Earth and a target destination (star/planet), sets travel parameters (max speed as a fraction of c, acceleration in g's), and sees real-time calculations of time dilation, length contraction, and fuel requirements — all rendered in a high-fidelity 3D scene using Three.js.

---

## Goals

1. **Educate** — make relativistic effects intuitive through interactive visualization
2. **Accuracy** — use proper relativistic equations (not Newtonian approximations)
3. **Delight** — cinematic 3D rendering that makes the physics tangible
4. **Accessibility** — runs in any modern browser, no install required

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict, no `any`) |
| Build | Vite |
| UI Framework | React 18+ |
| 3D Rendering | Three.js via `@react-three/fiber` + `@react-three/drei` |
| State | React context + hooks (ViewModel pattern per CLAUDE.md) |
| Testing | Vitest + React Testing Library + `@testing-library/react-hooks` |
| Styling | Tailwind CSS |
| Architecture | Dependency injection, interface-based services (per CLAUDE.md) |

---

## Core Concepts

### Journey Model

A symmetric acceleration/deceleration profile:

```
Phase 1: Accelerate at a (g's) from rest until reaching max_speed or midpoint
Phase 2: Coast at max_speed (if midpoint not yet reached)
Phase 3: Decelerate symmetrically at a (g's) to rest at destination
```

If the distance is short enough that the ship never reaches max_speed, the journey is purely accelerate-then-decelerate (no coast phase).

### Physics Engine (Special Relativity)

All calculations use proper relativistic kinematics:

- **Lorentz factor**: `gamma = 1 / sqrt(1 - v^2/c^2)`
- **Length contraction**: `L' = L / gamma` (at max speed)
- **Relativistic acceleration phase**:
  - Proper time (ship): `tau = (c/a) * arcsinh(a * t / c)`
  - Coordinate time (Earth): `t = (c/a) * sinh(a * tau / c)`
  - Distance covered: `d = (c^2/a) * (cosh(a * tau / c) - 1)`
  - Velocity: `v = c * tanh(a * tau / c)`
- **Time dilation** accumulated across all three phases (accel, coast, decel)
- **Fuel calculation** via the relativistic rocket equation:
  - `mass_ratio = exp(delta_v / (I_sp * g0))` for chemical/ion drives
  - For a perfect matter-antimatter drive: `mass_ratio = gamma * (1 + v/c)`
  - Fuel mass derived from 1-tonne payload
  - Cost computed at current antimatter production cost (~$62.5 trillion per gram) and conventional rocket fuel costs for comparison

---

## User Inputs

| Parameter | Control | Default | Range |
|---|---|---|---|
| Distance to target | Slider + numeric input | 4.24 ly (Proxima Centauri) | 0.001 ly – 100,000 ly |
| Max speed | Slider + numeric input | 0.9c | 0.01c – 0.9999c |
| Acceleration | Slider + numeric input | 1g | 0.1g – 10g |
| Preset destinations | Dropdown | Proxima Centauri | See list below |

### Preset Destinations

| Name | Distance (ly) |
|---|---|
| Proxima Centauri | 4.24 |
| Barnard's Star | 5.96 |
| Sirius | 8.6 |
| Vega | 25.0 |
| Polaris | 323 |
| Betelgeuse | 700 |
| Sagittarius A* (galactic center) | 26,000 |
| Andromeda Galaxy | 2,537,000 |

---

## Outputs / Results Panel

All outputs update in real-time as inputs change:

| Output | Description |
|---|---|
| **Earth time** | Total journey time as measured by clocks on Earth |
| **Ship time** | Total journey time as experienced by the traveler |
| **Time saved** | Difference: Earth time minus Ship time |
| **Max Lorentz factor** | gamma at peak velocity |
| **Contracted distance** | Distance as perceived at max speed (L / gamma) |
| **Peak velocity** | Actual max velocity reached (may be less than max_speed if distance is short) |
| **Fuel mass (antimatter)** | Fuel required assuming perfect matter-antimatter annihilation, 1-tonne ship |
| **Fuel cost (antimatter)** | Cost in USD at ~$62.5 trillion/gram |
| **Fuel mass (chemical)** | For comparison: mass needed with conventional rockets (I_sp ~ 450s) |
| **Journey phases** | Breakdown: accel time, coast time, decel time (both frames) |

---

## 3D Visualization (Three.js)

### Scene Layout

The scene shows a top-down / side view of the journey:

1. **Earth** — a textured sphere on the left side of the scene
2. **Target** — a star/planet sphere on the right side
3. **Distance bar (rest frame)** — a labeled bar showing the original distance between Earth and target
4. **Distance bar (contracted)** — a second bar (different color, overlaid or below) showing the length-contracted distance at max speed. This is the key visual: seeing the universe "shrink" as speed increases
5. **Ship** — a small spacecraft model between the two bodies
6. **Starfield** — particle-based background stars for ambiance
7. **Labels** — distance values rendered as text sprites or HTML overlays

### Visual Behaviors

- When the user adjusts **speed**, the contracted distance bar smoothly animates to its new length
- The **ship** can optionally animate along the path (play/pause toggle)
- **Color coding**: rest-frame distance in white/blue, contracted distance in orange/gold
- Camera controls: orbit, zoom, pan (via `OrbitControls`)
- Responsive: scene resizes with viewport

### Rendering Quality

- Anti-aliasing enabled
- Bloom/glow post-processing on stars
- Smooth animations (spring-based or lerped transitions)
- Earth texture map (NASA Blue Marble or similar free asset)
- Star glow/lens flare effect on target star
- Dark space background with subtle nebula or gradient

---

## UI Layout

```
+------------------------------------------------------------------+
|  Header: "Relativistic Space Travel Simulator"                    |
+------------------------------------------------------------------+
|                                                                    |
|                     [ 3D Visualization ]                          |
|                     (Three.js canvas)                             |
|                                                                    |
+------------------------------------------------------------------+
|  Controls Panel              |  Results Panel                     |
|                              |                                    |
|  Destination: [dropdown]     |  Earth time:      14.4 years       |
|  Distance:    [slider] ly    |  Ship time:       3.9 years        |
|  Max speed:   [slider] c     |  Time saved:      10.5 years       |
|  Accel:       [slider] g     |  Lorentz factor:  2.29             |
|                              |  Contracted dist: 1.85 ly          |
|  [Play Animation]            |  Peak velocity:   0.9c             |
|                              |                                    |
|                              |  Fuel (antimatter): 1,230 kg       |
|                              |  Fuel cost:         $$$            |
|                              |  Fuel (chemical):   absurd kg      |
|                              |                                    |
|                              |  Phase breakdown:                  |
|                              |   Accel: 1.2y / 0.8y              |
|                              |   Coast: 12.0y / 2.3y             |
|                              |   Decel: 1.2y / 0.8y              |
+------------------------------------------------------------------+
```

---

## Architecture

### Services (interface-based, per CLAUDE.md)

```
PhysicsService          — all relativistic calculations
  ├── calculateJourney(distance, maxSpeed, acceleration) → JourneyResult
  ├── lorentzFactor(velocity) → number
  ├── contractedDistance(distance, velocity) → number
  └── fuelRequirements(deltaV, payloadMass) → FuelResult

PresetService           — manages destination presets
  └── getPresets() → Preset[]
```

### ViewModels (per CLAUDE.md)

```
useSimulatorViewModel   — owns all input state, calls PhysicsService, exposes results
useVisualizationViewModel — derives 3D scene parameters from journey results
```

### Components

```
App
├── Header
├── Visualization (Three.js canvas)
│   ├── Earth
│   ├── TargetStar
│   ├── DistanceBars (rest + contracted)
│   ├── Spaceship
│   ├── Starfield
│   └── Labels
├── ControlsPanel
│   ├── DestinationDropdown
│   ├── DistanceSlider
│   ├── SpeedSlider
│   └── AccelerationSlider
└── ResultsPanel
    ├── TimeResults
    ├── RelativisticResults
    ├── FuelResults
    └── PhaseBreakdown
```

---

## Acceptance Criteria

### AC-1: Physics Calculations

- [ ] Lorentz factor is correct: at 0.9c, gamma = 2.294 (within 0.1%)
- [ ] Length contraction: at 0.9c over 4.24 ly, contracted distance = 1.848 ly (within 0.1%)
- [ ] Time dilation: ship time is less than Earth time for all v > 0
- [ ] Acceleration phase uses relativistic (not Newtonian) kinematics
- [ ] Journey with short distance correctly omits coast phase
- [ ] Journey with long distance correctly includes coast phase
- [ ] At v approaching c, gamma approaches infinity (no NaN/overflow up to 0.9999c)
- [ ] Fuel mass calculation uses relativistic rocket equation
- [ ] All calculations have unit tests with known analytic solutions

### AC-2: User Inputs

- [ ] Distance adjustable from 0.001 ly to 100,000 ly
- [ ] Max speed adjustable from 0.01c to 0.9999c
- [ ] Acceleration adjustable from 0.1g to 10g
- [ ] Preset dropdown populates distance field and updates all outputs
- [ ] Numeric input and slider are synchronized (change one, other updates)
- [ ] All inputs validate and clamp to valid ranges
- [ ] Changing any input instantly recalculates all outputs

### AC-3: Results Display

- [ ] Earth time, ship time, time saved displayed with appropriate units (years/days/hours)
- [ ] Lorentz factor displayed to 3 decimal places
- [ ] Contracted distance displayed in ly with 3 significant figures
- [ ] Peak velocity displayed as fraction of c
- [ ] Fuel mass displayed with appropriate units (kg/tonnes)
- [ ] Fuel cost displayed in USD with locale-appropriate formatting
- [ ] Phase breakdown shows accel/coast/decel times in both frames
- [ ] Chemical fuel comparison shown (will be astronomical for relativistic speeds — display appropriately)

### AC-4: 3D Visualization

- [ ] Earth and target star rendered as textured/glowing spheres
- [ ] Rest-frame distance bar visible with label
- [ ] Contracted distance bar visible with different color and label
- [ ] Contracted bar animates smoothly when inputs change
- [ ] Starfield background with at least 500 particles
- [ ] Camera supports orbit/zoom/pan via mouse
- [ ] Scene is responsive to window resizing
- [ ] Anti-aliasing enabled
- [ ] Post-processing bloom/glow on stars
- [ ] Renders at 60fps on modern hardware

### AC-5: Architecture & Code Quality

- [ ] All services defined as interfaces with injectable implementations
- [ ] Components use ViewModel hooks, no business logic in JSX
- [ ] All dependencies injected via React context
- [ ] PhysicsService has comprehensive unit tests (>95% branch coverage)
- [ ] ViewModel hooks have unit tests via `renderHook`
- [ ] Integration tests verify input-to-output flow
- [ ] No `any` types; strict TypeScript
- [ ] Tests written before implementation (TDD per CLAUDE.md)

### AC-6: Performance & UX

- [ ] All calculations complete in < 1ms (no perceptible lag)
- [ ] 3D scene initialization < 2 seconds
- [ ] Sliders feel smooth with no stutter
- [ ] Works in Chrome, Firefox, Safari (latest versions)
- [ ] Mobile-responsive layout (controls stack below visualization)

### AC-7: Fuel & Cost Calculations

- [ ] Antimatter fuel assumes perfect matter-antimatter annihilation (exhaust velocity = c)
- [ ] Chemical fuel uses specific impulse of ~450s (LOX/LH2)
- [ ] Payload mass fixed at 1 tonne (1,000 kg)
- [ ] Antimatter cost uses $62.5 trillion per gram as baseline
- [ ] When chemical fuel mass exceeds observable universe mass, display "exceeds observable universe mass" instead of a number
- [ ] Fuel results clearly label assumptions

---

## Out of Scope (v1)

- General relativity / gravitational time dilation
- Multi-leg journeys or return trips
- Realistic trajectory plotting (no orbital mechanics)
- Multiplayer or sharing features
- Backend / persistence
- Sound effects

---

## Open Questions

1. Should we add a "journey animation" mode where the ship flies from Earth to target in real-time-scaled animation?
2. Should fuel types beyond antimatter and chemical (e.g., fusion, ion drive) be included?
3. Should we show a graph of velocity over time for the journey profile?

---

## References

- [Relativistic Rocket (Baez)](https://math.ucr.edu/home/baez/physics/Relativity/SR/Rocket/rocket.html)
- [Wikipedia: Relativistic Rocket](https://en.wikipedia.org/wiki/Relativistic_rocket)
- [NASA Blue Marble textures](https://visibleearth.nasa.gov/collection/1484/blue-marble)
