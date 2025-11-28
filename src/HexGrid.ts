import HexData from './HexData'
import { TileDefinition, ALL_TILES, socketsMatch, Direction } from './TileDefinition';
import { vec2, vec3 } from 'gl-matrix';

class HexGrid {
    private hexData: Map<string, HexData>;
    private flatCoordArray: vec2[];

    constructor() {
        this.hexData = new Map();
        this.flatCoordArray = [];
    }

    private getKey(q: number, r: number): string {
        return `${q},${r}`;
    }

    getHexData(q: number, r: number): HexData | null {
        return this.hexData.get(this.getKey(q, r)) || null;
    }

    setHexData(q: number, r: number, data: HexData): void {
        this.hexData.set(this.getKey(q, r), data);
    }

    hasHex(q: number, r: number): boolean {
        return this.hexData.has(this.getKey(q, r));
    }

    getAllHexData(): HexData[] {
        return Array.from(this.hexData.values());
    }

    getFlatCoordArray(): vec2[] {
        return this.flatCoordArray;
    }

    initializeHexGrid(tilesRadius: number): void {
        this.flatCoordArray = [];
        this.hexData.clear();

        for (let q = -tilesRadius; q <= tilesRadius; ++q) {
            for (let r = -tilesRadius; r <= tilesRadius; ++r) {
                const s = -q - r;
                if (Math.abs(s) <= tilesRadius) {
                    const coord = vec2.fromValues(q, r);
                    this.flatCoordArray.push(coord);

                    const hexData = new HexData(q, r);
                    this.setHexData(q, r, hexData);
                }
            }
        }
    }

    /** Force a specific tile definition at this location */
    forceCollapseSingleTile(q: number, r: number, tile: TileDefinition): boolean {
        const hex = this.getHexData(q, r);
        if (!hex || hex.observed) return false;

        hex.collapseTo(tile);
        this.propagateConstraints(hex);
        return true;
    }

    /** Choose a tile with lowest entropy and collapse it */
    collapseSingleTile(): boolean {
        const allHexes = this.getAllHexData();
        const unobserved = allHexes.filter(h => !h.observed);

        if (unobserved.length === 0) return true;

        const minEntropy = Math.min(...unobserved.map(h => h.entropy));
        const candidates = unobserved.filter(h => h.entropy === minEntropy);
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];

        const possible = Array.from(chosen.possibleTiles);
        const chosenTile = possible[Math.floor(Math.random() * possible.length)];

        chosen.collapseTo(chosenTile);
        this.propagateConstraints(chosen);

        return false;
    }

    /**
     * NEW propagation logic (socket-based)
     */
    propagateConstraints(observed: HexData) {
        const queue: HexData[] = [observed];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const { q, r } = current;

            const neighbors = this.getNeighborData(q, r);

            for (let dir = 0; dir < 6; dir++) {
                const neighbor = neighbors[dir];
                if (!neighbor || neighbor.observed) continue;

                const oppositeDir = (dir + 3) % 6 as Direction;

                // Filter invalid tiles in neighbor
                let changed = false;

                for (const tile of Array.from(neighbor.possibleTiles)) {
                    // Check compatibility with ALL possible tiles of current
                    let validAgainstAny = false;

                    for (const myTile of current.possibleTiles) {
                        const mySocket = myTile.sockets[dir as Direction];
                        const neighborSocket = tile.sockets[oppositeDir];

                        if (socketsMatch(mySocket, neighborSocket)) {
                            validAgainstAny = true;
                            break;
                        }
                    }

                    if (!validAgainstAny) {
                        neighbor.possibleTiles.delete(tile);
                        changed = true;
                    }
                }

                if (changed) {
                    neighbor.entropy = neighbor.possibleTiles.size;
                    queue.push(neighbor);
                }
            }
        }
    }

    /** World coordinate for rendering */
    getHexWorldPosition(q: number, r: number): vec3 {
        const x = (3.0 / 2 * q);
        const y = (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        return vec3.fromValues(x * 1.1, 0, y * 1.1);
    }

    /** Returns neighbors indexed by Direction (0–5) */
    getNeighborData(q: number, r: number): Array<HexData | null> {
        const dirs = [
            [0, -1],   // NORTH
            [1, -1],   // NE
            [1, 0],    // SE
            [0, 1],    // SOUTH
            [-1, 1],   // SW
            [-1, 0]    // NW
        ];

        const out: Array<HexData | null> = [];

        for (let i = 0; i < 6; i++) {
            const [dq, dr] = dirs[i];
            out[i] = this.getHexData(q + dq, r + dr);
        }

        return out;
    }
}

export default HexGrid;
