let width =window.innerWidth, height=window.innerHeight;

let graph;
let simulation;
let currentTransform = d3.zoomIdentity; // Track current zoom transform
let selectedNode = null

const ColoringModes = Object.freeze({
    Community: 0,
    Grade: 1,
})


let renderingMode = ColoringModes.Community;


// Front End UI Things
const dropdown = document.getElementById("coloringSelect");

dropdown.addEventListener("change", function() {
    if (dropdown.value === "community") {
        renderingMode = ColoringModes.Community
    } else {
        renderingMode = ColoringModes.Grade
    }
    render()
})





// D3 Rendering Logic
d3.json("./graph.json").then(function(_graph) {
    for (let i = 0; i < _graph["links"].length; i++) {
        _graph["links"][i]["source"]= parseInt(_graph["links"][i]["source"].replace("n",""));
        _graph["links"][i]["target"]= parseInt(_graph["links"][i]["target"].replace("n",""))
    }

    // Capitalize the first letter of the first name and any letter(s) in the last name
    for (let i = 0; i < _graph["nodes"].length; i++) {
        let split = _graph["nodes"][i]["name"].split(" ")
        let str = ""


        split[0][0] = split[0][0].toUpperCase()
        str += String(split[0][0]).toUpperCase() + String(split[0]).slice(1)

        if (split.length > 1) {
            split[1] = split[1].toUpperCase()
            str += " " + split[1]
        }

        _graph["nodes"][i]["name"] = str
    }

    console.log(_graph)
    graph = _graph;
    // initializeDisplay();
    // initSim();

    simulation = d3.forceSimulation(graph.nodes)
        .force("charge", d3.forceManyBody().strength(-800))
        .force("center", d3.forceCenter(width/2, height/2))
        .force("collision", d3.forceCollide().radius(60))
        .force("link", d3.forceLink().links(graph.links).distance(40))
        .on("tick", render)

    updateQuadtree()
    initZoomDrag()
} ).catch(function (err) {
    console.log("Error loading graph ", err)
})

let graphQuadtree = d3.quadtree()
    .x(function(d) {return d.x;})
    .y(function(d) {return d.y;});


const zoom = d3.zoom().on("zoom", handleZoom)

const drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

function handleZoom(e) {
    d3.select("svg").select(".nodes").attr("transform", e.transform)
    d3.select("svg").select(".links").attr("transform", e.transform)
    d3.select("svg").select(".labels").attr("transform", e.transform)
    currentTransform = e.transform; // Update current transform
}

function initZoomDrag() {
    d3.select("svg").call(zoom);

}




function updateLinks() {
    const linkgraph = d3.select('.links')
        .selectAll('line')
        .data(graph.links)
        .join('line')
        .attr('x1', function(d) {
            return d.source.x
        })
        .attr('y1', function(d) {
            return d.source.y
        })
        .attr('x2', function(d) {
            return d.target.x
        })
        .attr('y2', function(d) {
            return d.target.y
        }).attr("stroke", "#E0E0E030")
}

function updateNodes() {
    let nodegraph = d3.select(".nodes")
        .selectAll("text")
        .data(graph.nodes)
        .join("text").text(function(d) {return d.name})
        .attr("x", function(d) {
            return d.x;
        })
        .attr("y", function(d) {
            return d.y;
        }).call(drag)
        .attr("class","node-text")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .on("mouseover", function(d) {
            selectedNode = d;
            render()
        })
        .on("mouseout", function(d) {
            selectedNode = null;
            render()
        })
        .attr("fill", function(d) {
            if (selectedNode !== null) {
                if (d.id === selectedNode.target.__data__.id || connectedNodes.indexOf(d.name) > -1 ) {
                    return "#FAFAFA"
                }
                else return getGradeColor(d) + "55";
            }

            return getGradeColor(d);

        })
        .on("mouseover", function(d) {
            selectedNode = d;
            var connectedNodes = graph.links
                .filter((x) => {
                    // I think this line is correct
                    // probably the map is being weird
                    return x.source.id === d.target.__data__.id || x.target.id === d.target.__data__.id})


            connectedNodes = connectedNodes.map((x) => (x.source.id === d.target.__data__.id ? x.target.name : x.source.name));


            //my function to highlight node and connected nodes. only highlights first node in map.
            d3.selectAll(".nodes")
                .selectAll("text")
                .attr("fill", function (c) {
                    if (c.id === d.target.__data__.id || connectedNodes.indexOf(c.name) > -1 ) {
                        return "#FAFAFA"
                    }
                    else return getGradeColor(c) + "55";
                });
        })
        .on("mouseout", function(d) {
            selectedNode = null;
            d3.selectAll(".nodes")
                .selectAll("text")
                .attr("fill", function (c) {
                    return getGradeColor(c);
                });
        })
}



function getGradeColor(d) {
    console.log(d)
    if (renderingMode === ColoringModes.Grade) {
        switch (d.grade) {
            case "12th":
                return "#03A9F4";
            case "11th":
                return "#4CAF50";
            case "10th":
                return "#FFC107";
            case "9th":
                return "#F44336";
            case "teacher":
                return "#7E57C2";
            case "?":
                return "#9E9E9E";
        }
    } else if (renderingMode === ColoringModes.Community) {
        switch (d.community) {
            case 1.0:
                return "#F44336"
            case 2.0:
                return "#BA68C8"
            case 3.0:
                return "#5C6BC0"
            case 4.0:
                return "#03A9F4"
            case 5.0:
                return "#009688"
            case 6.0:
                return "#8BC34A"
            case 7.0:
                return "#8BC34A"
            case 8.0:
                return "#FFEB3B"
            case 9.0:
                return "#FF5722"
            case 10.0:
                return "#90A4AE"
            case 11.0:
                return "#FF8A65"
            case 0:
                return "#BCAAA4"
            default:
                console.log(`Extra community without color: ${d.community}`)
                return "blue"
        }
    }
}

function updateQuadtree() {
    graphQuadtree = d3.quadtree()
        .x(d => d.x)
        .y(d => d.y)
        .addAll(graph.nodes);
}

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = event.x;
    d.fy = event.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function render() {
    updateQuadtree()
    updateNodes()
    updateLinks()
}


