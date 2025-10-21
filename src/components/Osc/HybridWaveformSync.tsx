import { useEffect } from "react";
import { useEquationBuilder } from "../../contexts/EquationBuilderContext";
import { useSynthControls } from "../../contexts/SynthControlsContext";
import {
  calculateWaveform,
  calculateWaveformFromExpression,
} from "../../utils/helperFunctions";

/**
 * Component that synchronizes hybrid waveform calculation
 * Combines equation builder base layer with harmonic additive layer
 *
 * This component bridges the equation builder and synth controls contexts
 * to generate a combined waveform from both sources.
 */
export const HybridWaveformSync: React.FC = () => {
  const equationBuilder = useEquationBuilder();
  const { harmonics, setWaveformData } = useSynthControls();

  useEffect(() => {
    // Generate base layer from equation (if equation exists and is valid)
    let baseWaveform: number[] = [];
    if (
      equationBuilder.compiledFunction &&
      equationBuilder.validationResult.isValid
    ) {
      baseWaveform = calculateWaveformFromExpression(
        equationBuilder.compiledFunction,
        equationBuilder.variables,
        2048
      );
    }

    // Generate harmonic layer (additive partials)
    const harmonicWaveform = calculateWaveform(harmonics);

    // Combine layers: base + harmonics
    const combinedWaveform = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      const base = baseWaveform[i] || 0;
      const harmonic = harmonicWaveform[i] || 0;
      combinedWaveform[i] = base + harmonic;
    }

    // Normalize combined waveform to prevent clipping
    const maxAmplitude = Math.max(
      ...Array.from(combinedWaveform).map(Math.abs)
    );
    if (maxAmplitude > 1e-10) {
      for (let i = 0; i < combinedWaveform.length; i++) {
        combinedWaveform[i] /= maxAmplitude;
      }
    }

    setWaveformData(combinedWaveform);
  }, [
    harmonics,
    equationBuilder.compiledFunction,
    equationBuilder.variables,
    equationBuilder.validationResult.isValid,
    setWaveformData,
  ]);

  // This component doesn't render anything
  return null;
};
