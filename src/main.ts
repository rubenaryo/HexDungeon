import { vec3, vec4 } from 'gl-matrix';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import { setGL } from './globals';
import ShaderProgram, { Shader } from './rendering/gl/ShaderProgram';

import { SceneManager } from './SceneManager';
import { createUI, createStats } from './ui';

function main(): void
{
    // Create Stats overlay
    const stats = createStats();
    
    // WebGL setup
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    
    if (!gl)
    {
      alert('WebGL 2 not supported!');
      return;
    }
    
    setGL(gl);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Scene manager handles all mesh construction
    const scene = new SceneManager();

    // UIManager owns all UI state & triggers scene reload
    const ui = createUI(
        () => {scene.collapseSingleTile(); },
        () => {scene.collapseWholeGrid(); }
    );

    // Initial load
    scene.loadScene();

    const camera = new Camera(
        vec3.fromValues(0, 16, 4),
        vec3.fromValues(0, 0, 0)
    );

    const renderer = new OpenGLRenderer(canvas);
    renderer.setClearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    const lambert = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
    ]);

    function tick(): void
    {
        stats.begin();

        camera.update();
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.clear();
        
        renderer.render(
            camera,
            lambert,
            [],
            vec4.fromValues(ui.colorR, ui.colorG, ui.colorB, 1.0)
        );

        scene.drawTiles(lambert, camera);
        renderer.renderGrid(camera);

        stats.end();
        requestAnimationFrame(tick);
    }

    // Handle window resize
    window.addEventListener('resize', () =>
    {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.setAspectRatio(window.innerWidth / window.innerHeight);
        camera.updateProjectionMatrix();
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();

    // Begin draw loop
    tick();
}

main();
