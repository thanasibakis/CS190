"use strict"



/*
    Configures the capabilities of the data2sound API.
    
    These typically shouldn't be adjusted.

    DEFAULT_API_URL:
        This url points to where the node.js API server is expectd to be running, by default.
        This location is relative to the client machine (ie. "localhost" is the user, not the website host).
        By default, the site looks to the user's computer for the server.

    SUPPORTED_PARAMETERS:
        This list stores which aspects of the synth sound can be controlled using the data.
        This information is obtained by viewing the API documentation (or source code).

    SUPPORTED_MEASUREMENT_TYPES:
        This list stores the possible ways by which the data can be translated into values for MIDI messages. 
        This information is obtained by viewing the API documentation (or source code).
        For an understanding of these values, see the API documentation.
*/
const DEFAULT_API_URL = "http://localhost/" // data2sound API location (relative to the client machine)
const SUPPORTED_PARAMETERS = ["pitch", "volume"] // specified by the API
const SUPPORTED_MEASUREMENT_TYPES =  ["mean", "min", "max", "length"]



/*
    Configures the properties of the resulting sonification.

    This data structure is passed to the API.
    At the moment, there is no user-facing way to modify these, but that would be a neat goal to work on.
*/
let config = {
    // Minimal duration of each sonified segment, in ticks
    ticks_per_samp: 30,

    // Number of tones to use in sonification
    range: 36,

    // Lowest MIDI note to use in sonification
    low: 52,

    // The scale of tones (in pitch class) from which to work with
    scale: [0, 2, 4, 5, 7, 9, 11] // C major scale
}



/*
    Stores various tools to be used by the program.

    synth:
        The Tone.js synth that will produce sound in the browser.
    
    midi_player:
        The midi-player-js object that fires events for each MIDI message, all properly timed.
        Tempo is controlled with this object, although this is not a user-facing feature at the moment.

    current_state.midi_event_log:
        Stores a list of MIDI messages, copied from the midi_player.
        This is used because each time the midi_player receives a note on, we want to find the note off
        after it to determine the duration. This enables us to highlight all the plotted data points
        corresponding to the current note.

    current_state.midi_uri:
        Stores the MIDI file receied from the API, in case the user wants to download it after playback.

    current_state.plot:
        Stores the Chart.JS plot object to visualize the data as the sonification is playing.

*/
let synth = null

let midi_player = null

let current_state = {
    midi_event_log: null,
    midi_uri: null,
    plot: null
}



/*
    Builds the UI for configuring the program, which occurs after uploading data and before sonification.

    This cannot be written in HTML because the UI elements that configure each parameter
    are build around the given dataset (eg. the dropdown values are dataset columns).
    
    parse_results:
        An object returned by the Papa Parse CSV-parsing library.
        Contains a JS object representation of the uploaded CSV file.
*/
let build_configuration_ui = (parse_results) => {
 
    // Retrieve the HTML table that will hold the various configuration elements
    let file_configuration_table = document.getElementById("file-configuration-table")

    // Reset the contents of the table, in case we had previously loaded a different dataset
    file_configuration_table.innerHTML = ""

    // For each parameter that can be configured, ask the user which data column will map to it
    // and how that data column will be measured.
    SUPPORTED_PARAMETERS.forEach(parameter => {
        new RowForTable(file_configuration_table)
            .add_label(`Which column should map to ${parameter}?`, `${parameter}-selector`)
            .add_selector(`${parameter}-selector`, Object.keys(parse_results.data[0]), true)
            .add_label("How should that be measured?", `${parameter}-measurement-selector`)
            .add_selector(`${parameter}-measurement-selector`, SUPPORTED_MEASUREMENT_TYPES)
    })

    // Allow the user to modify the location of the data2sound API server
    new RowForTable(file_configuration_table)
        .add_label("Where can the API be reached?", "api-url-input")
        .add_text_input("api-url-input", DEFAULT_API_URL, 3)

    // Add the button to finalize the configuration and trigger the sonification
    new RowForTable(file_configuration_table)
        .add_button("Sonify", () => load_user_configuration_of(parse_results), 4)

    // Now that we've build the table, show it in the UI
    show_section("file-configuration-section")
}



/*
    This function fires whenever the midi_player wants to execute a MIDI message.

    event:
        Contains entries for the MIDI message, including note name, velocity, and/or CC number.
*/
let handle_midi_message = (event) => {
    // Translate the current MIDI tick into the corresponding data point index
    let current_sample = event.tick / config.ticks_per_samp

    // Move window up, always keeping a PLOT_MARGIN to the left and right of the current sample
    scroll_plot_if_needed_for(current_sample)

    switch(event.name) {
        case "Note on":
            // Play the note on the synth
            synth.triggerAttack(event.noteName, event.velocity/127)
            
            // Find the tick value of the corresponding note off message
            let end_of_note = get_next_midi_event_matching("Note off").tick / config.ticks_per_samp - 1

            // Highlight the plotted data points corresponding to this note
            highlight_plot_between_indices(current_sample, end_of_note)

            break

        case "Note off":
            // Stop the note on the synth
            synth.triggerRelease()

            break

        case "Controller Change":
            switch(event.number) { // CC #
                case 7:
                    // Convert the MIDI CC value to a decibel value, maxing out at 0
                    let volume_db = 40 * Math.log(event.value/127)
                    synth.volume.exponentialRampToValueAtTime(volume_db, Tone.context.currentTime + 0.001)

                    break
            }

            break
    }
}



