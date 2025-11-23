// Main data structure for hexes behavior

class HexData {
    q: number;
    r: number;
    tileType: string | null; // TODO: enum

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
        this.tileType = null;
    }
}

export default HexData;
