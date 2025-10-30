import { renderHook, act } from "@testing-library/react";
import { useSynthControlsStore } from "../useSynthControlsStore";

describe("useSynthControlsStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useSynthControlsStore());
    act(() => {
      result.current.setActiveKey(null);
      result.current.setKeyboardEnabled(true);
      result.current.setActiveTab("equation");
    });
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useSynthControlsStore());

    expect(result.current.harmonics).toHaveLength(8);
    expect(result.current.harmonics[0]).toEqual({
      amplitude: 1.0,
      phase: 0.5 * Math.PI,
    });
    expect(result.current.harmonics[1].amplitude).toBe(0.0);
    expect(result.current.keyboardNotes).toHaveLength(17);
    expect(result.current.activeKey).toBeNull();
    expect(result.current.keyboardEnabled).toBe(true);
    expect(result.current.activeTab).toBe("equation");
  });

  describe("updateHarmonic", () => {
    it("updates harmonic amplitude correctly", () => {
      const { result } = renderHook(() => useSynthControlsStore());

      act(() => {
        result.current.updateHarmonic(1, "amplitude", 0.75);
      });

      expect(result.current.harmonics[1].amplitude).toBe(0.75);
      expect(result.current.harmonics[1].phase).toBe(0.5 * Math.PI);
      expect(result.current.harmonics[0].amplitude).toBe(1.0);
    });

    it("updates harmonic phase correctly", () => {
      const { result } = renderHook(() => useSynthControlsStore());

      act(() => {
        result.current.updateHarmonic(2, "phase", Math.PI);
      });

      expect(result.current.harmonics[2].phase).toBe(Math.PI);
      expect(result.current.harmonics[2].amplitude).toBe(0.0);
    });

    it("does not affect other harmonics", () => {
      const { result } = renderHook(() => useSynthControlsStore());
      const originalHarmonics = [...result.current.harmonics];

      act(() => {
        result.current.updateHarmonic(3, "amplitude", 0.5);
      });

      for (let i = 0; i < 8; i++) {
        if (i === 3) continue;
        expect(result.current.harmonics[i]).toEqual(originalHarmonics[i]);
      }
    });
  });

  describe("keyboard state", () => {
    it("updates keyboard note state by key", () => {
      const { result } = renderHook(() => useSynthControlsStore());

      act(() => {
        result.current.updateKeyboardNoteState("a", true);
      });

      const noteA = result.current.keyboardNotes.find((n) => n.key === "a");
      expect(noteA?.isActive).toBe(true);

      act(() => {
        result.current.updateKeyboardNoteState("a", false);
      });

      const noteAAfter = result.current.keyboardNotes.find(
        (n) => n.key === "a"
      );
      expect(noteAAfter?.isActive).toBe(false);
    });

    it("sets and clears active key", () => {
      const { result } = renderHook(() => useSynthControlsStore());

      act(() => {
        result.current.setActiveKey("a");
      });

      expect(result.current.activeKey).toBe("a");

      act(() => {
        result.current.clearActiveKey("a");
      });

      expect(result.current.activeKey).toBeNull();
    });

    it("clearActiveKey only clears if matching current key", () => {
      const { result } = renderHook(() => useSynthControlsStore());

      act(() => {
        result.current.setActiveKey("a");
      });

      act(() => {
        result.current.clearActiveKey("b");
      });

      expect(result.current.activeKey).toBe("a");
    });

    it("toggles keyboard enabled state", () => {
      const { result } = renderHook(() => useSynthControlsStore());

      act(() => {
        result.current.setKeyboardEnabled(false);
      });

      expect(result.current.keyboardEnabled).toBe(false);

      act(() => {
        result.current.setKeyboardEnabled(true);
      });

      expect(result.current.keyboardEnabled).toBe(true);
    });
  });

  describe("UI state", () => {
    it("switches active tab", () => {
      const { result } = renderHook(() => useSynthControlsStore());

      act(() => {
        result.current.setActiveTab("harmonic");
      });

      expect(result.current.activeTab).toBe("harmonic");

      act(() => {
        result.current.setActiveTab("equation");
      });

      expect(result.current.activeTab).toBe("equation");
    });
  });

  describe("waveformData", () => {
    it("sets waveform data", () => {
      const { result } = renderHook(() => useSynthControlsStore());
      const testData = new Float32Array(2048).fill(0.5);

      act(() => {
        result.current.setWaveformData(testData);
      });

      expect(result.current.waveformData).toEqual(testData);
    });
  });
});
