import { renderHook, act, waitFor } from "@testing-library/react";
import { useEquationBuilderStore } from "../useEquationBuilderStore";

describe("useEquationBuilderStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useEquationBuilderStore());
    act(() => {
      result.current.updateExpression("sin(i*t)");
    });
  });

  describe("initialization", () => {
    it("initializes with correct default state", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      expect(result.current.expression).toBe("sin(i*t)");
      expect(result.current.parsedExpression).toBeTruthy();
      expect(result.current.compiledFunction).toBeTruthy();
      expect(result.current.variables.n).toBeDefined();
      expect(result.current.variables.n.value).toBe(1);
      expect(result.current.latexExpression).toBeTruthy();
      expect(result.current.validationResult.isValid).toBe(true);
      expect(result.current.waveformData).toBeDefined();
    });

    it("always includes 'n' variable for summation", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      expect(result.current.variables.n).toEqual({
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
        result.current.updateExpression("cos(i*t)");
      });

      expect(result.current.expression).toBe("cos(i*t)");
    });

    it("parses expression after 300ms debounce", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(2*i*t)");
      });

      // Should not be parsed yet
      expect(result.current.expression).toBe("sin(2*i*t)");

      // Wait for debounce
      await waitFor(
        () => {
          expect(result.current.parsedExpression?.expression).toBe(
            "sin(2*i*t)"
          );
        },
        { timeout: 500 }
      );
    });

    it("clears parsed data when expression is empty", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("");
      });

      expect(result.current.expression).toBe("");
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.compiledFunction).toBeNull();
      expect(result.current.latexExpression).toBe("");
      // Should still have 'n' variable
      expect(result.current.variables.n).toBeDefined();
    });

    it("handles invalid expression gracefully", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(");
      });

      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(false);
          expect(result.current.validationResult.errors.length).toBeGreaterThan(
            0
          );
        },
        { timeout: 500 }
      );
    });
  });

  describe("variable auto-detection", () => {
    it("auto-detects variables from expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(a*i*t) + b");
      });

      await waitFor(
        () => {
          expect(result.current.variables.a).toBeDefined();
          expect(result.current.variables.b).toBeDefined();
          expect(result.current.variables.n).toBeDefined(); // Always present
        },
        { timeout: 500 }
      );
    });

    it("preserves existing variable values when adding new variables", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Set initial expression with variable 'a'
      act(() => {
        result.current.updateExpression("sin(a*i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.variables.a).toBeDefined();
        },
        { timeout: 500 }
      );

      // Update variable 'a'
      act(() => {
        result.current.updateVariable("a", 0.5);
      });

      expect(result.current.variables.a.value).toBe(0.5);

      // Add new variable 'b' to expression
      act(() => {
        result.current.updateExpression("sin(a*i*t) + b");
      });

      // Wait for parsing and variable detection
      await waitFor(
        () => {
          expect(result.current.variables.b).toBeDefined();
          // Variable 'a' should preserve its value
          expect(result.current.variables.a.value).toBe(0.5);
        },
        { timeout: 500 }
      );
    });

    it("removes variables no longer in expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Set expression with variable 'a'
      act(() => {
        result.current.updateExpression("sin(a*i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.variables.a).toBeDefined();
        },
        { timeout: 500 }
      );

      // Remove variable 'a' from expression
      act(() => {
        result.current.updateExpression("sin(i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.variables.a).toBeUndefined();
          expect(result.current.variables.n).toBeDefined(); // Always present
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
          expect(result.current.waveformData.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const initialWaveform = result.current.waveformData;

      act(() => {
        result.current.updateVariable("n", 5);
      });

      expect(result.current.variables.n.value).toBe(5);
      // Waveform should change
      expect(result.current.waveformData).not.toEqual(initialWaveform);
    });
  });

  describe("updateVariableConfig", () => {
    it("updates variable configuration without changing value", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      const initialValue = result.current.variables.n.value;

      act(() => {
        result.current.updateVariableConfig("n", {
          min: 0,
          max: 50,
          step: 5,
        });
      });

      expect(result.current.variables.n.min).toBe(0);
      expect(result.current.variables.n.max).toBe(50);
      expect(result.current.variables.n.step).toBe(5);
      expect(result.current.variables.n.value).toBe(initialValue);
    });
  });

  describe("resetVariable", () => {
    it("resets variable to default value and regenerates waveform", () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Change variable value
      act(() => {
        result.current.updateVariable("n", 10);
      });

      expect(result.current.variables.n.value).toBe(10);

      // Reset variable
      act(() => {
        result.current.resetVariable("n");
      });

      expect(result.current.variables.n.value).toBe(
        result.current.variables.n.defaultValue
      );
    });
  });

  describe("resetAllVariables", () => {
    it("resets all variables to default values", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      // Add variables
      act(() => {
        result.current.updateExpression("sin(a*i*t) + b*cos(c*i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.variables.a).toBeDefined();
          expect(result.current.variables.b).toBeDefined();
          expect(result.current.variables.c).toBeDefined();
        },
        { timeout: 500 }
      );

      // Change variable values
      act(() => {
        result.current.updateVariable("a", 2);
        result.current.updateVariable("b", 3);
        result.current.updateVariable("c", 4);
        result.current.updateVariable("n", 10);
      });

      expect(result.current.variables.a.value).toBe(2);
      expect(result.current.variables.b.value).toBe(3);
      expect(result.current.variables.c.value).toBe(4);
      expect(result.current.variables.n.value).toBe(10);

      // Reset all
      act(() => {
        result.current.resetAllVariables();
      });

      Object.values(result.current.variables).forEach((variable) => {
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
        result.current.loadTemplate(template);
      });

      expect(result.current.expression).toBe(template.expression);

      // Wait for parsing
      await waitFor(
        () => {
          expect(result.current.variables.a).toBeDefined();
          expect(result.current.variables.b).toBeDefined();
        },
        { timeout: 500 }
      );

      expect(result.current.variables.a.value).toBe(2);
      expect(result.current.variables.a.defaultValue).toBe(2);
      expect(result.current.variables.b.value).toBe(0.5);
      expect(result.current.variables.b.defaultValue).toBe(0.5);
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
        result.current.loadTemplate(template);
      });

      await waitFor(
        () => {
          expect(result.current.variables.a).toBeDefined();
        },
        { timeout: 500 }
      );

      // Should have value from template
      expect(result.current.variables.a.value).toBe(3);
      // Should have defaults for other properties
      expect(result.current.variables.a.min).toBeDefined();
      expect(result.current.variables.a.max).toBeDefined();
      expect(result.current.variables.a.step).toBeDefined();
    });
  });

  describe("waveform generation", () => {
    it("generates waveform from expression and variables", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.waveformData.length).toBeGreaterThan(0);
          expect(result.current.waveformData.length).toBe(2048);
        },
        { timeout: 500 }
      );
    });

    it("clears waveform on invalid expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("cos(");
      });

      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(false);
          expect(result.current.waveformData).toEqual([]);
        },
        { timeout: 500 }
      );
    });

    it("updates waveform when variables change", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(a*i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.variables.a).toBeDefined();
          expect(result.current.waveformData.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );

      const initialWaveform = [...result.current.waveformData];

      act(() => {
        result.current.updateVariable("a", 2);
      });

      // Waveform should be different
      expect(result.current.waveformData).not.toEqual(initialWaveform);
    });
  });

  describe("validation", () => {
    it("validates correct expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(i*t) + cos(2*i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(true);
          expect(result.current.validationResult.errors).toEqual([]);
        },
        { timeout: 500 }
      );
    });

    it("validates incorrect expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(+)");
      });

      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(false);
          expect(result.current.validationResult.errors.length).toBeGreaterThan(
            0
          );
        },
        { timeout: 500 }
      );
    });
  });

  describe("LaTeX generation", () => {
    it("generates LaTeX from expression", async () => {
      const { result } = renderHook(() => useEquationBuilderStore());

      act(() => {
        result.current.updateExpression("sin(i*t)");
      });

      await waitFor(
        () => {
          expect(result.current.latexExpression).toBeTruthy();
          expect(result.current.latexExpression.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });
  });
});
