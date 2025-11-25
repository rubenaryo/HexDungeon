import HexData from './HexData'
import * as hd from './HexData'
import { vec2, vec3, mat4 } from 'gl-matrix';

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

    initializeHexGrid(tilesRadius: number, possibleTileTypes: string[]): void {
        this.flatCoordArray = [];
        this.hexData.clear();

        for (let q = -tilesRadius; q <= tilesRadius; ++q) {
            for (let r = -tilesRadius; r <= tilesRadius; ++r) {
                for (let s = -tilesRadius; s <= tilesRadius; ++s) {
                    if ((q + r + s) === 0) {
                        const coord = vec2.fromValues(q, r);
                        this.flatCoordArray.push(coord);
                        let hexData = new HexData(q, r);

                        this.setHexData(q, r, hexData);
                    }
                }
            }
        }
    }

    collapseSingleTile(): boolean
    {
        const allHexes = this.getAllHexData();
        const unobservedHexes = allHexes.filter(hex => !hex.observed);
        
        if (unobservedHexes.length === 0) return false;

        // Per WFC - begin by observing the tile with the lowest entropy (least choice)
        const minEntropy = Math.min(...unobservedHexes.map(hex => hex.entropy));
        const candidates = unobservedHexes.filter(hex => hex.entropy === minEntropy);
        
        const randomHex = candidates[Math.floor(Math.random() * candidates.length)];
        const possibleTypes = Array.from(randomHex.possibleTypes);
        const randomTile = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
        
        randomHex.collapseTo(randomTile);

        return true;
    }

    // Helper method to convert to cartesian
    getHexWorldPosition(q: number, r: number): vec3 {
        const x = (3.0 / 2 * q);
        const y = (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        return vec3.fromValues(x * 1.1, 0, y * 1.1);
    }

    getNeighbors(q: number, r: number): HexData[] {
        // Hexagonal neighbors in axial coordinates
        const directions = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1]
        ];
        
        const neighbors: HexData[] = [];
        directions.forEach(([dq, dr]) => {
            const neighborQ = q + dq;
            const neighborR = r + dr;
            const neighbor = this.getHexData(neighborQ, neighborR);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        });
        
        return neighbors;
    }
}

export default HexGrid;