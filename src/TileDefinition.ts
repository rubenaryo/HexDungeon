import { vec2, vec3 } from "gl-matrix";

export enum Direction {
    NORTH = 0,
    NORTHEAST = 1,
    SOUTHEAST = 2,
    SOUTH = 3,
    SOUTHWEST = 4,
    NORTHWEST = 5
}

export const DIRECTION_COUNT = 6;

export const AXIAL_OFFSETS: vec2[] = [
    vec2.fromValues(0, -1),  // NORTH
    vec2.fromValues(1, -1),  // NORTHEAST
    vec2.fromValues(1, 0),   // SOUTHEAST
    vec2.fromValues(0, 1),   // SOUTH
    vec2.fromValues(-1, 1),  // SOUTHWEST
    vec2.fromValues(-1, 0)   // NORTHWEST
];

export function axialToDirection(offset: vec2|null): Direction | null {
    if (offset == null)
        return null;
    
    for (let i = 0; i < AXIAL_OFFSETS.length; i++) {
        const o = AXIAL_OFFSETS[i];

        if (o[0] === offset[0] && o[1] === offset[1]) {
            return i as Direction;
        }
    }
    return null; // not a valid direction
}

const directionVectors: vec3[] = [
    vec3.fromValues(0, 0, -1),
    vec3.fromValues(Math.SQRT1_2, 0, -Math.SQRT1_2),
    vec3.fromValues(Math.SQRT1_2, 0, Math.SQRT1_2),
    vec3.fromValues(0, 0, 1),
    vec3.fromValues(-Math.SQRT1_2, 0, Math.SQRT1_2),
    vec3.fromValues(-Math.SQRT1_2, 0, -Math.SQRT1_2)
];

export function getDirectionVector(d: Direction): vec3 {
    return directionVectors[d];
}

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.SOUTH,
    [Direction.NORTHEAST]: Direction.SOUTHWEST,
    [Direction.SOUTHEAST]: Direction.NORTHWEST,
    [Direction.SOUTH]: Direction.NORTH,
    [Direction.SOUTHWEST]: Direction.NORTHEAST,
    [Direction.NORTHWEST]: Direction.SOUTHEAST
};

export enum SocketType {
    OPEN = 0,
    WALL = 1,
    SOLID = 2
}

export interface TileDefinition {
    name: string;
    rotation: number;
    textureName: string;
    texture: WebGLTexture | null;
    sockets: { [K in Direction]: SocketType };
}

export function socketsMatch(a: SocketType, b: SocketType): boolean {
    return a === b;
}

function makeBaseTile(
    name: string,
    textureName: string,
    sockets: { [K in Direction]: SocketType }
): TileDefinition {
    return {
        name,
        rotation: 0,
        textureName,
        texture: null,
        sockets
    };
}

const Corridor = makeBaseTile("Corridor", "corridor.png", {
    [Direction.NORTH]: SocketType.OPEN,
    [Direction.NORTHEAST]: SocketType.WALL,
    [Direction.SOUTHEAST]: SocketType.WALL,
    [Direction.SOUTH]: SocketType.OPEN,
    [Direction.SOUTHWEST]: SocketType.WALL,
    [Direction.NORTHWEST]: SocketType.WALL
});

const DeadEnd = makeBaseTile("DeadEnd", "deadend.png", {
    [Direction.NORTH]: SocketType.OPEN,
    [Direction.NORTHEAST]: SocketType.WALL,
    [Direction.SOUTHEAST]: SocketType.WALL,
    [Direction.SOUTH]: SocketType.WALL,
    [Direction.SOUTHWEST]: SocketType.WALL,
    [Direction.NORTHWEST]: SocketType.WALL
});

const TJunction = makeBaseTile("TJunction", "tjunction.png", {
    [Direction.NORTH]: SocketType.OPEN,
    [Direction.NORTHEAST]: SocketType.OPEN,
    [Direction.SOUTHEAST]: SocketType.WALL,
    [Direction.SOUTH]: SocketType.OPEN,
    [Direction.SOUTHWEST]: SocketType.WALL,
    [Direction.NORTHWEST]: SocketType.OPEN
});

