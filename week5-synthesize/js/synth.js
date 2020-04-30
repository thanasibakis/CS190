let harmonics = [...Array(16).keys()].map(k => k + 1)   // https://stackoverflow.com/questions/3895478/

const keymap = {
    'a': 220,       's': 246.94,    'd': 277.18,
    'f': 293.66,    'j': 329.63,    'k': 369.99,
    'l': 415.30,    ';': 440
}

const context = new AudioContext()

let note = {
    keyPressed: null, // keep track to distinguish a key down from a key hold
    frequency: null
}

// Create the individual tones that form our sound
note.pitchOscillators = harmonics.map(h => context.createOscillator())
note.pitchAmplifiers = note.pitchOscillators.map(osc => osc.connect(context.createGain()))
note.pitchAmplifiers.map((amp, i) => amp.gain.value = 1 / harmonics[i])

// Create the master gain node that will control the envelope of the entire note
note.masterAmplifier = context.createGain()
note.masterAmplifier.gain.value = 0

note.pitchAmplifiers.map(amp => amp.connect(note.masterAmplifier))
note.masterAmplifier.connect(context.destination)

const envelope = {
    tongued: {
        peakValue: 0.8,
        sustainedValue: 0.2
    },
    legato: {
        peakValue: 0.3,
        sustainedValue: 0.2
    }
}

// Create vibrato at 4 hz, reaching 15 cents after 4 seconds
note.detuneOscillator = context.createOscillator()
note.detuneOscillator.frequency.value = 4

note.detuneAmplifier = note.detuneOscillator.connect(context.createGain())
note.detuneAmplifier.gain.value = 0

note.pitchOscillators.map(osc => note.detuneAmplifier.connect(osc.detune))

const detuneEnvelope = {
    peakValue: 15,
    startTime: 2
}

// Modulate the vibrato frequency between 3.75 and 4.25, at a rate of 0.3 hz
note.detuneOscFrequencyOscillator = context.createOscillator()
note.detuneOscFrequencyOscillator.frequency.value = 0.3

note.detuneOscFrequencyAmplifier = context.createGain()
note.detuneOscFrequencyAmplifier.gain.value = 0.25 // gets added/subtracted to detuneOsc.freq

note.detuneOscFrequencyOscillator.connect(note.detuneOscFrequencyAmplifier).connect(note.detuneOscillator.frequency)

// Start all oscillators. We will use the master gain node to control on/off
note.pitchOscillators.map(osc => osc.start())
note.detuneOscillator.start()
note.detuneOscFrequencyOscillator.start()

// Plotting

let plotData = [{
    x: harmonics,
    y: note.pitchAmplifiers.map(amp => amp.gain.value),
    type: "bar",
    hoverinfo: "none",
    marker: {
        color: "rgb(0, 117, 255)"
        
    }
}]

let plotLayout = {
    title: "Harmonic Amplitudes",
    plot_bgcolor: "rgba(0, 0, 0, 0)",
    paper_bgcolor: "rgba(0, 0, 0, 0)"
}


getKeyPressed = (event) => {
    if (event.key === ':')
        return ';'

    return event.key.toLowerCase()
}
getFrequency = (event) => {
    const key = getKeyPressed(event).replace(':', ';')
    const octiveMultiplier = event.shiftKey ? 2 : 1

    if (key in keymap)
        return keymap[key] * octiveMultiplier
    else if (key === ' ')
        return note.frequency * Math.pow(2, 1 / 12) // adjust the old note slightly
}

document.onkeydown = (event) => {
    const keyPressed = getKeyPressed(event)

    // Chrome will pause the AudioContext until the first time a button is clicked, so let's re-enable our sound
    context.resume()

    let frequency = getFrequency(event)

    // If the key corresponds to an actual note (ie. not a key held down, or not a different key)
    if (frequency && keyPressed !== note.keyPressed) {
        playNote(frequency)
        note.keyPressed = keyPressed
        note.frequency = frequency
    }
}

// Prevent spacebar from scrolling page
// https://stackoverflow.com/questions/22559830/
window.onkeydown = (e) => {
    if (e.keyCode == 32 && e.target == document.body)
        e.preventDefault()
}

window.onload = () => {
    Plotly.newPlot("harmonicsPlot", plotData, plotLayout, { staticPlot: true })

    document.getElementById("harmonicsSlider").oninput = () => {
        const upperBound = parseFloat(document.getElementById("harmonicsSlider").value)
        const brightnessSlider = document.getElementById("brightnessSlider")
        const k = brightnessSlider.max - parseFloat(brightnessSlider.value)
        note.pitchAmplifiers.map((amp, index) => amp.gain.value = index+1 > upperBound ? 0 : 1 / Math.pow(harmonics[index], k))

        plotData[0].y = note.pitchAmplifiers.map(amp => amp.gain.value)
        Plotly.restyle("harmonicsPlot", 'y', [plotData[0].y])
    }

    document.getElementById("brightnessSlider").oninput = document.getElementById("harmonicsSlider").oninput

    document.getElementById("vibratoDepthSlider").oninput = () => {
        detuneEnvelope.peakValue = parseFloat(document.getElementById("vibratoDepthSlider").value)
        note.detuneAmplifier.gain.cancelScheduledValues(context.currentTime)
        note.detuneAmplifier.gain.exponentialRampToValueAtTime(detuneEnvelope.peakValue, context.currentTime + 0.0001)
    }

    document.getElementById("vibratoDelaySlider").oninput = () => {
        detuneEnvelope.startTime = parseFloat(document.getElementById("vibratoDelaySlider").value)
    }
}


document.onkeyup = (event) => {
    const keyPressed = getKeyPressed(event)

    // Stop the note if the keyup corresponds to the note actually being played right now
    if (note.keyPressed === keyPressed)
        stopNote()
}

playNote = (frequency) => {
    isTonguedNote = (note.keyPressed === null) // the previous note

    note.pitchOscillators.map((osc, i) => osc.frequency.value = frequency * harmonics[i])

    let env = isTonguedNote ? envelope.tongued : envelope.legato

    note.masterAmplifier.gain.exponentialRampToValueAtTime(env.peakValue, 0.1)
    note.masterAmplifier.gain.exponentialRampToValueAtTime(env.sustainedValue, 0.1)

    // setValueCurveAtTime doesn't really help here, because it seems cancelScheduledValues 
    // can only cancel things that haven't started yet. Instead of starting a slow ramp now,
    // we schedule a quick ramp later

    note.detuneAmplifier.gain.setTargetAtTime(
        target = detuneEnvelope.peakValue,
        startTime = context.currentTime + detuneEnvelope.startTime,
        timeConstant = 0.1 // duration
    )
}

stopNote = () => {
    note.masterAmplifier.gain.cancelScheduledValues(context.currentTime)
    note.masterAmplifier.gain.linearRampToValueAtTime(0, context.currentTime + 0.0001)

    note.detuneAmplifier.gain.cancelScheduledValues(context.currentTime)
    note.detuneAmplifier.gain.linearRampToValueAtTime(0, context.currentTime + 0.0001)

    note.keyPressed = null
}



