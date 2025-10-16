/**
 * Tests for EquationPreview Component
 *
 * Validates:
 * - LaTeX rendering
 * - Empty state handling
 * - Error handling
 * - Copy functionality
 * - Variable values display
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EquationPreview } from "./EquationPreview";
import { useEquationBuilder } from "../../contexts/EquationBuilderContext";

// Mock the context
jest.mock("../../contexts/EquationBuilderContext");
const mockUseEquationBuilder = useEquationBuilder as jest.MockedFunction<
  typeof useEquationBuilder
>;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock react-katex to avoid rendering issues in tests
jest.mock("react-katex", () => ({
  BlockMath: ({ math }: { math: string }) => (
    <div data-testid="block-math">{math}</div>
  ),
}));

describe("EquationPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("LaTeX Rendering", () => {
    it("renders LaTeX expression correctly", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "a*sin(b*t + c)",
        latexExpression: "a \\sin(bt + c)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      expect(screen.getByText("LaTeX Preview")).toBeInTheDocument();
      expect(screen.getByText("f(t) =")).toBeInTheDocument();
      expect(screen.getByTestId("block-math")).toHaveTextContent(
        "a \\sin(bt + c)"
      );
    });

    it("renders complex LaTeX expressions", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "exp(-a*t)*sin(b*t)",
        latexExpression: "e^{-at} \\sin(bt)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      expect(screen.getByTestId("block-math")).toHaveTextContent(
        "e^{-at} \\sin(bt)"
      );
    });
  });

  describe("Empty State", () => {
    it("shows placeholder when expression is empty", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "",
        latexExpression: "",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      expect(screen.getByText("f(t) = ?")).toBeInTheDocument();
    });

    it("shows placeholder when latexExpression is empty but expression exists", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "sin(t)",
        latexExpression: "",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      expect(screen.getByText("f(t) = ?")).toBeInTheDocument();
    });
  });

  describe("Copy Functionality", () => {
    it("copies LaTeX to clipboard on button click", async () => {
      const mockWriteText = navigator.clipboard.writeText as jest.Mock;
      mockWriteText.mockResolvedValue(undefined);

      mockUseEquationBuilder.mockReturnValue({
        expression: "a*sin(b*t)",
        latexExpression: "a \\sin(bt)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      const copyButton = screen.getByTestId("copy-latex-button");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith("a \\sin(bt)");
      });

      // Check for success message
      expect(
        await screen.findByText("LaTeX copied to clipboard!")
      ).toBeInTheDocument();
    });

    it("disables copy button when no LaTeX expression", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "",
        latexExpression: "",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      const copyButton = screen.getByTestId("copy-latex-button");
      expect(copyButton).toBeDisabled();
    });

    it("handles clipboard copy errors gracefully", async () => {
      const mockWriteText = navigator.clipboard.writeText as jest.Mock;
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockWriteText.mockRejectedValue(new Error("Clipboard access denied"));

      mockUseEquationBuilder.mockReturnValue({
        expression: "sin(t)",
        latexExpression: "\\sin(t)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      const copyButton = screen.getByTestId("copy-latex-button");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to copy LaTeX:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Variable Values Display", () => {
    it("displays current variable values", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "a*sin(b*t + c)",
        latexExpression: "a \\sin(bt + c)",
        variables: {
          a: {
            name: "a",
            value: 1.5,
            min: 0,
            max: 2,
            step: 0.01,
            defaultValue: 1.0,
          },
          b: {
            name: "b",
            value: 2.0,
            min: 0,
            max: 10,
            step: 0.1,
            defaultValue: 1.0,
          },
          c: {
            name: "c",
            value: 0.75,
            min: 0,
            max: 6.28,
            step: 0.01,
            defaultValue: 0.0,
          },
        },
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      expect(
        screen.getByText(/a = 1\.50, b = 2\.00, c = 0\.75/)
      ).toBeInTheDocument();
    });

    it("does not display variable values when no variables", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "sin(t)",
        latexExpression: "\\sin(t)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      // Should not have any monospace text with variable values
      const variableText = screen.queryByText(/=/);
      if (variableText) {
        expect(variableText).toHaveTextContent("f(t) =");
      }
    });

    it("formats variable values to 2 decimal places", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "a*sin(t)",
        latexExpression: "a \\sin(t)",
        variables: {
          a: {
            name: "a",
            value: 1.23456789,
            min: 0,
            max: 2,
            step: 0.01,
            defaultValue: 1.0,
          },
        },
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      expect(screen.getByText(/a = 1\.23/)).toBeInTheDocument();
    });
  });

  describe("Help Tooltip", () => {
    it("renders help icon with tooltip", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "sin(t)",
        latexExpression: "\\sin(t)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      // Help icon button should be present
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2); // Help + Copy buttons
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and roles", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "sin(t)",
        latexExpression: "\\sin(t)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      render(<EquationPreview />);

      // Check for heading
      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
        "LaTeX Preview"
      );

      // Check for buttons
      expect(screen.getByTestId("copy-latex-button")).toBeInTheDocument();
    });
  });

  describe("Responsive Layout", () => {
    it("renders with proper styling structure", () => {
      mockUseEquationBuilder.mockReturnValue({
        expression: "sin(t)",
        latexExpression: "\\sin(t)",
        variables: {},
        parsedExpression: null,
        compiledFunction: null,
        validationResult: { isValid: true, errors: [] },
        waveformData: [],
        updateExpression: jest.fn(),
        updateVariable: jest.fn(),
        updateVariableConfig: jest.fn(),
        resetVariable: jest.fn(),
        resetAllVariables: jest.fn(),
        loadTemplate: jest.fn(),
      });

      const { container } = render(<EquationPreview />);

      // Check that Paper component renders
      expect(container.firstChild).toHaveClass("MuiPaper-root");
    });
  });
});
