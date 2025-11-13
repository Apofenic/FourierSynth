import { calculateDetunedFrequency } from "../utils/helperFunctions";

describe("calculateDetunedFrequency", () => {
  const A4 = 440; // Standard A4 pitch

  it("should return the same frequency with no detune", () => {
    const result = calculateDetunedFrequency(A4, 0, 0, 0);
    expect(result).toBeCloseTo(A4, 2);
  });

  it("should double the frequency with +1 octave", () => {
    const result = calculateDetunedFrequency(A4, 1, 0, 0);
    expect(result).toBeCloseTo(880, 2);
  });

  it("should halve the frequency with -1 octave", () => {
    const result = calculateDetunedFrequency(A4, -1, 0, 0);
    expect(result).toBeCloseTo(220, 2);
  });

  it("should shift up a semitone correctly", () => {
    const result = calculateDetunedFrequency(A4, 0, 1, 0);
    // A4 (440) -> A#4 (466.16)
    expect(result).toBeCloseTo(466.16, 2);
  });

  it("should shift down a semitone correctly", () => {
    const result = calculateDetunedFrequency(A4, 0, -1, 0);
    // A4 (440) -> G#4 (415.30)
    expect(result).toBeCloseTo(415.3, 2);
  });

  it("should shift up 12 semitones (one octave)", () => {
    const result = calculateDetunedFrequency(A4, 0, 12, 0);
    expect(result).toBeCloseTo(880, 2);
  });

  it("should shift up 50 cents (half a semitone)", () => {
    const result = calculateDetunedFrequency(A4, 0, 0, 50);
    // Half a semitone up from 440
    const expectedFreq = 440 * Math.pow(2, 0.5 / 12);
    expect(result).toBeCloseTo(expectedFreq, 2);
  });

  it("should combine octave, semitone, and cent adjustments", () => {
    const result = calculateDetunedFrequency(A4, 1, 3, 25);
    // +1 octave = 880 Hz
    // +3 semitones from 880 = C6
    // +25 cents
    const totalSemitones = 12 + 3 + 0.25;
    const expectedFreq = 440 * Math.pow(2, totalSemitones / 12);
    expect(result).toBeCloseTo(expectedFreq, 2);
  });

  it("should handle negative combinations", () => {
    const result = calculateDetunedFrequency(A4, -1, -3, -50);
    // -1 octave, -3 semitones, -50 cents
    const totalSemitones = -12 - 3 - 0.5;
    const expectedFreq = 440 * Math.pow(2, totalSemitones / 12);
    expect(result).toBeCloseTo(expectedFreq, 2);
  });

  it("should handle extreme octave shifts", () => {
    const upThree = calculateDetunedFrequency(A4, 3, 0, 0);
    expect(upThree).toBeCloseTo(440 * 8, 2); // 2^3 = 8

    const downThree = calculateDetunedFrequency(A4, -3, 0, 0);
    expect(downThree).toBeCloseTo(440 / 8, 2); // 2^-3 = 1/8
  });

  it("should handle extreme semitone shifts", () => {
    const upTwelve = calculateDetunedFrequency(A4, 0, 12, 0);
    expect(upTwelve).toBeCloseTo(880, 2);

    const downTwelve = calculateDetunedFrequency(A4, 0, -12, 0);
    expect(downTwelve).toBeCloseTo(220, 2);
  });

  it("should handle cent precision", () => {
    const up1Cent = calculateDetunedFrequency(A4, 0, 0, 1);
    const expectedFreq = 440 * Math.pow(2, 1 / 1200);
    expect(up1Cent).toBeCloseTo(expectedFreq, 5);
  });
});
