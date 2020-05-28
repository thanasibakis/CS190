(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
window["midiWriterJs"] = require("midi-writer-js");
},{"midi-writer-js":2}],2:[function(require,module,exports){
(function (process,Buffer){
'use strict';

var tonalMidi = require('tonal-midi');

/**
 * MIDI file format constants.
 * @return {Constants}
 */
var Constants = {
  VERSION: require('../package.json').version,
  HEADER_CHUNK_TYPE: [0x4d, 0x54, 0x68, 0x64],
  // Mthd
  HEADER_CHUNK_LENGTH: [0x00, 0x00, 0x00, 0x06],
  // Header size for SMF
  HEADER_CHUNK_FORMAT0: [0x00, 0x00],
  // Midi Type 0 id
  HEADER_CHUNK_FORMAT1: [0x00, 0x01],
  // Midi Type 1 id
  HEADER_CHUNK_DIVISION: [0x00, 0x80],
  // Defaults to 128 ticks per beat
  TRACK_CHUNK_TYPE: [0x4d, 0x54, 0x72, 0x6b],
  // MTrk,
  META_EVENT_ID: 0xFF,
  META_TEXT_ID: 0x01,
  META_COPYRIGHT_ID: 0x02,
  META_TRACK_NAME_ID: 0x03,
  META_INSTRUMENT_NAME_ID: 0x04,
  META_LYRIC_ID: 0x05,
  META_MARKER_ID: 0x06,
  META_CUE_POINT: 0x07,
  META_TEMPO_ID: 0x51,
  META_SMTPE_OFFSET: 0x54,
  META_TIME_SIGNATURE_ID: 0x58,
  META_KEY_SIGNATURE_ID: 0x59,
  META_END_OF_TRACK_ID: [0x2F, 0x00],
  CONTROLLER_CHANGE_STATUS: 0xB0,
  // includes channel number (0)
  PROGRAM_CHANGE_STATUS: 0xC0,
  // includes channel number (0)
  PITCH_BEND_STATUS: 0xE0 // includes channel number (0)

};

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

/**
 * Static utility functions used throughout the library.
 */

var Utils = /*#__PURE__*/function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: "version",

    /**
     * Gets MidiWriterJS version number.
     * @return {string}
     */
    value: function version() {
      return Constants.VERSION;
    }
    /**
     * Convert a string to an array of bytes
     * @param {string} string
     * @return {array}
     */

  }, {
    key: "stringToBytes",
    value: function stringToBytes(string) {
      return string.split('').map(function (_char) {
        return _char.charCodeAt();
      });
    }
    /**
     * Checks if argument is a valid number.
     * @param {*} n - Value to check
     * @return {boolean}
     */

  }, {
    key: "isNumeric",
    value: function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    /**
     * Returns the correct MIDI number for the specified pitch.
     * Uses Tonal Midi - https://github.com/danigb/tonal/tree/master/packages/midi
     * @param {(string|number)} pitch - 'C#4' or midi note code
     * @return {number}
     */

  }, {
    key: "getPitch",
    value: function getPitch(pitch) {
      return tonalMidi.toMidi(pitch);
    }
    /**
     * Translates number of ticks to MIDI timestamp format, returning an array of
     * hex strings with the time values. Midi has a very particular time to express time,
     * take a good look at the spec before ever touching this function.
     * Thanks to https://github.com/sergi/jsmidi
     *
     * @param {number} ticks - Number of ticks to be translated
     * @return {array} - Bytes that form the MIDI time value
     */

  }, {
    key: "numberToVariableLength",
    value: function numberToVariableLength(ticks) {
      var buffer = ticks & 0x7F;

      while (ticks = ticks >> 7) {
        buffer <<= 8;
        buffer |= ticks & 0x7F | 0x80;
      }

      var bList = [];

      while (true) {
        bList.push(buffer & 0xff);
        if (buffer & 0x80) buffer >>= 8;else {
          break;
        }
      }

      return bList;
    }
    /**
     * Counts number of bytes in string
     * @param {string} s
     * @return {array}
     */

  }, {
    key: "stringByteCount",
    value: function stringByteCount(s) {
      return encodeURI(s).split(/%..|./).length - 1;
    }
    /**
     * Get an int from an array of bytes.
     * @param {array} bytes
     * @return {number}
     */

  }, {
    key: "numberFromBytes",
    value: function numberFromBytes(bytes) {
      var hex = '';
      var stringResult;
      bytes.forEach(function (_byte) {
        stringResult = _byte.toString(16); // ensure string is 2 chars

        if (stringResult.length == 1) stringResult = "0" + stringResult;
        hex += stringResult;
      });
      return parseInt(hex, 16);
    }
    /**
     * Takes a number and splits it up into an array of bytes.  Can be padded by passing a number to bytesNeeded
     * @param {number} number
     * @param {number} bytesNeeded
     * @return {array} - Array of bytes
     */

  }, {
    key: "numberToBytes",
    value: function numberToBytes(number, bytesNeeded) {
      bytesNeeded = bytesNeeded || 1;
      var hexString = number.toString(16);

      if (hexString.length & 1) {
        // Make sure hex string is even number of chars
        hexString = '0' + hexString;
      } // Split hex string into an array of two char elements


      var hexArray = hexString.match(/.{2}/g); // Now parse them out as integers

      hexArray = hexArray.map(function (item) {
        return parseInt(item, 16);
      }); // Prepend empty bytes if we don't have enough

      if (hexArray.length < bytesNeeded) {
        while (bytesNeeded - hexArray.length > 0) {
          hexArray.unshift(0);
        }
      }

      return hexArray;
    }
    /**
     * Converts value to array if needed.
     * @param {string} value
     * @return {array}
     */

  }, {
    key: "toArray",
    value: function toArray(value) {
      if (Array.isArray(value)) return value;
      return [value];
    }
    /**
     * Converts velocity to value 0-127
     * @param {number} velocity - Velocity value 1-100
     * @return {number}
     */

  }, {
    key: "convertVelocity",
    value: function convertVelocity(velocity) {
      // Max passed value limited to 100
      velocity = velocity > 100 ? 100 : velocity;
      return Math.round(velocity / 100 * 127);
    }
    /**
     * Gets the total number of ticks of a specified duration.
     * Note: type=='note' defaults to quarter note, type==='rest' defaults to 0
     * @param {(string|array)} duration
     * @return {number}
     */

  }, {
    key: "getTickDuration",
    value: function getTickDuration(duration) {
      if (Array.isArray(duration)) {
        // Recursively execute this method for each item in the array and return the sum of tick durations.
        return duration.map(function (value) {
          return Utils.getTickDuration(value);
        }).reduce(function (a, b) {
          return a + b;
        }, 0);
      }

      duration = duration.toString();

      if (duration.toLowerCase().charAt(0) === 't') {
        // If duration starts with 't' then the number that follows is an explicit tick count
        return parseInt(duration.substring(1));
      } // Need to apply duration here.  Quarter note == Constants.HEADER_CHUNK_DIVISION
      // Rounding only applies to triplets, which the remainder is handled below


      var quarterTicks = Utils.numberFromBytes(Constants.HEADER_CHUNK_DIVISION);
      return Math.round(quarterTicks * Utils.getDurationMultiplier(duration));
    }
    /**
     * Gets what to multiple ticks/quarter note by to get the specified duration.
     * Note: type=='note' defaults to quarter note, type==='rest' defaults to 0
     * @param {string} duration
     * @return {number}
     */

  }, {
    key: "getDurationMultiplier",
    value: function getDurationMultiplier(duration) {
      // Need to apply duration here.  Quarter note == Constants.HEADER_CHUNK_DIVISION
      switch (duration) {
        case '0':
          return 0;

        case '1':
          return 4;

        case '2':
          return 2;

        case 'd2':
          // Dotted half
          return 3;

        case 'dd2':
          // Double dotted half
          return 3.5;

        case '4':
          return 1;

        case '4t':
          return 0.666;

        case 'd4':
          // Dotted quarter
          return 1.5;

        case 'dd4':
          // Double dotted quarter
          return 1.75;

        case '8':
          return 0.5;

        case '8t':
          // For 8th triplets, let's divide a quarter by 3, round to the nearest int, and substract the remainder to the last one.
          return 0.33;

        case 'd8':
          // Dotted eighth
          return 0.75;

        case 'dd8':
          // Double dotted eighth
          return 0.875;

        case '16':
          return 0.25;

        case '16t':
          return 0.166;

        case '32':
          return 0.125;

        case '64':
          return 0.0625;
        //return type === 'note' ? 1 : 0;

      }

      throw duration + ' is not a valid duration.';
    }
  }]);

  return Utils;
}();

