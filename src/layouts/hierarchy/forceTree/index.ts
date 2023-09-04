function genericforceTreeLayout(assign: any, treeNodes: any[], options: any) {
    const skipDistance = options?.skipDistance || 175;
    const springLength = options?.springLength || 25;
    const springStrength = options?.springStrength || 0.1;
    const repulsionStrength = options?.repulsionStrength || 1500;
    const tickNum = options?.tickNumber || 1000;

    for (let i = 0; i < tickNum; i++) {
        for (let i = 0; i < treeNodes.length; i++) {
            let node = treeNodes[i];
            for (let j = i + 1; j < treeNodes.length; j++) {
                let other = treeNodes[j];
                let apartX = other.x - node.x;
                let apartY = other.y - node.y;
                let distance = Math.max(1, Math.sqrt(apartX * apartX + apartY * apartY))

                let hasEdge = node.hasNeighbor(other);
                if (!hasEdge && distance > skipDistance) continue;
                let forceSize = -repulsionStrength / (distance * distance);
                if (node.hasNeighbor(other)) {
                    forceSize += (distance - springLength) * springStrength;
                }

                let forceX = apartX * forceSize / distance;
                let forceY = apartY * forceSize / distance;

                node.x += forceX;
                node.y += forceY;

                other.x -= forceX;
                other.y -= forceY;
            }
        }
    }

    let data: { [key: string]: { x: number, y: number } } = {}
    treeNodes.forEach(((e: any) => {
        data[e.id] = {
            x: e.x * 5,
            y: e.y * 5
        };
    }));

    return data
}

var forceTreeLayout = genericforceTreeLayout.bind(null, false)

export default forceTreeLayout