/**
 * Tests for EquationBuilderContext
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { EquationBuilderProvider, useEquationBuilder } from './EquationBuilderContext';
import { EquationTemplate } from '../types/equationBuilder';

/**
 * Wrapper component for testing hooks
 */
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EquationBuilderProvider>{children}</EquationBuilderProvider>
);

describe('EquationBuilderContext', () => {
  describe('Provider initialization', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      expect(result.current.expression).toBe('');
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.compiledFunction).toBeNull();
      expect(result.current.variables).toEqual({});
      expect(result.current.latexExpression).toBe('');
      expect(result.current.validationResult).toEqual({ isValid: true, errors: [] });
      expect(result.current.waveformData).toEqual([]);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useEquationBuilder());
      }).toThrow('useEquationBuilder must be used within EquationBuilderProvider');

      console.error = originalError;
    });
  });

  describe('updateExpression', () => {
    it('should update expression immediately', () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('sin(t)');
      });

      expect(result.current.expression).toBe('sin(t)');
    });

    it('should parse expression after debounce', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(b*t + c)');
      });

      // Wait for debounced parsing (300ms)
      await waitFor(
        () => {
          expect(result.current.parsedExpression).not.toBeNull();
        },
        { timeout: 500 }
      );

      expect(result.current.validationResult.isValid).toBe(true);
      expect(result.current.compiledFunction).not.toBeNull();
      expect(result.current.latexExpression).not.toBe('');
    });

    it('should handle invalid expression', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('sin(t');
      });

      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(false);
        },
        { timeout: 500 }
      );

      expect(result.current.validationResult.errors.length).toBeGreaterThan(0);
    });

    it('should clear state when expression is empty', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      // First set a valid expression
      act(() => {
        result.current.updateExpression('sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.parsedExpression).not.toBeNull();
        },
        { timeout: 500 }
      );

      // Then clear it
      act(() => {
        result.current.updateExpression('');
      });

      await waitFor(
        () => {
          expect(result.current.parsedExpression).toBeNull();
        },
        { timeout: 500 }
      );

      expect(result.current.compiledFunction).toBeNull();
      expect(result.current.latexExpression).toBe('');
      expect(result.current.validationResult).toEqual({ isValid: true, errors: [] });
    });
  });

  describe('Variable detection', () => {
    it('should detect variables from expression', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(b*t + c)');
      });

      await waitFor(
        () => {
          expect(Object.keys(result.current.variables)).toEqual(['a', 'b', 'c']);
        },
        { timeout: 500 }
      );

      // Check default configurations
      expect(result.current.variables['a']).toMatchObject({
        name: 'a',
        defaultValue: 1,
        min: 0,
        max: 2,
      });

      expect(result.current.variables['b']).toMatchObject({
        name: 'b',
        defaultValue: 1,
        min: 0,
        max: 10,
      });

      expect(result.current.variables['c']).toMatchObject({
        name: 'c',
        defaultValue: 0,
        min: 0,
      });
    });

    it('should not include reserved variables', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('sin(t) + e + i');
      });

      await waitFor(
        () => {
          expect(result.current.parsedExpression).not.toBeNull();
        },
        { timeout: 500 }
      );

      expect(Object.keys(result.current.variables)).toEqual([]);
    });

    it('should add new variables when expression changes', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(Object.keys(result.current.variables)).toEqual(['a']);
        },
        { timeout: 500 }
      );

      act(() => {
        result.current.updateExpression('a*sin(b*t)');
      });

      await waitFor(
        () => {
          expect(Object.keys(result.current.variables).sort()).toEqual(['a', 'b']);
        },
        { timeout: 500 }
      );
    });

    it('should remove obsolete variables when expression changes', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(b*t + c)');
      });

      await waitFor(
        () => {
          expect(Object.keys(result.current.variables).sort()).toEqual(['a', 'b', 'c']);
        },
        { timeout: 500 }
      );

      act(() => {
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(Object.keys(result.current.variables)).toEqual(['a']);
        },
        { timeout: 500 }
      );
    });

    it('should preserve variable values when adding new variables', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
        },
        { timeout: 500 }
      );

      // Update variable value
      act(() => {
        result.current.updateVariable('a', 1.5);
      });

      expect(result.current.variables['a'].value).toBe(1.5);

      // Add new variable
      act(() => {
        result.current.updateExpression('a*sin(b*t)');
      });

      await waitFor(
        () => {
          expect(result.current.variables['b']).toBeDefined();
        },
        { timeout: 500 }
      );

      // Original variable value should be preserved
      expect(result.current.variables['a'].value).toBe(1.5);
    });
  });

  describe('updateVariable', () => {
    it('should update variable value', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
        },
        { timeout: 500 }
      );

      act(() => {
        result.current.updateVariable('a', 1.5);
      });

      expect(result.current.variables['a'].value).toBe(1.5);
    });

    it('should update multiple variables independently', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(b*t)');
      });

      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
          expect(result.current.variables['b']).toBeDefined();
        },
        { timeout: 500 }
      );

      act(() => {
        result.current.updateVariable('a', 1.5);
        result.current.updateVariable('b', 2.5);
      });

      expect(result.current.variables['a'].value).toBe(1.5);
      expect(result.current.variables['b'].value).toBe(2.5);
    });
  });

  describe('updateVariableConfig', () => {
    it('should update variable configuration', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
        },
        { timeout: 500 }
      );

      act(() => {
        result.current.updateVariableConfig('a', {
          min: -5,
          max: 5,
          step: 0.1,
        });
      });

      expect(result.current.variables['a'].min).toBe(-5);
      expect(result.current.variables['a'].max).toBe(5);
      expect(result.current.variables['a'].step).toBe(0.1);
    });

    it('should preserve other config properties when updating', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
        },
        { timeout: 500 }
      );

      const originalName = result.current.variables['a'].name;
      const originalDefaultValue = result.current.variables['a'].defaultValue;

      act(() => {
        result.current.updateVariableConfig('a', { min: -1, max: 3 });
      });

      expect(result.current.variables['a'].name).toBe(originalName);
      expect(result.current.variables['a'].defaultValue).toBe(originalDefaultValue);
    });
  });

  describe('resetVariable', () => {
    it('should reset variable to default value', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
        },
        { timeout: 500 }
      );

      const defaultValue = result.current.variables['a'].defaultValue;

      act(() => {
        result.current.updateVariable('a', 1.5);
      });

      expect(result.current.variables['a'].value).toBe(1.5);

      act(() => {
        result.current.resetVariable('a');
      });

      expect(result.current.variables['a'].value).toBe(defaultValue);
    });
  });

  describe('resetAllVariables', () => {
    it('should reset all variables to default values', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(b*t + c)');
      });

      await waitFor(
        () => {
          expect(Object.keys(result.current.variables)).toEqual(['a', 'b', 'c']);
        },
        { timeout: 500 }
      );

      const defaultValues = {
        a: result.current.variables['a'].defaultValue,
        b: result.current.variables['b'].defaultValue,
        c: result.current.variables['c'].defaultValue,
      };

      act(() => {
        result.current.updateVariable('a', 1.5);
        result.current.updateVariable('b', 2.5);
        result.current.updateVariable('c', 3.5);
      });

      expect(result.current.variables['a'].value).toBe(1.5);
      expect(result.current.variables['b'].value).toBe(2.5);
      expect(result.current.variables['c'].value).toBe(3.5);

      act(() => {
        result.current.resetAllVariables();
      });

      expect(result.current.variables['a'].value).toBe(defaultValues.a);
      expect(result.current.variables['b'].value).toBe(defaultValues.b);
      expect(result.current.variables['c'].value).toBe(defaultValues.c);
    });
  });

  describe('loadTemplate', () => {
    it('should load template expression and variables', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      const template: EquationTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        expression: 'a*sin(b*t)',
        variables: {
          a: { value: 1.5, min: 0, max: 3 },
          b: { value: 2.0, min: 0, max: 5 },
        },
        category: 'basic',
      };

      act(() => {
        result.current.loadTemplate(template);
      });

      expect(result.current.expression).toBe('a*sin(b*t)');

      // Wait for parsing
      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
          expect(result.current.variables['b']).toBeDefined();
        },
        { timeout: 500 }
      );

      // Check that template variable configs were applied
      expect(result.current.variables['a'].value).toBe(1.5);
      expect(result.current.variables['a'].min).toBe(0);
      expect(result.current.variables['a'].max).toBe(3);

      expect(result.current.variables['b'].value).toBe(2.0);
      expect(result.current.variables['b'].min).toBe(0);
      expect(result.current.variables['b'].max).toBe(5);
    });

    it('should merge template config with defaults', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      const template: EquationTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        expression: 'a*sin(t)',
        variables: {
          a: { value: 1.5 }, // Only override value, not min/max/step
        },
        category: 'basic',
      };

      act(() => {
        result.current.loadTemplate(template);
      });

      await waitFor(
        () => {
          expect(result.current.variables['a']).toBeDefined();
        },
        { timeout: 500 }
      );

      // Value from template
      expect(result.current.variables['a'].value).toBe(1.5);

      // Defaults should still be present
      expect(result.current.variables['a'].min).toBeDefined();
      expect(result.current.variables['a'].max).toBeDefined();
      expect(result.current.variables['a'].step).toBeDefined();
      expect(result.current.variables['a'].defaultValue).toBeDefined();
    });
  });

  describe('LaTeX generation', () => {
    it('should generate LaTeX for valid expression', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.latexExpression).not.toBe('');
        },
        { timeout: 500 }
      );

      expect(result.current.latexExpression).toContain('sin');
    });

    it('should handle complex expressions', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a*sin(b*t + c) + d*cos(e*t)');
      });

      await waitFor(
        () => {
          expect(result.current.latexExpression).not.toBe('');
        },
        { timeout: 500 }
      );

      expect(result.current.latexExpression).toContain('sin');
      expect(result.current.latexExpression).toContain('cos');
    });
  });

  describe('Waveform generation', () => {
    it('should clear waveform when expression is invalid', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('sin(t');
      });

      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(false);
        },
        { timeout: 500 }
      );

      expect(result.current.waveformData).toEqual([]);
    });

    it('should clear waveform when no compiled function', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('');
      });

      await waitFor(
        () => {
          expect(result.current.compiledFunction).toBeNull();
        },
        { timeout: 500 }
      );

      expect(result.current.waveformData).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle parsing errors gracefully', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('invalid((()');
      });

      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(false);
        },
        { timeout: 500 }
      );

      expect(result.current.validationResult.errors.length).toBeGreaterThan(0);
      expect(result.current.parsedExpression).toBeNull();
      expect(result.current.compiledFunction).toBeNull();
    });

    it('should not crash on rapid expression changes', async () => {
      const { result } = renderHook(() => useEquationBuilder(), { wrapper });

      act(() => {
        result.current.updateExpression('a');
        result.current.updateExpression('a*');
        result.current.updateExpression('a*s');
        result.current.updateExpression('a*sin');
        result.current.updateExpression('a*sin(');
        result.current.updateExpression('a*sin(t');
        result.current.updateExpression('a*sin(t)');
      });

      await waitFor(
        () => {
          expect(result.current.expression).toBe('a*sin(t)');
        },
        { timeout: 500 }
      );

      // Should eventually parse the final valid expression
      await waitFor(
        () => {
          expect(result.current.validationResult.isValid).toBe(true);
        },
        { timeout: 1000 }
      );
    });
  });
});
