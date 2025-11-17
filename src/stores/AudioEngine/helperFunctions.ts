import { ADSRTimes, EnvelopeOperation } from "../../types";

/**
 * Convert ADSR parameters (0-100) to time values in seconds
 */
export const convertADSRToTimes = (adsr: {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}): ADSRTimes => ({
  attack: 0.001 + (adsr.attack / 100) * 1.999,
  decay: 0.001 + (adsr.decay / 100) * 1.999,
  sustain: adsr.sustain / 100,
  release: 0.001 + (adsr.release / 100) * 3.999,
});

/**
 * Generate amplitude envelope operations
 */
export const createAmpEnvelopeOps = (
  times: ADSRTimes,
  startTime: number,
  isNoteOn: boolean,
  envelopeAmount: number = 1.0 // 0-1 range, where 0 = no envelope effect, 1 = full envelope
): EnvelopeOperation[] => {
  if (isNoteOn) {
    // Calculate the envelope range based on envelope amount
    // At 0% (envelopeAmount=0): envelope stays at 1.0 (no modulation)
    // At 100% (envelopeAmount=1): envelope goes from 0 to 1.0 (full modulation)
    // At 50% (envelopeAmount=0.5): envelope goes from 0.5 to 1.0
    const minValue = 1.0 - envelopeAmount;
    const peakValue = 1.0;
    const sustainValue = minValue + (peakValue - minValue) * times.sustain;

    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [minValue, startTime] },
      {
        method: "linearRampToValueAtTime",
        args: [peakValue, startTime + times.attack],
      },
      {
        method: "linearRampToValueAtTime",
        args: [sustainValue, startTime + times.attack + times.decay],
      },
    ];
  } else {
    // For release, always ramp to the minimum value based on envelope amount
    const minValue = 1.0 - envelopeAmount;

    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [startTime] }, // Will use current value
      {
        method: "linearRampToValueAtTime",
        args: [minValue, startTime + times.release],
      },
    ];
  }
};

/**
 * Generate filter envelope operations
 */
export const createFilterEnvelopeOps = (
  times: ADSRTimes,
  startTime: number,
  baseCutoff: number,
  envelopeAmount: number,
  isNoteOn: boolean
): EnvelopeOperation[] => {
  if (isNoteOn) {
    const maxCutoff = Math.min(20000, baseCutoff * 4);
    const targetCutoff = baseCutoff + (maxCutoff - baseCutoff) * envelopeAmount;
    const sustainCutoff =
      baseCutoff + (targetCutoff - baseCutoff) * times.sustain;

    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [baseCutoff, startTime] },
      {
        method: "exponentialRampToValueAtTime",
        args: [Math.max(20, targetCutoff), startTime + times.attack],
      },
      {
        method: "exponentialRampToValueAtTime",
        args: [
          Math.max(20, sustainCutoff),
          startTime + times.attack + times.decay,
        ],
      },
    ];
  } else {
    return [
      { method: "cancelScheduledValues", args: [startTime] },
      { method: "setValueAtTime", args: [startTime] }, // Will use current value
      {
        method: "exponentialRampToValueAtTime",
        args: [Math.max(20, baseCutoff), startTime + times.release],
      },
    ];
  }
};

/**
 * Apply envelope operations to an AudioParam
 */
export const applyEnvelopeOps = (
  param: AudioParam,
  operations: EnvelopeOperation[]
): void => {
  operations.forEach((op) => {
    if (op.method === "setValueAtTime" && op.args.length === 1) {
      // Special case: use current value
      param.setValueAtTime(param.value, op.args[0]);
    } else {
      (param[op.method] as any)(...op.args);
    }
  });
};
