import { Asset } from "./asset.js"
import { Player } from "./player.js"

class Main extends Phaser.Scene {
    constructor() {
        super('MainScene')
    }

    preload() {
        this.load.image(Asset.bgLower,'./res/bg-1.png')
        this.load.image(Asset.bgBack,'./res/galaxy.png')
        this.load.image(Asset.mechBlue,'./res/mech.png')
        this.load.image(Asset.mechRed,'./res/mech-red.png')
        this.load.image(Asset.thrustDown,'./res/thrust_down.png')
        this.load.image(Asset.thrustLeft,'./res/thrust_left.png')
        this.load.image(Asset.thrustRight,'./res/thrust_right.png')
        this.load.image(Asset.thrustUp,'./res/thrust_up.png')
    }

    player: Player // player container
    bgBack: Phaser.GameObjects.TileSprite // background parallax sprites
    bgBot: Phaser.GameObjects.TileSprite
    bgTop: Phaser.GameObjects.TileSprite
    vel: number = 20 // overall rightwards velocity of the scene
    edgeGlow: Phaser.GameObjects.Graphics[] = [] // glowing edges representing gravitational anomaly: top, right, bottom, left
    create() {
        let cam = this.cameras.main
        this.bgBack = this.add.tileSprite(0,0,cam.width,0,Asset.bgBack).setOrigin(0)
        this.bgTop = this.add.tileSprite(0,-300,cam.width,0,Asset.bgLower)
            .setOrigin(0,0).setTileScale(0.65).setFlipY(true)
        this.bgBot = this.add.tileSprite(0,cam.height-390,cam.width,0,Asset.bgLower)
            .setOrigin(0).setTileScale(0.65)
        this.bgBot.tilePositionX += 2500 // shift it over for variance with top
        this.player = this.add.existing(new Player(this,this.vel))
        // init edge glow graphics
        let gColor = 0x004010
        let gWidth = 200
        this.edgeGlow[0] = this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(gColor,gColor,0,0,1,1,0,0)
            .fillRect(0,0,cam.width,gWidth)
        this.edgeGlow[1] = this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(0,gColor,0,gColor,0,1,0,1)
            .fillRect(cam.width-gWidth,0,gWidth,cam.height)
        this.edgeGlow[2] =  this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(0,0,gColor,gColor,0,0,1,1)
            .fillRect(0,cam.height-gWidth,cam.width,gWidth)
        this.edgeGlow[3] = this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(gColor,0,gColor,0,1,0,1,0)
            .fillRect(0,0,gWidth,cam.height)
        this.add.tween({
            targets: this.edgeGlow[0], duration: 1000, yoyo: true, alpha: 1, ease: 'Sine', loop: -1, repeatDelay: 2000
        })
        this.add.tween({
            targets: this.edgeGlow[1], duration: 1000, yoyo: true, alpha: 1, ease: 'Sine', loop: -1, repeatDelay: 2000, delay: 1000
        })
        this.add.tween({
            targets: this.edgeGlow[2], duration: 1000, yoyo: true, alpha: 1, ease: 'Sine', loop: -1, repeatDelay: 2000, delay: 2000
        })
        this.add.tween({
            targets: this.edgeGlow[3], duration: 1000, yoyo: true, alpha: 1, ease: 'Sine', loop: -1, repeatDelay: 2000, delay: 3000
        })
    }
    phase: 'pre' | 'play' = 'play'
    update(time:number, delta:number) { 
        // bg update
        if (this.phase == 'play') {
            this.bgBack.tilePositionX += this.vel/delta/20
            this.bgTop.tilePositionX += this.vel/delta
            this.bgBot.tilePositionX += this.vel/delta
            this.player.update(time,delta)
        }
    }
}

class Title extends Phaser.Scene {
    constructor() {
        super('TitleScene')
    }
    preload() {
        this.load.image('title','./res/title.png')
    }
    titleImg: Phaser.GameObjects.Image
    startBut: Phaser.GameObjects.Text
    create() {
        let cam = this.cameras.main
        // add bg image/color
        let bg = this.add.rectangle(0,0,cam.width,cam.height,0x050505,1).setOrigin(0,0)
        // add fg titlecard image
        let fg = this.titleImg = this.add.image(cam.centerX,cam.centerY-100,'title')
            .setScale(0.7).setAlpha(0)
        // add button
        let but = this.startBut = this.add.text(cam.width-80,cam.centerY+150,'[ START ]',
            {stroke:'#79A',strokeThickness:10,fontSize:'50px',fontFamily:'monospace'}).setOrigin(1,0.5).setAlpha(0)
        // smoothly show title card and button
        this.add.tween({targets: fg, duration: 1000, ease: 'Sine', y: '+=100', alpha:1 })
        this.add.tween({targets: but, duration: 1000, ease: 'Sine', y: '-=100', alpha:1, delay: 1500, onComplete: ()=>{but.setInteractive()}})

        but.on('pointerover',()=>{but.setTint(0xaaffbb)}).on('pointerout',()=>{but.clearTint()})
            .on('pointerup',()=>{
                but.scene.add.tween({
                    targets: [but,fg], duration: 500, alpha:0, ease:'Sine', onComplete: ()=>{but.scene.scene.start('MainScene')} 
                }) 
            })
    }
}
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    scene: [Title,Main]
}
const game = new Phaser.Game(config)