const RoomFloor = makeBaseTile("RoomFloor", "room.png", {
    [Direction.NORTH]: SocketType.OPEN,
    [Direction.NORTHEAST]: SocketType.OPEN,
    [Direction.SOUTHEAST]: SocketType.OPEN,
    [Direction.SOUTH]: SocketType.OPEN,
    [Direction.SOUTHWEST]: SocketType.OPEN,
    [Direction.NORTHWEST]: SocketType.OPEN
});

export const Solid = makeBaseTile("Solid", "solid.png", {
    [Direction.NORTH]: SocketType.SOLID,
    [Direction.NORTHEAST]: SocketType.SOLID,
    [Direction.SOUTHEAST]: SocketType.SOLID,
    [Direction.SOUTH]: SocketType.SOLID,
    [Direction.SOUTHWEST]: SocketType.SOLID,
    [Direction.NORTHWEST]: SocketType.SOLID
});

// Special tile types for start and end of the level

export const Start = makeBaseTile("Start", "start.png", {
    [Direction.NORTH]: SocketType.OPEN,
    [Direction.NORTHEAST]: SocketType.WALL,
    [Direction.SOUTHEAST]: SocketType.OPEN,
    [Direction.SOUTH]: SocketType.WALL,
    [Direction.SOUTHWEST]: SocketType.OPEN,
    [Direction.NORTHWEST]: SocketType.WALL
});

export const End = makeBaseTile("End", "end.png", {
    [Direction.NORTH]: SocketType.OPEN,
    [Direction.NORTHEAST]: SocketType.WALL,
    [Direction.SOUTHEAST]: SocketType.OPEN,
    [Direction.SOUTH]: SocketType.WALL,
    [Direction.SOUTHWEST]: SocketType.OPEN,
    [Direction.NORTHWEST]: SocketType.WALL
});

export function rotateTile(base: TileDefinition, rotation: number): TileDefinition {
    const rotated: TileDefinition = {
        name: `${base.name}_rot${rotation}`,
        rotation,
        textureName: base.textureName,
        texture: null,
        sockets: {} as { [K in Direction]: SocketType }
    };

    for (let d = 0; d < DIRECTION_COUNT; d++) {
        const oldDir = d as Direction;
        const newDir = ((d + rotation) % DIRECTION_COUNT) as Direction;
        rotated.sockets[newDir] = base.sockets[oldDir];
    }

    return rotated;
}

const unrotatedTiles = [Corridor, DeadEnd, TJunction, RoomFloor, Solid, Start, End];

export const ALL_TILES: TileDefinition[] = [];
export const BASE_TILES: TileDefinition[] = [];
export const START_TILES: TileDefinition[] = [];
export const END_TILES: TileDefinition[] = [];

for (const t of unrotatedTiles) {
    for (let r = 0; r < DIRECTION_COUNT; r++) {
        let rotated = rotateTile(t, r);
        ALL_TILES.push(rotated);

        if (t.name != "Start" && t.name != "End")
            BASE_TILES.push(rotated);
        else if (t.name == "Start")
            START_TILES.push(rotated);
        else if (t.name == "End")
            END_TILES.push(rotated);
    }
}

export function getBaseTileForEntryExit(entry:Direction, exit:Direction): TileDefinition|null
{
    let filtered = BASE_TILES.filter((tile) => 
        tile.sockets[entry] == SocketType.OPEN && tile.sockets[exit] == SocketType.OPEN);

    if (filtered.length == 0)
        return null;

    let randIdx = Math.floor(Math.random() * filtered.length);
    return filtered[randIdx];
}

export async function loadTileTextures(
    gl: WebGL2RenderingContext,
    basePath: string
): Promise<void> {
    const loadTexture = (file: string): Promise<WebGLTexture> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const tex = gl.createTexture();
                if (!tex) {
                    reject(new Error("Failed to create texture"));
                    return;
                }
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                resolve(tex);
            };
            img.onerror = reject;
            img.src = basePath + file;
        });
        
    const promises = ALL_TILES.map(async tile => {
        const tex = await loadTexture(tile.textureName);
        tile.texture = tex;
    });

    await Promise.all(promises);
}
