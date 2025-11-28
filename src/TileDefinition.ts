import { vec3 } from "gl-matrix";

// Hex direction for adjacency lookups
export enum Direction {
    NORTH = 0,
    NORTHEAST = 1,
    SOUTHEAST = 2,
    SOUTH = 3,
    SOUTHWEST = 4,
    NORTHWEST = 5
}
const DIRECTION_COUNT:number = 6;

const directionVectors: vec3[] = [
    vec3.fromValues( 0,            0,            -1 ), // NORTH
    vec3.fromValues( Math.SQRT1_2, 0, -Math.SQRT1_2 ), // NORTHEAST
    vec3.fromValues( Math.SQRT1_2, 0,  Math.SQRT1_2 ), // SOUTHEAST
    vec3.fromValues( 0,            0,             1 ), // SOUTH
    vec3.fromValues(-Math.SQRT1_2, 0,  Math.SQRT1_2 ), // SOUTHWEST
    vec3.fromValues(-Math.SQRT1_2, 0, -Math.SQRT1_2 )  // NORTHWEST
];

export function getDirectionVector(d: Direction): vec3
{
    return directionVectors[d];
}

// Opposite directions for axial hex grids
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
    [Direction.NORTH]:     Direction.SOUTH,
    [Direction.NORTHEAST]: Direction.SOUTHWEST,
    [Direction.SOUTHEAST]: Direction.NORTHWEST,
    [Direction.SOUTH]:     Direction.NORTH,
    [Direction.SOUTHWEST]: Direction.NORTHEAST,
    [Direction.NORTHWEST]: Direction.SOUTHEAST,
};


//    OPEN  = corridor / doorway / free flow
//    WALL  = impassable boundary
//    SOLID = completely blocked (terrain/rock)
export enum SocketType {
    OPEN = 0,
    WALL = 1,
    SOLID = 2,
}

export interface TileDefinition {
    name: string;
    rotation: number;  // 0–5
    sockets: { [K in Direction]: SocketType }; // 6 sockets per tile, indexed by direction
}

// Straight corridor (N <-> S)
const Corridor: TileDefinition = {
    name: "Corridor",
    rotation: 0,
    sockets: {
        [Direction.NORTH]:     SocketType.OPEN,
        [Direction.NORTHEAST]: SocketType.WALL,
        [Direction.SOUTHEAST]: SocketType.WALL,
        [Direction.SOUTH]:     SocketType.OPEN,
        [Direction.SOUTHWEST]: SocketType.WALL,
        [Direction.NORTHWEST]: SocketType.WALL,
    }
};

// Dead end (open only on NORTH)
const DeadEnd: TileDefinition = {
    name: "DeadEnd",
    rotation: 0,
    sockets: {
        [Direction.NORTH]:     SocketType.OPEN,
        [Direction.NORTHEAST]: SocketType.WALL,
        [Direction.SOUTHEAST]: SocketType.WALL,
        [Direction.SOUTH]:     SocketType.WALL,
        [Direction.SOUTHWEST]: SocketType.WALL,
        [Direction.NORTHWEST]: SocketType.WALL,
    }
};

// Three-way T-junction (N, NE, NW open)
const TJunction: TileDefinition = {
    name: "TJunction",
    rotation: 0,
    sockets: {
        [Direction.NORTH]:     SocketType.OPEN,
        [Direction.NORTHEAST]: SocketType.OPEN,
        [Direction.SOUTHEAST]: SocketType.WALL,
        [Direction.SOUTH]:     SocketType.WALL,
        [Direction.SOUTHWEST]: SocketType.WALL,
        [Direction.NORTHWEST]: SocketType.OPEN,
    }
};

// Room floor / open tile
const RoomFloor: TileDefinition = {
    name: "RoomFloor",
    rotation: 0,
    sockets: {
        [Direction.NORTH]:     SocketType.OPEN,
        [Direction.NORTHEAST]: SocketType.OPEN,
        [Direction.SOUTHEAST]: SocketType.OPEN,
        [Direction.SOUTH]:     SocketType.OPEN,
        [Direction.SOUTHWEST]: SocketType.OPEN,
        [Direction.NORTHWEST]: SocketType.OPEN,
    }
};

// Solid / rock / void
const Solid: TileDefinition = {
    name: "Solid",
    rotation: 0,
    sockets: {
        [Direction.NORTH]:     SocketType.SOLID,
        [Direction.NORTHEAST]: SocketType.SOLID,
        [Direction.SOUTHEAST]: SocketType.SOLID,
        [Direction.SOUTH]:     SocketType.SOLID,
        [Direction.SOUTHWEST]: SocketType.SOLID,
        [Direction.NORTHWEST]: SocketType.SOLID,
    }
};

export function socketsMatch(a: SocketType, b: SocketType): boolean {
    return a === b;
}

// Rotation function with explicit cast from number -> Direction
export function rotateTile(base: TileDefinition, rotation: number): TileDefinition {
    const rotated: TileDefinition = {
        name: `${base.name}_rot${rotation}`,
        rotation,
        sockets: {} as { [K in Direction]: SocketType }
    };

    for (let d = 0; d < DIRECTION_COUNT; d++) {
        const oldDir = d as Direction;
        const newDir = ((d + rotation) % DIRECTION_COUNT) as Direction;
        rotated.sockets[newDir] = base.sockets[oldDir];
    }

    return rotated;
}

// Start with the 6 unique base tile templates, and add rotated variants for each.
const baseTiles = [Corridor, DeadEnd, TJunction, RoomFloor, Solid];

export const ALL_TILES: TileDefinition[] = [];

for (const t of baseTiles) {
    for (let r = 0; r < DIRECTION_COUNT; r++) {
        ALL_TILES.push(rotateTile(t, r));
    }
}