/*
    Sends the observed data and configurations to the sound2data API
    and loads the resulting sonification into the midi_player.

    parameter_map:
        An object whose keys are a subset of the SUPPORTED_PARAMTERS list
        and whose values are arrays of numbers, corresponding to the data that
        will be used to sonify each parameter.

    measurement_types:
        An object whose keys are a subset of the SUPPORTED_PARAMETERS list
        and whose values are contained in SUPPORTED_MEASUREMENT_TYPES.
        See the API documentation for information on what the values mean.
*/
let load_sonification_of = (parameter_map, measurement_types) => {
    // Make the API call
    fetch(
        document.getElementById("api-url-input").value,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                parameter_map,
                measurement_types,
                config
            })
        }
    )

    // Extract the MIDI data from the API's response
    .then(response => response.text()) 

    // Store the MIDI data in the midi_player, and update the current_state
    .then(data => {
        // If anything's playing right now, stop it
        stop_player()

        // Generate a new player with the new MIDI file
        midi_player = new MidiPlayer.Player(handle_midi_message).loadDataUri(data)

        // The synth doesn't like obeying the last note off (not sure why),
        // so we'll force a stop at the end of the track
        midi_player.on("endOfFile", handle_end_of_track)

        // Updating the current state. See current_state comments.
        reset_midi_event_log()
        current_state.midi_uri = data
    })

    // If the connection or request was unsuccessful
    .catch(reason => alert("Could not connect to the API."))
}



/*
    Read the user's configuration of the data to parameter mapping from the UI
    and trigger the sonification process.

    parse_results:
        An object returned by the Papa Parse CSV-parsing library.
        Contains a JS object representation of the uploaded CSV file.
*/
let load_user_configuration_of = (parse_results) => {
    // Create the data structures that will be sent to the API
    let parameter_map = {}
    let measurement_types = {}

    // Retrieve the configuration for each parameter
    SUPPORTED_PARAMETERS.forEach(parameter => {
        let column_chosen = document.getElementById(`${parameter}-selector`).value
        let measurement_chosen = document.getElementById(`${parameter}-measurement-selector`).value

        if(column_chosen !== "None") { // Don't bother including this parameter if the user doesn't want to map data to it
            parameter_map[parameter] = parse_results.data.map(row => row[column_chosen])
            measurement_types[parameter] = measurement_chosen
        }
    })

    // Prevent a sonification attempt if the user did not map data to any parameters
    if (Object.keys(parameter_map).length === 0) {
        alert("Please configure at least one mapping.")
        return
    }

    // Load the playback UI and sonify the data
    show_section("results-section")
    draw_plot_of(parameter_map)
    load_sonification_of(parameter_map, measurement_types)
}



/*
    Setup for UI event handlers
*/
window.onload = () => {

    // These buttons map to single functions and are mainly self-explanatory
    document.getElementById("play-button").onclick          = toggle_player
    document.getElementById("reset-button").onclick         = stop_player
    document.getElementById("download-button").onclick      = download_midi_file
    document.getElementById("new-file-button").onclick      = () => show_section("get-started-section")
    document.getElementById("reconfigure-button").onclick   = () => show_section("file-configuration-section")

    // Parse the pre-built demo.csv file and build the configuration UI around it
    document.getElementById("load-demo-button").onclick = () =>
        Papa.parse(DEMO_CSV_FILE_PATH, {
            complete: build_configuration_ui,
            error: err => { alert(err.message) },
            download: true,
            header: true,
            dynamicTyping: true
        })
    
    // Don't let the browser open the file, part 1
    document.ondragover = (event) => event.preventDefault()

    // Fade out the UI when the user is dragging a file onto the application
    document.ondragenter = (event) => document.body.style.opacity = 0.1
    document.ondragleave = (event) => document.body.style.opacity = 1
    
    // Parse the user's desired CSV file and build the configuration UI around it
    document.ondrop = (event) => {
        // Don't let the browser open the file, part 2
        event.preventDefault()

        // Fade the UI back in
        document.body.style.opacity = 1
    
        Papa.parse(event.dataTransfer.files[0], {
            complete: build_configuration_ui,
            error: err => { alert(err.message) },
            header: true,
            dynamicTyping: true
        })
    }
}