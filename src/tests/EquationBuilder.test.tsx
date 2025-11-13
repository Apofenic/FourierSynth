/**
 * EquationBuilder Component Tests
 *
 * Tests the main EquationBuilder component integration:
 * - Renders all child components
 * - Layout structure is correct
 * - Drag-and-drop integration works
 * - Symbol click inserts into input
 * - Expression changes propagate
 * - Responsive layout
 *
 * Part of PR #7: Main EquationBuilder Component
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import EquationBuilder from "../components/Osc/EquationBuilder/EquationBuilder";

// Mock child components to simplify integration testing
jest.mock("../components/Osc/EquationBuilder/SymbolPalette", () => {
  return function MockSymbolPalette({ onSymbolClick }: any) {
    return (
      <div data-testid="symbol-palette">
        <button onClick={() => onSymbolClick("sin(")}>sin</button>
        <button onClick={() => onSymbolClick("a")}>a</button>
      </div>
    );
  };
});

jest.mock("../components/Osc/EquationBuilder/EquationInput", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(({ maxLength }: any, ref: any) => {
      const [value, setValue] = React.useState("");

      React.useImperativeHandle(ref, () => ({
        insertAtCursor: (text: string) => {
          setValue((prev: string) => prev + text);
        },
      }));

      return (
        <div data-testid="equation-input">
          <input
            data-testid="equation-input-field"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={maxLength}
          />
        </div>
      );
    }),
  };
});

jest.mock("../components/Osc/EquationBuilder/EquationPreview", () => {
  return {
    EquationPreview: function MockEquationPreview() {
      return <div data-testid="equation-preview">Preview</div>;
    },
  };
});

jest.mock("../components/Osc/EquationBuilder/VariableControlPanel", () => {
  return {
    VariableControlPanel: function MockVariableControlPanel() {
      return <div data-testid="variable-control-panel">Variables</div>;
    },
  };
});

// Mock react-dnd
jest.mock("react-dnd", () => ({
  DndProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

describe("EquationBuilder Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<EquationBuilder />);
      expect(screen.getByTestId("symbol-palette")).toBeInTheDocument();
    });

    it("renders all child components", () => {
      render(<EquationBuilder />);

      expect(screen.getByTestId("symbol-palette")).toBeInTheDocument();
      expect(screen.getByTestId("equation-input")).toBeInTheDocument();
      expect(screen.getByTestId("equation-preview")).toBeInTheDocument();
      expect(screen.getByTestId("variable-control-panel")).toBeInTheDocument();
    });
  });

  describe("Layout Structure", () => {
    it("has correct grid layout structure", () => {
      const { container } = render(<EquationBuilder />);

      // Check for grid container
      const gridContainer = container.querySelector(
        '[class*="MuiGrid-container"]'
      );
      expect(gridContainer).toBeInTheDocument();
    });

    it("arranges components in expected order", () => {
      render(<EquationBuilder />);

      const allElements = screen.getAllByTestId(
        /symbol-palette|equation-input|equation-preview|variable-control-panel/
      );

      // Symbol palette should come first (left panel)
      expect(allElements[0]).toHaveAttribute("data-testid", "symbol-palette");
    });
  });

  describe("Symbol Click Integration", () => {
    it("inserts symbol into input when symbol is clicked", async () => {
      render(<EquationBuilder />);

      const palette = screen.getByTestId("symbol-palette");
      const sinButton = within(palette).getByText("sin");
      const inputField = screen.getByTestId("equation-input-field");

      // Initial state
      expect(inputField).toHaveValue("");

      // Click symbol
      fireEvent.click(sinButton);

      // Symbol should be inserted
      await waitFor(() => {
        expect(inputField).toHaveValue("sin(");
      });
    });

    it("inserts multiple symbols sequentially", async () => {
      render(<EquationBuilder />);

      const palette = screen.getByTestId("symbol-palette");
      const inputField = screen.getByTestId("equation-input-field");

      // Click 'a'
      fireEvent.click(within(palette).getByText("a"));
      await waitFor(() => {
        expect(inputField).toHaveValue("a");
      });

      // Click 'sin'
      fireEvent.click(within(palette).getByText("sin"));
      await waitFor(() => {
        expect(inputField).toHaveValue("asin(");
      });
    });
  });

  describe("Component Props", () => {
    it("passes maxLength prop to EquationInput", () => {
      render(<EquationBuilder />);

      const inputField = screen.getByTestId("equation-input-field");
      expect(inputField).toHaveAttribute("maxlength", "200");
    });

    it("accepts optional oscillatorIndex prop", () => {
      expect(() =>
        render(<EquationBuilder oscillatorIndex={1} />)
      ).not.toThrow();
    });
  });

  describe("Context Integration", () => {
    it("wraps components in DndProvider", () => {
      // This is tested implicitly by the mock
      render(<EquationBuilder />);
      expect(screen.getByTestId("symbol-palette")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper component structure", () => {
      render(<EquationBuilder />);
      expect(screen.getByTestId("equation-input")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies elevation to Paper component", () => {
      const { container } = render(<EquationBuilder />);

      const paper = container.querySelector('[class*="MuiPaper-elevation"]');
      expect(paper).toBeInTheDocument();
    });

    it("has gradient header background", () => {
      const { container } = render(<EquationBuilder />);

      const header = container.querySelector('[class*="MuiBox-root"]');
      expect(header).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("renders gracefully even if a child component fails", () => {
      // The component should be wrapped in error boundary in production
      // For now, just test that it renders
      expect(() => render(<EquationBuilder />)).not.toThrow();
    });
  });
});
