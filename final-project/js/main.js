let API_URL = "http://localhost/" // data2sound API
const SUPPORTED_PARAMETERS = ["pitch", "volume"] // specified by the API

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

let play_midi_note = (event) => {
    let current_sample = event.tick / config.ticks_per_samp
    highlight_plot_up_to_index(current_sample)

    // Move window up, always keeping a PLOT_MARGIN to the left and right of the current sample
    let x_max = plot.options.scales.xAxes[0].ticks.max
    if (x_max - current_sample <= PLOT_MARGIN)
        scroll_plot_forward_by(MAX_PLOT_WIDTH - 2 * PLOT_MARGIN)

    switch(event.name) {
        case "Note on":
            synth.triggerAttack(
                note = event.noteName, 
                velocity = event.velocity/127 // it took me way too long to figure out velocity is 0-1
            )

            break

        case "Note off":
            synth.triggerRelease()

            break

        case "Controller Change":
            switch(event.number) { // CC #
                case 7:
                    let volume_db = 40 * Math.log(event.value/127)

                    synth.volume.exponentialRampToValueAtTime(
                        volume_db,
                        Tone.context.currentTime + 0.001
                    )
                    break
            }

            break
    }
}

// Connects to the sound2data API to sonify into MIDI
let load_sonification_of = (parameter_map) => {
    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            parameter_map,
            config
        })
    })
        .then(response => response.text()) // extract the MIDI URI
        .then(data => midi_player.loadDataUri(data))
        .catch(reason => alert("Could not connect to the API."))
}

let show_section = (section_id) => {
    ["get-started-text", "file-configuration-section", "results-section"].forEach(section => {
        if(section_id === section)
            document.getElementById(section).style.display = "block"
        else
            document.getElementById(section).style.display = "none"
    })
}

let configure_parameter_map_for = (parse_results) => {
    current_parse_results = parse_results

    show_section("file-configuration-section")

    let file_configuration_table = document.getElementById("file-configuration-table")
    file_configuration_table.innerHTML = "" // reset from any old files, if we loaded a new file

    SUPPORTED_PARAMETERS.forEach(parameter => {
        let dropdown = document.getElementById(`${parameter}-selector`)

        let label = document.createElement("label")
        label.htmlFor = `${parameter}-selector`
        label.innerHTML = `Which column should map to ${parameter}? `

        let selector = document.createElement("select")
        selector.name = `${parameter}-selector`
        selector.id = `${parameter}-selector`
        
        let row = document.createElement("tr")
        let col1 = document.createElement("td")
        let col2 = document.createElement("td")

        file_configuration_table.appendChild(row)
        row.appendChild(col1)
        row.appendChild(col2)
        col1.appendChild(label)
        col2.appendChild(selector)

        let option = document.createElement('option')
        option.value = "None"
        option.innerHTML = "None"
        selector.appendChild(option)

        Object.keys(parse_results.data[0]).forEach(column => {
            let option = document.createElement('option')
            option.value = column
            option.innerHTML = column
            selector.appendChild(option)
        })
    })

    let submit_button = document.createElement("div")
    submit_button.innerHTML = "Sonify"

    let row = document.createElement("tr")
    let col = document.createElement("td")
    col.className = "button-cell"
    col.colSpan = 2
    file_configuration_table.appendChild(row)
    row.appendChild(col)
    col.appendChild(submit_button)

    submit_button.onclick = () => {
        let parameter_map = {}

        SUPPORTED_PARAMETERS.forEach(parameter => {
            let selector = document.getElementById(`${parameter}-selector`)
            if(selector.value !== "None")
            parameter_map[parameter] = parse_results.data.map(row => row[selector.value])
        })

        show_section("results-section")

        draw_plot_with(parameter_map)

        load_sonification_of(parameter_map)
    }
}

// We will be reusing this
let generate_synth = () => new Tone.MembraneSynth().toMaster()
let synth = generate_synth()
let midi_player = new MidiPlayer.Player(play_midi_note)
let current_parse_results = null

window.onload = () => {

    document.getElementById("play-button").onclick = (event) => { 
        Tone.context.resume().then(() => {

            if(midi_player.isPlaying()) {
                midi_player.pause()
                synth.triggerRelease() // don't hold any note-on
                synth.dispose() // it likes to die on pause so we'll just make a new one
                synth = null
                document.getElementById("play-button").innerHTML = "Play"
            } else {
                synth = generate_synth()
                midi_player.play()
                document.getElementById("play-button").innerHTML = "Pause"
            }
            
        })
    }

    document.getElementById("reset-button").onclick = (event) => {        
        midi_player.stop()
        midi_player.resetTracks()

        // We might have already disposed it on pause
        if(synth) {
            synth.triggerRelease()
            synth.dispose()
            synth = null
        }
        
        reset_plot()
        document.getElementById("play-button").innerHTML = "Play"
    }

    document.getElementById("new-file-button").onclick = () => show_section("get-started-text")
    document.getElementById("reconfigure-button").onclick = () => show_section("file-configuration-section")
    
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

