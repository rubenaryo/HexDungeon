import { vec2, vec3, vec4, mat4 } from 'gl-matrix';
import Hex from './geometry/Hex';
import Cube from './geometry/Cube';
import HexGrid from './HexGrid';
import { TileDefinition, Direction, axialToDirection, SocketType, Solid, Start, End, SOLID_TILES, BASE_TILES, START_TILES, END_TILES } from './TileDefinition';
import * as hd from './HexData'
import ShaderProgram from './rendering/gl/ShaderProgram';
import Camera from './Camera';
import { gl } from './globals';

const GRID_RADIUS = 5;
export class SceneManager {
    hex: Hex;
    cube: Cube;
    hexGrid: HexGrid;

    loadScene(): void {
        this.hex = new Hex();
        this.hex.create();
        this.hexGrid = new HexGrid();
        this.hexGrid.initializeHexGrid(GRID_RADIUS);

        this.cube = new Cube(vec3.fromValues(0, 0, 0), 1);
        this.cube.create();

        const randomStartIdx = Math.floor(Math.random() * START_TILES.length);
        const randomEndIdx = Math.floor(Math.random() * END_TILES.length)

        const randomStart = START_TILES[randomStartIdx];
        const randomEnd = END_TILES[randomEndIdx];

        const SPACING: number = 3;
        const startPos = vec2.fromValues(-SPACING, 0);
        const endPos = vec2.fromValues(SPACING, 0);
        this.hexGrid.forceCollapseSingleTile(startPos[0], startPos[1], randomStart);
        this.hexGrid.forceCollapseSingleTile(endPos[0], endPos[1], randomEnd);
        //this.hexGrid.forceCollapseSingleTile(SPACING/2.5, -SPACING/2.5, hd.TileType.WATER);

        this.collapseGoalPath(startPos, endPos);
    }

    collapseSingleTile(): void {
        this.hexGrid.collapseSingleTile();
    }

    collapseWholeGrid(): void {
        var done = false;
        while (!done) {
            done = this.hexGrid.collapseSingleTile();
        }

        let datas = this.hexGrid.getAllHexData().filter(h => !h.observed);

        for (let data of datas)
        {
            if (!data.observed)
            {
                this.hexGrid.forceCollapseSingleTile(data.q, data.r, SOLID_TILES[0])
            }
        }
    }

