import { vec3, vec4 } from 'gl-matrix';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import { setGL } from './globals';
import ShaderProgram, { Shader } from './rendering/gl/ShaderProgram';

import { SceneManager } from './SceneManager';
import { loadTileTextures } from "./TileDefinition";
import { createUI, createStats } from './ui';

async function main(): Promise<void> {
    const stats = createStats();
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    if (!gl) {
        alert('WebGL 2 not supported!');
        return;
    }

    setGL(gl);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);

    // Load tile textures before creating the scene
    try {
        await loadTileTextures(gl, "./models/");
    } catch (err) {
        console.error("Failed to load tile textures", err);
        return;
    }

    // Create scene and related systems
    const scene = new SceneManager();
    scene.loadScene();

    const ui = createUI(
        () => scene.collapseSingleTile(),
        () => scene.collapseWholeGrid()
    );

    const camera = new Camera(vec3.fromValues(0, 16, 4), vec3.fromValues(0, 0, 0));
    const renderer = new OpenGLRenderer(canvas);
    renderer.setClearColor(0.2, 0.2, 0.2, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();

    const lambert = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl'))
    ]);

    const simple = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/simple-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/simple-frag.glsl'))
    ]);

    // Window resize handling
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.setAspectRatio(window.innerWidth / window.innerHeight);
        camera.updateProjectionMatrix();
    });

    // Render loop
    function tick(): void {
        stats.begin();

        camera.update();
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.clear();

        renderer.render(camera, lambert, [], vec4.fromValues(ui.colorR, ui.colorG, ui.colorB, 1.0));
        scene.drawTiles(lambert, simple, camera);
        renderer.renderGrid(camera);

        stats.end();
        requestAnimationFrame(tick);
    }

    tick();
}

main();
