/**
 * Asset tags, used as keys for scene-level texture and audio managers
 */
export enum Asset {
    mechBlue = "mech",
    mechRed = "mech-red",
    bgLower = "bg-1",
    bgBack = "bg-2",
    thrustDown = 'thrust-down',
    thrustLeft = 'thrust-left',
    thrustRight = 'thrust-right',
    thrustUp = 'thrust-up',
    plasma = 'particle',

    soundGameOver = 'gameOver',
    soundHit = 'hit',
    soundClick = 'click',
    soundThrustStart = 'thrustStart',
    soundThrust = 'thrust',
    soundBGM = 'bgm'
}
export const DEBUG = false
export class Theme {
    static readonly fontHUD: Phaser.Types.GameObjects.Text.TextStyle
        = {stroke:'#135',strokeThickness:2,fontSize:'16px',fontFamily:'monospace'}
    static readonly fontInfo: Phaser.Types.GameObjects.Text.TextStyle
        = {stroke:'#135',strokeThickness:2,fontSize:'24px',fontFamily:'Arcade'}
    static readonly fontFocus: Phaser.Types.GameObjects.Text.TextStyle
        = {stroke:'#135',strokeThickness:2,fontSize:'42px',fontFamily:'Arcade',align:'center'}
    static readonly gravColor = 0x004010
    static readonly plasmaColor = 0xe0ffe8
}

export class Settings {
    /** Min and max time between grave shifts in seconds. */
    static gravDelay = {min:5, max:20}
    /** plasma base velocity as units per second */
    static pVelMult = 10
    /** plasma velocity variation (this is maximum offset to base velocity) */
    static pVelVar = 5
}
/** Event tag strings used in this game */
export enum Event {
    /** Emitted by the scene when gravity changes. Has a vector parameter for gravity. */
    gravShift = 'gravShift',
    /** Player falls out of bounds -- game over */
    gameOver = 'gameOver',
    /** Plasma spawn on the right side of the screen */
    plasmaSpawn = 'plasmaSpawn',
    /** Player hit by plasma. Params are player and plasma objects */
    playerHit = 'playerHit'
}
/** Collection of helpful common functions */
export class Com {
    /** Animates the given text object contents letter by letter. */
    static showTextAnim(obj:Phaser.GameObjects.Text,text:string,total?:number,append?:boolean) {
        const len = text.length
        let delay = 40
        if (total!=undefined) delay = total/len  
        let i=0
        if (!append) obj.setText('')
        obj.scene.time.addEvent({
            repeat: len-1 , delay:delay, callback: ()=>{
                obj.text+=text[i++]
                if (i%5==0) obj.scene.sound.play(Asset.soundClick,{volume:.5})
            }
        })
    }
    /** Random number in given range min<=n<max */
    static randRange(min:number,max:number):number {
        return (Math.random()*(max-min))+min
    }
    /** Returns configs for a number tween between two colors. */
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
}