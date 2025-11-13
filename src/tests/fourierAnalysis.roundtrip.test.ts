import { analyzeWaveformToHarmonics } from "../utils/fourierAnalysis";
import { calculateWaveform } from "../utils/helperFunctions";

describe("Fourier Analysis Round-Trip", () => {
  it("should preserve waveform phase through analysis and resynthesis", () => {
    // Create a simple waveform with known harmonics
    const originalHarmonics = [
      { amplitude: 1.0, phase: 0.0 }, // Fundamental sine
      { amplitude: 0.5, phase: Math.PI / 2 }, // Second harmonic with phase shift
      { amplitude: 0.25, phase: 0.0 }, // Third harmonic
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.0, phase: 0.0 },
    ];

    // Generate waveform from these harmonics
    const originalWaveform = calculateWaveform(originalHarmonics);

    // Extract harmonics from the waveform
    const extractedHarmonics = analyzeWaveformToHarmonics(originalWaveform, 3);

    // Pad to 8 harmonics like the store does
    while (extractedHarmonics.length < 8) {
      extractedHarmonics.push({ amplitude: 0, phase: 0 });
    }

    // Resynthesize waveform from extracted harmonics
    const resynthesizedWaveform = calculateWaveform(extractedHarmonics);

    // Compare a few sample points - they should be very close
    const samplePoints = [0, 512, 1024, 1536];
    samplePoints.forEach((idx) => {
      expect(resynthesizedWaveform[idx]).toBeCloseTo(originalWaveform[idx], 1);
    });

    // Check that the waveforms match at the start (most important for phase)
    expect(resynthesizedWaveform[0]).toBeCloseTo(originalWaveform[0], 1);
    expect(resynthesizedWaveform[1]).toBeCloseTo(originalWaveform[1], 1);
    expect(resynthesizedWaveform[10]).toBeCloseTo(originalWaveform[10], 1);
  });

  it("should not flip phase when switching tabs", () => {
    // Simulate a waveform starting at a positive value (like a sine wave)
    const N = 2048;
    const waveform = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      // sin(2π*x) starts at 0, rises to positive
      waveform[i] = Math.sin((2 * Math.PI * i) / N);
    }

    // Extract harmonics (simulating tab switch)
    const harmonics = analyzeWaveformToHarmonics(waveform, 1);

    // Pad to 8
    while (harmonics.length < 8) {
      harmonics.push({ amplitude: 0, phase: 0 });
    }

    // Resynthesize
    const resynthesized = calculateWaveform(harmonics);

    // Check samples where waveform has clear non-zero values
    // Sample at 1/4 period should be positive (peak)
    const quarter = Math.floor(N / 4);
    expect(resynthesized[quarter]).toBeGreaterThan(0.8);
    expect(waveform[quarter]).toBeGreaterThan(0.8);

    // Sample at 3/4 period should be negative (trough)
    const threeQuarter = Math.floor((3 * N) / 4);
    expect(resynthesized[threeQuarter]).toBeLessThan(-0.8);
    expect(waveform[threeQuarter]).toBeLessThan(-0.8);

    // Peak should occur at similar location (around sample N/4 for sine)
    const originalPeakIdx = waveform.indexOf(Math.max(...Array.from(waveform)));
    const resynthPeakIdx = resynthesized.indexOf(
      Math.max(...Array.from(resynthesized))
    );

    // Peaks should be within 5% of the waveform length from each other
    expect(Math.abs(originalPeakIdx - resynthPeakIdx)).toBeLessThan(N * 0.05);
  });

  it("should handle complex waveforms without phase flip", () => {
    // Create a complex waveform with multiple harmonics
    const originalHarmonics = [
      { amplitude: 0.8, phase: 0.5 },
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.3, phase: -0.5 },
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.15, phase: 1.0 },
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.0, phase: 0.0 },
      { amplitude: 0.0, phase: 0.0 },
    ];

    const originalWaveform = calculateWaveform(originalHarmonics);
    const extractedHarmonics = analyzeWaveformToHarmonics(originalWaveform, 5);

    while (extractedHarmonics.length < 8) {
      extractedHarmonics.push({ amplitude: 0, phase: 0 });
    }

    const resynthesizedWaveform = calculateWaveform(extractedHarmonics);

    // Calculate correlation coefficient to ensure waveforms match
    let sumOriginal = 0;
    let sumResynth = 0;
    let sumProduct = 0;
    let sumOriginalSq = 0;
    let sumResynthSq = 0;

    for (let i = 0; i < originalWaveform.length; i++) {
      sumOriginal += originalWaveform[i];
      sumResynth += resynthesizedWaveform[i];
      sumProduct += originalWaveform[i] * resynthesizedWaveform[i];
      sumOriginalSq += originalWaveform[i] * originalWaveform[i];
      sumResynthSq += resynthesizedWaveform[i] * resynthesizedWaveform[i];
    }

    const n = originalWaveform.length;
    const numerator = n * sumProduct - sumOriginal * sumResynth;
    const denominator = Math.sqrt(
      (n * sumOriginalSq - sumOriginal * sumOriginal) *
        (n * sumResynthSq - sumResynth * sumResynth)
    );

    const correlation = numerator / denominator;

    // Correlation should be very high (close to 1.0) if phases match
    // If phase was flipped, correlation would be close to -1.0
    expect(correlation).toBeGreaterThan(0.95);
  });
});