/**
 * Holds all data for a "note on" MIDI event
 * @param {object} fields {data: []}
 * @return {NoteOnEvent}
 */

var NoteOnEvent = /*#__PURE__*/function () {
  function NoteOnEvent(fields) {
    _classCallCheck(this, NoteOnEvent);

    // Set default fields
    fields = Object.assign({
      channel: 1,
      startTick: null,
      velocity: 50,
      wait: 0
    }, fields);
    this.type = 'note-on';
    this.channel = fields.channel;
    this.pitch = fields.pitch;
    this.wait = fields.wait;
    this.velocity = fields.velocity;
    this.startTick = fields.startTick;
    this.midiNumber = Utils.getPitch(this.pitch);
    this.tick = null;
    this.delta = null;
    this.data = fields.data;
  }
  /**
   * Builds int array for this event.
   * @param {Track} track - parent track
   * @return {NoteOnEvent}
   */


  _createClass(NoteOnEvent, [{
    key: "buildData",
    value: function buildData(track) {
      this.data = []; // Explicitly defined startTick event

      if (this.startTick) {
        this.tick = this.startTick; // If this is the first event in the track then use event's starting tick as delta.

        if (track.tickPointer == 0) {
          this.delta = this.tick;
        }
      } else {
        this.delta = Utils.getTickDuration(this.wait);
        this.tick = track.tickPointer + this.delta;
      }

      this.data = Utils.numberToVariableLength(this.delta).concat(this.getStatusByte(), this.midiNumber, Utils.convertVelocity(this.velocity));
      return this;
    }
    /**
     * Gets the note on status code based on the selected channel. 0x9{0-F}
     * Note on at channel 0 is 0x90 (144)
     * 0 = Ch 1
     * @return {number}
     */

  }, {
    key: "getStatusByte",
    value: function getStatusByte() {
      return 144 + this.channel - 1;
    }
  }]);

  return NoteOnEvent;
}();

/**
 * Holds all data for a "note off" MIDI event
 * @param {object} fields {data: []}
 * @return {NoteOffEvent}
 */

var NoteOffEvent = /*#__PURE__*/function () {
  function NoteOffEvent(fields) {
    _classCallCheck(this, NoteOffEvent);

    // Set default fields
    fields = Object.assign({
      channel: 1,
      velocity: 50,
      tick: null
    }, fields);
    this.type = 'note-off';
    this.channel = fields.channel;
    this.pitch = fields.pitch;
    this.duration = fields.duration;
    this.velocity = fields.velocity;
    this.midiNumber = Utils.getPitch(this.pitch);
    this.tick = fields.tick;
    this.delta = Utils.getTickDuration(this.duration);
    this.data = fields.data;
  }
  /**
   * Builds int array for this event.
   * @param {Track} track - parent track
   * @return {NoteOffEvent}
   */


  _createClass(NoteOffEvent, [{
    key: "buildData",
    value: function buildData(track) {
      if (this.tick === null) {
        this.tick = this.delta + track.tickPointer;
      }

      this.data = Utils.numberToVariableLength(this.delta).concat(this.getStatusByte(), this.midiNumber, Utils.convertVelocity(this.velocity));
      return this;
    }
    /**
     * Gets the note off status code based on the selected channel. 0x8{0-F}
     * Note off at channel 0 is 0x80 (128)
     * 0 = Ch 1
     * @return {number}
     */

  }, {
    key: "getStatusByte",
    value: function getStatusByte() {
      return 128 + this.channel - 1;
    }
  }]);

  return NoteOffEvent;
}();

/**
 * Wrapper for noteOnEvent/noteOffEvent objects that builds both events.
 * @param {object} fields - {pitch: '[C4]', duration: '4', wait: '4', velocity: 1-100}
 * @return {NoteEvent}
 */

