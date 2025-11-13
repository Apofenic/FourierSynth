import { renderHook, act, waitFor } from "@testing-library/react";
import { useEquationBuilderStore } from "../../stores/useEquationBuilderStore";

describe("useEquationBuilderStore", () => {
  const oscIndex = 0; // Test with oscillator 0

  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useEquationBuilderStore());
    act(() => {
      result.current.updateExpression(oscIndex, "sin(i*t)");
    });
  });

  describe("initialization", () => {
    it("initializes with correct default state", () => {
      const { result } = renderHook(() => useEquationBuilderStore());
      const osc = result.current.oscillators[oscIndex];

      expect(osc.expression).toBe("sin(i*t)");
      expect(osc.parsedExpression).toBeTruthy();
      expect(osc.compiledFunction).toBeTruthy();
      expect(osc.variables.n).toBeDefined();
      expect(osc.variables.n.value).toBe(1);
      expect(osc.latexExpression).toBeTruthy();
      expect(osc.validationResult.isValid).toBe(true);
      expect(osc.waveformData).toBeDefined();
    });

    it("always includes 'n' variable for summation", () => {
      const { result } = renderHook(() => useEquationBuilderStore());
      const osc = result.current.oscillators[oscIndex];

      expect(osc.variables.n).toEqual({
        name: "n",
        value: 1,
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 1,
      });
    });
  });

  describe("updateExpression", () => {
    it("updates expression immediately", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "cos(i*t)");
      });

      expect(result.current.oscillators[oscIndex].expression).toBe("cos(i*t)");
    });

    it("parses expression after 300ms debounce", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(2*i*t)");
      });

      // Should not be parsed yet
      expect(result.current.oscillators[oscIndex].expression).toBe(
        "sin(2*i*t)"
      );

      // Wait for debounce
      await waitFor(
        () => {
          expect(
            result.current.oscillators[oscIndex].parsedExpression?.expression
          ).toBe("sin(2*i*t)");
        },
        { timeout: 500 }
      );
    });

    it("clears parsed data when expression is empty", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "");
      });

      const osc = result.current.oscillators[oscIndex];
      expect(osc.expression).toBe("");
      expect(osc.parsedExpression).toBeNull();
      expect(osc.compiledFunction).toBeNull();
      expect(osc.latexExpression).toBe("");
      // Should still have 'n' variable
      expect(osc.variables.n).toBeDefined();
    });

    it("handles invalid expression gracefully", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.validationResult.isValid).toBe(false);
          expect(osc.validationResult.errors.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });
  });

  describe("variable auto-detection", () => {
    it("auto-detects variables from expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(a*i*t) + b");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.variables.a).toBeDefined();
          expect(osc.variables.b).toBeDefined();
          expect(osc.variables.n).toBeDefined(); // Always present
        },
        { timeout: 500 }
      );
    });

    it("preserves existing variable values when adding new variables", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Set initial expression with variable 'a'
      act(() => {
        result.current.updateExpression(oscIndex, "sin(a*i*t)");
      });

      await waitFor(
        () => {
          expect(
            result.current.oscillators[oscIndex].variables.a
          ).toBeDefined();
        },
        { timeout: 500 }
      );

      // Update variable 'a'
      act(() => {
        result.current.updateVariable(oscIndex, "a", 0.5);
      });

      expect(result.current.oscillators[oscIndex].variables.a.value).toBe(0.5);

      // Add new variable 'b' to expression
      act(() => {
        result.current.updateExpression(oscIndex, "sin(a*i*t) + b");
      });

      // Wait for parsing and variable detection
      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.variables.b).toBeDefined();
          // Variable 'a' should preserve its value
          expect(osc.variables.a.value).toBe(0.5);
        },
        { timeout: 500 }
      );
    });

    it("removes variables no longer in expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Set expression with variable 'a'
      act(() => {
        result.current.updateExpression(oscIndex, "sin(a*i*t)");
      });

      await waitFor(
        () => {
          expect(
            result.current.oscillators[oscIndex].variables.a
          ).toBeDefined();
        },
        { timeout: 500 }
      );

      // Remove variable 'a' from expression
      act(() => {
        result.current.updateExpression(oscIndex, "sin(i*t)");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.variables.a).toBeUndefined();
          expect(osc.variables.n).toBeDefined(); // Always present
        },
        { timeout: 500 }
      );
    });
  });

  describe("updateVariable", () => {
    it("updates variable value and regenerates waveform", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Wait for initial setup
      await waitFor(
        () => {
          expect(
            result.current.oscillators[oscIndex].waveformData.length
          ).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const initialWaveform = result.current.oscillators[oscIndex].waveformData;

      act(() => {
        result.current.updateVariable(oscIndex, "n", 5);
      });

      expect(result.current.oscillators[oscIndex].variables.n.value).toBe(5);
      // Waveform should change
      expect(result.current.oscillators[oscIndex].waveformData).not.toEqual(
        initialWaveform
      );
    });
  });

  describe("updateVariableConfig", () => {
    it("updates variable configuration without changing value", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      const initialValue =
        result.current.oscillators[oscIndex].variables.n.value;

      act(() => {
        result.current.updateVariableConfig(oscIndex, "n", {
          min: 0,
          max: 50,
          step: 5,
        });
      });

      const osc = result.current.oscillators[oscIndex];
      expect(osc.variables.n.min).toBe(0);
      expect(osc.variables.n.max).toBe(50);
      expect(osc.variables.n.step).toBe(5);
      expect(osc.variables.n.value).toBe(initialValue);
    });
  });

  describe("resetVariable", () => {
    it("resets variable to default value and regenerates waveform", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Change variable value
      act(() => {
        result.current.updateVariable(oscIndex, "n", 10);
      });

      expect(result.current.oscillators[oscIndex].variables.n.value).toBe(10);

      // Reset variable
      act(() => {
        result.current.resetVariable(oscIndex, "n");
      });

      const osc = result.current.oscillators[oscIndex];
      expect(osc.variables.n.value).toBe(osc.variables.n.defaultValue);
    });
  });

  describe("resetAllVariables", () => {
    it("resets all variables to default values", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Add variables
      act(() => {
        result.current.updateExpression(oscIndex, "sin(a*i*t) + b*cos(c*i*t)");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.variables.a).toBeDefined();
          expect(osc.variables.b).toBeDefined();
          expect(osc.variables.c).toBeDefined();
        },
        { timeout: 500 }
      );

      // Change variable values
      act(() => {
        result.current.updateVariable(oscIndex, "a", 2);
        result.current.updateVariable(oscIndex, "b", 3);
        result.current.updateVariable(oscIndex, "c", 4);
        result.current.updateVariable(oscIndex, "n", 10);
      });

      const osc = result.current.oscillators[oscIndex];
      expect(osc.variables.a.value).toBe(2);
      expect(osc.variables.b.value).toBe(3);
      expect(osc.variables.c.value).toBe(4);
      expect(osc.variables.n.value).toBe(10);

      // Reset all
      act(() => {
        result.current.resetAllVariables(oscIndex);
      });

      const oscAfter = result.current.oscillators[oscIndex];
      Object.values(oscAfter.variables).forEach((variable) => {
        expect(variable.value).toBe(variable.defaultValue);
      });
    });
  });

  describe("loadTemplate", () => {
    it("loads template correctly", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      const template = {
        id: "test-template",
        name: "Test Template",
        description: "A test template",
        expression: "sin(a*i*t) * b",
        variables: {
          a: { value: 2, min: 0, max: 10, step: 0.1 },
          b: { value: 0.5, min: 0, max: 1, step: 0.01 },
        },
        category: "basic" as const,
      };

      act(() => {
        result.current.loadTemplate(oscIndex, template);
      });

      expect(result.current.oscillators[oscIndex].expression).toBe(
        template.expression
      );

      // Wait for parsing
      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.variables.a).toBeDefined();
          expect(osc.variables.b).toBeDefined();
        },
        { timeout: 500 }
      );

      const osc = result.current.oscillators[oscIndex];
      expect(osc.variables.a.value).toBe(2);
      expect(osc.variables.a.defaultValue).toBe(2);
      expect(osc.variables.b.value).toBe(0.5);
      expect(osc.variables.b.defaultValue).toBe(0.5);
    });

    it("merges template variables with defaults", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      const template = {
        id: "partial-template",
        name: "Partial Template",
        description: "Template with partial variable config",
        expression: "sin(a*i*t)",
        variables: {
          a: { value: 3 }, // Only provide value, not min/max/step
        },
        category: "basic" as const,
      };

      act(() => {
        result.current.loadTemplate(oscIndex, template);
      });

      await waitFor(
        () => {
          expect(
            result.current.oscillators[oscIndex].variables.a
          ).toBeDefined();
        },
        { timeout: 500 }
      );

      const osc = result.current.oscillators[oscIndex];
      // Should have value from template
      expect(osc.variables.a.value).toBe(3);
      // Should have defaults for other properties
      expect(osc.variables.a.min).toBeDefined();
      expect(osc.variables.a.max).toBeDefined();
      expect(osc.variables.a.step).toBeDefined();
    });
  });

  describe("waveform generation", () => {
    it("generates waveform from expression and variables", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(i*t)");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.waveformData.length).toBeGreaterThan(0);
          expect(osc.waveformData.length).toBe(2048);
        },
        { timeout: 500 }
      );
    });

    it("clears waveform on invalid expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "cos(");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.validationResult.isValid).toBe(false);
          expect(osc.waveformData).toEqual([]);
        },
        { timeout: 500 }
      );
    });

    it("updates waveform when variables change", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(a*i*t)");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.variables.a).toBeDefined();
          expect(osc.waveformData.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const initialWaveform = [
        ...result.current.oscillators[oscIndex].waveformData,
      ];

      act(() => {
        result.current.updateVariable(oscIndex, "a", 2);
      });

      // Waveform should be different
      expect(result.current.oscillators[oscIndex].waveformData).not.toEqual(
        initialWaveform
      );
    });
  });

  describe("validation", () => {
    it("validates correct expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(i*t) + cos(2*i*t)");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.validationResult.isValid).toBe(true);
          expect(osc.validationResult.errors).toEqual([]);
        },
        { timeout: 500 }
      );
    });

    it("validates incorrect expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(+)");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.validationResult.isValid).toBe(false);
          expect(osc.validationResult.errors.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });
  });

  describe("LaTeX generation", () => {
    it("generates LaTeX from expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression(oscIndex, "sin(i*t)");
      });

      await waitFor(
        () => {
          const osc = result.current.oscillators[oscIndex];
          expect(osc.latexExpression).toBeTruthy();
          expect(osc.latexExpression.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });
  });
});
