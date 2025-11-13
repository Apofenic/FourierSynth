import { act, renderHook } from "@testing-library/react";
import {
  useAudioEngineStore,
  audioNodes,
} from "../../stores/useAudioEngineStore";

// Mock Web Audio API
const mockAudioContext = {
  sampleRate: 44100,
  currentTime: 0,
  createGain: jest.fn(() => ({
    gain: { value: 0 },
    connect: jest.fn(),
  })),
  createBiquadFilter: jest.fn(() => ({
    type: "lowpass",
    frequency: {
      value: 0,
      exponentialRampToValueAtTime: jest.fn(),
    },
    Q: {
      value: 0,
      linearRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    loop: false,
    playbackRate: {
      value: 1,
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    disconnect: jest.fn(),
  })),
  createBuffer: jest.fn(() => ({
    copyToChannel: jest.fn(),
  })),
  destination: {},
};

// Mock window.AudioContext - return the same mockAudioContext instance
(global as any).AudioContext = jest.fn(() => mockAudioContext);

describe("useAudioEngineStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAudioEngineStore.setState({
      isPlaying: false,
      oscillators: [
        { frequency: 220, volume: 0.75, isActive: true },
        { frequency: 220, volume: 0.75, isActive: true },
        { frequency: 220, volume: 0.75, isActive: true },
        { frequency: 220, volume: 0.75, isActive: true },
      ],
      masterVolume: 75,
      cutoffFrequency: 2000,
      resonance: 0,
    });

    // Clear all mocks and reset implementations
    jest.clearAllMocks();

    // Reset mock implementations to return fresh objects
    mockAudioContext.createGain.mockReturnValue({
      gain: { value: 0, linearRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as any);

    mockAudioContext.createBiquadFilter.mockReturnValue({
      type: "lowpass",
      frequency: {
        value: 0,
        exponentialRampToValueAtTime: jest.fn(),
      },
      Q: {
        value: 0,
        linearRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    } as any);

    mockAudioContext.createBufferSource.mockReturnValue({
      buffer: null,
      loop: false,
      playbackRate: {
        value: 1,
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
    } as any);

    mockAudioContext.createBuffer.mockReturnValue({
      copyToChannel: jest.fn(),
    } as any);

    // Reset audioNodes and set mock audio context
    audioNodes.audioContext = mockAudioContext as any;
    audioNodes.oscillators = Array(4)
      .fill(null)
      .map(() => ({
        sourceNode: null,
        gainNode: null,
        waveformBuffer: null,
        ampEnvelopeNode: null,
      }));
    audioNodes.mixerGainNode = null;
    audioNodes.masterGainNode = null;
    audioNodes.filterNodes = [];
  });

  describe("Initial State", () => {
    it("initializes with correct default values", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.oscillators).toHaveLength(4);
      expect(result.current.oscillators[0].frequency).toBe(220);
      expect(result.current.oscillators[0].isActive).toBe(true);
      expect(result.current.masterVolume).toBe(75);
      expect(result.current.cutoffFrequency).toBe(2000);
      expect(result.current.resonance).toBe(0);
    });

    it("provides all required actions", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      expect(typeof result.current.startAudio).toBe("function");
      expect(typeof result.current.stopAudio).toBe("function");
      expect(typeof result.current.updateOscillatorFrequency).toBe("function");
      expect(typeof result.current.updateOscillatorVolume).toBe("function");
      expect(typeof result.current.updateMasterVolume).toBe("function");
      expect(typeof result.current.toggleOscillator).toBe("function");
      expect(typeof result.current.updateFilter).toBe("function");
      expect(typeof result.current.setIsPlaying).toBe("function");
    });
  });

  describe("Audio Context Initialization", () => {
    it("initializes audio context", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current._initializeAudioContext();
      });

      expect(audioNodes.audioContext).toBeTruthy();
    });

    it("reuses existing audio context", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current._initializeAudioContext();
      });

      const firstContext = audioNodes.audioContext;

      act(() => {
        result.current._initializeAudioContext();
      });

      expect(audioNodes.audioContext).toBe(firstContext);
    });
  });

  describe("startAudio", () => {
    it("sets isPlaying to true", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.startAudio();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("initializes audio context", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.startAudio();
      });

      expect(audioNodes.audioContext).toBeTruthy();
    });
  });

  describe("stopAudio", () => {
    it("sets isPlaying to false", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      // First start audio
      act(() => {
        result.current.startAudio();
      });

      expect(result.current.isPlaying).toBe(true);

      // Then stop audio
      act(() => {
        result.current.stopAudio();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it("cleans up audio nodes", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      // Mock some audio nodes
      const mockOscillator = {
        stop: jest.fn(),
        disconnect: jest.fn(),
      };
      audioNodes.oscillators[0].sourceNode = mockOscillator as any;

      act(() => {
        result.current.stopAudio();
      });

      expect(mockOscillator.stop).toHaveBeenCalled();
      expect(mockOscillator.disconnect).toHaveBeenCalled();
      expect(audioNodes.oscillators[0].sourceNode).toBeNull();
    });

    it("handles already stopped nodes gracefully", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      const mockOscillator = {
        stop: jest.fn(() => {
          throw new Error("Already stopped");
        }),
        disconnect: jest.fn(),
      };
      audioNodes.oscillators[0].sourceNode = mockOscillator as any;

      // Should not throw
      expect(() => {
        act(() => {
          result.current.stopAudio();
        });
      }).not.toThrow();

      expect(audioNodes.oscillators[0].sourceNode).toBeNull();
    });
  });

  describe("updateOscillatorFrequency", () => {
    it("updates frequency state for specific oscillator", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.updateOscillatorFrequency(0, 440);
      });

      expect(result.current.oscillators[0].frequency).toBe(440);
      expect(result.current.oscillators[1].frequency).toBe(220); // unchanged
    });

    it("updates playback rate when audio is playing", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      // Setup mock nodes
      const mockPlaybackRate = {
        exponentialRampToValueAtTime: jest.fn(),
      };
      const mockOscillator = {
        playbackRate: mockPlaybackRate,
      };
      audioNodes.oscillators[0].sourceNode = mockOscillator as any;
      audioNodes.audioContext = mockAudioContext as any;

      act(() => {
        result.current.updateOscillatorFrequency(0, 440);
      });

      expect(mockPlaybackRate.exponentialRampToValueAtTime).toHaveBeenCalled();
    });
  });

  describe("updateOscillatorVolume", () => {
    it("updates volume state for specific oscillator", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.updateOscillatorVolume(0, 0.5);
      });

      expect(result.current.oscillators[0].volume).toBe(0.5);
      expect(result.current.oscillators[1].volume).toBe(0.75); // unchanged
    });

    it("updates gain node when active", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      // Setup mock gain node
      const mockGain = {
        gain: { linearRampToValueAtTime: jest.fn() },
      };
      audioNodes.oscillators[0].gainNode = mockGain as any;
      audioNodes.audioContext = mockAudioContext as any;

      act(() => {
        result.current.updateOscillatorVolume(0, 0.5);
      });

      expect(mockGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.5,
        expect.any(Number)
      );
    });
  });

  describe("updateMasterVolume", () => {
    it("updates master volume state", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.updateMasterVolume(50);
      });

      expect(result.current.masterVolume).toBe(50);
    });

    it("updates master gain node when active", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      // Setup mock master gain
      const mockMasterGain = {
        gain: { linearRampToValueAtTime: jest.fn() },
      };
      audioNodes.masterGainNode = mockMasterGain as any;
      audioNodes.audioContext = mockAudioContext as any;

      act(() => {
        result.current.updateMasterVolume(50);
      });

      expect(mockMasterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.5, // 50/100
        expect.any(Number)
      );
    });
  });

  describe("toggleOscillator", () => {
    it("updates oscillator active state", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.toggleOscillator(1, true);
      });

      expect(result.current.oscillators[1].isActive).toBe(true);

      act(() => {
        result.current.toggleOscillator(1, false);
      });

      expect(result.current.oscillators[1].isActive).toBe(false);
    });
  });

  describe("updateFilter", () => {
    it("updates filter parameters in state", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.updateFilter(5000, 10);
      });

      expect(result.current.cutoffFrequency).toBe(5000);
      expect(result.current.resonance).toBe(10);
    });

    it("updates filter node when active", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      // Setup mock filter
      const mockFrequency = {
        exponentialRampToValueAtTime: jest.fn(),
      };
      const mockQ = {
        linearRampToValueAtTime: jest.fn(),
      };
      const mockFilter = {
        frequency: mockFrequency,
        Q: mockQ,
      };
      audioNodes.filterNodes = [
        mockFilter,
        mockFilter,
        mockFilter,
        mockFilter,
      ] as any;
      audioNodes.audioContext = mockAudioContext as any;

      act(() => {
        result.current.updateFilter(5000, 10);
      });

      expect(mockFrequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        5000,
        expect.any(Number)
      );
      expect(mockQ.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe("setIsPlaying", () => {
    it("updates isPlaying state", () => {
      const { result } = renderHook(() => useAudioEngineStore());

      act(() => {
        result.current.setIsPlaying(true);
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.setIsPlaying(false);
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe("AudioNodeManager", () => {
    it("initializes audio context", () => {
      audioNodes.initializeAudioContext();
      expect(audioNodes.audioContext).toBeTruthy();
    });

    it("cleanup removes all nodes", () => {
      const mockOscillator = {
        stop: jest.fn(),
        disconnect: jest.fn(),
      };
      audioNodes.oscillators[0].sourceNode = mockOscillator as any;
      audioNodes.mixerGainNode = {} as any;
      audioNodes.masterGainNode = {} as any;
      audioNodes.filterNodes = [{} as any];

      audioNodes.cleanup();

      expect(mockOscillator.stop).toHaveBeenCalled();
      expect(audioNodes.oscillators[0].sourceNode).toBeNull();
      expect(audioNodes.mixerGainNode).toBeNull();
      expect(audioNodes.masterGainNode).toBeNull();
      expect(audioNodes.filterNodes).toEqual([]);
    });
  });
});
