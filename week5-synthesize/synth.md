---
title: Synthesize
permalink: /synth
---

<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script src="{{ site.baseurl }}{% link week5-synthesize/js/synth.js %}"></script>

> to combine two or more things to produce a new product
([Wiktionary](https://en.wiktionary.org/wiki/synthesize))

&nbsp;

### Type with the home row (asdfjkl;)

<div style="display: flex">
    <div style="width: 30%; height: 400px">
        <br><br>
        <label for="harmonicsSlider">Number of Overtones</label><br>
        <input type="range" min="1" max="16" value="16" step="1" id="harmonicsSlider"><br><br>
        <label for="brightnessSlider">Relative Amplitudes</label><br>
        <input type="range" min="0" max="2" value="1" step="0.01" id="brightnessSlider"><br><br>
        <label for="vibratoDepthSlider">Vibrato Depth</label><br>
        <input type="range" min="0.01" max="30" value="15" step="0.01" id="vibratoDepthSlider"><br><br>
        <label for="vibratoDelaySlider">Vibrato Onset Delay</label><br>
        <input type="range" min="0.01" max="3" value="2" step="0.01" id="vibratoDelaySlider">
    </div>
    <div id="harmonicsPlot" style="flex-grow: 1"></div>
</div>

### Explanation

This synthesizer combines up to 16 notes in the harmonic series to create sounds that respond to your input.

How to use the synthesizer:

- The keys of the home row play the notes of the A major scale.
- The spacebar will play the note one half-step above the previously sounded note. This is useful to perform a quick grace note into a higher note.
- Holding the shift key before pressing a key will play the note an octave up.

How to customize the sound:

- You can add or remove overtones from the harmonic series. At least the fundamental tone must be kept.
- You can adjust the amplitudes of the overtones by a scaling factor.
- You can increase the depth of the vibrato. Setting this to zero removes the vibrato.
- You can increase the time it takes to start the vibrato.

Fun facts:

- The frequency of the vibrato fluctuates slightly, to give a slightly more realistic feel and remove some rigidity.
- If no note is currently playing, pressing a key will give a harsher attack. If a note is currently playing, pressing a key will give a softer attack. This is to emulate the tonguing/slurring nature of playing a wind instrument.
  - Important tip: for slurred/legato note phrases, try not to release the first key until the second one is definitely held down. If a key is pressed within a (very short) window of time after a previous key is released, a sound will not be made. (This is due to the short amount of time it takes to process a note stop.)