var NoteEvent = /*#__PURE__*/function () {
  function NoteEvent(fields) {
    _classCallCheck(this, NoteEvent);

    // Set default fields
    fields = Object.assign({
      channel: 1,
      repeat: 1,
      sequential: false,
      startTick: null,
      velocity: 50,
      wait: 0
    }, fields);
    this.data = [];
    this.type = 'note';
    this.pitch = Utils.toArray(fields.pitch);
    this.channel = fields.channel;
    this.duration = fields.duration;
    this.grace = fields.grace;
    this.repeat = fields.repeat;
    this.sequential = fields.sequential;
    this.startTick = fields.startTick;
    this.velocity = fields.velocity;
    this.wait = fields.wait;
    this.tickDuration = Utils.getTickDuration(this.duration);
    this.restDuration = Utils.getTickDuration(this.wait);
    this.events = []; // Hold actual NoteOn/NoteOff events
  }
  /**
   * Builds int array for this event.
   * @return {NoteEvent}
   */


  _createClass(NoteEvent, [{
    key: "buildData",
    value: function buildData() {
      var _this = this;

      // Reset data array
      this.data = [];
      var tickDuration = this.tickDuration;
      var restDuration = this.restDuration; // Apply grace note(s) and subtract ticks (currently 1 tick per grace note) from tickDuration so net value is the same

      if (this.grace) {
        var graceDuration = 1;
        this.grace = Utils.toArray(this.grace);
        this.grace.forEach(function (pitch) {
          var noteEvent = new NoteEvent({
            pitch: _this.grace,
            duration: 'T' + graceDuration
          });
          _this.data = _this.data.concat(noteEvent.data);
          tickDuration -= graceDuration;
        });
      } // fields.pitch could be an array of pitches.
      // If this.sequential === true then it's a sequential string of notes that requires separate NoteOnEvents.

      if (!this.sequential) {
        // Handle repeat
        for (var j = 0; j < this.repeat; j++) {
          // Note on
          this.pitch.forEach(function (p, i) {
            if (i == 0) {
              var noteOnNew = new NoteOnEvent({
                channel: _this.channel,
                wait: _this.wait,
                velocity: _this.velocity,
                pitch: p,
                startTick: _this.startTick
              });
            } else {
              // Running status (can ommit the note on status)
              //noteOn = new NoteOnEvent({data: [0, Utils.getPitch(p), Utils.convertVelocity(this.velocity)]});
              var noteOnNew = new NoteOnEvent({
                channel: _this.channel,
                wait: 0,
                velocity: _this.velocity,
                pitch: p,
                startTick: _this.startTick
              });
            }

            _this.events.push(noteOnNew);
          }); // Note off

          this.pitch.forEach(function (p, i) {
            if (i == 0) {
              //noteOff = new NoteOffEvent({data: Utils.numberToVariableLength(tickDuration).concat(this.getNoteOffStatus(), Utils.getPitch(p), Utils.convertVelocity(this.velocity))});
              var noteOffNew = new NoteOffEvent({
                channel: _this.channel,
                duration: _this.duration,
                velocity: _this.velocity,
                pitch: p,
                tick: _this.startTick !== null ? Utils.getTickDuration(_this.duration) - _this.startTick : null
              });
            } else {
              // Running status (can ommit the note off status)
              //noteOff = new NoteOffEvent({data: [0, Utils.getPitch(p), Utils.convertVelocity(this.velocity)]});
              var noteOffNew = new NoteOffEvent({
                channel: _this.channel,
                duration: 0,
                velocity: _this.velocity,
                pitch: p,
                tick: _this.startTick !== null ? Utils.getTickDuration(_this.duration) - _this.startTick : null
              });
            }

            _this.events.push(noteOffNew);
          });
        }
      } else {
        // Handle repeat
        for (var j = 0; j < this.repeat; j++) {
          this.pitch.forEach(function (p, i) {
            // restDuration only applies to first note
            if (i > 0) {
              restDuration = 0;
            } // If duration is 8th triplets we need to make sure that the total ticks == quarter note.
            // So, the last one will need to be the remainder


            if (_this.duration === '8t' && i == _this.pitch.length - 1) {
              var quarterTicks = Utils.numberFromBytes(Constants.HEADER_CHUNK_DIVISION);
              tickDuration = quarterTicks - tickDuration * 2;
            }

            var noteOnNew = new NoteOnEvent({
              channel: _this.channel,
              wait: i > 0 ? 0 : _this.wait,
              // wait only applies to first note in repetition
              velocity: _this.velocity,
              pitch: p,
              startTick: _this.startTick
            });
            var noteOffNew = new NoteOffEvent({
              channel: _this.channel,
              duration: _this.duration,
              velocity: _this.velocity,
              pitch: p
            });

            _this.events.push(noteOnNew, noteOffNew);
          });
        }
      }

      return this;
    }
  }]);

  return NoteEvent;
}();

/**
 * Holds all data for a "Pitch Bend" MIDI event
 * [ -1.0, 0, 1.0 ] ->  [ 0, 8192, 16383]
 * @param {object} fields { bend : float, channel : int }
 * @return {PitchBendEvent}
 */

var scale14bits = function scale14bits(zeroOne) {
  if (zeroOne <= 0) {
    return Math.floor(16384 * (zeroOne + 1) / 2);
  }

  return Math.floor(16383 * (zeroOne + 1) / 2);
};

var PitchBendEvent = function PitchBendEvent(fields) {
  _classCallCheck(this, PitchBendEvent);

  this.type = 'pitch-bend';
  var bend14 = scale14bits(fields.bend);
  var channel = fields.channel || 0;
  var lsbValue = bend14 & 0x7f;
  var msbValue = bend14 >> 7 & 0x7f;
  this.data = Utils.numberToVariableLength(0x00).concat(Constants.PITCH_BEND_STATUS | channel, lsbValue, msbValue);
};

/**
 * Holds all data for a "program change" MIDI event
 * @param {object} fields {instrument: integer}
 * @return {ProgramChangeEvent}
 */

var ProgramChangeEvent = function ProgramChangeEvent(fields) {
  _classCallCheck(this, ProgramChangeEvent);

  this.type = 'program'; // delta time defaults to 0.

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.PROGRAM_CHANGE_STATUS, fields.instrument);
};

/**
 * Holds all data for a "controller change" MIDI event
 * @param {object} fields {controllerNumber: integer, controllerValue: integer}
 * @return {ControllerChangeEvent}
 */

var ControllerChangeEvent = function ControllerChangeEvent(fields) {
  _classCallCheck(this, ControllerChangeEvent);

  this.type = 'controller'; // delta time defaults to 0.

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.CONTROLLER_CHANGE_STATUS, fields.controllerNumber, fields.controllerValue);
};

/**
 * Object representation of a tempo meta event.
 * @param {string} text - Copyright text
 * @return {CopyrightEvent}
 */

var CopyrightEvent = function CopyrightEvent(text) {
  _classCallCheck(this, CopyrightEvent);

  this.type = 'copyright';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_COPYRIGHT_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a cue point meta event.
 * @param {string} text - Cue point text
 * @return {CuePointEvent}
 */

var CuePointEvent = function CuePointEvent(text) {
  _classCallCheck(this, CuePointEvent);

  this.type = 'marker';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_CUE_POINT, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a end track meta event.
 * @return {EndTrackEvent}
 */

var EndTrackEvent = function EndTrackEvent() {
  _classCallCheck(this, EndTrackEvent);

  this.type = 'end-track'; // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_END_OF_TRACK_ID);
};

/**
 * Object representation of an instrument name meta event.
 * @param {number} bpm - Beats per minute
 * @return {InstrumentNameEvent}
 */

var InstrumentNameEvent = function InstrumentNameEvent(text) {
  _classCallCheck(this, InstrumentNameEvent);

  this.type = 'instrument-name';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_INSTRUMENT_NAME_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Instrument name
  );
};

/**
 * Object representation of a key signature meta event.
 * @return {KeySignatureEvent}
 */

var KeySignatureEvent = function KeySignatureEvent(sf, mi) {
  _classCallCheck(this, KeySignatureEvent);

  this.type = 'key-signature';
  var mode = mi || 0;
  sf = sf || 0; //	Function called with string notation

  if (typeof mi === 'undefined') {
    var fifths = [['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'], ['ab', 'eb', 'bb', 'f', 'c', 'g', 'd', 'a', 'e', 'b', 'f#', 'c#', 'g#', 'd#', 'a#']];
    var _sflen = sf.length;
    var note = sf || 'C';
    if (sf[0] === sf[0].toLowerCase()) mode = 1;

    if (_sflen > 1) {
      switch (sf.charAt(_sflen - 1)) {
        case 'm':
          mode = 1;
          note = sf.charAt(0).toLowerCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;

        case '-':
          mode = 1;
          note = sf.charAt(0).toLowerCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;

        case 'M':
          mode = 0;
          note = sf.charAt(0).toUpperCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;

        case '+':
          mode = 0;
          note = sf.charAt(0).toUpperCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;
      }
    }

    var fifthindex = fifths[mode].indexOf(note);
    sf = fifthindex === -1 ? 0 : fifthindex - 7;
  } // Start with zero time delta


  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_KEY_SIGNATURE_ID, [0x02], // Size
  Utils.numberToBytes(sf, 1), // Number of sharp or flats ( < 0 flat; > 0 sharp)
  Utils.numberToBytes(mode, 1) // Mode: 0 major, 1 minor
  );
};

