# Final Project: Data to Sound

For this final assignment, we were given the flexibility to create anything in the realm of computer music. My implementation, as well as its explanation, can be found [here](https://thanasibakis.github.io/CS190/data2sound).

While the functionality of the program can be read about in the above link, I will take the time here to break down the code for this project, since there is a decent amount of it:

- `data2sound.md`, the main web page for the project. The components for this page get hidden/unhidden and constructed in the JavaScript code.
- `js/main.js`, the core functions that drive this program. Here, the UI is built, API calls are made, and the main MIDI player event loop is run.
- `js/main_helpers.js`, the support functions for the main JS file. These are necessary for the program to work, but I don't feel it's as necessary to see their source code to get an understanding of the program.
- `js/main_plotting.js`, the support functions for visualizing data. Like the prior file, the code here is not necessary to get an understanding of the program.
- `js/MIDISynth.js`, a wrapper for the Tone.js Synth. In particular, I wanted to be able to pass the synth MIDI CC events from the MIDI player loop cleanly, so this wrapper enables such functionality. 
- `js/RowForTable.js`, a class that enables simple construction of HTML tables from JS. I built this after getting frusterated with all the `document.createElement` calls clutterin my main JS file. I'm sure there are great frameworks that do this, but I didn't want to spend too much of my two weeks learning yet another piece of tech for this program :)
- `js/libs/*`, various JS libraries that I used. They are cited in the script tags of the data2sound Markdown page.

## Where does the sonification happen?

Great question! This project has a [sister repository](https://github.com/thanasibakis/data2sound) for that task, as the sonification is performed through an API call to a Node.js engine. An explanation of this can be found in the project manual at the first link.
