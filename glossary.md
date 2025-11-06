# Glossary

## Audio Buffer

**Definition**: An audio buffer is a memory storage area that holds audio data in a digital format, typically as an array of floating-point numbers representing the amplitude of the audio waveform at discrete time intervals (samples).

**Details**:

- **Structure**: An audio buffer typically contains:
  - **Channels**: Separate arrays for each audio channel (e.g., left and right for stereo).
  - **Samples**: Individual amplitude values for each channel, sampled at a specific rate (e.g., 44,100 samples per second for CD-quality audio).
  - **Length**: The total number of samples in the buffer.
  - **Sample Rate**: The number of samples per second, determining the audio's playback speed and pitch.

- **Use Cases**:
  - **Playback**: Audio buffers are used to feed data to audio output devices.
  - **Synthesis**: Custom waveforms can be generated and stored in buffers for oscillators.
  - **Processing**: Effects like reverb, delay, or equalization operate on audio buffers.

- **In Web Audio API**: The `AudioBuffer` object is used to represent audio data. It allows you to create, manipulate, and play audio in a browser.

**Example**:
In the Web Audio API, you can create an `AudioBuffer` to store a custom waveform:

```typescript
const audioContext = new AudioContext();
const buffer = audioContext.createBuffer(1, 44100, 44100); // 1 channel, 1 second, 44.1kHz
const channelData = buffer.getChannelData(0); // Access the first channel
for (let i = 0; i < channelData.length; i++) {
  channelData[i] = Math.sin((2 * Math.PI * i) / 44100); // Fill with a sine wave
}
```
