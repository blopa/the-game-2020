import { GameObjects } from 'phaser';
import { MISSILE_DEPTH } from '../constants';

class Missile extends GameObjects.Sprite {
    constructor({
        scene,
        x,
        y,
        asset = 'missile',
        frame,
        spriteKey = 'missile',
    }) {
        super(scene, x, y, asset, frame);
        this.setDepth(MISSILE_DEPTH);
        this.spriteKey = spriteKey;
    }
}

export default Missile;
