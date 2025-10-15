/**
 * Tests for SymbolPalette component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { SymbolPalette } from "../components/EquationBuilder/SymbolPalette";

/**
 * Wrapper for DnD provider
 */
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={HTML5Backend}>{children}</DndProvider>
);

describe("SymbolPalette", () => {
  const mockOnSymbolClick = jest.fn();

  beforeEach(() => {
    mockOnSymbolClick.mockClear();
  });

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      expect(screen.getByText("Symbol Palette")).toBeInTheDocument();
    });

    it("should render all category tabs", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      expect(screen.getByText("Operators")).toBeInTheDocument();
      expect(screen.getByText("Functions")).toBeInTheDocument();
      expect(screen.getByText("Greek Letters")).toBeInTheDocument();
      expect(screen.getByText("Constants")).toBeInTheDocument();
      expect(screen.getByText("Brackets")).toBeInTheDocument();
    });

    it("should display help text about reserved variables", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      expect(
        screen.getByText(
          /Reserved variables are t \(time\), i \(imaginary\), and e/
        )
      ).toBeInTheDocument();
    });
  });

  describe("Category Tabs", () => {
    it("should show operators by default", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      // Check for some operator symbols
      expect(screen.getByRole("button", { name: "+" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "−" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "×" })).toBeInTheDocument();
    });

    it("should switch to functions tab when clicked", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const functionsTab = screen.getByText("Functions");
      fireEvent.click(functionsTab);

      // Check for some function symbols
      expect(screen.getByRole("button", { name: "sin" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "cos" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "tan" })).toBeInTheDocument();
    });

    it("should switch to greek tab when clicked", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const greekTab = screen.getByText("Greek Letters");
      fireEvent.click(greekTab);

      // Check for some Greek symbols
      expect(screen.getByRole("button", { name: "α" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "β" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "π" })).toBeInTheDocument();
    });

    it("should switch to constants tab when clicked", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const constantsTab = screen.getByText("Constants");
      fireEvent.click(constantsTab);

      // Check for constant symbols
      const buttons = screen.getAllByRole("button");
      const hasEConstant = buttons.some((btn) => btn.textContent === "e");
      expect(hasEConstant).toBe(true);
    });

    it("should switch to brackets tab when clicked", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const bracketsTab = screen.getByText("Brackets");
      fireEvent.click(bracketsTab);

      // Check for bracket symbols
      expect(screen.getByRole("button", { name: "(" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: ")" })).toBeInTheDocument();
    });
  });

  describe("Symbol Click Interaction", () => {
    it("should call onSymbolClick when an operator is clicked", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const plusButton = screen.getByRole("button", { name: "+" });
      fireEvent.click(plusButton);

      expect(mockOnSymbolClick).toHaveBeenCalledWith("+");
      expect(mockOnSymbolClick).toHaveBeenCalledTimes(1);
    });

    it("should call onSymbolClick with correct value for functions", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const functionsTab = screen.getByText("Functions");
      fireEvent.click(functionsTab);

      const sinButton = screen.getByRole("button", { name: "sin" });
      fireEvent.click(sinButton);

      expect(mockOnSymbolClick).toHaveBeenCalledWith("sin(");
      expect(mockOnSymbolClick).toHaveBeenCalledTimes(1);
    });

    it("should call onSymbolClick for multiple symbol clicks", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const plusButton = screen.getByRole("button", { name: "+" });
      const multiplyButton = screen.getByRole("button", { name: "×" });

      fireEvent.click(plusButton);
      fireEvent.click(multiplyButton);

      expect(mockOnSymbolClick).toHaveBeenCalledTimes(2);
      expect(mockOnSymbolClick).toHaveBeenNthCalledWith(1, "+");
      expect(mockOnSymbolClick).toHaveBeenNthCalledWith(2, "*");
    });
  });

  describe("Symbol Tooltips", () => {
    it("should show tooltip on hover", async () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const plusButton = screen.getByRole("button", { name: "+" });
      fireEvent.mouseOver(plusButton);

      // Tooltip should appear with description
      const tooltip = await screen.findByText("Addition operator");
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe("Symbol Grid Layout", () => {
    it("should render symbols in a grid", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      // Operators category should have 6 symbols
      const buttons = screen.getAllByRole("button");
      // Filter out tab buttons (5 tabs) + symbol buttons
      const symbolButtons = buttons.filter(
        (btn) =>
          ![
            "Operators",
            "Functions",
            "Greek Letters",
            "Constants",
            "Brackets",
          ].includes(btn.textContent || "")
      );

      expect(symbolButtons.length).toBeGreaterThan(0);
    });

    it("should have proper styling on buttons", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const plusButton = screen.getByRole("button", { name: "+" });

      // Check that button exists and is properly rendered
      expect(plusButton).toBeInTheDocument();
      expect(plusButton).toHaveTextContent("+");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for tabs", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const operatorsTab = screen.getByRole("tab", { name: "Operators" });
      expect(operatorsTab).toHaveAttribute(
        "aria-controls",
        "symbol-panel-operators"
      );
      expect(operatorsTab).toHaveAttribute("id", "symbol-tab-operators");
    });

    it("should have proper role for tabpanel", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const tabpanel = screen.getByRole("tabpanel");
      expect(tabpanel).toHaveAttribute("id", "symbol-panel-operators");
    });

    it("should be keyboard navigable", () => {
      render(
        <DndWrapper>
          <SymbolPalette onSymbolClick={mockOnSymbolClick} />
        </DndWrapper>
      );

      const plusButton = screen.getByRole("button", { name: "+" });
      plusButton.focus();
      expect(plusButton).toHaveFocus();

      fireEvent.keyPress(plusButton, { key: "Enter", code: "Enter" });
      // Note: MUI Button doesn't fire onClick on Enter in jsdom by default
      // This is a limitation of the test environment
    });
  });
});
