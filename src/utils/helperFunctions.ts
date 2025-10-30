import { CompiledFunction, VariableConfig } from '../types/equationBuilderTypes';

interface HarmonicParam {
  amplitude: number;
  phase: number;
}

export const calculateWaveform = (harmonics:HarmonicParam[]) => {
    const newWaveform = new Float32Array(2048);
    const TWO_PI = Math.PI * 2;
    for (let i = 0; i < newWaveform.length; i++) {
      const x = i / newWaveform.length;
      let value = 0;
      // Sum up the harmonic components using Fourier series
      harmonics.forEach((harmonic, idx) => {
        const harmonicNumber = idx + 1;
        value +=
          harmonic.amplitude *
          Math.sin(TWO_PI * harmonicNumber * x + harmonic.phase);
      });
      // Normalize to the range [-1, 1]
      newWaveform[i] = value;
    }
    // No automatic normalization - let the caller decide
    // This allows amplitude changes to be visible in the visualizer
    return newWaveform;
};

export const generateFullEquation = (harmonics: HarmonicParam[]) => {
    const activeHarmonics = harmonics.filter((h) => h.amplitude > 0.001);
    if (activeHarmonics.length === 0) {
      return "f(t) = 0";
    }
    let generalForm = `f(t) = \\sum_{n=1}^{${harmonics.length}} A_n \\sin(n\\omega t + \\phi_n)`;
    generalForm += "\n\nWhere:";
    activeHarmonics.forEach((harmonic, idx) => {
      const n = idx + 1;
      const amplitude = harmonic.amplitude.toFixed(2);
      const phaseInPi = (harmonic.phase / Math.PI).toFixed(2);
      const phaseSign = harmonic.phase >= 0 ? "+" : "";
      generalForm += `\nA_${n} = ${amplitude}, \\phi_${n} = ${phaseSign}${phaseInPi}\\pi`;
    });
    return generalForm;
  };

export const generateFourierEquation = (harmonics:HarmonicParam[]) => {
    const activeHarmonics = harmonics.filter((h) => h.amplitude > 0.001);
    if (activeHarmonics.length === 0) {
      return "f(t) = 0";
    }
    return `f(t) = \\sum_{n=1}^{${harmonics.length}} A_n \\sin(n\\omega t + \\phi_n)`;
  };

/**
 * Calculate waveform from a compiled expression and variables
 * 
 * Evaluates a custom mathematical expression over a time range [0, 2π]
 * to generate waveform data for audio synthesis and visualization.
 * 
 * @param compiledFunction - Pre-compiled function from math.js
 * @param variables - Map of variable configurations with current values
 * @param sampleCount - Number of samples to generate (default: 2048)
 * @returns Array of normalized waveform values in range [-1, 1]
 * 
 * @example
 * ```typescript
 * const compiled = compileExpression(parseExpression('a*sin(b*t + c)'));
 * const variables = {
 *   a: { name: 'a', value: 1.0, min: 0, max: 2, step: 0.01, defaultValue: 1.0 },
 *   b: { name: 'b', value: 2.0, min: 0, max: 10, step: 0.1, defaultValue: 2.0 },
 *   c: { name: 'c', value: 0.0, min: 0, max: 6.28, step: 0.1, defaultValue: 0.0 }
 * };
 * const waveform = calculateWaveformFromExpression(compiled, variables, 2048);
 * ```
 */
export const calculateWaveformFromExpression = (
  compiledFunction: CompiledFunction,
  variables: Record<string, VariableConfig>,
  sampleCount: number = 2048
): number[] => {
  // Initialize output array with typed array for better performance
  const output = new Float32Array(sampleCount);
  const TWO_PI = Math.PI * 2;
  
  // Pre-extract variable values to avoid object property lookup in hot loop
  const scope: Record<string, number> = {};
  for (const varName in variables) {
    scope[varName] = variables[varName].value;
  }
  
  // Get summation bounds (default to 1,1 for no summation)
  const nValue = scope.n ?? 1;
  const startValue = 1;
  
  // Track min/max for normalization
  let minValue = Infinity;
  let maxValue = -Infinity;
  
  // Generate waveform samples over time range [0, 2π]
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    // Calculate time value
    const t = (sampleIndex / sampleCount) * TWO_PI;
    scope.t = t;
    
    try {
      // Evaluate summation: sum from i=1 to n
      let sumValue = 0;
      for (let i = startValue; i <= nValue; i++) {
        scope.i = i;
        const termValue = compiledFunction(scope);
        
        // Handle edge cases for each term
        if (isFinite(termValue)) {
          sumValue += termValue;
        }
      }
      
      // Handle edge cases for final sum
      let value = sumValue;
      if (!isFinite(value)) {
        value = 0;
      } else {
        // Clamp very large values to prevent audio artifacts
        value = Math.max(-1000, Math.min(1000, value));
      }
      
      output[sampleIndex] = value;
      
      // Track range for normalization
      if (value < minValue) minValue = value;
      if (value > maxValue) maxValue = value;
    } catch (error) {
      // On evaluation error, use silent sample
      output[sampleIndex] = 0;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Expression evaluation error at sample ${sampleIndex}:`, error);
      }
    }
  }
  
  // Normalize to [-1, 1] range
  const range = maxValue - minValue;
  
  if (range < 1e-10) {
    // Constant output or all zeros - return zeros
    return new Array(sampleCount).fill(0);
  }
  
  // Scale to [-1, 1] preserving waveform shape
  const normalizedOutput = new Array(sampleCount);
  const center = (maxValue + minValue) / 2;
  const scale = 2 / range;
  
  for (let i = 0; i < sampleCount; i++) {
    normalizedOutput[i] = (output[i] - center) * scale;
    // Final clamp to ensure strict [-1, 1] bounds
    normalizedOutput[i] = Math.max(-1, Math.min(1, normalizedOutput[i]));
  }
  
  return normalizedOutput;
};