import csv
import matplotlib.pyplot as plt
import igraph
import gzip
import shutil

edges = []
vertexs = {}
with open('3 Degrees Of ILHSv24.csv', newline='\n') as csvfile:
    reader = csv.reader(csvfile, delimiter=',', quotechar='"')
    for row in reader:
        name = row[2].lower()
        grade = row[3].lower()

        connectionStr = row[4]
        if row[4] == "":
            connectionStr = row[5].lower()
        elif row[5] != "":
            connectionStr += "," + row[5].lower()

        connections = connectionStr.split(',')

        connections = [conn.strip().lower().replace(".", "").replace("-", "") for conn in connections]
        vertexs[name] = grade

        if len(connections) == 0:
            print("0 length connections")

        for connect in connections:
            if not connect in vertexs:
                vertexs[connect] = "?"

            edges.append([name, connect])

g = igraph.Graph()
for key in vertexs.keys():
    g.add_vertex(key, grade=vertexs[key])

print(vertexs)

g.add_edges(edges)

farthest = g.farthest_points()

g.simplify(multiple=True, loops=True)

node1 = g.vs[farthest[0]]
node2 = g.vs[farthest[1]]

shortestPath = g.get_shortest_path(farthest[1], farthest[0])

community = g.community_multilevel()
membership = community.membership

for index,value in enumerate(membership):
    g.vs[index]["community"] = value

print(membership)

print("Longest connection is:")
for index, nodeid in enumerate(shortestPath):
    print(f"{index}: {g.vs[nodeid]['name']}")

print()

print(f"Node1: {node1} node2: {node2}")

print(f"farthest: {farthest}")

print("Calculating the RA index for all nodes. This might be a while")


def top_resource_allocation_index(graph, node, top_n=10):
    rai_scores = []
    all_nodes = set(range(graph.vcount()))
    neighbors = set(graph.neighbors(node))
    non_neighbors = all_nodes - neighbors - {node}

    for other in non_neighbors:
        common_neighbors = neighbors.intersection(graph.neighbors(other))
        rai_score = sum(1 / graph.degree(w) for w in common_neighbors)
        rai_scores.append((other, rai_score))

    # Sort by RAI score in descending order and select top_n
    top_connections = sorted(rai_scores, key=lambda x: x[1], reverse=True)[:top_n]
    return top_connections


# Example usage
nameToCheck = "max w"

nodeid = g.vs.find(name=nameToCheck)
top_connections = top_resource_allocation_index(g, nodeid.index)

# Display the results
print(f"Top {len(top_connections)} potential connections for node {nameToCheck}:")
for target, score in top_connections:
    print(f"Node {nameToCheck} -> Node {g.vs[target]['name']} with RAI score: {score:.4f}")

igraph._write_graph_to_graphmlz_file(g, "graph.graphml.gz")

with gzip.open('graph.graphml.gz', 'rb') as f_in:
    with open('graph.graphml', 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)


def gradeSubGraphProperties(grade: str):
    print(f"Looking at properties of {grade}")
    indices = [v.index for v in g.vs if v['grade'] == grade]

    if len(indices) <= 2:
        print(f"No properties of {grade}\n")
        return

    subg = g.subgraph(indices)

    farthest = subg.farthest_points()

    subg.simplify(multiple=True, loops=True)

    shortestPath = subg.get_shortest_path(farthest[1], farthest[0])


    # Find the nodes with the highest degrees
    degrees = subg.degree()
    max_degree = max(degrees)

    print(f"Max degree for {grade}: {subg.vs.find(max_degree)}")


    print("Longest connection is:")
    for index, node in enumerate(shortestPath):
        print(f"{index}: {subg.vs[node]['name']}")

    print()


[gradeSubGraphProperties(grade) for grade in ["9th", "10th", "11th", "12th"]]


# Top 10 dumbest programming solutions ever written
import networkx as nx
import json
from networkx.readwrite import json_graph
import re

G=nx.read_graphml('graph.graphml')
data = json_graph.node_link_data(G)

for nodeid in data['nodes']:
    str=nodeid['id']
    nodeid['id']=[int(s) for s in str.split("n") if s.isdigit()][0]

with open('graph.json', 'w') as f:
    json.dump(data, f, indent=4)
