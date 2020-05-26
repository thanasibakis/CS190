// Configuration


// run "browserify main.js -o bundle.js" to use these libraries
let MidiWriter = require("midi-writer-js")
let MidiPlayer = require("midi-player-js")
let Tone = require("tone") // high-level API for Web Audio

let file_reader = new FileReader()
let synth = new Tone.MonoSynth().toMaster(); synth.sync()
let midi_player = new MidiPlayer.Player(event => {
    console.log(event)

    if(event.name === "Note on")
        synth.triggerAttack(note = event.noteName, velocity = event.velocity)
    else if(event.name === "Note off")
        synth.triggerRelease(note = event.noteName)
})

let PARAM = {
    // Minimal duration of each sonified segment, in ticks
    TICKS_PER_SAMP: 30,

    // Musical base, number of tones to use
    BASE: 36,

    // Musical difference, the lowest pitch that can be distinguished
    DIFF: 52,

    // Function used to reduce a segment to a single value
    SUMMARIZE: array => Math.round(sum(array) / array.length), // mean

    // The scale of tones (in pitch class) from which to work with
    SCALE: [0, 2, 4, 5, 7, 9, 11] // C major scale
}









// Sonification Functions

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
    let pitch = Math.round(
        (segment_value - ts_stat.min) / (ts_stat.max - ts_stat.min) * PARAM.BASE + PARAM.DIFF
    )

    let pitch_class = (pitch - PARAM.DIFF) % 12

    if (!PARAM.SCALE.includes(pitch_class))
        pitch -= 1

    return new MidiWriter.NoteEvent({
        pitch: pitch,
        duration: "T" + duration
    })
}









// Segmentation Functions

let determine_num_segments_for = (ts) => {
    if (ts.length < 100)
        return Math.round(0.50 * ts.length)
    else if (ts.length < 200)
        return Math.round(0.35 * ts.length)
    else
        return Math.round(0.25 * ts.length)
}


// SSE of simple linear regression (assuming constant sample rate; treating index as x)
let error_of = (array) => {
    let Xbar = (array.length - 1) / 2
    let Ybar = sum(array) / array.length

    let m = sum(array.map((y, x) => (x - Xbar) * (y - Ybar))) /
        sum(array.map((y, x) => (x - Xbar) ** 2))

    let b = Ybar - m * Xbar

    let yhat = x => m * x + b

    return sum(array.map((y, x) => (y - yhat(x)) ** 2))
}


// Bottom-up algorithm for segmentation (Pazzani 6)
let segmentation_of = (ts, num_segments) => {
    let segments = []
    let costs = []

    // Create initial fine approximation
    for (let i = 0; i < ts.length - 1; i += 2)
        segments.push(ts.slice(i, i + 2))

    // Find cost of merging each pair of segments
    for (let i = 0; i < segments.length - 1; i++)
        costs[i] = error_of(merge_pair(segments, i, i + 1))

    while (segments.length > num_segments) {
        // Find cheapest pair to merge, and do so
        let index = argmin(costs)
        segments[index] = merge_pair(segments, index, index + 1)
        segments.splice(index + 1, 1)
        costs.splice(index, 1)

        // Update cost records
        if (index > 0)
            costs[index - 1] = error_of(merge_pair(segments, index - 1, index))

        costs[index] = error_of(merge_pair(segments, index, index + 1))
    }

    return segments
}









// Helper Functions

// https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
let argmin = array => array.map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1]
let merge_pair = (array, index1, index2) => array[index1].concat(array[index2])
let sum = array => array.reduce((a, b) => a + b)








// Making Things Happen

document.onclick = (event) => {
    console.log("Click")
    Tone.start() // context resume
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
    let output = sonification_of(data)

    midi_player.loadDataUri(output.dataUri()).play()
    Tone.Transport.start()
    
}

file_reader.onerror = (event) => {
    console.log("Couldn't read that file.")
}