/**
 * Object representation of a lyric meta event.
 * @param {string} text - Lyric text
 * @return {LyricEvent}
 */

var LyricEvent = function LyricEvent(text) {
  _classCallCheck(this, LyricEvent);

  this.type = 'marker';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_LYRIC_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a marker meta event.
 * @param {string} text - Marker text
 * @return {MarkerEvent}
 */

var MarkerEvent = function MarkerEvent(text) {
  _classCallCheck(this, MarkerEvent);

  this.type = 'marker';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_MARKER_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a tempo meta event.
 * @param {number} bpm - Beats per minute
 * @return {TempoEvent}
 */

var TempoEvent = function TempoEvent(bpm) {
  _classCallCheck(this, TempoEvent);

  this.type = 'tempo';
  var tempo = Math.round(60000000 / bpm); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TEMPO_ID, [0x03], // Size
  Utils.numberToBytes(tempo, 3) // Tempo, 3 bytes
  );
};

/**
 * Object representation of a tempo meta event.
 * @param {number} bpm - Beats per minute
 * @return {TextEvent}
 */

var TextEvent = function TextEvent(text) {
  _classCallCheck(this, TextEvent);

  this.type = 'text';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TEXT_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a time signature meta event.
 * @return {TimeSignatureEvent}
 */

var TimeSignatureEvent = function TimeSignatureEvent(numerator, denominator, midiclockspertick, notespermidiclock) {
  _classCallCheck(this, TimeSignatureEvent);

  this.type = 'time-signature'; // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TIME_SIGNATURE_ID, [0x04], // Size
  Utils.numberToBytes(numerator, 1), // Numerator, 1 bytes
  Utils.numberToBytes(Math.log2(denominator), 1), // Denominator is expressed as pow of 2, 1 bytes
  Utils.numberToBytes(midiclockspertick || 24, 1), // MIDI Clocks per tick, 1 bytes
  Utils.numberToBytes(notespermidiclock || 8, 1) // Number of 1/32 notes per MIDI clocks, 1 bytes
  );
};

/**
 * Object representation of a tempo meta event.
 * @param {number} bpm - Beats per minute
 * @return {TrackNameEvent}
 */

var TrackNameEvent = function TrackNameEvent(text) {
  _classCallCheck(this, TrackNameEvent);

  this.type = 'track-name';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TRACK_NAME_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Holds all data for a track.
 * @param {object} fields {type: number, data: array, size: array, events: array}
 * @return {Track}
 */

var Track = /*#__PURE__*/function () {
  function Track() {
    _classCallCheck(this, Track);

    this.type = Constants.TRACK_CHUNK_TYPE;
    this.data = [];
    this.size = [];
    this.events = [];
    this.explicitTickEvents = []; // If there are any events with an explicit tick defined then we will create a "sub" track for those
    // and merge them in and the end.

    this.tickPointer = 0; // Each time an event is added this will increase
  }
  /**
   * Adds any event type to the track.
   * Events without a specific startTick property are assumed to be added in order of how they should output.
   * Events with a specific startTick property are set aside for now will be merged in during build process.
   * @param {(NoteEvent|ProgramChangeEvent)} events - Event object or array of Event objects.
   * @param {function} mapFunction - Callback which can be used to apply specific properties to all events.
   * @return {Track}
   */


  _createClass(Track, [{
    key: "addEvent",
    value: function addEvent(events, mapFunction) {
      var _this = this;

      Utils.toArray(events).forEach(function (event, i) {
        if (event instanceof NoteEvent) {
          // Handle map function if provided
          if (typeof mapFunction === 'function') {
            var properties = mapFunction(i, event);

            if (_typeof(properties) === 'object') {
              for (var j in properties) {
                switch (j) {
                  case 'channel':
                    event.channel = properties[j];
                    break;

                  case 'duration':
                    event.duration = properties[j];
                    break;

                  case 'sequential':
                    event.sequential = properties[j];
                    break;

                  case 'velocity':
                    event.velocity = Utils.convertVelocity(properties[j]);
                    break;
                }
              }
            }
          } // If this note event has an explicit startTick then we need to set aside for now


          if (event.startTick !== null) {
            _this.explicitTickEvents.push(event);
          } else {
            // Push each on/off event to track's event stack
            event.buildData().events.forEach(function (e) {
              return _this.events.push(e);
            });
          }
        } else {
          _this.events.push(event);
        }
      });
      return this;
    }
    /**
     * Builds int array of all events.
     * @return {Track}
     */

  }, {
    key: "buildData",
    value: function buildData() {
      var _this2 = this;

      // Remove existing end track event and add one.
      // This makes sure it's at the very end of the event list.
      this.removeEventsByType('end-track').addEvent(new EndTrackEvent()); // Reset

      this.data = [];
      this.size = [];
      this.tickPointer = 0;
      this.events.forEach(function (event, eventIndex) {
        // Build event & add to total tick duration
        if (event instanceof NoteOnEvent || event instanceof NoteOffEvent) {
          _this2.data = _this2.data.concat(event.buildData(_this2).data);
          _this2.tickPointer = event.tick;
        } else {
          _this2.data = _this2.data.concat(event.data);
        }
      });
      this.mergeExplicitTickEvents();
      this.size = Utils.numberToBytes(this.data.length, 4); // 4 bytes long

      return this;
    }
  }, {
    key: "mergeExplicitTickEvents",
    value: function mergeExplicitTickEvents() {
      var _this3 = this;

      if (!this.explicitTickEvents.length) return; // First sort asc list of events by startTick

      this.explicitTickEvents.sort(function (a, b) {
        return a.startTick - b.startTick;
      }); // Now this.explicitTickEvents is in correct order, and so is this.events naturally.
      // For each explicit tick event, splice it into the main list of events and
      // adjust the delta on the following events so they still play normally.

      this.explicitTickEvents.forEach(function (noteEvent) {
        // Convert NoteEvent to it's respective NoteOn/NoteOff events
        // Note that as we splice in events the delta for the NoteOff ones will
        // Need to change based on what comes before them after the splice.
        noteEvent.buildData().events.forEach(function (e) {
          return e.buildData(_this3);
        }); // Merge each event indivually into this track's event list.

        noteEvent.events.forEach(function (event) {
          return _this3.mergeSingleEvent(event);
        });
      }); // Hacky way to rebuild track with newly spliced events.  Need better solution.

      this.explicitTickEvents = [];
      this.buildData();
    }
    /**
     * Merges another track's events with this track.
     * @param {Track} track
     * @return {Track}
     */

  }, {
    key: "mergeTrack",
    value: function mergeTrack(track) {
      var _this4 = this;

      // First build this track to populate each event's tick property
      this.buildData(); // Then build track to be merged so that tick property is populated on all events & merge each event.

      track.buildData().events.forEach(function (event) {
        return _this4.mergeSingleEvent(event);
      });
    }
    /**
     * Merges a single event into this track's list of events based on event.tick property.
     * @param {NoteOnEvent|NoteOffEvent} - event
     * @return {Track}
     */

  }, {
    key: "mergeSingleEvent",
    value: function mergeSingleEvent(event) {
      // Find index of existing event we need to follow with
      var lastEventIndex = 0;

      for (var i = 0; i < this.events.length; i++) {
        if (this.events[i].tick > event.tick) break;
        lastEventIndex = i;
      }

      var splicedEventIndex = lastEventIndex + 1; // Need to adjust the delta of this event to ensure it falls on the correct tick.

      event.delta = event.tick - this.events[lastEventIndex].tick; // Splice this event at lastEventIndex + 1

      this.events.splice(splicedEventIndex, 0, event); // Now adjust delta of all following events

      for (var i = splicedEventIndex + 1; i < this.events.length; i++) {
        // Since each existing event should have a tick value at this point we just need to
        // adjust delta to that the event still falls on the correct tick.
        this.events[i].delta = this.events[i].tick - this.events[i - 1].tick;
      }
    }
    /**
     * Removes all events matching specified type.
     * @param {string} eventType - Event type
     * @return {Track}
     */

  }, {
    key: "removeEventsByType",
    value: function removeEventsByType(eventType) {
      var _this5 = this;

      this.events.forEach(function (event, index) {
        if (event.type === eventType) {
          _this5.events.splice(index, 1);
        }
      });
      return this;
    }
    /**
     * Sets tempo of the MIDI file.
     * @param {number} bpm - Tempo in beats per minute.
     * @return {Track}
     */

  }, {
    key: "setTempo",
    value: function setTempo(bpm) {
      return this.addEvent(new TempoEvent(bpm));
    }
    /**
     * Sets time signature.
     * @param {number} numerator - Top number of the time signature.
     * @param {number} denominator - Bottom number of the time signature.
     * @param {number} midiclockspertick - Defaults to 24.
     * @param {number} notespermidiclock - Defaults to 8.
     * @return {Track}
     */

  }, {
    key: "setTimeSignature",
    value: function setTimeSignature(numerator, denominator, midiclockspertick, notespermidiclock) {
      return this.addEvent(new TimeSignatureEvent(numerator, denominator, midiclockspertick, notespermidiclock));
    }
    /**
     * Sets key signature.
     * @param {*} sf -
     * @param {*} mi -
     * @return {Track}
     */

  }, {
    key: "setKeySignature",
    value: function setKeySignature(sf, mi) {
      return this.addEvent(new KeySignatureEvent(sf, mi));
    }
    /**
     * Adds text to MIDI file.
     * @param {string} text - Text to add.
     * @return {Track}
     */

  }, {
    key: "addText",
    value: function addText(text) {
      return this.addEvent(new TextEvent(text));
    }
    /**
     * Adds copyright to MIDI file.
     * @param {string} text - Text of copyright line.
     * @return {Track}
     */

  }, {
    key: "addCopyright",
    value: function addCopyright(text) {
      return this.addEvent(new CopyrightEvent(text));
    }
    /**
     * Adds Sequence/Track Name.
     * @param {string} text - Text of track name.
     * @return {Track}
     */

  }, {
    key: "addTrackName",
    value: function addTrackName(text) {
      return this.addEvent(new TrackNameEvent(text));
    }
    /**
     * Sets instrument name of track.
     * @param {string} text - Name of instrument.
     * @return {Track}
     */

  }, {
    key: "addInstrumentName",
    value: function addInstrumentName(text) {
      return this.addEvent(new InstrumentNameEvent(text));
    }
    /**
     * Adds marker to MIDI file.
     * @param {string} text - Marker text.
     * @return {Track}
     */

  }, {
    key: "addMarker",
    value: function addMarker(text) {
      return this.addEvent(new MarkerEvent(text));
    }
    /**
     * Adds cue point to MIDI file.
     * @param {string} text - Text of cue point.
     * @return {Track}
     */

  }, {
    key: "addCuePoint",
    value: function addCuePoint(text) {
      return this.addEvent(new CuePointEvent(text));
    }
    /**
     * Adds lyric to MIDI file.
     * @param {string} text - Lyric text to add.
     * @return {Track}
     */

  }, {
    key: "addLyric",
    value: function addLyric(text) {
      return this.addEvent(new LyricEvent(text));
    }
    /**
     * Channel mode messages
     * @return {Track}
     */

  }, {
    key: "polyModeOn",
    value: function polyModeOn() {
      var event = new NoteOnEvent({
        data: [0x00, 0xB0, 0x7E, 0x00]
      });
      return this.addEvent(event);
    }
    /**
     * Sets a pitch bend.
     * @param {float} bend - Bend value ranging [-1,1], zero meaning no bend.
     * @return {Track}
     */

  }, {
    key: "setPitchBend",
    value: function setPitchBend(bend) {
      return this.addEvent(new PitchBendEvent({
        bend: bend
      }));
    }
    /**
     * Adds a controller change event
     * @param {number} number - Control number.
     * @param {number} value - Control value.
     * @return {Track}
     */

  }, {
    key: "controllerChange",
    value: function controllerChange(number, value) {
      return this.addEvent(new ControllerChangeEvent({
        controllerNumber: number,
        controllerValue: value
      }));
    }
  }]);

  return Track;
}();

var VexFlow = /*#__PURE__*/function () {
  function VexFlow() {
    _classCallCheck(this, VexFlow);
  } // code...

  /**
   * Support for converting VexFlow voice into MidiWriterJS track
   * @return MidiWritier.Track object
   */


  _createClass(VexFlow, [{
    key: "trackFromVoice",
    value: function trackFromVoice(voice) {
      var _this = this;

      var track = new Track();
      var wait;
      var pitches = [];
      voice.tickables.forEach(function (tickable) {
        pitches = [];

        if (tickable.noteType === 'n') {
          tickable.keys.forEach(function (key) {
            // build array of pitches
            pitches.push(_this.convertPitch(key));
          });
        } else if (tickable.noteType === 'r') {
          // move on to the next tickable and use this rest as a `wait` property for the next event
          wait = _this.convertDuration(tickable);
          return;
        }

        track.addEvent(new NoteEvent({
          pitch: pitches,
          duration: _this.convertDuration(tickable),
          wait: wait
        })); // reset wait

        wait = 0;
      });
      return track;
    }
    /**
     * Converts VexFlow pitch syntax to MidiWriterJS syntax
     * @param pitch string
     */

  }, {
    key: "convertPitch",
    value: function convertPitch(pitch) {
      return pitch.replace('/', '');
    }
    /**
     * Converts VexFlow duration syntax to MidiWriterJS syntax
     * @param note struct from VexFlow
     */

  }, {
    key: "convertDuration",
    value: function convertDuration(note) {
      switch (note.duration) {
        case 'w':
          return '1';

        case 'h':
          return note.isDotted() ? 'd2' : '2';

        case 'q':
          return note.isDotted() ? 'd4' : '4';

        case '8':
          return note.isDotted() ? 'd8' : '8';
      }

      return note.duration;
    }
  }]);

  return VexFlow;
}();

/**
 * Object representation of a header chunk section of a MIDI file.
 * @param {number} numberOfTracks - Number of tracks
 * @return {HeaderChunk}
 */

var HeaderChunk = function HeaderChunk(numberOfTracks) {
  _classCallCheck(this, HeaderChunk);

  this.type = Constants.HEADER_CHUNK_TYPE;
  var trackType = numberOfTracks > 1 ? Constants.HEADER_CHUNK_FORMAT1 : Constants.HEADER_CHUNK_FORMAT0;
  this.data = trackType.concat(Utils.numberToBytes(numberOfTracks, 2), // two bytes long,
  Constants.HEADER_CHUNK_DIVISION);
  this.size = [0, 0, 0, this.data.length];
};

/**
 * Object that puts together tracks and provides methods for file output.
 * @param {array|Track} tracks - A single {Track} object or an array of {Track} objects.
 * @return {Writer}
 */

var Writer = /*#__PURE__*/function () {
  function Writer(tracks) {
    var _this = this;

    _classCallCheck(this, Writer);

    // Ensure track is an array
    tracks = Utils.toArray(tracks);
    this.data = [];
    this.data.push(new HeaderChunk(tracks.length)); // For each track add final end of track event and build data

    tracks.forEach(function (track, i) {
      _this.data.push(track.buildData());
    });
  }
  /**
   * Builds the file into a Uint8Array
   * @return {Uint8Array}
   */


  _createClass(Writer, [{
    key: "buildFile",
    value: function buildFile() {
      var build = []; // Data consists of chunks which consists of data

      this.data.forEach(function (d) {
        return build = build.concat(d.type, d.size, d.data);
      });
      return new Uint8Array(build);
    }
    /**
     * Convert file buffer to a base64 string.  Different methods depending on if browser or node.
     * @return {string}
     */

  }, {
    key: "base64",
    value: function base64() {
      if (typeof btoa === 'function') return btoa(String.fromCharCode.apply(null, this.buildFile()));
      return Buffer.from(this.buildFile()).toString('base64');
    }
    /**
     * Get the data URI.
     * @return {string}
     */

  }, {
    key: "dataUri",
    value: function dataUri() {
      return 'data:audio/midi;base64,' + this.base64();
    }
    /**
     * Output to stdout
     * @return {string}
     */

  }, {
    key: "stdout",
    value: function stdout() {
      return process.stdout.write(new Buffer(this.buildFile()));
    }
    /**
     * Save to MIDI file
     * @param {string} filename
     */

  }, {
    key: "saveMIDI",
    value: function saveMIDI(filename) {
      var fs = require('fs');

      var buffer = new Buffer.from(this.buildFile());
      fs.writeFile(filename + '.mid', buffer, function (err) {
        if (err) throw err;
      });
    }
  }]);

  return Writer;
}();

var main = {
  Constants: Constants,
  NoteOnEvent: NoteOnEvent,
  NoteOffEvent: NoteOffEvent,
  NoteEvent: NoteEvent,
  PitchBendEvent: PitchBendEvent,
  ProgramChangeEvent: ProgramChangeEvent,
  Track: Track,
  Utils: Utils,
  VexFlow: VexFlow,
  Writer: Writer
};

module.exports = main;

}).call(this,require('_process'),require("buffer").Buffer)
},{"../package.json":5,"_process":11,"buffer":8,"fs":7,"tonal-midi":4}],3:[function(require,module,exports){
!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n(t.NoteParser=t.NoteParser||{})}(this,function(t){"use strict";function n(t,n){return Array(n+1).join(t)}function r(t){return"number"==typeof t}function e(t){return"string"==typeof t}function u(t){return void 0!==t}function c(t,n){return Math.pow(2,(t-69)/12)*(n||440)}function o(){return b}function i(t,n,r){if("string"!=typeof t)return null;var e=b.exec(t);if(!e||!n&&e[4])return null;var u={letter:e[1].toUpperCase(),acc:e[2].replace(/x/g,"##")};u.pc=u.letter+u.acc,u.step=(u.letter.charCodeAt(0)+3)%7,u.alt="b"===u.acc[0]?-u.acc.length:u.acc.length;var o=A[u.step]+u.alt;return u.chroma=o<0?12+o:o%12,e[3]&&(u.oct=+e[3],u.midi=o+12*(u.oct+1),u.freq=c(u.midi,r)),n&&(u.tonicOf=e[4]),u}function f(t){return r(t)?t<0?n("b",-t):n("#",t):""}function a(t){return r(t)?""+t:""}function l(t,n,r){return null===t||void 0===t?null:t.step?l(t.step,t.alt,t.oct):t<0||t>6?null:C.charAt(t)+f(n)+a(r)}function p(t){if((r(t)||e(t))&&t>=0&&t<128)return+t;var n=i(t);return n&&u(n.midi)?n.midi:null}function s(t,n){var r=p(t);return null===r?null:c(r,n)}function d(t){return(i(t)||{}).letter}function m(t){return(i(t)||{}).acc}function h(t){return(i(t)||{}).pc}function v(t){return(i(t)||{}).step}function g(t){return(i(t)||{}).alt}function x(t){return(i(t)||{}).chroma}function y(t){return(i(t)||{}).oct}var b=/^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/,A=[0,2,4,5,7,9,11],C="CDEFGAB";t.regex=o,t.parse=i,t.build=l,t.midi=p,t.freq=s,t.letter=d,t.acc=m,t.pc=h,t.step=v,t.alt=g,t.chroma=x,t.oct=y});


},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var noteParser = require('note-parser');

