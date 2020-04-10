---
title: Sonify
permalink: /sonify
---

<script src="{{ site.baseurl }}{% link week3-sonify/js/sonify.js %}"></script>

<style>
    #text-container {
        margin: auto;
        width: 50%;
        height: 80px;
        text-align: center;
    }
    #text {
        margin: 0;
    }
</style>


---

<br>

# Type Something!

<div id="text-container"><h4 id="text"></h4></div>

---

<br>

# Welcome to the Sonify program!

Here, we create sound from text. There are two main factors that influence the created sound: the vowels in the text, and the length of the text.

More precisely, the algorithm is currently as follows:
- If a vowel is typed, a note from the A9 chord is sustained (with _a_ corresponding to A, _e_ to C#, etc.)
  - Adding the same vowel again will not change the sound.
  - The note is removed once all instances of the vowel have been deleted.
- If a consonant is typed, a pitch between A5 and B8 is chosen at random, and spontaneous pings are generated over time.
  - The pings for a pitch occur around 0.5 - 3.5 seconds after its previous ping.
  - The pitch will stop pinging when the letter that created it is removed.
