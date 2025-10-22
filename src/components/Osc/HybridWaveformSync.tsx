import { useEffect, useMemo } from "react";
import { useEquationBuilder } from "../../contexts/EquationBuilderContext";
import { useSynthControls } from "../../contexts/SynthControlsContext";
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
  const equationBuilder = useEquationBuilder();
  const { harmonics, setWaveformData, activeTab } = useSynthControls();

  // Create a stable serialized version of variables for dependency comparison
  const variablesKey = useMemo(
    () => JSON.stringify(equationBuilder.variables),
    [equationBuilder.variables]
  );

  useEffect(() => {
    try {
      // When on equation builder tab, use the equation to generate waveform
      if (activeTab === "equation") {
        // Generate waveform directly from equation (which includes summation)
        let equationWaveform: number[] = [];
        if (
          equationBuilder.compiledFunction &&
          equationBuilder.validationResult.isValid
        ) {
          equationWaveform = calculateWaveformFromExpression(
            equationBuilder.compiledFunction,
            equationBuilder.variables,
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
        const nValue = equationBuilder.variables.n?.value ?? 1;
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
    equationBuilder.compiledFunction,
    equationBuilder.expression,
    equationBuilder.validationResult.isValid,
    activeTab,
    variablesKey, // Use the memoized key
    setWaveformData,
  ]);

  // This component doesn't render anything
  return null;
};