/**
 * A midi note number is a number representation of a note pitch. It can be
 * integers so it's equal tempered tuned, or float to indicate it's not
 * tuned into equal temepered scale.
 *
 * This module contains functions to convert to and from midi notes.
 *
 * @example
 * var midi = require('tonal-midi')
 * midi.toMidi('A4') // => 69
 * midi.note(69) // => 'A4'
 * midi.note(61) // => 'Db4'
 * midi.note(61, true) // => 'C#4'
 *
 * @module midi
 */

/**
 * Convert the given note to a midi note number. If you pass a midi number it
 * will returned as is.
 *
 * @param {Array|String|Number} note - the note to get the midi number from
 * @return {Integer} the midi number or null if not valid pitch
 * @example
 * midi.toMidi('C4') // => 60
 * midi.toMidi(60) // => 60
 * midi.toMidi('60') // => 60
 */
function toMidi (val) {
  if (Array.isArray(val) && val.length === 2) return val[0] * 7 + val[1] * 12 + 12
  return noteParser.midi(val)
}

var FLATS = 'C Db D Eb E F Gb G Ab A Bb B'.split(' ');
var SHARPS = 'C C# D D# E F F# G G# A A# B'.split(' ');

/**
 * Given a midi number, returns a note name. The altered notes will have
 * flats unless explicitly set with the optional `useSharps` parameter.
 *
 * @function
 * @param {Integer} midi - the midi note number
 * @param {Boolean} useSharps - (Optional) set to true to use sharps instead of flats
 * @return {String} the note name
 * @example
 * var midi = require('tonal-midi')
 * midi.note(61) // => 'Db4'
 * midi.note(61, true) // => 'C#4'
 * // it rounds to nearest note
 * midi.note(61.7) // => 'D4'
 */
