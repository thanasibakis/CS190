---
title: Data to Sound
permalink: /data2sound
---

<style>
  body {
    transition: opacity 0.3s;
  }

  #api-url-input {
    width: 100%;
    box-sizing: border-box;
  }

  .button-cell {
    padding: 0;
  }

  /* The buttons */
  .button-cell div {
    box-sizing: border-box; /* otherwise the padding is added to the width, not inside it */
    width: 100%;
    height: 100%;
    padding: 8px;
    text-align: center;
    transition: background-color 0.3s;
  }

  .button-cell div:hover {
    background-color: #2a7ae220;
    cursor: pointer;
  }

  .flex-center {
    display: flex;
    flex-flow: column; 
    align-items: center;
    justify-content: center;
  }
</style>

<script src="{{ site.baseurl }}{% link final-project/js/libs/Tone.js %}"></script> <!-- GitHub Tonejs/Tone.js -->
<script src="{{ site.baseurl }}{% link final-project/js/libs/midiplayer.js %}"></script> <!-- GitHub grimmdude/MidiPlayerJS -->
<script src="{{ site.baseurl }}{% link final-project/js/libs/papaparse.min.js %}"></script> <!-- GitHub mholt/PapaParse -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@2.8.0"></script> <!-- chartjs.org -->

<script>
  // We need this here so Jekyll can autofill the path
  const DEMO_CSV_FILE_PATH = "{{ site.baseurl }}{% link final-project/demo.csv %}"
</script>


<script src="{{ site.baseurl }}{% link final-project/js/MIDISynth.js %}"></script> <!-- A class to interface with Tone.js more easily -->
<script src="{{ site.baseurl }}{% link final-project/js/main_plotting.js %}"></script> <!-- Helper functions for plotting charts of data -->
<script src="{{ site.baseurl }}{% link final-project/js/main_helpers.js %}"></script> <!-- Helper functions that are not plot-related -->
<script src="{{ site.baseurl }}{% link final-project/js/RowForTable.js %}"></script> <!-- A class to aid in building HTML tables using JS -->
<script src="{{ site.baseurl }}{% link final-project/js/main.js %}"></script> <!-- The main bulk of the client program (import this last!) -->

<div class="flex-center" style="height: 30em">
  <div id="get-started-section" class="flex-center">
    <h4>Drop a CSV file (with headers) on the page to get started</h4>
    <br/><br/>
    <table><tr><td class="button-cell"><div id="load-demo-button">Load the demo dataset</div></td></tr></table>
    <br/><br/>
    You may be interested in reading the <a href="{{ site.baseurl }}{% link final-project/manual.md %}">manual</a> for this program.
  </div>
  <div id="file-configuration-section" class="flex-center" style="display: none">
    <h4>Let's configure the program</h4>
    <br/>
    <table id="file-configuration-table"></table>
  </div>
  <div id="results-section" class="flex-center" style="display: none">
    <div style="padding: 30px 0; width: 600px">
      <canvas id="plot"></canvas>
    </div>
    <table><tr>
      <td class="button-cell"><div id="play-button">Play</div></td>
      <td class="button-cell"><div id="reset-button">Reset</div></td>
      <td class="button-cell"><div id="download-button">Download MIDI</div></td>
      <td class="button-cell"><div id="new-file-button">Load New</div></td>
      <td class="button-cell"><div id="reconfigure-button">Reconfigure</div></td>
    </tr></table>
  </div>
</div>

