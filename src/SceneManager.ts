import { vec2, vec3, vec4, mat4 } from 'gl-matrix';
import Hex from './geometry/Hex';
import HexGrid from './HexGrid';
import * as hd from './HexData'
import ShaderProgram from './rendering/gl/ShaderProgram';
import Camera from './Camera';

export class SceneManager {
    hex: Hex;
    hexGrid: HexGrid;

    loadScene(): void {
        this.hex = new Hex();
        this.hex.create();
        this.hexGrid = new HexGrid();
        this.hexGrid.initializeHexGrid(15);

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

        // Model matrix and inv model
        mat4.identity(model);
        mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
        prog.setUniformMat4("u_ViewProj", viewProj);

        let hexTiles = this.hexGrid.getFlatCoordArray();
        hexTiles.forEach((tile) => {
            const q = tile[0];
            const r = tile[1];

            const hexData = this.hexGrid.getHexData(q, r);

            let color = vec3.fromValues(0.0, 0.0, 0.0);//hd.getColorFromTileType(hexData.type);
            prog.setUniformVec4("u_Color", vec4.fromValues(color[0], color[1], color[2], 1));

            // get cartesian pos
            const position = this.hexGrid.getHexWorldPosition(q, r);

            mat4.fromTranslation(model, position);
            prog.setUniformMat4("u_Model", model);
            mat4.transpose(modelinvtr, model);
            mat4.invert(modelinvtr, modelinvtr);
            prog.setUniformMat4("u_ModelInvTr", modelinvtr);
            prog.draw(this.hex);
        });
    }
}
