// Date: 08/08/21
export default class styles {
    private _classList: Map<string, any>
    private _graph: any
    private __proto__:any
    constructor(graph) {
            this.__proto__._graph = graph
            this.__proto__._classList = new Map()
    }

    public addRule = ({ nodeAttribute, edgeAttribute, nodeSelector, edgeSelector }) => {
        let graphId = this._graph.id
        
    }
    
    
    public setSelectedEdgeAttributes = () => {
        
    }
}