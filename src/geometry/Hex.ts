import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';
import { parseOBJ } from '../utils/ModelUtils';

class Hex extends Drawable
{
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;

    constructor()
    {
        super();
    }

    async create()
    {
        try
        {
            // Load the OBJ file
            const response = await fetch('./models/hex.obj');
            if (!response.ok)
            {
                throw new Error(`Failed to load hex.obj: ${response.status} ${response.statusText}`);
            }

            const objText = await response.text();

            const objData = parseOBJ(objText);

            this.positions = objData.positions;
            this.normals = objData.normals;
            this.indices = objData.indices;
            this.uvs = objData.uvs;

            // Generate WGL buffers
            this.generateIdx();
            this.generatePos();
            this.generateNor();
            this.generateUV();

            this.count = this.indices.length;

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
            gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
            gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
            gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

            console.log(`Created hex from OBJ file`);
        }
        catch (error)
        {
            console.error('Error loading hex.obj:', error);
            throw error;
        }
    }
}

export default Hex;