function note (num, sharps) {
  if (num === true || num === false) return function (m) { return note(m, num) }
  num = Math.round(num);
  var pcs = sharps === true ? SHARPS : FLATS;
  var pc = pcs[num % 12];
  var o = Math.floor(num / 12) - 1;
  return pc + o
}

exports.toMidi = toMidi;
exports.note = note;

},{"note-parser":3}],5:[function(require,module,exports){
module.exports={
  "_args": [
    [
      {
        "raw": "midi-writer-js",
        "scope": null,
        "escapedName": "midi-writer-js",
        "name": "midi-writer-js",
        "rawSpec": "",
        "spec": "latest",
        "type": "tag"
      },
      "C:\\Users\\thana"
    ]
  ],
  "_from": "midi-writer-js",
  "_hasShrinkwrap": false,
  "_id": "midi-writer-js@1.7.4",
  "_location": "/midi-writer-js",
  "_nodeVersion": "10.15.0",
  "_npmOperationalInternal": {
    "host": "s3://npm-registry-packages",
    "tmp": "tmp/midi-writer-js_1.7.4_1589704010859_0.4677966350120353"
  },
  "_npmUser": {
    "name": "grimmdude",
    "email": "garrett@grimmdude.com"
  },
  "_npmVersion": "6.4.1",
  "_phantomChildren": {},
  "_requested": {
    "raw": "midi-writer-js",
    "scope": null,
    "escapedName": "midi-writer-js",
    "name": "midi-writer-js",
    "rawSpec": "",
    "spec": "latest",
    "type": "tag"
  },
  "_requiredBy": [
    "#USER"
  ],
  "_resolved": "https://registry.npmjs.org/midi-writer-js/-/midi-writer-js-1.7.4.tgz",
  "_shasum": "7ee7c36c0fae6aa7574ef2a24186d02660a0c237",
  "_shrinkwrap": null,
  "_spec": "midi-writer-js",
  "_where": "C:\\Users\\thana",
  "author": {
    "name": "Garrett Grimm"
  },
  "bugs": {
    "url": "https://github.com/grimmdude/MidiWriterJS/issues"
  },
  "dependencies": {
    "tonal-midi": "^0.69.7"
  },
  "description": "A library providing an API for generating MIDI files.",
  "devDependencies": {
    "@babel/core": "^7.9.6",
    "@babel/plugin-transform-destructuring": "^7.9.5",
    "@babel/preset-env": "^7.9.6",
    "@rollup/plugin-babel": "^5.0.0",
    "eslint": "^7.0.0",
    "eslint-config-standard": "^12.0.0",
    "eslint-plugin-import": "^2.20.2",
    "eslint-plugin-node": "^9.2.0",
    "eslint-plugin-promise": "^4.1.1",
    "eslint-plugin-standard": "^4.0.1",
    "jsdoc": "^3.6.4",
    "minami": "^1.1.1",
    "mocha": "^6.2.3",
    "nyc": "^15.0.1",
    "rollup": "^2.9.0",
    "watch": "^1.0.2"
  },
  "directories": {
    "lib": "src",
    "example": "examples",
    "test": "test"
  },
  "dist": {
    "integrity": "sha512-Qpou6O+G8G3ZhDyzGwKjm9Tj2u5YeEFVcxB8MAy7nGuq3Ii8DJlOaqHEllS9n+tq6l2FSExgLJz+d3hwrF8UZQ==",
    "shasum": "7ee7c36c0fae6aa7574ef2a24186d02660a0c237",
    "tarball": "https://registry.npmjs.org/midi-writer-js/-/midi-writer-js-1.7.4.tgz",
    "fileCount": 25,
    "unpackedSize": 264115,
    "npm-signature": "-----BEGIN PGP SIGNATURE-----\r\nVersion: OpenPGP.js v3.0.4\r\nComment: https://openpgpjs.org\r\n\r\nwsFcBAEBCAAQBQJewPVLCRA9TVsSAnZWagAACngP+wbXXQJrQMBqtAFoEsbN\nH+G8zgPmPgsdXGkscWWdzQ5EXIRnZUBEyfnqHOvMm9LR69fkqYwFFgRR72l2\na7e6we0Ql68HmMZcErW8PZbhukRpK0cjhbdKDj3u6wnQdVCOYvYZh/tmwvxy\nO1eYpzMCjrMcAsyxaFSW57MPlZ1vbuZX4yIT+iN4wvx++i1CZgtZeG5Hs7Kr\nE3f76c+gEMf5Rv+UazihxvsFGEnbGO6n0u+KWT7UL/3VXBIXM9pPISW4tk4v\nNoXfVLDtifz1ymEUu3cPTRjpya0DJk3X78DX2Tin3c4kIxlUZVn85/4P/8PN\n5/HK6rIYjc/2CTzeZc6zFn0avEr8UuAng7w6ad2i7V7923RnFF7WmUB3yJTw\nTg9FrIUhDSbSXCRJzaaidrEAA9XTxW8r3h7nQlQlhXmtKseawfcFOeT8GFLg\nKhcg+/DadFpPjGk6UZ2/M/p3Ih7wYzv95uYqms90wmJH+W42o2P8KMSEof3e\nMdShqvo0HGVuaUATk2b/Q3kuMNUxK17DRdzVmaqTxQ46QSy2LKRFNkDLQ07p\nTnJwSW6BhlFgDLMEvMu1urrxqtBABEHfiLF0yTiquUlwxWpkG+bxzfgM8hVC\nQgNXMnDsbKfqiFLV6vLtqrGcwwnee5yGGaZigV3XU3liNTwvDC5YAAOs4wfx\nCDvM\r\n=5Ee8\r\n-----END PGP SIGNATURE-----\r\n"
  },
  "gitHead": "890a1f51dcea9226ae39189c45c33d0acbcb8a95",
  "homepage": "https://github.com/grimmdude/MidiWriterJS#readme",
  "keywords": [
    "midi",
    "generator",
    "music"
  ],
  "license": "MIT",
  "main": "build/index.js",
  "maintainers": [
    {
      "name": "grimmdude",
      "email": "garrett@grimmdude.com"
    }
  ],
  "name": "midi-writer-js",
  "optionalDependencies": {},
  "readme": "&#9836; MidiWriterJS\n===============\n[![npm version](https://badge.fury.io/js/midi-writer-js.svg)](https://badge.fury.io/js/midi-writer-js)\n[![Build Status](https://travis-ci.org/grimmdude/MidiWriterJS.svg?branch=master)](https://travis-ci.org/grimmdude/MidiWriterJS)\n\nMidiWriterJS is a JavaScript library providing an API for generating expressive multi-track MIDI files.  \n\nNote that the `master` branch is in active development so if you're looking for a tried and true stable version please use the latest release.\n\n[Source Documentation](http://grimmdude.com/MidiWriterJS/docs/)\n\nInstall\n------------\n```sh\nnpm install midi-writer-js\n```\nGetting Started\n------------\n```javascript\nvar MidiWriter = require('midi-writer-js');\n\n// Start with a new track\nvar track = new MidiWriter.Track();\n\n// Define an instrument (optional):\ntrack.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 1}));\n\n// Add some notes:\nvar note = new MidiWriter.NoteEvent({pitch: ['C4', 'D4', 'E4'], duration: '4'});\ntrack.addEvent(note);\n\n// Generate a data URI\nvar write = new MidiWriter.Writer(track);\nconsole.log(write.dataUri());\n```\nDocumentation\n------------\n### `MidiWriter.Track()`\n\n- `addEvent({event}, mapFunction)`\n- `setTempo(tempo)`\n- `addText(text)`\n- `addCopyright(text)`\n- `addTrackName(text)`\n- `addInstrumentName(text)`\n- `addMarker(text)`\n- `addCuePoint(text)`\n- `addLyric(text)`\n- `setTimeSignature(numerator, denominator)`\n\n### `MidiWriter.NoteEvent({options})`\n\nThe `NoteEvent` supports these options:\n\n<table>\n\t<thead>\n\t\t<tr>\n\t\t\t<th>Name</th>\n\t\t\t<th>Type</th>\n\t\t\t<th>Description</th>\n\t\t</tr>\n\t</thead>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td><b>pitch</b></td>\n\t\t\t<td>string or array</td>\n\t\t\t<td>Each pitch can be a string or valid MIDI note code.  Format for string is <code>C#4</code>.  Pro tip: You can use the output from <a href=\"https://github.com/danigb/tonal\" target=\"_blank\">tonal</a> functions to build scales, chords, intervals, etc. in this parameter.</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>duration</b></td>\n\t\t\t<td>string or array</td>\n\t\t\t<td>\n\t\t\t\tHow long the note should sound.\n\t\t\t\t<ul>\n\t\t\t\t\t<li><code>1</code>  : whole</li>\n\t\t\t\t\t<li><code>2</code>  : half</li>\n\t\t\t\t\t<li><code>d2</code> : dotted half</li>\n\t\t\t\t\t<li><code>dd2</code> : double dotted half</li>\n\t\t\t\t\t<li><code>4</code>  : quarter</li>\n\t\t\t\t\t<li><code>4t</code>  : quarter triplet</li>\n\t\t\t\t\t<li><code>d4</code> : dotted quarter</li>\n\t\t\t\t\t<li><code>dd4</code> : double dotted quarter</li>\n\t\t\t\t\t<li><code>8</code>  : eighth</li>\n\t\t\t\t\t<li><code>8t</code> : eighth triplet</li>\n\t\t\t\t\t<li><code>d8</code> : dotted eighth</li>\n\t\t\t\t\t<li><code>dd8</code> : double dotted eighth</li>\n\t\t\t\t\t<li><code>16</code> : sixteenth</li>\n\t\t\t\t\t<li><code>16t</code> : sixteenth triplet</li>\n\t\t\t\t\t<li><code>32</code> : thirty-second</li>\n\t\t\t\t\t<li><code>64</code> : sixty-fourth</li>\n\t\t\t\t\t<li><code>Tn</code> : where n is an explicit number of ticks (T128 = 1 beat)</li>\n\t\t\t\t</ul>\n\t\t\t\tIf an array of durations is passed then the sum of the durations will be used.\n\t\t\t</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>wait</b></td>\n\t\t\t<td>string or array</td>\n\t\t\t<td>How long to wait before sounding note (rest).  Takes same values as <b>duration</b>.</td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>sequential</b></td>\n\t\t\t<td>boolean</td>\n\t\t\t<td>If true then array of pitches will be played sequentially as opposed to simulatanously.  Default: <code>false</code></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>velocity</b></td>\n\t\t\t<td>number</td>\n\t\t\t<td>How loud the note should sound, values 1-100.  Default: <code>50</code></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>repeat</b></td>\n\t\t\t<td>number</td>\n\t\t\t<td>How many times this event should be repeated. Default: <code>1</code></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>channel</b></td>\n\t\t\t<td>number</td>\n\t\t\t<td>MIDI channel to use. Default: <code>1</code></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>grace</b></td>\n\t\t\t<td>string or array</td>\n\t\t\t<td>Grace note to be applied to note event.  Takes same value format as <code>pitch</code></td>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<td><b>startTick</b></td>\n\t\t\t<td>number</td>\n\t\t\t<td>Specific tick where this event should be played.  If this parameter is supplied then <code>wait</code> is disregarded if also supplied.</td>\n\t\t</tr>\n\t</tbody>\n</table>\n\n\n### `MidiWriter.Writer(tracks)`\nThe `Writer` class provides a few ways to output the file:\n- `buildFile()` *Uint8Array*\n- `base64()` *string*\n- `dataUri()` *string*\n- `stdout()` *file stream (cli)*\n\n### Hot Cross Buns\nHere's an example of how everyone's favorite song \"Hot Cross Buns\" could be written.  Note use of the mapping function passed as the second argument of `addEvent()`.  This can be used to apply specific properties to all events.  With some \nstreet smarts you could also use it for programmatic crescendos and other property 'animation'.\n```javascript\nvar MidiWriter = require('midi-writer-js');\n\nvar track = new MidiWriter.Track();\n\ntrack.addEvent([\n\t\tnew MidiWriter.NoteEvent({pitch: ['E4','D4'], duration: '4'}),\n\t\tnew MidiWriter.NoteEvent({pitch: ['C4'], duration: '2'}),\n\t\tnew MidiWriter.NoteEvent({pitch: ['E4','D4'], duration: '4'}),\n\t\tnew MidiWriter.NoteEvent({pitch: ['C4'], duration: '2'}),\n\t\tnew MidiWriter.NoteEvent({pitch: ['C4', 'C4', 'C4', 'C4', 'D4', 'D4', 'D4', 'D4'], duration: '8'}),\n\t\tnew MidiWriter.NoteEvent({pitch: ['E4','D4'], duration: '4'}),\n\t\tnew MidiWriter.NoteEvent({pitch: ['C4'], duration: '2'})\n\t], function(event, index) {\n    return {sequential: true};\n  }\n);\n\nvar write = new MidiWriter.Writer(track);\nconsole.log(write.dataUri());\n```\n\n### VexFlow Integration\nMidiWriterJS can export MIDI from VexFlow voices, though this feature is still experimental.  Current usage is to use `MidiWriter.VexFlow.trackFromVoice(voice)` to create a MidiWriterJS `Track` object:\n```javascript\n\n// ...VexFlow code defining notes\nvar voice = create_4_4_voice().addTickables(notes);\n\nvar vexWriter = new MidiWriter.VexFlow();\nvar track = vexWriter.trackFromVoice(voice);\nvar writer = new MidiWriter.Writer([track]);\nconsole.log(writer.dataUri());\n```\n",
  "readmeFilename": "README.md",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/grimmdude/MidiWriterJS.git"
  },
  "scripts": {
    "build": "mkdir -p build && rollup -c && npm run docs",
    "docs": "jsdoc -r src README.md -d ./docs -t ./node_modules/minami",
    "lint:js": "eslint 'src/**/**.js'",
    "postinstall": "node postinstall.js",
    "prepublishOnly": "npm test",
    "pretest": "npm run build",
    "test": "nyc --reporter=text mocha --no-config --no-package",
    "watch": "watch 'npm run build' src"
  },
  "version": "1.7.4"
}

},{}],6:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
(function (global,Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"base64-js":6,"buffer":8,"ieee754":9,"isarray":10}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],11:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
