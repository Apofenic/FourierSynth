# Performance Concerns & Limitations

This document tracks known performance issues and optimization opportunities that need to be addressed.

---

## UI Performance

### Dial Rotation Choppiness (Variable Controls)

**Status:** Partially mitigated, still has noticeable lag

**Description:**
When rotating variable dials (e.g., `w`, `d`, `s`, `a`, `f`, `q` parameters in equation presets), the dial rotation animation appears choppy with visible frame skipping and lag.

**Current Mitigation:**

- Audio updates happen immediately (0ms latency) for real-time sound response
- Visualization updates are debounced (50ms) to reduce canvas redraw frequency
- Despite this optimization, UI still feels laggy during continuous dial rotation

**Root Cause:**
Waveform calculation (`calculateWaveformFromExpression` with 2048 samples) is computationally expensive. Even with debouncing, the combined cost of:

1. Mathematical expression evaluation (via Math.js compiled function)
2. 2048-sample waveform generation
3. Normalization calculations
4. Float32Array conversions
5. Canvas redraws

...creates noticeable performance impact during rapid parameter changes.

**Potential Solutions to Investigate:**

- Move waveform calculations to Web Worker to prevent main thread blocking
- Reduce waveform resolution during active dragging (e.g., 512 samples while dragging, 2048 on release)
- Implement requestAnimationFrame-based throttling instead of setTimeout debouncing
- Use OffscreenCanvas for waveform visualization rendering
- Cache waveform calculations for common parameter values
- Profile to identify if the bottleneck is calculation vs rendering

**Files Involved:**

- `/src/stores/useEquationBuilderStore.ts` - `updateVariable` method
- `/src/utils/helperFunctions.ts` - `calculateWaveformFromExpression` function
- `/src/components/Osc/WaveformVisualizer.tsx` - Canvas rendering

**Priority:** Medium - UX impact but not blocking functionality

---

## Filter Responsiveness

**Status:** Reported but not yet investigated

**Description:**
User mentioned "issues with filter changes not responding correctly in real time" - specific symptoms and conditions not yet documented.

**Next Steps:**

- Document specific scenarios where filter updates lag or don't apply
- Identify if issue is with UI feedback or actual audio processing
- Check if related to the same waveform calculation bottleneck

**Priority:** Unknown - needs investigation

---

## AudioBuffer Architecture Limitations

### FM & Ring Modulation Constraints

**Status:** Architectural limitation - requires significant refactoring to address

**Description:**
The current audio engine uses `AudioBufferSourceNode` with pre-rendered waveforms stored in `AudioBuffer` objects. While this approach works well for static waveforms and basic parameter modulation, it creates fundamental limitations for implementing frequency modulation (FM) and ring modulation:

**Current Architecture:**

- Waveforms calculated once from equation builder expressions
- Stored as `Float32Array` in `AudioBuffer` objects
- Playback controlled via `playbackRate` parameter for frequency changes
- Each oscillator is an `AudioBufferSourceNode` playing a looped buffer

**Specific Limitations:**

1. **No Audio-Rate Frequency Modulation (FM Synthesis)**
   - `playbackRate` parameter cannot accept audio-rate modulation input
   - AudioBufferSourceNode doesn't support connecting other oscillators to modulate frequency
   - True FM synthesis requires dynamic phase manipulation at audio rate (44.1kHz+)
   - Workaround: Control-rate modulation via LFOs is possible but not true FM

2. **No Direct Ring Modulation**
   - Ring modulation requires sample-by-sample multiplication of two audio signals
   - AudioBufferSourceNode outputs cannot be directly multiplied in real-time
   - Requires either:
     - Dynamic buffer regeneration (computationally expensive, introduces latency)
     - Migration to `OscillatorNode` or `AudioWorkletProcessor`

3. **Limited Oscillator Cross-Modulation**
   - Oscillator outputs can be tapped via `AnalyserNode` (per Task 4 in modulation planning)
   - Analyser data downsampled to control-rate (~60Hz) for performance
   - Cross-modulation limited to control-rate parameter changes
   - Cannot achieve classic FM/PM or ring mod timbres

**Performance Implications:**

- **Lazy Reading Implemented:** Oscillator taps only read when actively used as modulation sources (see Task 4.2)
- **Control-Rate Only:** Oscillator cross-modulation updates at ~60fps, not audio-rate
- **Buffer Reuse:** Float32Array buffers reused to minimize allocation overhead
- **Overhead When Used:** ~2% CPU impact when oscillators actively routed as control-rate mod sources

**Potential Solutions:**

- **Short-term:** Document limitation, implement control-rate cross-modulation for basic effects
- **Medium-term:** Add dedicated FM oscillator using `OscillatorNode` for true FM synthesis
- **Long-term:** Migrate to `AudioWorkletProcessor` for sample-level control and arbitrary modulation routing
  - Enables true FM synthesis, ring modulation, waveshaping
  - Maintains equation-based waveform generation
  - Performance considerations: AudioWorklet runs on separate thread but requires careful optimization

**Impact on Modulation Matrix (Tasks 1-9):**