    collapseGoalPath(startIdx: vec2, endIdx: vec2): void {
        const HEX_DIRS = [
            vec2.fromValues(+1, 0),
            vec2.fromValues(+1, -1),
            vec2.fromValues(0, -1),
            vec2.fromValues(-1, 0),
            vec2.fromValues(-1, +1),
            vec2.fromValues(0, +1)
        ];

        function axialKey(v: vec2): string {
            return `${v[0]},${v[1]}`;
        }

        function shuffle<T>(arr: T[]): T[] {
            for (let i = arr.length - 1; i > 0; --i) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function withinRadius(n:number, radius:number): boolean {
            return Math.abs(n) <= radius;
        }

        const visited = new Set<string>();
        const path: vec2[] = [];

        function dfs(current: vec2): boolean {
            const key = axialKey(current);
            if (visited.has(key)) return false;
            visited.add(key);
            path.push(current);

            if (current[0] === endIdx[0] && current[1] === endIdx[1]) {
                return true; // Reached goal
            }

            // Try neighbors in random order
            const dirs = shuffle([...HEX_DIRS]);
            for (let d of dirs) {
                const next = vec2.fromValues(current[0] + d[0], current[1] + d[1]);
                if (!withinRadius(next[0], GRID_RADIUS))
                    continue;
                if (!withinRadius(next[1], GRID_RADIUS))
                    continue;

                if (dfs(next)) return true;
            }

            // Dead end -> backtrack
            path.pop();
            return false;
        }

        dfs(vec2.clone(startIdx));

        console.log(path.length);
        
        function subtract(a:vec2, b:vec2) : vec2
        {
            return vec2.fromValues(a[0] - b[0], a[1] - b[1]);
        }

        function validateDef(def:TileDefinition, requiredDir:Direction[])
        {
            for(let reqDir of requiredDir)
            {
                if (def.sockets[reqDir] != SocketType.OPEN)
                    return false;
            }

            return true;
        }

        let prevIdx = null;
        let nextIdx = null;
        for (let i = 0; i != path.length; ++i)
        {
            let idx = path[i];
            prevIdx = i-1 > 0 ? path[i - 1] : null;
            nextIdx = i+1 < path.length ? path[i+1] : null;

            let requiredDir: Direction[] = []

            if (prevIdx != null)
            {
                let entryOffset = subtract(prevIdx, idx);
                let entryDir = axialToDirection(entryOffset);
                requiredDir.push(entryDir);
            }

            if (nextIdx != null)
            {
                let exitOffset = subtract(nextIdx, idx);
                let exitDir = axialToDirection(exitOffset);
                requiredDir.push(exitDir);
            }

            let hexData = this.hexGrid.getHexData(idx[0], idx[1]);
            if (hexData == null)
            {
                continue;
            }

            for (const tile of hexData.possibleTiles) 
            {
                if (!validateDef(tile, requiredDir))
                {
                    hexData.possibleTiles.delete(tile);
                }
            }
        }
    }

    drawTiles(prog: ShaderProgram, debugProg: ShaderProgram, camera: Camera): void {
        let model = mat4.create();
        let modelinvtr = mat4.create();
        let viewProj = mat4.create();

        mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
        prog.setUniformMat4("u_ViewProj", viewProj);
        debugProg.setUniformMat4("u_ViewProj", viewProj);

        const hexTiles = this.hexGrid.getFlatCoordArray();

        // Unit vectors for each hex direction in world space
        const dirOffsets = [
            vec3.fromValues(0, 0, -1),                // NORTH
            vec3.fromValues(0.866, 0, -0.5),          // NE
            vec3.fromValues(0.866, 0, 0.5),           // SE
            vec3.fromValues(0, 0, 1),                 // SOUTH
            vec3.fromValues(-0.866, 0, 0.5),          // SW
            vec3.fromValues(-0.866, 0, -0.5),         // NW
        ];

        hexTiles.forEach((tile) => {
            const q = tile[0];
            const r = tile[1];
            const hexData = this.hexGrid.getHexData(q, r);

            if (!hexData) return;

            prog.use();
            gl.activeTexture(gl.TEXTURE0);
            const tileDef = hexData.tile;
            if (tileDef && tileDef.texture) {
                gl.bindTexture(gl.TEXTURE_2D, tileDef.texture);
            }
            else {
                gl.bindTexture(gl.TEXTURE_2D, SOLID_TILES[0].texture);
            }

            prog.setUniformInt("u_Texture", 0);

            const tileColor = vec3.fromValues(0, 0, 0);
            prog.setUniformVec4("u_Color", vec4.fromValues(tileColor[0], tileColor[1], tileColor[2], 1));

            const tilePos = this.hexGrid.getHexWorldPosition(q, r);
            mat4.fromTranslation(model, tilePos);
            prog.setUniformMat4("u_Model", model);

            mat4.transpose(modelinvtr, model);
            mat4.invert(modelinvtr, modelinvtr);
            prog.setUniformMat4("u_ModelInvTr", modelinvtr);

            prog.setUniformInt("u_Rotation", tileDef ? tileDef.rotation : 0);
            prog.draw(this.hex);   // draw your hex tile mesh
            if (!tileDef) return; // if not collapsed yet

            return;
            // --- Draw socket cubes ---
            for (let dir = 0; dir < 6; dir++) {
                const socket = tileDef.sockets[dir as keyof typeof tileDef.sockets];

                // Determine cube color
                const isOpen = socket === SocketType.OPEN;
                const color = isOpen
                    ? vec4.fromValues(0, 1, 0, 1)   // green
                    : vec4.fromValues(1, 0, 0, 1);  // red

                debugProg.setUniformVec4("u_Color", color);

                // Offset cube from tile center
                const offset = vec3.clone(dirOffsets[dir]);
                vec3.scale(offset, offset, 0.8);     // distance from center

                let cubePos = vec3.create();
                vec3.add(cubePos, tilePos, offset);
                cubePos[1] += 0.55;

                // Scale down cube
                const cubeModel = mat4.create();
                mat4.fromTranslation(cubeModel, cubePos);
                const CUBE_SCALE = 0.2;
                mat4.scale(cubeModel, cubeModel, vec3.fromValues(CUBE_SCALE, CUBE_SCALE, CUBE_SCALE));
                debugProg.setUniformMat4("u_Model", cubeModel);

                // Model inverse transpose
                const cubeInvTr = mat4.create();
                mat4.transpose(cubeInvTr, cubeModel);
                mat4.invert(cubeInvTr, cubeInvTr);
                debugProg.setUniformMat4("u_ModelInvTr", cubeInvTr);

                // Draw cube mesh
                debugProg.draw(this.cube);
            }
        });
    }
}
