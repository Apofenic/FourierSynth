// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: {
      value: 440,
      exponentialRampToValueAtTime: jest.fn(),
    },
    setPeriodicWave: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 0.5,
    },
  })),
  createBiquadFilter: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    type: 'lowpass',
    frequency: {
      value: 2000,
      exponentialRampToValueAtTime: jest.fn(),
    },
    Q: {
      value: 0,
      linearRampToValueAtTime: jest.fn(),
    },
  })),
  createPeriodicWave: jest.fn(() => ({})),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
})) as any;

(global as any).webkitAudioContext = global.AudioContext;

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
})) as any;

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => '');
