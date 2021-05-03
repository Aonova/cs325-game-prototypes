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

    soundGameOver = 'gameOver',
    soundHit = 'hit',
    soundClick = 'click',
    soundThrustStart = 'thrustStart',
    soundThrust = 'thrust',
    soundBGM = 'bgm'
}
export const DEBUG = true
export class Theme {
    static readonly fontHUD: Phaser.Types.GameObjects.Text.TextStyle
        = {stroke:'#135',strokeThickness:2,fontSize:'16px',fontFamily:'monospace'}
    static readonly fontInfo: Phaser.Types.GameObjects.Text.TextStyle
        = {stroke:'#135',strokeThickness:2,fontSize:'24px',fontFamily:'Arcade'}
    static readonly fontFocus: Phaser.Types.GameObjects.Text.TextStyle
        = {stroke:'#135',strokeThickness:2,fontSize:'42px',fontFamily:'Arcade',align:'center'}
}
/** Event tag strings used in this game */
export enum Event {
    /** Emitted by the scene when gravity changes. Has a vector parameter for gravity. */
    gravShift = 'gravShift',
    /** Player falls out of bounds -- game over */
    gameOver = 'gameOver'
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
                obj.scene.sound.play(Asset.soundClick,{volume:.5})
            }
        })
    }
}