/**
 * Integration tests for modulation system
 * Tests real-world scenarios and parameter application
 */

import { act, renderHook } from "@testing-library/react";
import { useModulationStore } from "../stores/useModulationStore";
import { ModulationSource } from "../types";

describe("Modulation System Integration Tests", () => {
  beforeEach(() => {
    // Reset store state before each test
    useModulationStore.setState({
      routes: {},
      sourceValues: {
        [ModulationSource.NONE]: 0,
        [ModulationSource.LFO1]: 0,
        [ModulationSource.LFO2]: 0,
        [ModulationSource.MOD_ENV]: 0,
        [ModulationSource.OSC1]: 0,
        [ModulationSource.OSC2]: 0,
        [ModulationSource.OSC3]: 0,
        [ModulationSource.OSC4]: 0,
      },
      parameters: {},
      activeSources: new Set(),
    });
  });

  describe("LFO Modulating Filter Cutoff", () => {
    it("should modulate filter cutoff with sine LFO", () => {
      const { result } = renderHook(() => useModulationStore());
      const updateFn = jest.fn();

      act(() => {
        // Register filter cutoff (exponential, 20-20000 Hz)
        result.current.registerParameter({
          paramId: "filter_cutoff",
          min: 20,
          max: 20000,
          default: 1000,
          type: "exponential",
          updateFn,
        });

        // Add LFO1 modulation (50% depth, unipolar)
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
      });

      // Simulate LFO at different phases
      const baseValue = 1000;
      const paramRange = 20000 - 20; // 19980
      const testPoints = [
        { phase: "min", value: 0.0, expected: baseValue }, // No modulation at min (unipolar clamps negative to 0)
        { phase: "quarter", value: 0.5, expected: baseValue + (0.5 * 0.5 * paramRange) }, // Mid modulation: 1000 + 4995 = 5995
        { phase: "max", value: 1.0, expected: baseValue + (1.0 * 0.5 * paramRange) }, // Full modulation: 1000 + 9990 = 10990
      ];

      testPoints.forEach(({ phase, value, expected }) => {
        act(() => {
          result.current.updateSourceValue(ModulationSource.LFO1, value);
        });

        const modulated = result.current.getModulatedValue(
          "filter_cutoff",
          baseValue
        );
        expect(modulated).toBeCloseTo(expected, 0);
      });
    });

    it("should handle bipolar LFO modulation (sweeping up and down)", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "filter_cutoff",
          min: 20,
          max: 20000,
          default: 1000,
          type: "exponential",
          updateFn: jest.fn(),
        });

        // Bipolar modulation allows negative values
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          30,
          true
        );
      });

      const baseValue = 1000;

      // Test negative modulation (sweeps down)
      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, -1.0);
      });
      let modulated = result.current.getModulatedValue(
        "filter_cutoff",
        baseValue
      );
      expect(modulated).toBeLessThan(baseValue);

      // Test positive modulation (sweeps up)
      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 1.0);
      });
      modulated = result.current.getModulatedValue("filter_cutoff", baseValue);
      expect(modulated).toBeGreaterThan(baseValue);
    });
  });

  describe("Envelope Modulating Volume", () => {
    it("should apply envelope to oscillator volume (ADSR)", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        // Register oscillator volume (linear, 0-1)
        result.current.registerParameter({
          paramId: "osc1_volume",
          min: 0,
          max: 1,
          default: 0.8,
          type: "linear",
          updateFn: jest.fn(),
        });

        // Full depth envelope modulation
        result.current.addModulationRoute(
          "osc1_volume",
          0,
          ModulationSource.MOD_ENV,
          100,
          false
        );
      });

      const baseValue = 0.8;

      // Simulate ADSR stages
      // Note: Envelope is normalized from 0-1 to -1 to +1
      // For unipolar modulation: only positive normalized values add modulation
      const paramRange = 1.0; // max=1.0, min=0
      const stages = [
        { name: "attack", envValue: 0.5, normalizedEnv: 0.0, expected: 0.8 }, // normalized=0, modAmount=0
        { name: "peak", envValue: 1.0, normalizedEnv: 1.0, expected: 1.0 }, // normalized=1, modAmount=1.0, result clamped to 1.0
        { name: "decay", envValue: 0.7, normalizedEnv: 0.4, expected: 0.8 + (0.4 * 1.0 * paramRange) }, // 0.8 + 0.4 = 1.2, clamped to 1.0
        { name: "sustain", envValue: 0.6, normalizedEnv: 0.2, expected: 0.8 + (0.2 * 1.0 * paramRange) }, // 0.8 + 0.2 = 1.0
        { name: "release", envValue: 0.2, normalizedEnv: -0.6, expected: 0.8 }, // negative, clamped to 0
        { name: "off", envValue: 0.0, normalizedEnv: -1.0, expected: 0.8 }, // negative, clamped to 0
      ];

      stages.forEach(({ name, envValue, normalizedEnv, expected }) => {
        act(() => {
          result.current.updateSourceValue(
            ModulationSource.MOD_ENV,
            normalizedEnv
          );
        });

        const modulated = result.current.getModulatedValue(
          "osc1_volume",
          baseValue
        );
        expect(modulated).toBeCloseTo(Math.min(expected, 1.0), 2);
      });
    });
  });

  describe("Oscillator Cross-Modulation (FM Synthesis)", () => {
    it("should modulate osc2 frequency with osc1 output", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        // Register oscillator 2 frequency
        result.current.registerParameter({
          paramId: "osc2_frequency",
          min: 20,
          max: 20000,
          default: 440,
          type: "exponential",
          updateFn: jest.fn(),
        });

        // Moderate FM depth (20%)
        result.current.addModulationRoute(
          "osc2_frequency",
          0,
          ModulationSource.OSC1,
          20,
          true
        );
      });

      const baseFreq = 440;

      // OSC1 outputs -1 to +1
      act(() => {
        result.current.updateSourceValue(ModulationSource.OSC1, 0.5);
      });

      const modulated = result.current.getModulatedValue(
        "osc2_frequency",
        baseFreq
      );

      // Bipolar 20% depth with source=0.5 and range 19980
      // modAmount = 0.5 * 0.2 * 19980 = 1998
      // Result = 440 + 1998 = 2438
      expect(modulated).toBeCloseTo(2438, 0);
      expect(modulated).toBeGreaterThan(baseFreq);
    });

    it("should handle complex multi-oscillator modulation", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "osc3_frequency",
          min: 20,
          max: 20000,
          default: 330,
          type: "exponential",
          updateFn: jest.fn(),
        });

        // Multiple modulators
        result.current.addModulationRoute(
          "osc3_frequency",
          0,
          ModulationSource.OSC1,
          15,
          true
        );
        result.current.addModulationRoute(
          "osc3_frequency",
          1,
          ModulationSource.OSC2,
          10,
          true
        );
      });

      act(() => {
        result.current.updateSourceValue(ModulationSource.OSC1, 0.7);
        result.current.updateSourceValue(ModulationSource.OSC2, -0.3);
      });

      const modulated = result.current.getModulatedValue(
        "osc3_frequency",
        330
      );

      // Should be modulated by sum of both oscillators
      expect(modulated).not.toBe(330);
    });
  });

  describe("Multiple Modulations on One Parameter", () => {
    it("should combine LFO and envelope on filter cutoff", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "filter_cutoff",
          min: 20,
          max: 20000,
          default: 1000,
          type: "exponential",
          updateFn: jest.fn(),
        });

        // LFO for vibrato
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          30,
          true
        );
        // Envelope for dynamics
        result.current.addModulationRoute(
          "filter_cutoff",
          1,
          ModulationSource.MOD_ENV,
          40,
          false
        );
      });

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 0.5);
        result.current.updateSourceValue(ModulationSource.MOD_ENV, 0.6);
      });

      const modulated = result.current.getModulatedValue(
        "filter_cutoff",
        1000
      );

      // Should be sum of both modulations
      expect(modulated).toBeGreaterThan(1000);
    });

    it("should handle up to 4 simultaneous modulation sources", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "test_param",
          min: 0,
          max: 100,
          default: 50,
          type: "linear",
          updateFn: jest.fn(),
        });

        // Max modulation sources (4 slots)
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          10,
          false
        );
        result.current.addModulationRoute(
          "test_param",
          1,
          ModulationSource.LFO2,
          10,
          false
        );
        result.current.addModulationRoute(
          "test_param",
          2,
          ModulationSource.MOD_ENV,
          10,
          false
        );
        result.current.addModulationRoute(
          "test_param",
          3,
          ModulationSource.OSC1,
          10,
          true
        );
      });

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 1.0);
        result.current.updateSourceValue(ModulationSource.LFO2, 0.5);
        result.current.updateSourceValue(ModulationSource.MOD_ENV, 0.8);
        result.current.updateSourceValue(ModulationSource.OSC1, 0.3);
      });

      const modulated = result.current.getModulatedValue("test_param", 50);

      // All modulations should sum together
      expect(modulated).toBeGreaterThan(50);
      expect(modulated).toBeLessThanOrEqual(100);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle rapid parameter updates efficiently", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "filter_cutoff",
          min: 20,
          max: 20000,
          default: 1000,
          type: "exponential",
          updateFn: jest.fn(),
        });
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
      });

      // Simulate rapid updates (60fps)
      const startTime = performance.now();
      for (let i = 0; i < 60; i++) {
        act(() => {
          result.current.updateSourceValue(
            ModulationSource.LFO1,
            Math.sin((i / 60) * Math.PI * 2)
          );
        });
        result.current.getModulatedValue("filter_cutoff", 1000);
      }
      const duration = performance.now() - startTime;

      // Should complete 60 updates in reasonable time (<50ms)
      expect(duration).toBeLessThan(50);
    });

    it("should handle all sources inactive gracefully", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "test_param",
          min: 0,
          max: 100,
          default: 50,
          type: "linear",
          updateFn: jest.fn(),
        });
      });

      // No routes added, all sources at 0
      const modulated = result.current.getModulatedValue("test_param", 50);
      expect(modulated).toBe(50);
    });

    it("should maintain parameter range integrity under extreme modulation", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "test_param",
          min: 0,
          max: 100,
          default: 50,
          type: "linear",
          updateFn: jest.fn(),
        });

        // Extreme modulation amounts
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          100,
          true
        );
        result.current.addModulationRoute(
          "test_param",
          1,
          ModulationSource.LFO2,
          100,
          true
        );
        result.current.addModulationRoute(
          "test_param",
          2,
          ModulationSource.MOD_ENV,
          100,
          false
        );
      });

      // All sources at maximum
      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 1.0);
        result.current.updateSourceValue(ModulationSource.LFO2, 1.0);
        result.current.updateSourceValue(ModulationSource.MOD_ENV, 1.0);
      });

      const modulated = result.current.getModulatedValue("test_param", 50);

      // Should still be within valid range
      expect(modulated).toBeGreaterThanOrEqual(0);
      expect(modulated).toBeLessThanOrEqual(100);
    });
  });

  describe("Real-World Synthesis Scenarios", () => {
    it("should create classic wobble bass (LFO->Filter)", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "filter_cutoff",
          min: 20,
          max: 20000,
          default: 300,
          type: "exponential",
          updateFn: jest.fn(),
        });

        // Deep LFO modulation for wobble
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          80,
          false
        );
      });

      // Low starting frequency for bass
      const baseValue = 300;
      const samples = [];

      // Simulate one LFO cycle
      for (let i = 0; i < 16; i++) {
        const lfoValue = Math.sin((i / 16) * Math.PI * 2);
        act(() => {
          result.current.updateSourceValue(ModulationSource.LFO1, lfoValue);
        });
        samples.push(
          result.current.getModulatedValue("filter_cutoff", baseValue)
        );
      }

      // Should create substantial frequency variation
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      expect(max - min).toBeGreaterThan(1000); // Significant wobble
      expect(min).toBeGreaterThanOrEqual(20); // Still valid
      expect(max).toBeLessThanOrEqual(20000); // Still valid
    });

    it("should create pluck sound (Envelope->Volume)", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "osc1_volume",
          min: 0,
          max: 1,
          default: 0.8,
          type: "linear",
          updateFn: jest.fn(),
        });

        // Envelope shapes the pluck
        result.current.addModulationRoute(
          "osc1_volume",
          0,
          ModulationSource.MOD_ENV,
          100,
          false
        );
      });

      // Simulate fast attack, fast decay
      const envelopeStages = [
        { env: 0.0, normalized: -1.0 }, // Silent -> negative, unipolar=0
        { env: 1.0, normalized: 1.0 },  // Attack peak -> full mod
        { env: 0.6, normalized: 0.2 },  // Decay -> partial mod
        { env: 0.3, normalized: -0.4 }, // Sustain -> negative, unipolar=0
        { env: 0.1, normalized: -0.8 }, // Release -> negative, unipolar=0
        { env: 0.0, normalized: -1.0 }, // Off -> negative, unipolar=0
      ];

      const volumes = envelopeStages.map(({ env, normalized }) => {
        act(() => {
          result.current.updateSourceValue(
            ModulationSource.MOD_ENV,
            normalized
          );
        });
        return result.current.getModulatedValue("osc1_volume", 0.8);
      });

      // Should show pluck envelope shape
      expect(volumes[0]).toBe(0.8); // Base value (no modulation)
      expect(volumes[1]).toBe(1.0); // Peak (clamped to max)
      expect(volumes[2]).toBeCloseTo(1.0, 2); // Decay (0.8 + 0.2 = 1.0, clamped)
      // Note: stages 3-5 all have negative normalized values, so unipolar clamps them to base (0.8)
      expect(volumes[3]).toBe(0.8);
      expect(volumes[4]).toBe(0.8);
      expect(volumes[5]).toBe(0.8);
    });
  });
});
