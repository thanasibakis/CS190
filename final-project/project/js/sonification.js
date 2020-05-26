// Sonification Functions

// Round a pitch to be tonal to the scale.
// The paper only used Cmaj so it hardcoded a decrement
let get_scale_tone_for = (midi_note) => {
    let decreased = midi_note
    let increased = midi_note

    let is_tonal = note => PARAM.SCALE.includes(note % 12)

    while (!is_tonal(decreased) || !is_tonal(increased)) {
        decreased--
        increased++
    }

    if (is_tonal(decreased))
        return decreased
    else
        return increased
}

let sonification_of = (ts) => {
    let ts_statistics = {
        min: Math.min(...ts),
        max: Math.max(...ts)
    }

    let midi_track = new MidiWriter.Track()

    segmentation_of(ts, determine_num_segments_for(ts))
        .map(segment => sonification_of_segment(segment, ts_statistics))
        .map(note_event => midi_track.addEvent(note_event))

    let write = new MidiWriter.Writer(midi_track)
    
    return write
}


let sonification_of_segment = (array, ts_stat) => {
    let duration = array.length * PARAM.TICKS_PER_SAMP
    let segment_value = PARAM.SUMMARIZE(array)

    // Map the segment value (within the total range of the data) to the range of pitches
    let note = Math.round(
        (segment_value - ts_stat.min) / (ts_stat.max - ts_stat.min) * PARAM.RANGE + PARAM.LOW
    )

    return new MidiWriter.NoteEvent({
        pitch: get_scale_tone_for(note),
        duration: "T" + duration
    })
}