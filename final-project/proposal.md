---
title: Project Proposal
permalink: /project-proposal
---

### Project Info

- Team: Thanasi Bakis
- Programming platform: Web Audio API

### Product Purpose

In the world of data science today, great emphasis is placed on the quality and aesthetic of data visualizations. However, sight is only one of the human senses, and this project will explore how well data can be communicated audibly. Just as properties of the data can be mapped to various features of a plot (axes, colors, etc.), we will discover ways to map these properties to characteristics of sound.

### Anticipated Result

Specifically, this project is aiming to be able to create sound that communicates information about some digital signal, such as data being sampled from a sensor. You will be able to provide a sequence of data samples, and you will receive a MIDI file containing an audible representation of the input.

### User Interaction

The goal is to develop a web application to which a user can upload a data file, then play its audible representation and download the corresponding MIDI file. Additionally, I would like to have a visual plot of the input data as well, and when the audio is playing within the web app, the visual highlights the data along the time axis in sync with the playback time of the audio, to allow the user to follow along with the data in two modalities and compare the way each one expresses the data.

### Project Timeline

| Time    | Goal                                                         |
| ------- | ------------------------------------------------------------ |
| Week 7  | Explore prior work and discover mappings from data to sound  |
| Week 8  | Implement engine to process data and create MIDI file        |
| Week 9  | Build user interface with upload, plot, playback, and download features |
| Week 10 | Present product, create documentation, and clean up rough edges |

### Knowledge Needed and Prior Work

I will most definitely need to research the mappings previous projects have used. What aspects of the data were they examining? Which MIDI controls were being adjusted? 

One resource I will examine more is Prof. Jonathan Middleton's [Music Algorithms](http://musicalgorithms.org/4.1/app/#/howto) tool. This project converts numerical sequences into a musical phrase, and it lays out a couple different mappings, including pitch and duration. This resource will likely be useful to aid me in structuring my program, and will give me a jumping point from which I can locate and develop further mappings.

I will also explore this 2015 research paper from Prof. Mark Last titled [Listen to the Sound of Data](https://www.researchgate.net/publication/282504359_Listen_to_the_Sound_of_Data), which appears to be a project very similar to mine in which a time series signal is sonified. This resource will likely aid me in understanding the current state of this field, and I will explore ways to implement their work in a web application as well as hopefully extend their work in ways that I discover to be interesting. 