let API_URL = "http://localhost/" // data2sound API

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

// We will be reusing this
let generate_synth = () => new Tone.MembraneSynth().toMaster()

let midi_player = new MidiPlayer.Player(play_midi_note)

let synth = generate_synth()

let parameter_map = {}

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
    
    document.ondragover = (event) => {
        // Don't let the browser open the file, part 1
        event.preventDefault()
    }
    
    document.ondrop = (event) => {
        // Don't let the browser open the file, part 2
        event.preventDefault()
        let has_header = confirm("Please confirm that the CSV file has a header row.")
    
        let file = event.dataTransfer.files[0]
        Papa.parse(file, {
            complete: results => {
                let pitch_column = prompt("Which column to use for pitch?", "pitch")
                let volume_column = prompt("Which column to use for volume?", "volume")

                //let parameter_map = {}

                // Later on, use this section to only push the parameters desired
                parameter_map["pitch"] = results.data.map(row => row[pitch_column])
                parameter_map["volume"] = results.data.map(row => row[volume_column])

                // Unhide things now
                document.getElementById("plot-section").style.display = "block"
                document.getElementById("media-control-section").style.display = "block" // unhide
                
                draw_plot_with(parameter_map)

                load_sonification_of(parameter_map)
            },

            error: err => { alert(err.message) },
            header: has_header,
            dynamicTyping: true
        })
    }
}

