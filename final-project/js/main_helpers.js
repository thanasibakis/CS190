/*
    Triggers a download of the saved MIDI data in the browser, as a .MID file.
*/
let download_midi_file = () => {
    let link = document.createElement("a")
    link.href = current_state.midi_uri
    link.setAttribute("download", "sonification.mid")
    link.click()
}



/*
    Find the first MIDI event in the saved event log whose name matches the given name.

    This function also removes that event, and all events before it, from the log.
    This way, it can be used in the midi_player event loop to find the next matching event
    after the current event.
*/
let get_next_midi_event_matching = (name) => {
    try {
        let next_event = current_state.midi_event_log.shift()

        while(next_event.name !== name)
            next_event = current_state.midi_event_log.shift()

        return next_event
    } catch (error) {
        return null
    }
    
}



/*
    Once the playback hits the end of the track, this temporarily
    modifies the actions of the play button to reset everything before playing.

    This also force resets the synth, since it does not seem to obey the final
    note off message.
*/
let handle_end_of_track = () => {
    reset_synth()

    document.getElementById("play-button").innerHTML = "Play"

    document.getElementById("play-button").onclick = () => {
        stop_player()
        toggle_player()

        // Next time we click the play button, the usual thing will happen
        document.getElementById("play-button").onclick = toggle_player
    }

    // Clear the plot highlights
    // We don't use reset_plot because we don't want to scroll back automatically
    highlight_plot_between_indices(1, -1)
}



/*
    Stores a copy of the midi_player's saved MIDI events.

    See the comments on current_state.midi_event_log for why.
*/
let reset_midi_event_log = () => 
    current_state.midi_event_log = midi_player.getEvents()[0].slice() || null



/*
    Stop the current synth object and replace it with a new one.

    This is because the synth objects seem to have spontaneous issues with the reset functionality.
    Replacing the synth works better.
*/
let reset_synth = () => {
    if(synth) {
        synth.triggerRelease() // Don't hold any note ons before you are disposed
        synth.dispose()
        synth = null
    }
    
    // Tone.MembraneSynth doesn't work well, but let's emulate its sound
    synth = new Tone.Synth({
        pitchDecay:         0.05,
        octaves:            10,
        oscillator: {
            type:           "sine"
        },
        envelope: {
            attack:         0.001,
            decay:          0.4,
            sustain:        0.01,
            release:        1.4,
            attackCurve:    "exponential"
        }
    }).toMaster()
}



/*
    Adjusts the webapp UI to show the div with the given ID, and hides the others.

    section_id:
        The ID of the div to reveal in the UI.
        One of ["get-started-section", "file-configuration-section", "results-section"]
*/
let show_section = (section_id) => {
    ["get-started-section", "file-configuration-section", "results-section"].forEach(section => {
        if(section_id === section)
            document.getElementById(section).style.display = "flex"
        else
            document.getElementById(section).style.display = "none"
    })
}



/*
    Halt the midi_player and reset the MIDI track to 0.

    Also adjusts the data plot and saved event log to reflect the reset.
*/
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



/*
    If the midi_player is playing, pause it; otherwise, resume it.
*/
let toggle_player = () => {
    // Resume audio context
    Tone.start().then( () => {

        // The synth likes to die on pauses, so we'll just make a new one
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
