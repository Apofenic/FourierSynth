import { HarmonicParam } from "../types/synthControlsTypes";

/**
 * Perform Discrete Fourier Transform to extract harmonic components from a waveform
 *
 * This function analyzes a waveform and extracts the amplitude and phase of each harmonic
 * component using the DFT formula:
 *
 * X[k] = Σ(n=0 to N-1) x[n] * e^(-i*2π*k*n/N)
 *
 * Where:
 * - X[k] is the k-th frequency component
 * - x[n] is the input signal at sample n
 * - N is the total number of samples
 * - k is the harmonic number
 *
 * @param waveform - Input waveform data (Float32Array or number[])
 * @param numHarmonics - Number of harmonic components to extract
 * @returns Array of harmonic parameters with amplitude and phase
 *
 * @example
 * ```typescript
 * const waveform = new Float32Array(2048); // Your waveform data
 * const harmonics = extractHarmonics(waveform, 8);
 * // Returns 8 harmonics with amplitude and phase
 * ```
 */
export function extractHarmonics(
  waveform: Float32Array | number[],
  numHarmonics: number
): HarmonicParam[] {
  const N = waveform.length;
  const harmonics: HarmonicParam[] = [];

  // Extract each harmonic component (k = 1 to numHarmonics)
  for (let k = 1; k <= numHarmonics; k++) {
    let realPart = 0;
    let imagPart = 0;

    // Compute DFT for this harmonic
    // We want to match: A*sin(2π*k*n/N + φ)
    // sin(θ + φ) = sin(θ)cos(φ) + cos(θ)sin(φ)
    // So we need: -imag component for cosine part, real component for sine part
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      // Match synthesis formula: sin(angle + phase)
      // Extract coefficients for sin(angle)*cos(phase) + cos(angle)*sin(phase)
      realPart += waveform[n] * Math.sin(angle); // Coefficient for sin(angle)
      imagPart += waveform[n] * Math.cos(angle); // Coefficient for cos(angle)
    }

    // Normalize by N and multiply by 2 (except DC component)
    realPart = (2 * realPart) / N;
    imagPart = (2 * imagPart) / N;

    // Calculate amplitude and phase
    const amplitude = Math.sqrt(realPart * realPart + imagPart * imagPart);
    // For sin(wt + φ): A*sin(wt + φ) = A*sin(wt)*cos(φ) + A*cos(wt)*sin(φ)
    // realPart = A*cos(φ), imagPart = A*sin(φ)
    // Therefore: φ = atan2(imagPart, realPart)
    const phase = Math.atan2(imagPart, realPart);

    harmonics.push({
      amplitude,
      phase,
    });
  }

  return harmonics;
}

/**
 * Analyze waveform and populate harmonic parameters with normalized values
 *
 * This function ensures that:
 * 1. Harmonics are extracted from the waveform
 * 2. Amplitudes are normalized to prevent clipping
 * 3. Phases are wrapped to [-π, π] range
 *
 * @param waveform - Input waveform data
 * @param numHarmonics - Number of harmonics to extract
 * @returns Normalized harmonic parameters ready for synthesis
 */
export function analyzeWaveformToHarmonics(
  waveform: Float32Array | number[],
  numHarmonics: number
): HarmonicParam[] {
  const harmonics = extractHarmonics(waveform, numHarmonics);

  // Find max amplitude for normalization
  const maxAmplitude = Math.max(...harmonics.map((h) => h.amplitude));

  // Normalize amplitudes if needed (keep within [0, 1] range)
  if (maxAmplitude > 1e-10) {
    harmonics.forEach((harmonic) => {
      harmonic.amplitude = harmonic.amplitude / maxAmplitude;
    });
  }

  // Ensure phases are in [-π, π] range
  harmonics.forEach((harmonic) => {
    while (harmonic.phase > Math.PI) harmonic.phase -= 2 * Math.PI;
    while (harmonic.phase < -Math.PI) harmonic.phase += 2 * Math.PI;
  });

  return harmonics;
}
