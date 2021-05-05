import { Asset, Com, Theme, Event, Settings } from "./common.js";
import { Player } from "./player.js";
/** Plasma orbs which emp the player mech */
export class Plasma extends Phaser.GameObjects.Image {
    /** velocity in scene units per second */
    vel:Phaser.Math.Vector2
    /** reference to player */
    player:Player
    constructor(scene:Phaser.Scene) {
        const cam = scene.cameras.main
        const Vec2 = Phaser.Math.Vector2
        const x = cam.width+50
        const y = Com.randRange(50,cam.height-50)
        super(scene,x,y,Asset.plasma)
        this.vel = new Vec2(-1,0).rotate(Com.randRange(-Math.PI/8,Math.PI/8))
            .scale(Settings.pVelMult+Com.randRange(-Settings.pVelVar,Settings.pVelVar))
        this.setScale(Com.randRange(.25,.75)).setTint(Theme.plasmaColor).setBlendMode(Phaser.BlendModes.SCREEN)
            .setAlpha(.9).setVisible(true).setDepth(6).setOrigin(.5).setRotation(Math.random()*2*Math.PI)
        scene.add.existing(this)
    }
    reset() {
        const cam = this.scene.cameras.main
        const Vec2 = Phaser.Math.Vector2
        const x = cam.width+50
        const y = Com.randRange(50,cam.height-50)
        this.setPosition(x,y)
        this.vel = new Vec2(-1,0).rotate(Com.randRange(-Math.PI/8,Math.PI/8))
            .scale(Settings.pVelMult+Com.randRange(-Settings.pVelVar,Settings.pVelVar))
            this.setScale(Com.randRange(.25,.75)).setTint(Theme.plasmaColor).setBlendMode(Phaser.BlendModes.SCREEN)
            .setAlpha(.9).setVisible(true).setDepth(6).setOrigin(.5).setRotation(Math.random()*2*Math.PI)
        this.setActive(true)
    }
    setPlayer(player:Player) { this.player = player }
    update(time:number,delta:number) {
        // update position according to velocity
        this.setPosition(this.x+this.vel.x/delta,this.y+this.vel.y/delta)
        this.setRotation(this.rotation+Com.randRange(-20,40)/delta)
        if (this.x < this.scene.cameras.main.x-50) this.setActive(false)
        if (this.player && // if player and plasma hitboxs intersect
            !Phaser.Geom.Rectangle.Intersection(this.player.hitBox.getBounds(),this.getBounds()).isEmpty()) {
            this.scene.events.emit(Event.playerHit,this.player,this)
            this.setActive(false)
        }
            
    }
}