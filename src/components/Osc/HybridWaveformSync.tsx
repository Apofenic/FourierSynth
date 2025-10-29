import { useEffect, useMemo } from "react";
import { useEquationBuilderStore, useSynthControlsStore } from "../../stores";
import {
  calculateWaveform,
  calculateWaveformFromExpression,
} from "../../utils/helperFunctions";

/**
 * Component that synchronizes hybrid waveform calculation
 * The equation defines the partial series formula, and the result is
 * synthesized using the harmonic layer.
 *
 * This component bridges the equation builder and synth controls contexts
 * to generate the waveform from the equation-defined partials.
 */
export const HybridWaveformSync: React.FC = () => {
  const compiledFunction = useEquationBuilderStore(
    (state) => state.compiledFunction
  );
  const expression = useEquationBuilderStore((state) => state.expression);
  const validationResult = useEquationBuilderStore(
    (state) => state.validationResult
  );
  const variables = useEquationBuilderStore((state) => state.variables);

  const harmonics = useSynthControlsStore((state) => state.harmonics);
  const setWaveformData = useSynthControlsStore(
    (state) => state.setWaveformData
  );
  const activeTab = useSynthControlsStore((state) => state.activeTab);

  // Create a stable serialized version of variables for dependency comparison
  const variablesKey = useMemo(() => JSON.stringify(variables), [variables]);

  useEffect(() => {
    try {
      // When on equation builder tab, use the equation to generate waveform
      if (activeTab === "equation") {
        // Generate waveform directly from equation (which includes summation)
        let equationWaveform: number[] = [];
        if (compiledFunction && validationResult.isValid) {
          equationWaveform = calculateWaveformFromExpression(
            compiledFunction,
            variables,
            2048
          );
        }

        // Convert to Float32Array and normalize
        const combinedWaveform = new Float32Array(2048);
        for (let i = 0; i < 2048; i++) {
          combinedWaveform[i] = equationWaveform[i] || 0;
        }

        // Normalize waveform to prevent clipping
        const maxAmplitude = Math.max(
          ...Array.from(combinedWaveform).map(Math.abs)
        );
        if (maxAmplitude > 1e-10) {
          for (let i = 0; i < combinedWaveform.length; i++) {
            combinedWaveform[i] /= maxAmplitude;
          }
        }

        setWaveformData(combinedWaveform);
      } else {
        // When on harmonic tab, use the harmonic controls
        const nValue = variables.n?.value ?? 1;
        const maxHarmonics = Math.min(Math.round(nValue), harmonics.length);
        const activeHarmonics = harmonics.slice(0, maxHarmonics);
        const harmonicWaveform = calculateWaveform(activeHarmonics);

        // Normalize waveform
        const maxAmplitude = Math.max(
          ...Array.from(harmonicWaveform).map(Math.abs)
        );
        if (maxAmplitude > 1e-10) {
          for (let i = 0; i < harmonicWaveform.length; i++) {
            harmonicWaveform[i] /= maxAmplitude;
          }
        }

        setWaveformData(harmonicWaveform);
      }
    } catch (error) {
      console.error("HybridWaveformSync effect error:", error);
    }
  }, [
    harmonics,
    compiledFunction,
    expression,
    validationResult.isValid,
    activeTab,
    variablesKey, // Use the memoized key
    setWaveformData,
    variables,
  ]);

  // This component doesn't render anything
  return null;
};
