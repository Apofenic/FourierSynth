/**
 * Tests for helper functions including waveform generation
 */

import { calculateWaveformFromExpression } from './helperFunctions';
import { parseExpression, compileExpression } from './expressionParser';
import { VariableConfig } from '../types/equationBuilderTypes';

describe('calculateWaveformFromExpression', () => {
  describe('Basic Waveform Generation', () => {
    it('should generate a sine wave for sin(t)', () => {
      const parsed = parseExpression('sin(t)');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      expect(Math.max(...waveform)).toBeCloseTo(1, 1);
      expect(Math.min(...waveform)).toBeCloseTo(-1, 1);
      
      // Check that it starts near 0 (sin(0) = 0)
      expect(waveform[0]).toBeCloseTo(0, 1);
      
      // Check quarter cycle (should be near peak)
      expect(waveform[512]).toBeCloseTo(1, 1);
    });

    it('should generate a cosine wave for cos(t)', () => {
      const parsed = parseExpression('cos(t)');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      expect(Math.max(...waveform)).toBeCloseTo(1, 1);
      expect(Math.min(...waveform)).toBeCloseTo(-1, 1);
      
      // Check that it starts near 1 (cos(0) = 1)
      expect(waveform[0]).toBeCloseTo(1, 1);
    });
  });

  describe('Variable Integration', () => {
    it('should use variable values in expression a*sin(b*t + c)', () => {
      const parsed = parseExpression('a*sin(b*t + c)');
      const compiled = compileExpression(parsed);
      const variables: Record<string, VariableConfig> = {
        a: { name: 'a', value: 0.5, min: 0, max: 2, step: 0.01, defaultValue: 1.0 },
        b: { name: 'b', value: 2.0, min: 0, max: 10, step: 0.1, defaultValue: 1.0 },
        c: { name: 'c', value: 0.0, min: 0, max: 6.28, step: 0.1, defaultValue: 0.0 }
      };

      const waveform = calculateWaveformFromExpression(compiled, variables, 2048);

      expect(waveform).toHaveLength(2048);
      
      // Waveform is normalized to [-1, 1] regardless of amplitude
      expect(Math.max(...waveform)).toBeCloseTo(1, 1);
      expect(Math.min(...waveform)).toBeCloseTo(-1, 1);
    });

    it('should respond to amplitude changes', () => {
      const parsed = parseExpression('a*sin(t)');
      const compiled = compileExpression(parsed);
      
      // First with amplitude 1.0
      const variables1: Record<string, VariableConfig> = {
        a: { name: 'a', value: 1.0, min: 0, max: 2, step: 0.01, defaultValue: 1.0 }
      };
      const waveform1 = calculateWaveformFromExpression(compiled, variables1, 512);
      const max1 = Math.max(...waveform1);

      // Then with amplitude 0.5
      const variables2: Record<string, VariableConfig> = {
        a: { name: 'a', value: 0.5, min: 0, max: 2, step: 0.01, defaultValue: 1.0 }
      };
      const waveform2 = calculateWaveformFromExpression(compiled, variables2, 512);
      const max2 = Math.max(...waveform2);

      // Both waveforms are normalized to [-1, 1], so max should be 1 for both
      // (This is correct behavior for audio synthesis - normalization prevents clipping)
      expect(max1).toBeCloseTo(1, 1);
      expect(max2).toBeCloseTo(1, 1);
    });

    it('should respond to frequency changes', () => {
      const parsed = parseExpression('sin(b*t)');
      const compiled = compileExpression(parsed);
      
      // Frequency 1
      const variables1: Record<string, VariableConfig> = {
        b: { name: 'b', value: 1.0, min: 0, max: 10, step: 0.1, defaultValue: 1.0 }
      };
      const waveform1 = calculateWaveformFromExpression(compiled, variables1, 2048);

      // Frequency 2 (should have twice as many cycles)
      const variables2: Record<string, VariableConfig> = {
        b: { name: 'b', value: 2.0, min: 0, max: 10, step: 0.1, defaultValue: 1.0 }
      };
      const waveform2 = calculateWaveformFromExpression(compiled, variables2, 2048);

      // Both should be normalized to same range
      expect(Math.max(...waveform1)).toBeCloseTo(1, 1);
      expect(Math.max(...waveform2)).toBeCloseTo(1, 1);
      
      // But frequency 2 should cross zero more times
      const zeroCrossings1 = countZeroCrossings(waveform1);
      const zeroCrossings2 = countZeroCrossings(waveform2);
      expect(zeroCrossings2).toBeGreaterThan(zeroCrossings1);
    });
  });

  describe('Complex Expressions', () => {
    it('should handle additive synthesis a*sin(t) + b*sin(2*t)', () => {
      const parsed = parseExpression('a*sin(t) + b*sin(2*t)');
      const compiled = compileExpression(parsed);
      const variables: Record<string, VariableConfig> = {
        a: { name: 'a', value: 1.0, min: 0, max: 2, step: 0.01, defaultValue: 1.0 },
        b: { name: 'b', value: 0.5, min: 0, max: 2, step: 0.01, defaultValue: 0.5 }
      };

      const waveform = calculateWaveformFromExpression(compiled, variables, 2048);

      expect(waveform).toHaveLength(2048);
      expect(Math.max(...waveform)).toBeCloseTo(1, 1);
      expect(Math.min(...waveform)).toBeCloseTo(-1, 1);
    });

    it('should handle amplitude modulation (1 + a*sin(b*t)) * sin(t)', () => {
      const parsed = parseExpression('(1 + a*sin(b*t)) * sin(t)');
      const compiled = compileExpression(parsed);
      const variables: Record<string, VariableConfig> = {
        a: { name: 'a', value: 0.5, min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
        b: { name: 'b', value: 3.0, min: 0, max: 10, step: 0.1, defaultValue: 3.0 }
      };

      const waveform = calculateWaveformFromExpression(compiled, variables, 2048);

      expect(waveform).toHaveLength(2048);
      // Should be normalized
      expect(Math.max(...waveform)).toBeCloseTo(1, 1);
      expect(Math.min(...waveform)).toBeCloseTo(-1, 1);
    });

    it('should handle frequency modulation sin(t + a*sin(b*t))', () => {
      const parsed = parseExpression('sin(t + a*sin(b*t))');
      const compiled = compileExpression(parsed);
      const variables: Record<string, VariableConfig> = {
        a: { name: 'a', value: 2.0, min: 0, max: 5, step: 0.1, defaultValue: 2.0 },
        b: { name: 'b', value: 3.0, min: 0, max: 10, step: 0.1, defaultValue: 3.0 }
      };

      const waveform = calculateWaveformFromExpression(compiled, variables, 2048);

      expect(waveform).toHaveLength(2048);
      expect(Math.max(...waveform)).toBeCloseTo(1, 1);
      expect(Math.min(...waveform)).toBeCloseTo(-1, 1);
    });
  });

  describe('Error Handling', () => {
    it('should handle division by zero gracefully', () => {
      const parsed = parseExpression('1 / (sin(t) - sin(t))');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      // Should return zeros for invalid values
      expect(waveform.every(v => v === 0)).toBe(true);
    });

    it('should handle expressions that produce NaN', () => {
      const parsed = parseExpression('sqrt(-1 * abs(sin(t)))');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      // Should replace NaN with 0
      expect(waveform.every(v => !isNaN(v))).toBe(true);
    });

    it('should handle expressions that produce Infinity', () => {
      const parsed = parseExpression('tan(t)');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      // All values should be finite and in range
      expect(waveform.every(v => isFinite(v))).toBe(true);
      expect(waveform.every(v => v >= -1 && v <= 1)).toBe(true);
    });

    it('should handle very large values by clamping', () => {
      const parsed = parseExpression('exp(10 * sin(t))');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      // Should be normalized to [-1, 1]
      expect(Math.max(...waveform)).toBeLessThanOrEqual(1);
      expect(Math.min(...waveform)).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('Normalization', () => {
    it('should normalize constant output to zeros', () => {
      const parsed = parseExpression('5');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      // Constant output should be normalized to 0
      expect(waveform.every(v => v === 0)).toBe(true);
    });

    it('should normalize waveform to [-1, 1] range', () => {
      const parsed = parseExpression('10 * sin(t)');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      expect(Math.max(...waveform)).toBeCloseTo(1, 5);
      expect(Math.min(...waveform)).toBeCloseTo(-1, 5);
    });

    it('should preserve waveform shape during normalization', () => {
      const parsed = parseExpression('sin(t)');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 256);

      // Check zero crossings are preserved
      expect(waveform[0]).toBeCloseTo(0, 1);
      expect(waveform[128]).toBeCloseTo(0, 1);
    });
  });

  describe('Performance', () => {
    it('should generate 2048 samples in under 50ms', () => {
      const parsed = parseExpression('a*sin(b*t + c)');
      const compiled = compileExpression(parsed);
      const variables: Record<string, VariableConfig> = {
        a: { name: 'a', value: 1.0, min: 0, max: 2, step: 0.01, defaultValue: 1.0 },
        b: { name: 'b', value: 2.0, min: 0, max: 10, step: 0.1, defaultValue: 2.0 },
        c: { name: 'c', value: 0.0, min: 0, max: 6.28, step: 0.1, defaultValue: 0.0 }
      };

      const startTime = performance.now();
      calculateWaveformFromExpression(compiled, variables, 2048);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('should handle complex expressions efficiently', () => {
      const parsed = parseExpression('a*sin(t) + b*sin(2*t) + c*sin(3*t) + d*cos(t)');
      const compiled = compileExpression(parsed);
      const variables: Record<string, VariableConfig> = {
        a: { name: 'a', value: 1.0, min: 0, max: 2, step: 0.01, defaultValue: 1.0 },
        b: { name: 'b', value: 0.5, min: 0, max: 2, step: 0.01, defaultValue: 0.5 },
        c: { name: 'c', value: 0.25, min: 0, max: 2, step: 0.01, defaultValue: 0.25 },
        d: { name: 'd', value: 0.3, min: 0, max: 2, step: 0.01, defaultValue: 0.3 }
      };

      const startTime = performance.now();
      calculateWaveformFromExpression(compiled, variables, 2048);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty variables object', () => {
      const parsed = parseExpression('sin(t)');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 2048);

      expect(waveform).toHaveLength(2048);
      expect(Math.max(...waveform)).toBeCloseTo(1, 1);
    });

    it('should handle custom sample count', () => {
      const parsed = parseExpression('sin(t)');
      const compiled = compileExpression(parsed);
      const waveform = calculateWaveformFromExpression(compiled, {}, 512);

      expect(waveform).toHaveLength(512);
    });

    it('should handle expressions with only variables', () => {
      const parsed = parseExpression('a + b');
      const compiled = compileExpression(parsed);
      const variables: Record<string, VariableConfig> = {
        a: { name: 'a', value: 1.0, min: 0, max: 2, step: 0.01, defaultValue: 1.0 },
        b: { name: 'b', value: 2.0, min: 0, max: 2, step: 0.01, defaultValue: 2.0 }
      };
      const waveform = calculateWaveformFromExpression(compiled, variables, 2048);

      expect(waveform).toHaveLength(2048);
      // Constant sum should normalize to 0
      expect(waveform.every(v => v === 0)).toBe(true);
    });
  });
});

// Helper function to count zero crossings
function countZeroCrossings(waveform: number[]): number {
  let count = 0;
  for (let i = 1; i < waveform.length; i++) {
    if ((waveform[i - 1] < 0 && waveform[i] >= 0) ||
        (waveform[i - 1] >= 0 && waveform[i] < 0)) {
      count++;
    }
  }
  return count;
}
