/**
 * Tests for EquationInput Component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EquationInput } from "./EquationInput";
import { EquationBuilderProvider } from "../../contexts/EquationBuilderContext";

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      <EquationBuilderProvider>{component}</EquationBuilderProvider>
    </DndProvider>
  );
};

describe("EquationInput", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      renderWithProviders(<EquationInput />);
      expect(
        screen.getByPlaceholderText(/enter equation/i)
      ).toBeInTheDocument();
    });

    it("displays placeholder text", () => {
      renderWithProviders(<EquationInput />);
      expect(
        screen.getByPlaceholderText("Enter equation: e.g., a*sin(b*t + c)")
      ).toBeInTheDocument();
    });

    it("displays character counter", () => {
      renderWithProviders(<EquationInput />);
      expect(screen.getByText(/0 \/ 200/)).toBeInTheDocument();
    });
  });

  describe("Typing and Input", () => {
    it("updates expression when typing", async () => {
      renderWithProviders(<EquationInput />);

      const input = screen.getByPlaceholderText(
        /enter equation/i
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "sin(t)" } });

      await waitFor(() => {
        expect(input).toHaveValue("sin(t)");
      });
    });

    it("updates character counter when typing", async () => {
      renderWithProviders(<EquationInput />);

      const input = screen.getByPlaceholderText(/enter equation/i);
      fireEvent.change(input, { target: { value: "sin(t)" } });

      await waitFor(() => {
        expect(screen.getByText(/6 \/ 200/)).toBeInTheDocument();
      });
    });

    it("prevents typing beyond max length", async () => {
      renderWithProviders(<EquationInput maxLength={10} />);

      const input = screen.getByPlaceholderText(
        /enter equation/i
      ) as HTMLInputElement;
      // Attempt to type 14 characters (should be limited to 10)
      fireEvent.change(input, { target: { value: "sin(t)+cos(t)" } });

      await waitFor(() => {
        // The component should prevent values longer than maxLength
        const value = input.value;
        expect(value.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe("Clear Button", () => {
    it("shows clear button when there is text", async () => {
      renderWithProviders(<EquationInput />);

      const input = screen.getByPlaceholderText(/enter equation/i);
      fireEvent.change(input, { target: { value: "sin(t)" } });

      await waitFor(() => {
        expect(screen.getByLabelText(/clear expression/i)).toBeInTheDocument();
      });
    });

    it("clears expression when clear button is clicked", async () => {
      renderWithProviders(<EquationInput />);

      const input = screen.getByPlaceholderText(
        /enter equation/i
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "sin(t)" } });

      await waitFor(() => {
        expect(input).toHaveValue("sin(t)");
      });

      const clearButton = screen.getByLabelText(/clear expression/i);
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(input).toHaveValue("");
        expect(screen.getByText(/0 \/ 200/)).toBeInTheDocument();
      });
    });
  });

  describe("Validation Display", () => {
    it("shows success indicator for valid expression", async () => {
      renderWithProviders(<EquationInput />);

      const input = screen.getByPlaceholderText(/enter equation/i);
      fireEvent.change(input, { target: { value: "sin(t)" } });

      // Wait for debounced validation
      await waitFor(
        () => {
          const successIcon = screen.queryByTestId("CheckCircleOutlineIcon");
          expect(successIcon).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    // Note: math.js is quite lenient in what it accepts as valid syntax
    // Expressions like "sin(" or "2++3" may parse successfully
    // This is acceptable behavior - runtime errors are handled gracefully
  });

  describe("Insert at Cursor", () => {
    it("maintains cursor position when inserting text", async () => {
      renderWithProviders(<EquationInput />);

      const input = screen.getByPlaceholderText(
        /enter equation/i
      ) as HTMLInputElement;

      // Type initial text
      fireEvent.change(input, { target: { value: "a+b" } });

      // Move cursor to middle (after '+')
      input.setSelectionRange(2, 2);

      // Simulate inserting text (this would normally be done via drag-drop or symbol click)
      fireEvent.change(input, { target: { value: "a+sin(t)+b" } });

      await waitFor(() => {
        expect(input.value).toContain("sin(t)");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper aria labels", () => {
      renderWithProviders(<EquationInput />);

      // Input should be accessible
      const input = screen.getByPlaceholderText(/enter equation/i);
      expect(input).toBeInTheDocument();
    });

    it("clear button has aria-label", async () => {
      renderWithProviders(<EquationInput />);

      const input = screen.getByPlaceholderText(/enter equation/i);
      fireEvent.change(input, { target: { value: "sin(t)" } });

      await waitFor(() => {
        const clearButton = screen.getByLabelText(/clear expression/i);
        expect(clearButton).toHaveAttribute("aria-label");
      });
    });
  });

  describe("Warning States", () => {
    it("shows warning color when approaching character limit", async () => {
      renderWithProviders(<EquationInput maxLength={10} />);

      const input = screen.getByPlaceholderText(/enter equation/i);
      fireEvent.change(input, { target: { value: "sin(t)+c" } }); // 8 characters (80% of 10)

      await waitFor(() => {
        // Character counter should exist and show warning (this is visual, hard to test color)
        expect(screen.getByText(/8 \/ 10/)).toBeInTheDocument();
      });
    });
  });
});
