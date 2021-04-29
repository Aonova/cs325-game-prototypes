import {Theme,Helper,DEBUG,SETTINGS,Asset,Event} from './common.js'
import { Player } from './player.js'
/**
 * Tiles on the board created during the main scene. Can hold players, a bomb, and can be a hole, floor, or wall.
 */
export class Tile {
    /** array players currently on this tile. */
    players: Player[] = []
    /** x and y coordinate of this tile relative to top-left of board */
    pos: {x:number,y:number}
    /** scene-space x and y coordinates of the center of this tile */
    sPos: {x:number,y:number}
    /** bomb on this tile of player number, or null if no bomb */
    bomb: number = null
    /** tile terrain type: -1=hole 0=normal 1=wall */
    type: -1|0|1 = 0
    /** board reference */
    board: Tile[][]
    /** graphical arrow shown over flashed during force moves */
    forceArrow: Phaser.GameObjects.Image
    /** 
     * Force move direction. Players check this to force move before their action, like a slippery slide.
     * Values 0-8 for directions N clockwise. -1 for conflicting directions (net zero) and null for no force present.
     */
    forceDir: number = null
    /** inner tile graphic which is drawn to scene */
    rect: Phaser.GameObjects.Rectangle
    /** 
     * Create a tile for the given x and y position of the board
     * @param scene reference to main scene
     * @param tDim scene-space size of tile in w and h 
     * @param bPos x,y coordinates of this tile on board
     * @param cPos x,y position of board center
     * @param bDim tile size of board in w and h
     */
    constructor(scene:Phaser.Scene,tDim:{w:number,h:number},bPos:{x:number,y:number},
        cPos:{x:number,y:number},bDim:{w:number,h:number},board) {
        this.pos = bPos
        this.sPos = {
            x: cPos.x + (bPos.x-bDim.w/2+.5)*tDim.w,
            y: cPos.y + (bPos.y-bDim.h/2+.5)*tDim.h
        }
        this.board = board
        // adjust scale according to parity -- give it a nice checkerboard look
        let scale = (this.pos.x + this.pos.y)%2 ? .65 : .95
        if (this.pos.x*this.pos.y==0||this.pos.x+1==bDim.w||this.pos.y+1==bDim.h) scale = .95
        // add the tile graphic
        this.rect = scene.add.rectangle(this.sPos.x,this.sPos.y,tDim.w*scale,tDim.h*scale,Theme.colorBG,1).setOrigin(.5)
        // add force arrow graphic
        this.forceArrow = scene.add.image(this.sPos.x,this.sPos.y,Asset.forceArrow).setOrigin(.5).setAlpha(0)
            .setScale(.25).setTint(Theme.colorHL).setDepth(3)
        // show force graphics during move phase
        scene.events.on(Event.phaseMove,()=>{
            if (this.forceDir!=null) this.showForce(this.forceDir)
        })
        // clear force start of turn
        scene.events.on(Event.phaseAction,()=>{
            this.forceDir = null
        })
    }
    /** Update type and thus graphic of tile */
    setType(type:number) {
        const duration = 300
        this.type = type<0 ? -1 : type>0 ? 1 : 0
        if (type==-1) this.rect.scene.add.tween({targets:this.rect,alpha:.2,duration:duration})
        else {
            this.rect.scene.add.tween({targets:this.rect,alpha:1,duration:duration})
            if (type==0) 
            this.rect.scene.tweens
                .addCounter(Helper.tweenFillStyle([this.rect],this.rect.fillColor,Theme.colorBG,duration))
            else if (type==1) 
            this.rect.scene.tweens
                .addCounter(Helper.tweenFillStyle([this.rect],this.rect.fillColor,Theme.wallColor,duration))
        }
    }
    /** Get neighboring tile in direction, or null if it is out of bounds */
    getNbrTile(dir:number) {
        const offset = Helper.dirToXY(dir)
        try {return this.board[this.pos.x+offset.x][this.pos.y-offset.y]}
        catch(e) {return null}
    }
    /** Display a little message temporarily over the player piece. */
    showTextMote(msg:string) {
        const obj = this.rect
        const textObj = obj.scene.add.text(obj.x, obj.y-obj.height/2, msg, Theme.fontDebug)
            .setAlpha(0).setOrigin(.5).setShadowFill(true).setShadowBlur(8)
        const timeline = obj.scene.tweens.createTimeline()
        timeline
            .add({targets:textObj, y:textObj.y-obj.height/2, ease:'Cubic.easeInOut', duration:1000, onComplete:()=>{textObj.destroy()}})
            .add({targets:textObj, alpha:1, ease:'Sine', yoyo:true, hold:300, duration:300, offset:0})
            .play()
    }
    /** Show the force arrow animation in the given direction */
    showForce(dir:number) {
        const arrow = this.forceArrow
        arrow.setRotation(dir/8 * 2*Math.PI)
        /** offset position to give a linear translation animation */
        const doFrom = Helper.dirToXY((dir+4)%8)
        const doTo = Helper.dirToXY(dir)
        const dist = SETTINGS.tileSize/4
        const oPos = {
            from: {x: this.sPos.x+dist*doFrom.x, y: this.sPos.y-dist*doFrom.y},
            to: {x: this.sPos.x+dist*doTo.x, y: this.sPos.y-dist*doTo.y}
        }
        arrow.setPosition(oPos.from.x, oPos.from.y)
        arrow.scene.add.tween({
            targets: arrow, x: oPos.to.x, y:oPos.to.y, duration: 800, ease: 'Linear'
        })
        arrow.scene.add.tween({
            targets: arrow, alpha: .5, yoyo:true, duration: 400, ease: 'Sine'
        })
    }
    /** Add force to this tile in a certain direction. Direction from 0-8 starting N,NE,E...clockwise */
    addForce(dir:number) {
        if (this.forceDir!=null && this.forceDir!=dir) this.forceDir = -1
        else this.forceDir = dir
    }
    /** Resets force on this tile. Should be called after resolving forced moves every turn players. */
    clearForce() {
        this.forceDir = null
    }
    /** Gets the direction of force on this tile, if it exists. */
    getForce():number {
        return this.forceDir
    }
}