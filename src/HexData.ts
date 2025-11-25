// Main data structure for hexes behavior

import { vec3 } from "gl-matrix";

export enum TileType
{
    INVALID = -1,
    FIRST,
    WATER = FIRST,
    SAND,
    GRASS,
    FOREST,
    COUNT // Keep last
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

export function getDisallowedNeighborTypes(t: TileType): TileType[]
{
    let ret = [];
    switch(t)
    {
        case TileType.INVALID:
            break;
        case TileType.WATER:
            ret.push(TileType.GRASS);
            ret.push(TileType.FOREST);
            break;
        case TileType.SAND:
            ret.push(TileType.FOREST);
            break;
        case TileType.GRASS:
            ret.push(TileType.WATER);
            break;
        case TileType.FOREST:
            ret.push(TileType.SAND);
            ret.push(TileType.WATER);
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
        case TileType.FOREST:
            return vec3.fromValues(0.13, 0.55, 0.13)
    }

    return vec3.fromValues(1,1,1);
}

class HexData {
    q: number;
    r: number;
    type: TileType;
    observed: boolean;
    possibleTypes: Set<TileType>
    entropy: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
        this.type = TileType.INVALID;
        this.observed = false;

        this.possibleTypes = new Set<TileType>();
        for (let i = TileType.FIRST; i < TileType.COUNT; ++i)
            this.possibleTypes.add(i);

        this.entropy = this.possibleTypes.size;
    }

    collapseTo(type: TileType)
    {
        this.type = type;
        this.possibleTypes.clear();
        this.entropy = 0;
        this.observed = true;
    }
}

export default HexData