interface HarmonicParam {
  amplitude: number;
  phase: number;
}

export const calculateWaveform = (harmonics:HarmonicParam[]) => {
    const newWaveform = new Float32Array(2048);
    const TWO_PI = Math.PI * 2;
    for (let i = 0; i < newWaveform.length; i++) {
      const x = i / newWaveform.length;
      let value = 0;
      // Sum up the harmonic components using Fourier series
      harmonics.forEach((harmonic, idx) => {
        const harmonicNumber = idx + 1;
        value +=
          harmonic.amplitude *
          Math.sin(TWO_PI * harmonicNumber * x + harmonic.phase);
      });
      // Normalize to the range [-1, 1]
      newWaveform[i] = value;
    }
    // Normalize the waveform to prevent clipping
    const maxAmplitude = Math.max(...Array.from(newWaveform).map(Math.abs));
    if (maxAmplitude > 1) {
      for (let i = 0; i < newWaveform.length; i++) {
        newWaveform[i] /= maxAmplitude;
      }
    }
    return newWaveform;
};

export const generateFullEquation = (harmonics: HarmonicParam[]) => {
    const activeHarmonics = harmonics.filter((h) => h.amplitude > 0.001);
    if (activeHarmonics.length === 0) {
      return "f(t) = 0";
    }
    let generalForm = `f(t) = \\sum_{n=1}^{${harmonics.length}} A_n \\sin(n\\omega t + \\phi_n)`;
    generalForm += "\n\nWhere:";
    activeHarmonics.forEach((harmonic, idx) => {
      const n = idx + 1;
      const amplitude = harmonic.amplitude.toFixed(2);
      const phaseInPi = (harmonic.phase / Math.PI).toFixed(2);
      const phaseSign = harmonic.phase >= 0 ? "+" : "";
      generalForm += `\nA_${n} = ${amplitude}, \\phi_${n} = ${phaseSign}${phaseInPi}\\pi`;
    });
    return generalForm;
  };

export const generateFourierEquation = (harmonics:HarmonicParam[]) => {
    const activeHarmonics = harmonics.filter((h) => h.amplitude > 0.001);
    if (activeHarmonics.length === 0) {
      return "f(t) = 0";
    }
    return `f(t) = \\sum_{n=1}^{${harmonics.length}} A_n \\sin(n\\omega t + \\phi_n)`;
  };