- LFO → Parameter modulation: ✅ Fully functional
- Envelope → Parameter modulation: ✅ Fully functional
- Oscillator → Parameter modulation: ✅ Functional at control-rate (~60Hz)
- Oscillator → Oscillator frequency (FM): ⚠️ Control-rate only, not true FM synthesis
- Oscillator × Oscillator (Ring Mod): ❌ Not possible with current architecture

**Files Affected:**

- `/src/stores/useAudioEngineStore.ts` - AudioBuffer-based oscillator implementation
- `/src/types/audioEngineTypes.ts` - AudioBufferSourceNode type definitions
- Modulation planning (Task 4, Task 5) - Documents control-rate limitation

**Priority:** Medium-Low - Control-rate modulation covers most use cases; true FM/ring mod is advanced feature

**Workarounds Available:**

- Use LFO modulation for vibrato/tremolo effects (covers 80% of typical modulation needs)
- Layer multiple oscillators with envelope modulation for complex timbres
- Use filter modulation for dynamic tone shaping

---

## Simultaneous Parameter Modulation Limitations

### Current Architecture (Main Thread + requestAnimationFrame)

**Status:** Performance bottleneck at scale - documented in planning (Task 5.3)

**Description:**
The modulation matrix architecture processes all parameter modulations in a single `requestAnimationFrame` loop on the main JavaScript thread. While this works well for moderate use cases, it creates performance constraints when scaling to complex modulation routing.

**Current Implementation (Per Task 5.2):**

- **Single Master Update Loop:** Consolidated rAF callback runs at ~60fps
- **Sequential Processing:**
  1. Read LFO values from AnalyserNodes
  2. Calculate envelope values (ADSR stages)
  3. Read oscillator taps (lazy, only if actively routed)
  4. Calculate modulated values for all parameters with routes
  5. Batch apply Web Audio API parameter updates
- **Performance Budget:** Target <10ms per frame (60fps with 6ms headroom)

**Scaling Limitations:**

**Current Performance Targets (from Task 9.3):**

| Modulation Routes       | Target Frame Time | Target CPU Usage | Status                          |
| ----------------------- | ----------------- | ---------------- | ------------------------------- |
| 0 routes (baseline)     | 1-2ms             | 6-12%            | ✅ Acceptable                   |
| 5 routes (LFO/ENV)      | 3-5ms             | 18-30%           | ✅ Acceptable                   |
| 10 routes (+ osc taps)  | 6-9ms             | 36-54%           | ✅ Acceptable                   |
| 20 routes (full matrix) | 10-14ms           | <84%             | ⚠️ Limit - marginal performance |

**Specific Bottlenecks:**

1. **Main Thread Blocking**
   - All modulation calculations run on main thread
   - Competes with UI rendering, event handling, and other JavaScript
   - Risk of dropped frames during complex modulation + heavy UI interaction
   - Budget of 16.67ms/frame shared between all tasks

2. **AnalyserNode Overhead**
   - Each source read requires `getFloatTimeDomainData()` call (synchronous)
   - LFO reads: 2 × 128 samples = minimal overhead
   - Oscillator reads (when routed): up to 4 × 128 samples = ~2% CPU
   - No parallelization - sequential blocking reads

3. **Modulation Calculation Complexity**
   - Per parameter: O(n) where n = number of routes to that parameter
   - Total: O(m × n) where m = parameters with routes, n = avg routes per parameter
   - Example: 10 parameters × 2 routes each = 20 route calculations per frame
   - JavaScript math operations (scaling, clamping) add overhead

4. **Web Audio API Parameter Updates**
   - Batched but still require main thread scheduling
   - `setValueAtTime()` / `exponentialRampToValueAtTime()` calls add latency
   - Each parameter update triggers internal Web Audio graph recalculation

**Hard Limits (Current Architecture):**

- **Maximum Practical Routes:** ~20-25 before frame drops
- **Maximum Simultaneous Oscillator Taps:** 4 (all oscillators) but degrades performance
- **Update Rate:** Fixed at 60fps (16.67ms interval)
  - Cannot achieve higher modulation rates
  - Nyquist limit: ~30Hz modulation frequency before aliasing
- **Latency:** 16.67ms minimum (one frame) between modulation changes
- **Precision:** Control-rate only, no audio-rate modulation

**Performance Degradation Scenarios:**

- **Complex Equations + Full Matrix:** Waveform regeneration + 20 routes = likely frame drops
- **Mobile Devices:** Lower CPU budget, target ~10 routes maximum
- **Safari/iOS:** Typically 20-30% slower than Chrome, reduce route count accordingly
- **Background Tabs:** Browser throttles rAF to 1fps, modulation effectively stops

---

### Upgraded Architecture (AudioWorklet + WASM)

**Status:** Future enhancement - not yet implemented

**Description:**
Migrating to AudioWorklet with WASM-compiled modulation calculations would eliminate main thread bottlenecks and enable true audio-rate modulation. However, this comes with implementation complexity and new considerations.

**Proposed Architecture:**

