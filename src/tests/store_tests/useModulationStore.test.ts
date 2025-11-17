/**
 * Unit tests for modulation store
 * Tests modulation calculation, routing, and parameter registration
 */

import { act, renderHook } from "@testing-library/react";
import { useModulationStore } from "../../stores/useModulationStore";
import { ModulationSource } from "../../types";

describe("useModulationStore", () => {
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

  describe("Parameter Registration", () => {
    it("should register a parameter with metadata", () => {
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
      });

      const params = result.current.parameters;
      expect(params["filter_cutoff"]).toBeDefined();
      expect(params["filter_cutoff"].min).toBe(20);
      expect(params["filter_cutoff"].max).toBe(20000);
      expect(params["filter_cutoff"].type).toBe("exponential");
    });

    it("should register multiple parameters", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.registerParameter({
          paramId: "osc1_volume",
          min: 0,
          max: 1,
          default: 1,
          type: "linear",
          updateFn: jest.fn(),
        });
        result.current.registerParameter({
          paramId: "osc1_frequency",
          min: 20,
          max: 20000,
          default: 220,
          type: "exponential",
          updateFn: jest.fn(),
        });
      });

      const params = result.current.parameters;
      expect(Object.keys(params)).toHaveLength(2);
      expect(params["osc1_volume"]).toBeDefined();
      expect(params["osc1_frequency"]).toBeDefined();
    });
  });

  describe("Modulation Routing", () => {
    it("should add a modulation route", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
      });

      const routes = result.current.routes["filter_cutoff"];
      expect(routes).toBeDefined();
      expect(routes).toHaveLength(1);
      expect(routes[0].source).toBe(ModulationSource.LFO1);
      expect(routes[0].amount).toBe(50);
      expect(routes[0].bipolar).toBe(false);
    });

    it("should update active sources when route added", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
      });

      const activeSources = result.current.getActiveSources();
      expect(activeSources.has(ModulationSource.LFO1)).toBe(true);
    });

    it("should allow multiple routes to same parameter", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
        result.current.addModulationRoute(
          "filter_cutoff",
          1,
          ModulationSource.MOD_ENV,
          30,
          true
        );
      });

      const routes = result.current.routes["filter_cutoff"];
      expect(routes).toHaveLength(2);
      expect(routes[0].source).toBe(ModulationSource.LFO1);
      expect(routes[1].source).toBe(ModulationSource.MOD_ENV);
    });

    it("should replace existing route in same slot", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO2,
          75,
          true
        );
      });

      const routes = result.current.routes["filter_cutoff"];
      expect(routes).toHaveLength(1);
      expect(routes[0].source).toBe(ModulationSource.LFO2);
      expect(routes[0].amount).toBe(75);
    });

    it("should remove a modulation route", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
        result.current.removeModulationRoute("filter_cutoff", 0);
      });

      const routes = result.current.routes["filter_cutoff"];
      // When all routes removed, parameter entry is deleted from map
      expect(routes).toBeUndefined();
    });

    it("should update active sources when route removed", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.addModulationRoute(
          "filter_cutoff",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
      });

      let activeSources = result.current.getActiveSources();
      expect(activeSources.has(ModulationSource.LFO1)).toBe(true);

      act(() => {
        result.current.removeModulationRoute("filter_cutoff", 0);
      });

      activeSources = result.current.getActiveSources();
      expect(activeSources.has(ModulationSource.LFO1)).toBe(false);
    });
  });

  describe("Source Value Updates", () => {
    it("should update source value", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 0.5);
      });

      expect(result.current.sourceValues[ModulationSource.LFO1]).toBe(0.5);
    });

    it("should update multiple source values", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 0.5);
        result.current.updateSourceValue(ModulationSource.LFO2, -0.3);
        result.current.updateSourceValue(ModulationSource.MOD_ENV, 0.8);
      });

      expect(result.current.sourceValues[ModulationSource.LFO1]).toBe(0.5);
      expect(result.current.sourceValues[ModulationSource.LFO2]).toBe(-0.3);
      expect(result.current.sourceValues[ModulationSource.MOD_ENV]).toBe(0.8);
    });
  });

  describe("Modulation Calculation - getModulatedValue", () => {
    beforeEach(() => {
      // Register test parameter
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
    });

    it("should return base value when no routes exist", () => {
      const { result } = renderHook(() => useModulationStore());

      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBe(50);
    });

    it("should calculate unipolar modulation (positive only)", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        // Set LFO1 to max value (1.0)
        result.current.updateSourceValue(ModulationSource.LFO1, 1.0);
        // Add route: 50% amount, unipolar
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
      });

      // Base = 50, Range = 100, Source = 1.0, Amount = 50%
      // Modulation = 1.0 * 0.5 * 100 = 50
      // Result = 50 + 50 = 100 (clamped to max)
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBe(100);
    });

    it("should calculate bipolar modulation (positive and negative)", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        // Set LFO1 to -1.0 (fully negative)
        result.current.updateSourceValue(ModulationSource.LFO1, -1.0);
        // Add route: 50% amount, bipolar
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          50,
          true
        );
      });

      // Base = 50, Range = 100, Source = -1.0, Amount = 50%
      // Modulation = -1.0 * 0.5 * 100 = -50
      // Result = 50 - 50 = 0
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBe(0);
    });

    it("should sum multiple modulation sources", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 0.5);
        result.current.updateSourceValue(ModulationSource.LFO2, 0.3);
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          50,
          false
        );
        result.current.addModulationRoute(
          "test_param",
          1,
          ModulationSource.LFO2,
          30,
          false
        );
      });

      // LFO1: 0.5 * 0.5 * 100 = 25
      // LFO2: 0.3 * 0.3 * 100 = 9
      // Total modulation = 25 + 9 = 34
      // Result = 50 + 34 = 84
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBeCloseTo(84, 1);
    });

    it("should clamp to minimum value", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, -1.0);
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          100,
          true
        );
      });

      // Base = 50, Modulation = -1.0 * 1.0 * 100 = -100
      // Result = 50 - 100 = -50, clamped to min (0)
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBe(0);
    });

    it("should clamp to maximum value", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 1.0);
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          100,
          false
        );
      });

      // Base = 50, Modulation = 1.0 * 1.0 * 100 = 100
      // Result = 50 + 100 = 150, clamped to max (100)
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBe(100);
    });

    it("should handle zero modulation amount", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.updateSourceValue(ModulationSource.LFO1, 1.0);
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          0,
          false
        );
      });

      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBe(50);
    });

    it("should handle NONE source (no modulation)", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.NONE,
          50,
          false
        );
      });

      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBe(50);
    });

    it("should handle mixed bipolar and unipolar routes", () => {
      const { result } = renderHook(() => useModulationStore());

      act(() => {
        // Unipolar: adds to base
        result.current.updateSourceValue(ModulationSource.LFO1, 0.5);
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          40,
          false
        );
        // Bipolar: can subtract from base
        result.current.updateSourceValue(ModulationSource.LFO2, -0.3);
        result.current.addModulationRoute(
          "test_param",
          1,
          ModulationSource.LFO2,
          30,
          true
        );
      });

      // LFO1 (unipolar): 0.5 * 0.4 * 100 = 20
      // LFO2 (bipolar): -0.3 * 0.3 * 100 = -9
      // Total = 20 - 9 = 11
      // Result = 50 + 11 = 61
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBeCloseTo(61, 1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle non-existent parameter gracefully", () => {
      const { result } = renderHook(() => useModulationStore());

      // Should return base value when parameter not registered
      const modulatedValue = result.current.getModulatedValue(
        "non_existent_param",
        50
      );
      expect(modulatedValue).toBe(50);
    });

    it("should handle extreme source values", () => {
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
        // Extreme positive
        result.current.updateSourceValue(ModulationSource.LFO1, 100.0);
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          100,
          true
        );
      });

      // Should still clamp to max
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBeLessThanOrEqual(100);
    });

    it("should handle very small modulation amounts", () => {
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
        result.current.updateSourceValue(ModulationSource.LFO1, 1.0);
        result.current.addModulationRoute(
          "test_param",
          0,
          ModulationSource.LFO1,
          1,
          false
        );
      });

      // 1% modulation should have minimal effect
      const modulatedValue = result.current.getModulatedValue("test_param", 50);
      expect(modulatedValue).toBeCloseTo(51, 1);
    });
  });
});
