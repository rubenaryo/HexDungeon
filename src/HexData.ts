// Main data structure for hexes behavior

import { vec3 } from "gl-matrix";

export enum TileType
{
    INVALID = -1,
    WATER = 0,
    SAND = 1,
    GRASS = 2
};

export function getPossibleNeighborTypes(t: TileType): TileType[]
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

export function getColorFromTileType(t: TileType) : vec3
{
    switch(t)
    {
        case TileType.INVALID:
            return vec3.fromValues(0,0,0);
        case TileType.WATER:
            return vec3.fromValues(0,0,1);
        case TileType.SAND:
            return vec3.fromValues(0.761, 0.698, 0.502);
        case TileType.GRASS:
            return vec3.fromValues(0,1,0);
    }

    return vec3.fromValues(1,1,1);
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
