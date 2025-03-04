# 3 Degrees Of ILHS

I'm going to assume if you're reading the github readme, you're a developer. So welcome! This project is not pretty, even slighty, but it has some really cool graph components that I think are at least worth pointing out.


## main.py

Despite this being a website, most of the data processing is actually done in python. The python code isn't terribly efficient. Among other things it:
- Opens the data with `igraph`
- Does a bunch of data processing
- Saves a compressed file of the data (only format igraph will save in)
- Uncompresses that file in place
- Reopens that file but this time in `networkx`
- Converts that graphml file into a usable json file

Yeah it's bad. But it gets the job done and runs in under a second so I don't really care

## main.js
The javascript side is much less terrible than the python side. It's not perfect by any means, but it's a reasonably well put together D3.js visualization. It does some unconventional things like using labels instead of circles for nodes, but I'm quite happy with how the visualization looks.