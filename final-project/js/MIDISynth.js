/*
    A wrapper to the Tone.js Synth, abstracting away audio nodes into
    simple methods inspired by MIDI events.
*/
let MIDISynth = class {

    /*
        Creates a new MIDISynth object using "new MIDISynth(...)".

        synth_options:
            The options to be passed into the Tone.Synth constructor.
    */
    constructor(synth_options) {
        this.synth_options = synth_options
        
        this.reset()
    }



    /*
        Performs the given MIDI continuous controller change.

        Currently supports volume (CC #7) and pan (CC #10).

        cc_number:
            An integer representing which MIDI controller to change.
        
        cc_value:
            The value to change the controller to.
    */
    controller_change(cc_number, cc_value) {
        switch(cc_number) {
            case 7:
                // Convert the MIDI CC value to a decibel value, maxing out at 0
                let volume_db = 40 * Math.log(cc_value/127)

                this.synth.volume.value = volume_db

                break

            case 10:
                // Convert the (0 to 127) to a (-1 to 1)
                let pan = Math.cbrt((cc_value - 64) / 32 - 1) // the cube root makes the panning more noticeable

                this.panner.pan.value = pan
                
                break
        }
    }



    /*
        Stops the current note.
    */
    note_off() {
        this.synth.triggerRelease()
    }



    /*
        Plays a note.

        note_name:
            A string representing the name of the note to play (eg. "C4").
    */
    note_on(note_name) {
        this.synth.triggerAttack(note_name)
    }



    /*
        Stop the current synth object and replace it with a new one.

        This is because the Tone.Synth objects seem to have spontaneous issues with the reset functionality.
        Replacing the synth works better.
    */
    reset() {
        if(this.synth) { // We also use this method in the constructor
            this.synth.triggerRelease() // Don't hold any note ons before you are disposed
            this.synth.dispose()
            this.panner.dispose()
        }

        this.synth = new Tone.Synth(this.synth_options)
        this.panner = new Tone.Panner()

        this.synth.chain(this.panner, Tone.Master)
    }

}