---
title: Data to Sound
permalink: /data2sound
---

<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/13.0.1/Tone.min.js"></script> <!-- GitHub Tonejs/Tone.js -->
<script src="{{ site.baseurl }}{% link final-project/js/libs/midiplayer.js %}"></script> <!-- GitHub grimmdude/MidiPlayerJS -->
<script src="{{ site.baseurl }}{% link final-project/js/libs/papaparse.min.js %}"></script> <!-- GitHub mholt/PapaParse -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@2.8.0"></script> <!-- chartjs.org -->

<script src="{{ site.baseurl }}{% link final-project/js/plotting.js %}"></script>
<script src="{{ site.baseurl }}{% link final-project/js/main.js %}"></script>

<div style="display: flex; flex-flow: row wrap; justify-content: center">
  <div id="plot-section" style="width: 40rem; height: 30rem; display: none">
    <canvas id="plot"></canvas>
  </div>
  <div id="media-control-section" style="display: none">
    <button id="play-button">Play</button>
    <button id="reset-button">Reset</button>
  </div>
</div>

