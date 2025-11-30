// Main data structure for hexes behavior

import { vec3 } from "gl-matrix";
import { TileDefinition, BASE_TILES } from './TileDefinition';

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
    observed: boolean;
    possibleTiles: Set<TileDefinition>;
    entropy: number;
    tile: TileDefinition | null;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;

        this.observed = false;
        this.tile = null;

        // Initially all tiles are possible
        this.possibleTiles = new Set<TileDefinition>();
        BASE_TILES.forEach(t => this.possibleTiles.add(t));

        this.entropy = this.possibleTiles.size;
    }

    collapseTo(tile: TileDefinition) {
        this.tile = tile;
        this.possibleTiles.clear();
        this.observed = true;
        this.entropy = 0;
    }
}

export default HexData;