// Web Audio API Synthesizer for instant retail scan beeps
// No external mp3 or wav files required

export function playScannerBeep(success = true) {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      // High-pitched pleasant retail register beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // Error double-buzz for item not found
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    // Audio autoplay might be restricted before user interaction
    console.debug("Audio play failed:", e);
  }
}
