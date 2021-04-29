/** Asset tags, used as keys for scene-level texture and audio managers. */
export enum Asset {
    buildUp = 'buildUp',
    buildDown = 'buildDown',
    forceArrow = 'force'
}
/** Color and font configs */
export class Theme {
    static readonly fontStandard: Phaser.Types.GameObjects.Text.TextStyle 
        = {color:"#fff",fontFamily:"Arcade",fontSize:"xx-large"}
    static readonly fontDebug: Phaser.Types.GameObjects.Text.TextStyle
        = {color:"#fff",fontFamily:"monospace",fontSize:"small"}
    static readonly colorBG = 0x161616
    static readonly colorHL = 0xdaa520
    static readonly colorTick = 0x367546
    static readonly wallColor = 0x36a636
    // static readonly bombColor = 0x7585e5
    static readonly actionColor = {
        done: 0x85CB33,
        start: 0xA5CBC3
    }
    static readonly playerColor = {
        0: 0x4535a6,
        1: 0xa63545
    }
}
/** Tags for events registered on main scene event system. */
export enum Event {
    /** Marks the start of a shared turn for all players */
    tick = 'tick',
    /** Phase 1 - players lock in moves according to action. */
    phaseAction = 'action',
    /** Phase 2 - force actions are resolved simultaneously into force directions on tiles. */
    phaseForce = 'force',
    /** Phase 3 - movement is resolved, first the force movement, then any move action. */
    phaseMove = 'move',
    /** Phase 4 - builds are resolved, and tile types changed accordingly */
    phaseBuild = 'build',
    /** Bomb picked up */
    bombTaken = 'btaken',
    /** Bomb needs respawn */
    bombSpawn = 'brspawn',
    /** Game over sent by losing player */
    gameOver = 'gameover'
}
export enum Dir {
    N=0, NE=1, E=2, SE=3, S=4, SW=5, W=6, NW=7 
}
/** Common Game settings accessible for all classes */
export const SETTINGS = {
    /** Width of board in tiles */
    boardWidth: 10,
    /** Height of board in tiles */
    boardHeight: 8,
    /** Length of sides of square tiles on board */
    tileSize: 60,
    /** Diameter of player piece ellipse */
    playerSize: 50,
    /** Milliseconds between tick - turn/game speed */
    tickSpeed: 1000
}
/** Shared useful helper functions */
export class Helper {
    /** Utility to make a color tween config. This calls "setFillStyle" (fallback to setTint) */
    static tweenFillStyle(targets:{setFillStyle}[]|{setTint}[]
        ,fromColor:number,toColor:number,duration:number):Phaser.Types.Tweens.NumberTweenBuilderConfig {
        return {
            from: 0, to: 100, duration:duration, ease:'Sine',
            onUpdate: tw => {
                const colObj = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(fromColor),
                    Phaser.Display.Color.ValueToColor(toColor),
                    100,tw.getValue()
                )
                targets.forEach(obj=>{
                    if (obj.setFillStyle) 
                        obj.setFillStyle(Phaser.Display.Color.GetColor(colObj.r,colObj.g,colObj.b))
                    else if (obj.setTint)
                        obj.setTint(Phaser.Display.Color.GetColor(colObj.r,colObj.g,colObj.b))
                })
            }
        }
    }
    /** Depict a transient image mote animation. Spawns a at a position and pops up for a duration. */
    static showMote(scene:Phaser.Scene,tag:string,x:number,y:number,scale:number,duration:number,tint:number) {
        const mote = scene.add.image(x,y,tag).setOrigin(.5).setScale(scale).setAlpha(0).setTint(tint)
        scene.add.tween({
            targets:mote, alpha:1, yoyo:true, ease:'Sine', duration:(duration/2)  
        })
        scene.add.tween({
            targets:mote, y:mote.y+mote.displayHeight, ease:'Sine', duration:duration, 
            onComplete: ()=>{mote.destroy()}  
        })
    }
    /** translates a xy offset to a direction between 0-7, or null if its invalid*/
    static xyToDir(xy:{x:number,y:number}):Dir {
        let dir = null
        if (xy.y==1 && xy.x==0) dir = 0
        else if (xy.y==1 && xy.x==1) dir = 1
        else if (xy.y==0 && xy.x==1) dir = 2
        else if (xy.y==-1 && xy.x==1) dir = 3
        else if (xy.y==-1 && xy.x==0) dir = 4
        else if (xy.y==-1 && xy.x==-1) dir = 5
        else if (xy.y==0 && xy.x==-1) dir = 6
        else if (xy.y==1 && xy.x==-1) dir = 7
        return dir
    }
    static dirToXY(dir):{x:-1|0|1,y:-1|0|1} {
        if (dir==Dir.N) return {x:0,y:1}
        else if (dir==Dir.NE) return {x:1,y:1}
        else if (dir==Dir.E) return {x:1,y:0}
        else if (dir==Dir.SE) return {x:1,y:-1}
        else if (dir==Dir.S) return {x:0,y:-1}
        else if (dir==Dir.SW) return {x:-1,y:-1}
        else if (dir==Dir.W) return {x:-1,y:0}
        else if (dir==Dir.NW) return {x:-1,y:1}
    }
    /** Prints cardinal string repr of a direction number */
    static dirToStr(dir:Dir):string {
        if (dir>7 || dir < 0) return null
        const key = ['N','NE','E','SE','S','SW','W','NW']
        return key[dir]
    }
}
/** Flag used for debug views and rendering. Toggle between builds as needed. */
export const DEBUG = true
/** Possible human player inputs bound to keys. */
export type Inputs = {
    up:Phaser.Input.Keyboard.Key, 
    down:Phaser.Input.Keyboard.Key, 
    left:Phaser.Input.Keyboard.Key, 
    right:Phaser.Input.Keyboard.Key, 
    out:Phaser.Input.Keyboard.Key,
    in:Phaser.Input.Keyboard.Key
}