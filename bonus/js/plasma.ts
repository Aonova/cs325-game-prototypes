import { Player } from "./player";
/** Plasma walls which must be avoided by the player */
export class plasma {
    /** leftward velocity per second */
    vel:number = 30
    /** visual object of the plasma wall in the scene */
    obj: Phaser.GameObjects.Rectangle = null
    constructor(scene:Phaser.Scene,vel:number) {
        
    }
}