- **AudioWorklet Processor:** Runs on dedicated audio rendering thread (high-priority, real-time)
- **WASM Module:** Compiled C/C++/Rust code for modulation calculations
  - Math operations 10-100× faster than JavaScript
  - SIMD vectorization for parallel processing
  - Zero-cost abstractions for complex routing logic
- **Shared State:** Atomic operations or message passing for parameter updates

**Performance Improvements:**

**Expected Performance (AudioWorklet + WASM):**

| Modulation Routes    | Frame Time | CPU Usage | Improvement         |
| -------------------- | ---------- | --------- | ------------------- |
| 0 routes (baseline)  | <0.5ms     | 2-4%      | 2-3× faster         |
| 5 routes (LFO/ENV)   | 0.5-1ms    | 6-12%     | 3-5× faster         |
| 10 routes            | 1-2ms      | 12-18%    | 6-9× faster         |
| 20 routes            | 2-4ms      | 18-28%    | 5-7× faster         |
| 50 routes            | 4-8ms      | 28-42%    | ✅ **Now feasible** |
| 100 routes (massive) | 8-14ms     | 42-70%    | ✅ **Now feasible** |

**Key Advantages:**

1. **Audio-Rate Processing**
   - Modulation calculations at sample rate (44.1kHz or 48kHz)
   - True FM synthesis, ring modulation, complex waveshaping
   - Per-sample precision eliminates control-rate aliasing
   - Enables phase modulation, through-zero FM, etc.

2. **Dedicated Thread**
   - AudioWorklet runs on separate high-priority audio thread
   - No competition with UI rendering or main thread JavaScript
   - Guaranteed real-time scheduling (no frame drops)
   - Continues running even when tab backgrounded (browser policy permitting)

3. **WASM Performance**
   - Math operations 10-100× faster than JavaScript for numeric computation
   - SIMD instructions for parallel modulation calculation
   - Efficient memory layout (no garbage collection pauses)
   - Predictable performance (no JIT warm-up required)

4. **Scalability**
   - **100+ simultaneous modulations feasible** at audio rate
   - Complex routing matrices (any source → any parameter)
   - Multiple modulation stages (e.g., LFO → Envelope → Filter Cutoff)
   - Per-voice modulation routing for polyphony

**Remaining Limitations (Even with AudioWorklet + WASM):**

1. **Implementation Complexity**
   - Requires C/C++/Rust expertise for WASM module
   - Complex state synchronization between main thread and AudioWorklet
   - Debugging more difficult (limited DevTools support for AudioWorklet)
   - Build toolchain complexity (Emscripten, wasm-pack, etc.)

2. **Memory Constraints**
   - AudioWorklet has limited memory budget (~4-16MB typical)
   - WASM module must be memory-efficient
   - Large waveform buffers may need streaming/paging
   - Equation-based waveforms may need on-demand generation per sample

3. **Browser Compatibility**
   - AudioWorklet requires modern browsers (Chrome 66+, Firefox 76+, Safari 14.1+)
   - WASM support near-universal but some older mobile browsers lack it
   - Fallback to current architecture required for compatibility

4. **Communication Overhead**
   - Main thread ↔ AudioWorklet messaging adds latency
   - Parameter changes require message passing (typically 1-2ms latency)
   - Real-time UI feedback may lag slightly behind audio
   - Shared memory (SharedArrayBuffer) mitigates but has security requirements

5. **Equation Builder Integration**
   - Current Math.js expression evaluation is JavaScript-only
   - Would need to either:
     - Compile expressions to WASM (complex, requires custom compiler)
     - Generate waveforms in JavaScript, transfer to AudioWorklet (adds latency)
     - Implement expression evaluator in WASM (duplicate logic)

6. **Development & Maintenance**
   - Two codebases: JavaScript (UI/logic) + WASM (audio processing)
   - Harder to onboard contributors without WASM experience
   - Build times increase (WASM compilation step)
   - Testing complexity (need audio-specific test infrastructure)

**Recommended Approach:**

- **Phase 1:** Implement current modulation matrix with documented limitations (Tasks 1-9)
- **Phase 2:** Profile real-world usage to identify actual bottlenecks
- **Phase 3:** Optimize hot paths in JavaScript (may be sufficient for most users)
- **Phase 4:** Consider AudioWorklet migration only if:
  - User demand for >20 simultaneous routes
  - Need for true FM/ring mod confirmed by user feedback
  - Team has WASM expertise or budget for learning curve

**Files That Would Be Affected:**

- `/src/audio-worklet/modulation-processor.worklet.ts` (new)
- `/src/wasm/modulation-engine.cpp` or `.rs` (new)
- `/src/stores/useAudioEngineStore.ts` (refactor to communicate with worklet)
- `/build/wasm/` (compiled WASM modules)
- `package.json` (add WASM build tools)

**Priority:** Low - Current architecture sufficient for MVP and typical usage patterns

---

## Future Considerations

### Areas to Monitor

- Memory usage with multiple active oscillators
- Performance with complex equations (deeply nested operations)
- Canvas rendering performance at different screen sizes/resolutions
- Audio glitching during heavy UI interactions
