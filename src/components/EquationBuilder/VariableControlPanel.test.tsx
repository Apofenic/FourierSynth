/**
 * Tests for VariableControlPanel Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariableControlPanel } from './VariableControlPanel';
import { EquationBuilderProvider, useEquationBuilder } from '../../contexts/EquationBuilderContext';

// Helper component to set expression and render VariableControlPanel
function TestWrapper({ expression }: { expression?: string }) {
  const { updateExpression } = useEquationBuilder();
  
  React.useEffect(() => {
    if (expression) {
      updateExpression(expression);
    }
  }, [expression, updateExpression]);
  
  return <VariableControlPanel />;
}

// Helper to render component within context with optional expression
const renderWithContext = (expression?: string) => {
  return render(
    <EquationBuilderProvider>
      <TestWrapper expression={expression} />
    </EquationBuilderProvider>
  );
};

describe('VariableControlPanel', () => {
  describe('Empty State', () => {
    it('should render empty state when no variables', () => {
      renderWithContext();

      expect(screen.getByText(/No variables detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Variables are single letters/i)).toBeInTheDocument();
    });

    it('should disable "Reset All" button when no variables', async () => {
      renderWithContext();

      // Wait for initial render to stabilize
      await waitFor(() => {
        expect(screen.queryByText(/No variables detected/i)).toBeInTheDocument();
      });

      // The button should not be rendered in empty state
      const resetAllButton = screen.queryByRole('button', { name: /Reset All/i });
      // Button exists but should be disabled
      if (resetAllButton) {
        expect(resetAllButton).toBeDisabled();
      }
    });
  });

  describe('Variable Display', () => {
    it('should render variables from context', async () => {
      renderWithContext('a*sin(b*t + c)');

      // Wait for variables to be detected
      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Check for all variables
      expect(screen.getByText('a:')).toBeInTheDocument();
      expect(screen.getByText('b:')).toBeInTheDocument();
      expect(screen.getByText('c:')).toBeInTheDocument();
    });

    it('should display variables in sorted order', async () => {
      renderWithContext('c*sin(a*t + b)');

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 1000 });

      const labels = screen.getAllByText(/[abc]:/).map((el) => el.textContent);
      expect(labels).toEqual(['a:', 'b:', 'c:']);
    });
  });

  describe('Slider Interaction', () => {
    it('should update variable value when slider changes', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression to create variables
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Find the slider (it's an input with type="range" in MUI)
      const sliders = container.querySelectorAll('input[type="range"]');
      expect(sliders.length).toBeGreaterThan(0);

      // Simulate slider change
      const slider = sliders[0];
      fireEvent.change(slider, { target: { value: '1.5' } });

      // Check that the value is updated in the text field
      await waitFor(() => {
        const numberInputs = container.querySelectorAll('input[type="number"]');
        const valueInput = Array.from(numberInputs).find(
          (input) => (input as HTMLInputElement).value === '1.50'
        );
        expect(valueInput).toBeInTheDocument();
      });
    });
  });

  describe('Text Input Interaction', () => {
    it('should update variable value when text input changes', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Find the number input
      const numberInputs = container.querySelectorAll('input[type="number"]');
      expect(numberInputs.length).toBeGreaterThan(0);

      const input = numberInputs[0] as HTMLInputElement;
      
      // Clear and type new value
      userEvent.clear(input);
      userEvent.type(input, '1.75');

      // Verify the value was updated
      await waitFor(() => {
        expect(input.value).toBe('1.75');
      });
    });

    it('should clamp values to min/max range', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Find the number input
      const numberInputs = container.querySelectorAll('input[type="number"]');
      const input = numberInputs[0] as HTMLInputElement;

      // Try to set value above max (default max is 2 for 'a')
      fireEvent.change(input, { target: { value: '999' } });
      fireEvent.blur(input); // Trigger validation

      await waitFor(() => {
        // Should be clamped to max value (2.00)
        expect(input.value).toBe('2.00');
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset individual variable to default', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Change the value
      const numberInputs = container.querySelectorAll('input[type="number"]');
      const input = numberInputs[0] as HTMLInputElement;
      fireEvent.change(input, { target: { value: '1.5' } });

      // Find and click reset button (Undo icon)
      const resetButtons = screen.getAllByRole('button', { name: /Reset to default value/i });
      expect(resetButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(resetButtons[0]);

      // Should reset to default value (1.00 for 'a')
      await waitFor(() => {
        expect(input.value).toBe('1.00');
      });
    });

    it('should disable reset button when at default value', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Reset buttons should be disabled when at default
      const resetButtons = screen.getAllByRole('button', { name: /Reset to default value/i });
      expect(resetButtons[0]).toBeDisabled();
    });

    it('should reset all variables when "Reset All" clicked', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression with multiple variables
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(b*t + c)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Change some values
      const numberInputs = container.querySelectorAll('input[type="number"]');
      fireEvent.change(numberInputs[0], { target: { value: '1.5' } });
      fireEvent.change(numberInputs[1], { target: { value: '2.5' } });

      // Click "Reset All"
      const resetAllButton = screen.getByRole('button', { name: /Reset All/i });
      fireEvent.click(resetAllButton);

      // All values should be reset
      await waitFor(() => {
        const inputs = container.querySelectorAll('input[type="number"]');
        // Check that values are back to defaults
        expect((inputs[0] as HTMLInputElement).value).toBe('1.00'); // 'a' default
        expect((inputs[1] as HTMLInputElement).value).toBe('1.00'); // 'b' default
      });
    });
  });

  describe('Configuration Dialog', () => {
    it('should open configuration dialog when settings clicked', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Click settings button
      const settingsButtons = screen.getAllByRole('button', { name: /Configure min\/max\/step/i });
      fireEvent.click(settingsButtons[0]);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByText(/Configure Variable: a/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Minimum Value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Maximum Value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Step Size/i)).toBeInTheDocument();
    });

    it('should close dialog when cancel clicked', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Open dialog
      const settingsButtons = screen.getAllByRole('button', { name: /Configure min\/max\/step/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Configure Variable: a/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/Configure Variable: a/i)).not.toBeInTheDocument();
      });
    });

    it('should save configuration changes', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Open dialog
      const settingsButtons = screen.getAllByRole('button', { name: /Configure min\/max\/step/i });
      fireEvent.click(settingsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Configure Variable: a/i)).toBeInTheDocument();
      });

      // Change max value
      const maxInput = screen.getByLabelText(/Maximum Value/i) as HTMLInputElement;
      userEvent.clear(maxInput);
      userEvent.type(maxInput, '5');

      // Save
      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/Configure Variable: a/i)).not.toBeInTheDocument();
      });

      // Configuration should be applied (slider should have new max)
      const sliders = container.querySelectorAll('input[type="range"]');
      const slider = sliders[0] as HTMLInputElement;
      expect(slider.max).toBe('5');
    });
  });

  describe('Synchronization', () => {
    it('should synchronize slider and text input', async () => {
      const { container } = renderWithContext(<VariableControlPanel />);

      // Set expression
      const expressionInput = container.querySelector('input[type="text"]');
      if (expressionInput) {
        fireEvent.change(expressionInput, { target: { value: 'a*sin(t)' } });
      }

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 500 });

      // Change slider
      const sliders = container.querySelectorAll('input[type="range"]');
      const slider = sliders[0];
      fireEvent.change(slider, { target: { value: '1.5' } });

      // Text input should update
      await waitFor(() => {
        const numberInputs = container.querySelectorAll('input[type="number"]');
        expect((numberInputs[0] as HTMLInputElement).value).toBe('1.50');
      });

      // Change text input
      const numberInputs = container.querySelectorAll('input[type="number"]');
      fireEvent.change(numberInputs[0], { target: { value: '1.8' } });

      // Slider should update
      await waitFor(() => {
        expect((slider as HTMLInputElement).value).toBe('1.8');
      });
    });
  });
});
