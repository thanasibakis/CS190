---
title: Sonify
permalink: /sonify
---

<script src="{{ site.baseurl }}{% link week3-sonify/js/sonify.js %}"></script>

<style>
    #text-container {
        margin: auto;
        width: 100%;
        padding: 40px 0 0 0;
        height: 80px;
        text-align: center;
        background: #f9f9f9;
        overflow: hidden;
    }
    #text {
        margin: 0;
    }
</style>

> to map data to sound in order to allow listeners to interpret it in an auditory manner ([Wiktionary](https://en.wiktionary.org/wiki/sonify))

&nbsp;

### Type your name

<div id="text-container"><h4 id="text"></h4></div>

&nbsp;

### The algorithm

If a vowel is typed, a note from the [A Major9](https://pianochord.com/A-major-7th/variation/A-major-9th-5th) chord is sustained.

- The letter _a_ corresponds to A, _e_ to C#, etc.
- Adding the same vowel again will not change the sound.
- The note is removed once all instances of the vowel have been deleted.

If a consonant is typed, a pitch between A5 and B8 is chosen, and spontaneous chimes of that pitch are generated over time.

- Specifically, each consonant is assigned a pitch such that the [less frequently the letter is used in English](https://en.wikipedia.org/wiki/Letter_frequency), the higher the frequency of the pitch.
- A chime for a pitch occurs when the letter is typed, and from there, at a random time up to 3 seconds after that pitch's previous chime.
- Adding the same consonant twice will schedule twice as many chimes for that pitch.
- New chimes for that pitch will stop being scheduled when the corresponding letter is removed.
