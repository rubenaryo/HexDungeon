// Main data structure for hexes behavior

enum TileType
{
    INVALID = -1,
    WATER = 0,
    SAND = 1,
    GRASS = 2
};

function getPossibleNeighborTypes(t: TileType): TileType[]
{
    let ret = [];
    switch(t)
    {
        case TileType.INVALID:
            ret.push(TileType.WATER, TileType.SAND, TileType.GRASS);
            break;
        case TileType.WATER:
            ret.push(TileType.WATER, TileType.SAND);
            break;
        case TileType.SAND:
            ret.push(TileType.WATER, TileType.SAND, TileType.GRASS);
            break;
        case TileType.GRASS:
            ret.push(TileType.SAND, TileType.GRASS);
            break;
    }

    return ret;
}

class HexData {
    q: number;
    r: number;
    type: TileType;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
        this.type = TileType.INVALID;
    }
}

export default HexData;
