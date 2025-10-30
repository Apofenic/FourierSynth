# FourierSynth

A web-based Fourier series synthesizer and visualization tool built with React, TypeScript, and Zustand. FourierSynth demonstrates how complex waveforms can be constructed from simple sine waves using Fourier series, with real-time audio synthesis and visualization. The application leverages Zustand for efficient state management, ensuring smooth interactions and performance.

## Features

- **Customizable Fourier Series**: Adjust up to 8 harmonics with precise amplitude and phase controls.
- **Real-time Audio Synthesis**: Generate and play waveforms using the Web Audio API with low-latency performance.
- **Dynamic Waveform Visualization**: Real-time canvas rendering of waveforms, updated with every user interaction.
- **Equation Builder**: Create and visualize mathematical equations that define waveforms, with LaTeX rendering support.
- **Interactive Keyboard**: Play notes using a virtual keyboard with visual feedback and customizable key mappings.
- **Advanced Synthesis Controls**: Fine-tune waveforms with adjustable filter cutoff, resonance, and waveform blending.
- **State Management with Zustand**: Efficient and scalable state handling for harmonics, equations, and audio parameters.
- **Performance Optimization**: Minimized re-renders and optimized rendering pipeline for smooth user experience.
- **Modular Design**: Extensible architecture for adding new synthesis features and visualizations.

## Architecture

FourierSynth uses a modern React architecture with Zustand for state management:

### Project Structure

```text
src/
├── components/          # UI Components
│   ├── EquationDisplay.tsx       # LaTeX equation renderer
│   ├── PlainTextEquation.tsx     # Text fallback equation
│   ├── WaveformVisualizer.tsx    # Canvas waveform display
│   ├── HarmonicsControl.tsx      # Harmonic amplitude/phase sliders
│   ├── SubtractiveControls.tsx   # Filter cutoff/resonance controls
│   └── KeyboardControls.tsx      # Musical keyboard interface
├── stores/              # Zustand Stores
│   ├── useAudioEngineStore.ts    # Web Audio API state & methods
│   ├── useSynthControlsStore.ts  # Synthesis parameters & keyboard state
│   └── useEquationBuilderStore.ts # Equation builder state
├── hooks/               # Custom Hooks
│   └── useAudioInitializer.ts    # Audio system initialization
├── types/               # TypeScript Definitions
└── helperFunctions.ts   # Waveform calculation utilities
```

### Zustand State Management

- **useAudioEngineStore**: Manages Web Audio API nodes, playback state, and real-time parameter updates
- **useSynthControlsStore**: Manages harmonics, keyboard state, and waveform data generation
- **useEquationBuilderStore**: Handles equation parsing, validation, and waveform synthesis

### Key Technologies

- React 18+ with TypeScript
- Zustand for state management
- Web Audio API for synthesis
- Material-UI (MUI) for UI components
- KaTeX for mathematical equation rendering
- Canvas API for waveform visualization

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer recommended)
- [Yarn](https://yarnpkg.com/) (v1.22+ recommended)

> **Note:** This project uses Yarn exclusively. npm commands will not work due to the `packageManager` field in `package.json`. If you don't have Yarn installed, run: `npm install -g yarn`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Apofenic/FourierSynth.git
cd FourierSynth
yarn install
```

### Running the App

Start the development server:

```bash
yarn start
```

Open [http://localhost:5847](http://localhost:5847) in your browser to use the app.

> **Note:** The app runs on port 5847 by default (configured in `.env`). You can change this by modifying the `PORT` value in your `.env` file.

### Available Scripts

- `yarn start` – Run the app in development mode
- `yarn test` – Launch the test runner
- `yarn build` – Build the app for production
- `yarn eject` – Eject configuration (not recommended unless necessary)
- `yarn format` – Format code with Prettier
- `yarn format:check` – Check code formatting

## License

[MIT](LICENSE)

## Learn More

- [React documentation](https://reactjs.org/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Fourier Transform](https://en.wikipedia.org/wiki/Fourier_transform)
