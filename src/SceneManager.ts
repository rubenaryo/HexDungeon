import { vec2, vec3, vec4, mat4 } from 'gl-matrix';
import Hex from './geometry/Hex';
import Cube from './geometry/Cube';
import HexGrid from './HexGrid';
import { SocketType } from './TileDefinition';
import * as hd from './HexData'
import ShaderProgram from './rendering/gl/ShaderProgram';
import Camera from './Camera';

export class SceneManager {
    hex: Hex;
    cube: Cube;
    hexGrid: HexGrid;

    loadScene(): void {
        this.hex = new Hex();
        this.hex.create();
        this.hexGrid = new HexGrid();
        this.hexGrid.initializeHexGrid(5);

        this.cube = new Cube(vec3.fromValues(0,0,0), 1);
        this.cube.create();

        //const SPACING:number = 5;
        //this.hexGrid.forceCollapseSingleTile(-SPACING, 0, hd.TileType.WATER);
        //this.hexGrid.forceCollapseSingleTile(SPACING, 0, hd.TileType.WATER);
        //this.hexGrid.forceCollapseSingleTile(SPACING/2.5, -SPACING/2.5, hd.TileType.WATER);
    }

    collapseSingleTile(): void
    {
        this.hexGrid.collapseSingleTile();
    }

    collapseWholeGrid(): void
    {
        var done = false;
        while(!done)
        {
            done = this.hexGrid.collapseSingleTile();
        }
    }

    drawTiles(prog: ShaderProgram, camera: Camera): void {
    let model = mat4.create();
    let modelinvtr = mat4.create();
    let viewProj = mat4.create();

    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    prog.setUniformMat4("u_ViewProj", viewProj);

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

        const tileColor = vec3.fromValues(0,0,0);
        prog.setUniformVec4("u_Color", vec4.fromValues(tileColor[0], tileColor[1], tileColor[2], 1));

        const tilePos = this.hexGrid.getHexWorldPosition(q, r);
        mat4.fromTranslation(model, tilePos);
        prog.setUniformMat4("u_Model", model);

        mat4.transpose(modelinvtr, model);
        mat4.invert(modelinvtr, modelinvtr);
        prog.setUniformMat4("u_ModelInvTr", modelinvtr);

        prog.draw(this.hex);   // draw your hex tile mesh

        const tileDef = hexData.tile;
        if (!tileDef) return; // if not collapsed yet

        // --- Draw socket cubes ---
        for (let dir = 0; dir < 6; dir++) {
            const socket = tileDef.sockets[dir as keyof typeof tileDef.sockets];

            // Determine cube color
            const isOpen = socket === SocketType.OPEN;
            const color = isOpen
                ? vec4.fromValues(0, 1, 0, 1)   // green
                : vec4.fromValues(1, 0, 0, 1);  // red

            prog.setUniformVec4("u_Color", color);

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
            prog.setUniformMat4("u_Model", cubeModel);

            // Model inverse transpose
            const cubeInvTr = mat4.create();
            mat4.transpose(cubeInvTr, cubeModel);
            mat4.invert(cubeInvTr, cubeInvTr);
            prog.setUniformMat4("u_ModelInvTr", cubeInvTr);

            // Draw cube mesh
            prog.draw(this.cube);
        }
    });
}
}
