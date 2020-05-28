const API_URL = "http://localhost/" // data2sound API

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
    switch(event.name) {
        case "Note on":
            console.log(`Playing note ${event.noteName}`)

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
                    console.log(`Setting volume to ${volume_db} dB`)
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
}

let midi_player = new MidiPlayer.Player(play_midi_note)

let synth = new Tone.MembraneSynth().toMaster()


window.onload = () => {
    document.getElementById("play-button").onclick = (event) => {        
        Tone.context.resume()
            .then(() => midi_player.play())
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

                let parameter_map = {}

                // Later on, use this section to only push the parameters desired
                parameter_map["pitch"] = results.data.map(row => row[pitch_column])
                parameter_map["volume"] = results.data.map(row => row[volume_column])

                load_sonification_of(parameter_map)
            },

            error: err => { alert(err.message) },
            header: has_header,
            dynamicTyping: true
        })
    }
}

