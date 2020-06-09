---
title: Project Manual
permalink: /project-manual
---

### Introduction

Welcome! *Data to Sound* is a program for sonifying time series data into the MIDI format. This document will walk you through the usage, algorithm, and basic architecture of the program. 

### Getting Started-- Loading Data

Visit the [program page]({{ site.baseurl }}{% link final-project/data2sound.md %}). If you have a CSV file you would like to work with, go ahead and drop it right on the page. *Be sure the file has headers.* If you do not have a file of your own, that is fine! Click the button to load the demo dataset. (The demo dataset contains two columns: an arbitrary time series, and a copy of that time series but shifted down and with a small random error added to it.)

### Configuring the Sonification

The core of the sonification is the *parameter map*. In this program, a *parameter* refers to an aspect of the resulting sound that can be controlled, such as the pitches of the notes or the volume of the track over time. The main purpose of the program is to map columns in your CSV file to these sound parameters.

On this screen, you can set the parameter map. Each row of the table represents a parameter you can configure. The leftmost dropdown of each row allows you to pick which CSV column will map to each parameter. The other dropdown allows you to configure how the column of data is measured. To understand this better, we need to look briefly at the algorithm that drives the sonification-- check out the [next section](#the-key-algorithm-segmentation) for this! If you'd rather get right to the sonification, the default setting of *mean* is a pretty sensible choice. 

You are not required to use every column of your data, and you are not forbidden from using the same column for multiple parameters. The only requirement is that you must set up at least one mapping. You'll likely want this to be pitch, so you can actually hear something!

The last row of the table, before the *Sonify* button, allows the user to specify the location of the web server providing the sonification engine. You will likely not need to change this ever, unless you are developing your own additions to the engine. You can read the section about the program [architecture](#program-architecture) for information on this.

Finally, click the *Sonify* button to access the [playback interface](#the-playback-interface)!

### The Key Algorithm-- Segmentation

How do we translate the data into sound? We could assign a note to each data point, but that would likely be very noisy, and not capture the trend of the data "as a whole". Instead, we break the data into chunks over time, and translate each chunk into a note. These chunks are called *segments*.

To create our list of segments, we first let every two elements form a segment (ie. 1 & 2, 3 & 4, ...). From there, we repeatedly merge two consecutive segments that "make sense to merge", in that we merge the two whose data points increase or decrease in a continuous way. Consider, for instance, a set of points that travel up and down in the pattern of a sine wave; you can imagine that we would want to group all the points that travel up from a "valley" (y = -1) to a "peak" (y = 1). We would want to avoid grouping points that are at the top of the peak, since that segment travels up and then down, instead of one continuous motion.

The algorithm does this by considering every pair of adjacent segments and fitting a simple linear regression on their combined set of points. Whichever pair of segments yields the regression with the lowest mean squared error ends up being merged. 

Now, how do we convert each segment to a note? We need to decide two things: the "value" of the note, and the duration of the note. The duration of the note is easy to consider-- each data point represents a small chunk of time, so longer segments yield longer notes. But how do we decide which pitch, volume, etc. gets assigned to a note, given this chunk? We apply a "measurement function" to it-- the functions listed in the rightmost dropdowns in the configuration table.

When we take the mean, min, max, or length of each segment, we're reducing each one to a single value that can then be used as the pitch, volume level, etc. of the note. This value then undergoes a linear mapping to the range of desired pitches, volume levels, etc. (Actually, panning is slightly more involved; after the linear mapping, I take the cubed root, as it pushes values closer to the extremes -1 (left pan) and 1 (right pan), making the effect more interesting and easier to perceive.)

Each measurement function has its own effect on the resulting sound/effect:

- **mean** creates a good overview of the data; as the data tend to go up or down, so do the values of the parameter.
- **min** tends to exaggerate valleys in the data; you will hear lower pitches, volumes, etc. more often.
- **max** tends to exaggerate peaks in the data; you will hear higher pitches, volumes, etc. more often.
- **length** focuses on the "noiseness" of the data, rather than the up/down movement; higher pitches, volumes, etc. are given to longer segments (typically that are smoother), whereas smaller segments tend to exist within higher-frequency cycles (typically noisier).

### The Playback Interface

By now, you should see a line plot of the column(s) of data you selected. Clicking the *Play* button will begin playback of the sonification, highlighting the points that belong to the segment that created each currently-playing note. You can pause playback at the current note, or reset it to the beginning. You can also download the sonification as a MIDI (.mid) file for your own synthesizer. Finally, you can return to the first page to load a new dataset, or simply reconfigure the parameter mapping for the current dataset. 

### Program Architecture

While not required to operate this program, an understanding of the program architecture might be interesting to you. The program exists in two entities, a sonification engine and a client-side program that interfaces with it. 

The sonification engine is a Node.js server that provides a web API for client programs to use. In particular, client programs can make a POST request to the */sonify* endpoint, passing the parameter map (among other settings) and receiving back the sonification as a MIDI file. You can check out the API documentation and source code [here](https://github.com/thanasibakis/data2sound). The engine is an implementation and expansion of a 2015 paper by Last, M., & Usyskin, A., referenced in the documentation at that page.

The client-side program is a way for an end user to interface with the sonification engine. It connects to an instance of the engine running on Heroku, and visualizes the data as it translates each MIDI event to method calls to a Tone.js synth. It also allows the user to specify the URL of a different instance of the engine, typically for development/testing purposes (eg. pointing it to *http://localhost/sonify*). The source code for this client-side program is available [here](https://github.com/thanasibakis/CS190/tree/master/final-project), as a part of the repository for this entire website.