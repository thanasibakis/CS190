"using strict"

/*
The algorithm:
    - if you type a vowel, it will add the respective note of the A9 chord as a long tone, held out indefinitely
        - adding the same vowel twice does nothing. the note will be held until all instances of its vowel are removed
    - if you type a consonant, it will pick a random tone between A5 and B8 inclusive, and generate short tones that ping at random
*/

const SHORT_LEVEL = 0.05 // For when multiple tones play, let's avoid clipping
const LONG_LEVEL = 0.1

// Consonants are sorted by frequency of use in the English language
const CONSONANTS = ['r', 't', 'n', 's', 'l', 'c', 'd', 'p', 'm', 'h', 'g', 'b', 'f', 'y', 'w', 'k', 'v', 'x', 'z', 'j', 'q']
const VOWELS = { 'a': 220, 'e': 277.18, 'i': 329.63, 'o': /*392*/ 415.30, 'u': 493.88 }
const NOTES = [880, 932.33, 987.77, 1046.5, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22, 1760, 1864.66, 1975.53, 2093, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44, 3520, 3729.31, 3951.07, 4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88, 7040, 7458.62, 7902.13]

let context = new AudioContext()
let short_tones = []
let long_tones = []
let long_tone_nodes = {}

let add_letter = (letter) => {
    if (letter in VOWELS)
        add_long_tone(VOWELS[letter])
    else if (letter in CONSONANTS) {
        frequency = NOTES[CONSONANTS.indexOf(letter)]
        short_tones.push(frequency)
        play_short_tone(frequency, delay = 0)
    }
}

let remove_letter = (letter) => {
    if (letter in VOWELS)
        remove_long_tone(VOWELS[letter])
    else
        short_tones.pop()
}

let add_long_tone = (frequency) => {
    if (!long_tones.includes(frequency)) { // Only create the sound if it's the first time seeing it
        long_tones.push(frequency)
        long_tone_nodes[frequency] = play_long_tone(frequency)
    } else
        long_tones.push(frequency)
}

let remove_long_tone = (frequency) => {
    long_tones.pop(frequency)

    if (!long_tones.includes(frequency)) { // Only delete the actual sound if every instance of that letter is gone
        long_tone_nodes[frequency].gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 2)
        delete long_tone_nodes[frequency]
    }
}

let play_short_tone = (frequency, scheduled_delay_ms) => {
    let oscillator = context.createOscillator()
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)
    oscillator.type = "sine"

    let gain = context.createGain()
    gain.gain.setValueAtTime(SHORT_LEVEL, context.currentTime)

    oscillator.connect(gain)
    gain.connect(context.destination)

    start_time = context.currentTime + scheduled_delay_ms / 1000
    oscillator.start(start_time) // Start the sound
    gain.gain.exponentialRampToValueAtTime(0.00001, start_time + 3) // Slowly end the sound

    if (short_tones.includes(frequency)) { // if it hasn't been removed, schedule it to play again!
        let delay = Math.floor(Math.random() * 3000) // play it sometime soon...
        window.setTimeout(play_short_tone, 500, frequency, delay) // ...but delay the recursion so it doesn't sound awful
    }
}

let play_long_tone = (frequency) => {
    let oscillator = context.createOscillator()
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)
    oscillator.type = "sine"

    let gain = context.createGain()

    oscillator.connect(gain)
    gain.connect(context.destination)
    gain.gain.setValueAtTime(0.0001, context.currentTime)

    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(LONG_LEVEL, context.currentTime + 0.25)
    
    return gain
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Backspace") {
        text = document.getElementById("text").innerHTML
        letter = text.charAt(text.length - 1)
        document.getElementById("text").innerHTML = text.slice(0, -1)

        remove_letter(letter)
    } else if (event.key.length === 1) { // aka is this an actual char and not "shift", etc.
        document.getElementById("text").innerHTML += event.key

        add_letter(event.key)
    }
})