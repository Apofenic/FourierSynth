/**
 * Simplified Tests for VariableControlPanel Component
 * 
 * These tests focus on core functionality with simplified setup.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { VariableControlPanel } from './VariableControlPanel';
import { EquationBuilderProvider, useEquationBuilder } from '../../contexts/EquationBuilderContext';

// Helper component to set expression programmatically
function TestHarness({ expression }: { expression?: string }) {
  const { updateExpression } = useEquationBuilder();
  
  React.useEffect(() => {
    if (expression) {
      updateExpression(expression);
    }
  }, [expression, updateExpression]);
  
  return <VariableControlPanel />;
}

function renderWithExpression(expression?: string) {
  return render(
    <EquationBuilderProvider>
      <TestHarness expression={expression} />
    </EquationBuilderProvider>
  );
}

describe('VariableControlPanel', () => {
  describe('Empty State', () => {
    it('should render empty state when no variables', () => {
      renderWithExpression();
      expect(screen.getByText(/No variables detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Variables are single letters/i)).toBeInTheDocument();
    });
  });

  describe('Variable Display', () => {
    it('should render variables from expression', async () => {
      renderWithExpression('a*sin(b*t + c)');

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 1000 });

      expect(screen.getByText('a:')).toBeInTheDocument();
      expect(screen.getByText('b:')).toBeInTheDocument();
      expect(screen.getByText('c:')).toBeInTheDocument();
    });

    it('should display variables in sorted order', async () => {
      renderWithExpression('c*sin(a*t + b)');

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 1000 });

      const labels = screen.getAllByText(/[abc]:/).map((el) => el.textContent);
      expect(labels).toEqual(['a:', 'b:', 'c:']);
    });

    it('should render sliders for each variable', async () => {
      const { container } = renderWithExpression('a*sin(t)');

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Check for slider (MUI renders as input type="range")
      const sliders = container.querySelectorAll('input[type="range"]');
      expect(sliders.length).toBeGreaterThan(0);
    });

    it('should render text inputs for each variable', async () => {
      const { container } = renderWithExpression('a*sin(t)');

      await waitFor(() => {
        expect(screen.queryByText('a:')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Check for number input
      const numberInputs = container.querySelectorAll('input[type="number"]');
      expect(numberInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Component Structure', () => {
    it('should render Variable Controls heading', async () => {
      renderWithExpression('a*sin(t)');

      await waitFor(() => {
        expect(screen.queryByText('Variable Controls')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should render Reset All button', async () => {
      renderWithExpression('a*sin(t)');

      await waitFor(() => {
        expect(screen.queryByText('Reset All')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});
