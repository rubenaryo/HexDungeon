import { vec3, vec2 } from "gl-matrix";

export function parseOBJ(objText: string): {
    positions: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;
    indices: Uint32Array;
} {
    const tempPositions: vec3[] = [];
    const tempNormals: vec3[] = [];
    const tempUVs: vec2[] = [];

    const finalPositions: number[] = [];
    const finalNormals: number[] = [];
    const finalUVs: number[] = [];
    const finalIndices: number[] = [];

    // Cache: maps "p/t/n" to final vertex index
    const vertexCache = new Map<string, number>();

    const lines = objText.split("\n");

    function getOrCreateVertex(p: number, t: number, n: number): number {
        const key = `${p}/${t}/${n}`;

        // Already built?
        if (vertexCache.has(key)) {
            return vertexCache.get(key)!;
        }

        // --- Create new combined vertex ---

        const pos = tempPositions[p];
        finalPositions.push(pos[0], pos[1], pos[2], 1.0);

        const uv = (t >= 0 ? tempUVs[t] : vec2.fromValues(0, 0));
        finalUVs.push(uv[0], uv[1]);

        const normal = (n >= 0 ? tempNormals[n] : vec3.fromValues(0, 1, 0));
        finalNormals.push(normal[0], normal[1], normal[2], 0.0);

        // Use vertexCache.size as the new vertex index
        const newIndex = vertexCache.size;
        vertexCache.set(key, newIndex);

        return newIndex;
    }

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length === 0) continue;

        switch (parts[0]) {
            case "v": {
                tempPositions.push(vec3.fromValues(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ));
                break;
            }

            case "vt": {
                tempUVs.push(vec2.fromValues(
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                ));
                break;
            }

            case "vn": {
                tempNormals.push(vec3.fromValues(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ));
                break;
            }

            case "f": {
                const face = parts.slice(1);

                // Triangulate n-gon into triangles
                for (let i = 1; i < face.length - 1; i++) {
                    const verts = [
                        face[0],
                        face[i],
                        face[i + 1]
                    ];

                    for (const fv of verts) {
                        const indices = fv.split("/");
                        
                        // Parse vertex index (always present)
                        const p = parseInt(indices[0]) - 1;
                        
                        // Parse UV index (may be empty)
                        let t = -1;
                        if (indices.length > 1 && indices[1] !== "") {
                            t = parseInt(indices[1]) - 1;
                        }
                        
                        // Parse normal index (may be empty)
                        let n = -1;
                        if (indices.length > 2 && indices[2] !== "") {
                            n = parseInt(indices[2]) - 1;
                        }

                        const index = getOrCreateVertex(p, t, n);
                        finalIndices.push(index);
                    }
                }
                break;
            }
        }
    }
    
    return {
        positions: new Float32Array(finalPositions),
        normals: new Float32Array(finalNormals),
        uvs: new Float32Array(finalUVs),
        indices: new Uint32Array(finalIndices)
    };
}