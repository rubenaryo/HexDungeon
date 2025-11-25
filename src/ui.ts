// src/ui/UIManager.ts

import * as DAT from 'dat.gui';
const Stats = require('stats-js');

export interface UIState
{
    colorR: number;
    colorG: number;
    colorB: number;
}

/**
 * Creates UI controls and attaches event bindings.
 * 
 * @param singleTileCallback A function called whenever the user requests a scene reload.
 * @returns UIState An object containing live-updating UI values.
 */
export function createUI(singleTileCallback: () => void, wholeGridCallback: () => void): UIState
{
    const uiState: UIState =
    {
        colorR: 1,
        colorG: 1,
        colorB: 1
    };

    const gui = new DAT.GUI();

    gui.add(
        { CollapseSingleTile: () => singleTileCallback() },
        'CollapseSingleTile'
    ).name('CollapseSingleTile');

    gui.add(
        { CollapseWholeGrid: () => wholeGridCallback() },
        'CollapseWholeGrid'
    ).name('CollapseWholeGrid');

    gui.add(uiState, 'colorR', 0, 1).step(0.1).name('Red');
    gui.add(uiState, 'colorG', 0, 1).step(0.1).name('Green');
    gui.add(uiState, 'colorB', 0, 1).step(0.1).name('Blue');

    return uiState;
}

/**
 * Creates and attaches a Stats.js FPS meter.
 *
 * @returns A Stats object whose .begin() and .end() should be called each frame.
 */
export function createStats(): any
{
    const stats = Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild(stats.domElement);

    return stats;
}
