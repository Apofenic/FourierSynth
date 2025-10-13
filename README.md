# FourierSynth

A web-based Fourier series synthesizer and visualization tool built with React and TypeScript. FourierSynth demonstrates how complex waveforms can be constructed from simple sine waves using Fourier series, with real-time audio synthesis and visualization.

## Features

- **Interactive Fourier Series Synthesis**: Adjust up to 8 harmonics with amplitude and phase control
- **Real-time Audio Playback**: Web Audio API-based synthesis with 4-pole lowpass filter
- **Waveform Visualization**: Canvas-based real-time waveform display
- **Mathematical Equation Display**: LaTeX-rendered Fourier series equation with fallback
- **Visual Keyboard**: Computer keyboard-to-note mapping with visual feedback
- **Subtractive Synthesis**: Adjustable filter cutoff and resonance controls

## Architecture

FourierSynth uses a modern React architecture with Context API for state management:

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
├── contexts/            # State Management
│   ├── AudioEngineContext.tsx    # Web Audio API state & methods
│   └── SynthControlsContext.tsx  # Synthesis parameters & keyboard state
├── hooks/               # Custom Hooks
│   └── useAudioInitializer.ts    # Audio system initialization
├── types/               # TypeScript Definitions
└── helperFunctions.ts   # Waveform calculation utilities
```

### Context API

- **AudioEngineContext**: Manages Web Audio API nodes, playback state, and real-time parameter updates
- **SynthControlsContext**: Manages harmonics, keyboard state, and waveform data generation

### Key Technologies

- React 18+ with TypeScript
- Web Audio API for synthesis
- Material-UI (MUI) for UI components
- KaTeX for mathematical equation rendering
- Canvas API for waveform visualization

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Apofenic/FourierSynth.git
cd FourierSynth
npm install
```

### Running the App

Start the development server:

```bash
npm start
```

Open [http://localhost:5847](http://localhost:5847) in your browser to use the app.

> **Note:** The app runs on port 5847 by default (configured in `.env`). You can change this by modifying the `PORT` value in your `.env` file.

### Available Scripts

- `npm start` – Run the app in development mode
- `npm test` – Launch the test runner
- `npm run build` – Build the app for production
- `npm run eject` – Eject configuration (not recommended unless necessary)

## License

[MIT](LICENSE)

## Learn More

- [React documentation](https://reactjs.org/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Fourier Transform](https://en.wikipedia.org/wiki/Fourier_transform)
