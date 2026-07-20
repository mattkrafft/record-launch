# Record Launch

Record Launch is a browser-based 2D physics puzzle prototype. Spin a record, control its speed, and use the transition from static to kinetic friction to launch objects into matching baskets.

## Play the prototype

The current playable build is available at:

**https://record-launch.mattkrafft.chatgpt.site**

No installation is required to play the hosted version.

## Current features

- Top-down rotating record
- Custom stick/slip friction model
- Adjustable speed from 0 to 120 RPM
- Spin, brake, and reset controls
- Curved object trajectory
- Timed level with gold, silver, and bronze targets
- Best time saved in browser storage
- Speed-responsive synthesized beat
- Responsive desktop and mobile layout

## How to play

1. Press **Spin** or raise the RPM slider.
2. Increase the speed until the cyan puck overcomes static friction and begins to slide.
3. Use **Brake** or adjust the RPM to curve the puck toward the cyan basket.
4. Complete the level as quickly as possible.

## Run the source locally

### Requirements

- Node.js 22.13 or newer
- npm

### Setup

```bash
git clone https://github.com/mattkrafft/record-launch.git
cd record-launch
npm install
npm run dev
```

Open the local address printed by the development server, normally `http://localhost:5173`.

You can also download the repository as a ZIP from GitHub, extract it, and run `npm install` followed by `npm run dev` inside the extracted folder.

## Testing without installing software

Use the hosted prototype link above. GitHub stores the source and its history, but the repository page does not execute the game itself.

## Physics model

The prototype explicitly models static and kinetic friction between the puck and rotating record. While the puck sticks, friction supplies the acceleration needed to follow the record. Once the required friction exceeds the static-friction limit, the puck begins sliding and kinetic friction acts opposite its velocity relative to the record surface.

## Status

Early playable prototype. Visuals, physics parameters, music, level design, and scoring are expected to change during development.
