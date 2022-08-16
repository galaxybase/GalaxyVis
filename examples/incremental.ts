import galaxyvis from "../src/galaxyVis";

let renderer = "webgl"
let galaxyVis = new galaxyvis({
    container: 'container',
    renderer: renderer,
    options: {
        backgroundColor: "#F9FBFF",
    }
})

const generateDenseTree = (startNodeId, startEdgeId, N, inId?, maxR?, minR?) => {
    maxR = maxR || 10;
    minR = minR || 5;
    return new Promise((resolve, reject) => {
        const nodes = new Array(N).fill(0).map((_, i) => {
            return {
                id: startNodeId + i + '',
                attributes: {
                    text: startNodeId + i + '',
                    x: -50 + Math.random() * 100,
                    y: -50 + Math.random() * 100
                }
            };
        });
        const edges = new Array(N).fill(0).map((_, i) => {
            if (i == N - 1) {
                return {
                    id: startEdgeId + i + '',
                    source: inId + '',
                    target: startNodeId +'',
                }
            }
            return {
                id: startEdgeId + i + '',
                source: startNodeId + Math.floor(Math.sqrt(i) / 2) + '',
                target: startNodeId + i + 1 + ''
            };
        });
        resolve({ nodes: nodes, edges: edges });
    });
};


const incremental = () => {
    galaxyVis.events.on('doubleClick', (evt) => {
        generateDenseTree(galaxyVis.getNodes().size, galaxyVis.getEdges().size, 5, evt.target.getId()).then((data: any) => {
            galaxyVis.addGraph(data).then((data: any) => {
                galaxyVis.layouts.force({
                    nodes: data.nodes.getId(),
                    incremental: true,
                    incrementalNode: evt.target.getId()
                }).then(()=>{
                    galaxyVis.view.locateGraph()
                })
            })
        })
    })

    generateDenseTree(0, 0, 5)
    .then(graph => {
        // @ts-ignore
        return galaxyVis.addGraph(graph);
    })
    .then(() => {
        return galaxyVis.layouts.force({});
    })

}

incremental();

export default incremental
