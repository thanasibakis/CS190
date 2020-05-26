// Configuration

let PARAM = {
    // Minimal duration of each sonified segment, in ticks
    TICKS_PER_SAMP: 30,

    // Number of tones to use in sonification
    RANGE: 36,

    // Lowest MIDI note to use in sonification
    LOW: 52,

    // Function used to reduce a segment to a single value
    SUMMARIZE: array => Math.round(sum(array) / array.length), // mean

    // The scale of tones (in pitch class) from which to work with
    SCALE: [0, 2, 4, 5, 7, 9, 11] // C major scale
}


// Making Things Happen

let file_reader = new FileReader()

let midi_player = new MidiPlayer.Player(event => {
    console.log(event)

    if(event.name === "Note on")
        synth.triggerAttack(note = event.noteName, velocity = event.velocity/127) // it took me way too long to figure out velocity is 0-1
    else if(event.name === "Note off")
        synth.triggerRelease()
})

let most_recent_MIDI_output = null

let synth = new Tone.MembraneSynth().toMaster()


window.onload = () => {
    document.getElementById("play-button").onclick = (event) => {
        console.log("Click")
        
        Tone.context.resume().then(() => {
            midi_player.loadDataUri(most_recent_MIDI_output).play()
        })
    }
    
    document.ondragover = (event) => {
        // Don't let the browser open the file, part 1
        event.preventDefault()
    }
    
    
    document.ondrop = (event) => {
        // Don't let the browser open the file, part 2
        event.preventDefault()
    
        file_reader.readAsText(event.dataTransfer.files[0])
    }
    
    file_reader.onload = (event) => {
        let data = file_reader.result.split(',').map(parseFloat)
        
        most_recent_MIDI_output = sonification_of(data).dataUri()
    }
    
    file_reader.onerror = (event) => {
        console.log("Couldn't read that file.")
    }
}

