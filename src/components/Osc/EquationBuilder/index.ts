/**
 * EquationBuilder Component Exports
 *
 * Main entry point for the equation builder module.
 * Exports the main component and child components for flexibility.
 *
 * Part of PR #7: Main EquationBuilder Component
 */

// Main component (default export)
// export { default } from "./EquationBuilder";
export {EquationBuilder } from "./EquationBuilder";

// Child components (named exports)
export { EquationInput } from "./EquationInput";
export type { EquationInputHandle } from "./EquationInput";
export { EquationPreview } from "./EquationPreview";
export { VariableControlPanel } from "./VariableControlPanel";
export { default as SymbolPalette } from "./SymbolPalette";
