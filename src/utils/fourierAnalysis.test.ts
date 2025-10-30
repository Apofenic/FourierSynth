import {
  extractHarmonics,
  analyzeWaveformToHarmonics,
} from "./fourierAnalysis";

describe("Fourier Analysis", () => {
  describe("extractHarmonics", () => {
    it("should extract fundamental frequency from a pure sine wave", () => {
      // Generate a pure sine wave at fundamental frequency
      const N = 2048;
      const waveform = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        waveform[i] = Math.sin((2 * Math.PI * i) / N);
      }

      const harmonics = extractHarmonics(waveform, 4);

      // First harmonic should have amplitude ~1
      expect(harmonics[0].amplitude).toBeGreaterThan(0.9);
      expect(harmonics[0].amplitude).toBeLessThan(1.1);

      // Higher harmonics should be near zero
      expect(harmonics[1].amplitude).toBeLessThan(0.1);
      expect(harmonics[2].amplitude).toBeLessThan(0.1);
      expect(harmonics[3].amplitude).toBeLessThan(0.1);
    });

    it("should extract multiple harmonics from a complex waveform", () => {
      // Generate a waveform with 1st and 3rd harmonics
      const N = 2048;
      const waveform = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const fundamental = 0.8 * Math.sin((2 * Math.PI * i) / N);
        const third = 0.3 * Math.sin((6 * Math.PI * i) / N);
        waveform[i] = fundamental + third;
      }

      const harmonics = extractHarmonics(waveform, 4);

      // First harmonic should be strong
      expect(harmonics[0].amplitude).toBeGreaterThan(0.7);

      // Second harmonic should be weak
      expect(harmonics[1].amplitude).toBeLessThan(0.1);

      // Third harmonic should be present
      expect(harmonics[2].amplitude).toBeGreaterThan(0.2);

      // Fourth harmonic should be weak
      expect(harmonics[3].amplitude).toBeLessThan(0.1);
    });

    it("should return correct number of harmonics", () => {
      const waveform = new Float32Array(2048).fill(0);

      const harmonics3 = extractHarmonics(waveform, 3);
      expect(harmonics3.length).toBe(3);

      const harmonics8 = extractHarmonics(waveform, 8);
      expect(harmonics8.length).toBe(8);
    });
  });

  describe("analyzeWaveformToHarmonics", () => {
    it("should normalize amplitudes to [0, 1] range", () => {
      // Generate a waveform with large amplitude
      const N = 2048;
      const waveform = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        waveform[i] = 10 * Math.sin((2 * Math.PI * i) / N); // Amplitude = 10
      }

      const harmonics = analyzeWaveformToHarmonics(waveform, 4);

      // All amplitudes should be in [0, 1] range
      harmonics.forEach((h) => {
        expect(h.amplitude).toBeGreaterThanOrEqual(0);
        expect(h.amplitude).toBeLessThanOrEqual(1);
      });

      // First harmonic should be normalized to 1
      expect(harmonics[0].amplitude).toBeCloseTo(1, 1);
    });

    it("should wrap phases to [-π, π] range", () => {
      const N = 2048;
      const waveform = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        waveform[i] = Math.sin((2 * Math.PI * i) / N);
      }

      const harmonics = analyzeWaveformToHarmonics(waveform, 4);

      // All phases should be in [-π, π] range
      harmonics.forEach((h) => {
        expect(h.phase).toBeGreaterThanOrEqual(-Math.PI);
        expect(h.phase).toBeLessThanOrEqual(Math.PI);
      });
    });

    it("should return HarmonicParam objects with amplitude and phase", () => {
      const waveform = new Float32Array(2048);
      for (let i = 0; i < 2048; i++) {
        waveform[i] = Math.sin((2 * Math.PI * i) / 2048);
      }

      const harmonics = analyzeWaveformToHarmonics(waveform, 3);

      expect(harmonics).toHaveLength(3);
      harmonics.forEach((h) => {
        expect(h).toHaveProperty("amplitude");
        expect(h).toHaveProperty("phase");
        expect(typeof h.amplitude).toBe("number");
        expect(typeof h.phase).toBe("number");
      });
    });

    it("should handle zero/silent waveforms gracefully", () => {
      const waveform = new Float32Array(2048).fill(0);

      const harmonics = analyzeWaveformToHarmonics(waveform, 4);

      // Should return harmonics with zero amplitude
      harmonics.forEach((h) => {
        expect(h.amplitude).toBe(0);
      });
    });
  });
});
