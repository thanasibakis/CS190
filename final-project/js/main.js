const DEFAULT_API_URL = "http://localhost/" // data2sound API location (relative to the client machine)
const SUPPORTED_PARAMETERS = ["pitch", "volume"] // specified by the API
const SUPPORTED_MEASUREMENT_TYPES =  ["mean", "min", "max", "length"]

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

let synth = null
let midi_player = null

let current_state = {
    parse_results: null,
    midi_uri: null,
    midi_event_log: null
}

let handle_midi_message = (event) => {
    let current_sample = event.tick / config.ticks_per_samp

    // Move window up, always keeping a PLOT_MARGIN to the left and right of the current sample
    scroll_plot_if_needed_for(current_sample)

    switch(event.name) {
        case "Note on":
            synth.triggerAttack(note = event.noteName, velocity = event.velocity/127)
            
            // Find the tick value of the corresponding note off message
            let end_of_note = get_next_midi_event_matching("Note off").tick / config.ticks_per_samp - 1
            highlight_plot_between_indices(current_sample, end_of_note)

            break

        case "Note off":
            synth.triggerRelease()

            break

        case "Controller Change":
            switch(event.number) { // CC #
                case 7:
                    let volume_db = 40 * Math.log(event.value/127)
                    synth.volume.exponentialRampToValueAtTime(volume_db, Tone.context.currentTime + 0.001)

                    break
            }

            break
    }
}

// Connects to the sound2data API to sonify into MIDI
let load_sonification_of = (parameter_map, measurement_types) => {
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
    ).then(response => response.text()) // extract the MIDI URI
     .then(data => {
         stop_player()
         midi_player = new MidiPlayer.Player(handle_midi_message).loadDataUri(data)
         reset_midi_event_log()
         current_state.midi_uri = data
      })
     .catch(reason => alert("Could not connect to the API."))
}

let show_section = (section_id) => {
    ["get-started-section", "file-configuration-section", "results-section"].forEach(section => {
        if(section_id === section)
            document.getElementById(section).style.display = "flex"
        else
            document.getElementById(section).style.display = "none"
    })
}

let download_midi_file = () => {
    let link = document.createElement("a")
    link.href = current_state.midi_uri
    link.setAttribute("download", "sonification.mid")
    link.click()
  }
  

// Builds the UI
let configure_parameter_map_for = (parse_results) => {
    current_parse_results = parse_results

    let file_configuration_table = document.getElementById("file-configuration-table")
    file_configuration_table.innerHTML = "" // reset from any old files, if we loaded a new file

    SUPPORTED_PARAMETERS.forEach(parameter => {
        let dropdown = document.getElementById(`${parameter}-selector`)

        new RowForTable(file_configuration_table)
            .add_label(`Which column should map to ${parameter}?`, htmlFor = `${parameter}-selector`)
            .add_selector(id = `${parameter}-selector`, options_list = Object.keys(parse_results.data[0]), none_option = true)
            .add_label("How should that be measured?", htmlFor = `${parameter}-measurement-selector`)
            .add_selector(id = `${parameter}-measurement-selector`, options_list = SUPPORTED_MEASUREMENT_TYPES)
    })

    new RowForTable(file_configuration_table)
        .add_label("Where can the API be reached?", htmlFor = "api-url-input")
        .add_text_input(id = "api-url-input", default_value = DEFAULT_API_URL, colSpan = 3)


    new RowForTable(file_configuration_table)
        .add_button("Sonify",
            onClick = () => {
                let parameter_map = {}
                let measurement_types = {}

                SUPPORTED_PARAMETERS.forEach(parameter => {
                    let column_chosen = document.getElementById(`${parameter}-selector`).value
                    let measurement_chosen = document.getElementById(`${parameter}-measurement-selector`).value

                    if(column_chosen !== "None") {
                        parameter_map[parameter] = parse_results.data.map(row => row[column_chosen])
                        measurement_types[parameter] = measurement_chosen
                    }
                })

                if (Object.keys(parameter_map).length === 0) {
                    alert("Please configure at least one mapping.")
                    return
                }

                show_section("results-section")
                draw_plot_of(parameter_map)
                load_sonification_of(parameter_map, measurement_types)
            },
            colSpan = 4
        )

    show_section("file-configuration-section")
}

// Make a copy of the MIDI track, so we can parse through it asynchronously
let reset_midi_event_log = () => 
    current_state.midi_event_log = midi_player.getEvents()[0].slice() || null


let get_next_midi_event_matching = (name) => {
    let next_event = current_state.midi_event_log.shift()

    while(next_event.name !== name)
        next_event = current_state.midi_event_log.shift()

    return next_event
}

let reset_synth = () => {
    if(synth) {
        synth.triggerRelease() // don't hold any note ons before you are disposed
        synth.dispose()
        synth = null
    }

    synth = new Tone.MembraneSynth().toMaster()
}


let toggle_player = () => {
    Tone.context.resume().then(() => {

        // It likes to die on pauses, so we'll just make a new one
        reset_synth()

        switch(midi_player.isPlaying()) {
            case true:
                midi_player.pause()
                document.getElementById("play-button").innerHTML = "Play"
                break

            case false:
                midi_player.play()
                document.getElementById("play-button").innerHTML = "Pause"
                break
        }

    })
}

let stop_player = () => {
    if(!midi_player)
        return 

    midi_player.stop()
    midi_player.resetTracks()

    reset_synth()
    reset_plot()
    reset_midi_event_log()
    document.getElementById("play-button").innerHTML = "Play"
}


window.onload = () => {

    document.getElementById("play-button").onclick = toggle_player
    document.getElementById("reset-button").onclick = stop_player
    document.getElementById("download-button").onclick = download_midi_file
    document.getElementById("new-file-button").onclick = () => show_section("get-started-section")
    document.getElementById("reconfigure-button").onclick = () => show_section("file-configuration-section")

    document.getElementById("load-demo-button").onclick = () => Papa.parse(
        DEMO_CSV_FILE_PATH,
        {
            complete: configure_parameter_map_for,
            error: err => { alert(err.message) },
            download: true,
            header: true,
            dynamicTyping: true
        }
    )
    
    document.ondragover = (event) => {
        // Don't let the browser open the file, part 1
        event.preventDefault()
    }

    document.ondragenter = (event) => {
        document.body.style.opacity = 0.1
    }

    document.ondragleave = (event) => {
        document.body.style.opacity = 1
    }
    
    document.ondrop = (event) => {
        // Don't let the browser open the file, part 2
        event.preventDefault()

        document.body.style.opacity = 1
    
        let file = event.dataTransfer.files[0]

        Papa.parse(file, {
            complete: configure_parameter_map_for,
            error: err => { alert(err.message) },
            header: true,
            dynamicTyping: true
        })
    }
}