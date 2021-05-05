import { Asset, Com, Event, Theme, Settings } from "./common.js"
import { Plasma } from "./plasma.js"
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
        this.load.image(Asset.plasma,'./res/particle.png')

        this.load.audio(Asset.soundGameOver,'./res/sounds/gameover.wav')
        this.load.audio(Asset.soundHit,'./res/sounds/hit.wav')
        this.load.audio(Asset.soundThrust,'./res/sounds/engine.wav')
        this.load.audio(Asset.soundClick,'./res/sounds/click.wav')
        this.load.audio(Asset.soundBGM,'./res/sounds/bgm.mp3')
        this.load.audio(Asset.soundThrustStart, './res/sounds/engine-start.wav')
    }
    player: Player // player container
    bgBack: Phaser.GameObjects.TileSprite // background parallax sprites
    bgBot: Phaser.GameObjects.TileSprite
    bgTop: Phaser.GameObjects.TileSprite
    /** overall rightwards velocity of the scene  */
    vel: number = 20 
    edgeGlow: Phaser.GameObjects.Graphics[] = [] // glowing edges representing gravitational anomaly: top, right, bottom, left
    /** Current anomaly state: 0 is none, 1-4 are different directions. Used only to generate the next one.*/
    gravState = 0
    /** Plasma object group on screen */
    plasma: Phaser.GameObjects.Group
    create() {
        let cam = this.cameras.main
        const me = this
        this.bgBack = this.add.tileSprite(0,0,cam.width,0,Asset.bgBack).setOrigin(0)
        this.bgTop = this.add.tileSprite(0,-300,cam.width,0,Asset.bgLower)
            .setOrigin(0,0).setTileScale(0.65).setFlipY(true)
        this.bgBot = this.add.tileSprite(0,cam.height-390,cam.width,0,Asset.bgLower)
            .setOrigin(0).setTileScale(0.65)
        this.bgBot.tilePositionX += 2500 // shift it over for variance with top
        this.player = this.add.existing(new Player(this,this.vel))
        // init edge glow graphics
        let gColor = Theme.gravColor
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
        // init bgm
        this.sound.play(Asset.soundBGM,{loop:true})
        // init plasma
        this.plasma = this.add.group([],{
            classType:Plasma, runChildUpdate:true, visible:true, 
            createCallback: (p:Plasma)=>p.setPlayer(me.player),
        })
        const introText = this.add.text(50,30,'',Theme.fontInfo).setOrigin(0)
        const tAnim = Com.showTextAnim
        let t = 0
        this.time.delayedCall(t+=500,()=>
            tAnim(introText,`3-1-5, you have reached target orbit around the station core.`
                +`\nThe core already sustained heavy damage, so watch out for gravitational anomalies.`
                +`\nWe are switching you to manual: fire your thrusters [W,A,S,D] to avoid crashing.`,4000))
        let Vec2 = Phaser.Math.Vector2
        this.time.delayedCall(t+=8000,()=>{
            me.time.delayedCall(2000,()=>this.events.emit(Event.gravShift,new Vec2(0,0.5)))
            tAnim(introText,`Anomaly detected towards orbit anti-normal. Thrust towards normal to compensate.`,1000)
            me.time.delayedCall(4500,()=>tAnim(introText,`\nAdjust thrust acceleration for finer impulse control.`
                +`\n[R] to increase, [F] to decrease, and [X] to match gravity level.`,1000,true))
        })
        this.time.delayedCall(t+=8000,()=>{
            me.events.emit(Event.gravShift, new Vec2(0,0))
            tAnim(introText,`Anomaly receding.`
                + `\nGravity anomalies can appear at any time and direction.`
                + `\nBe vigilant for the signature green glow, and compensate using your thrusters.`,2000)
            me.time.delayedCall(2000,()=>doGravShift())
        })
        this.time.delayedCall(t+=8000,()=>{
            tAnim(introText,`Detecting plasma debris in your orbit - probably being spewed out by the core.`
                + `\nThey wont pierce your hull, but will give your systems a nasty shock.`
                + `\nEvasive manuevers recommended.`,2000)
            me.time.delayedCall(3000,()=>{
                for (let i=0;i<10;i++) me.time.delayedCall(Com.randRange(0,2000),()=>me.plasma.get())
            })
        })
        this.time.delayedCall(t+=8000,()=>{
            tAnim(introText,`Try and stay in orbit as long as possible.`
                + `\nBest of luck, Theta-315`,800)
            doPlasmaSpawn()
        })
        this.time.delayedCall(t+=8000,()=>introText.setText(''))

        const glow = this.edgeGlow
        
        const hideAll = ()=>{
            let toHide = []
            glow.forEach(g=>{if (g.alpha>0) toHide.push(g)})
            if (toHide.length>0) me.add.tween({targets:toHide,alpha:0,duration:1000,ease:'Sine'})
        }
        const show = (obj: Phaser.GameObjects.Graphics)=>{
            me.add.tween({targets:obj,alpha:1,duration:1000,ease:'Sine'})
        }
        /** Start doing random plasma spawns */
        const doPlasmaSpawn = ()=>{
            const delay = (Com.randRange(500,1500))
            me.time.delayedCall(delay,()=>{
                let p1:Plasma = me.plasma.get() // spawn new plasma
                let p2:Plasma = null
                if (Math.random()<.5) p2 = me.plasma.get() // 50% chance to spawn another
                if (!p1.active) p1.reset()
                if (p2 && !p2.active) p2.reset()
                doPlasmaSpawn() // recurse
            })
        }
        /** Start doing random grav shifts in random intervals (according to settings) */
        const doGravShift = ()=>{
            let dir = 0; do {
                dir = Math.floor(Math.random()*5)
            } while (dir==me.gravState) // choose a new grav direction
            me.gravState = dir
            const gVec = new Vec2()
            if (dir==0) gVec.set(0,0)
            else gVec.set(1,0).rotate((dir-1)/2*Math.PI).scale(Com.randRange(.25,.75))
            const gd = Settings.gravDelay
            const delay = ((Math.random()*(gd.max-gd.min))+gd.min)*1000
            me.time.delayedCall(delay,()=>{
                me.events.emit(Event.gravShift,gVec)
                doGravShift() // set up the next grav shift
            })
        }
        // handle grav shifts graphics
        this.events.on(Event.gravShift,(vec:Phaser.Math.Vector2)=>{
            hideAll()
            if (vec.length()==0) return
            const a = vec.angle()/Math.PI*2
            show(glow[(Math.floor(a+1.5))%4])
        })
        // handle game over (player flies out of bounds)
        this.events.once(Event.gameOver,(player:Player)=>{
            me.player.update = ()=>{}
            me.player.thrustController.destroy()
            const score = player.traveled
            let endText = me.add.text(cam.centerX,cam.centerY-50,`Game Over\nDistance: ${score.toFixed(1)}`,Theme.fontFocus)
                .setOrigin(.5).setScale(2).setAlpha(0).setDepth(7)
            me.tweens.add({ targets:endText, alpha:1, scale:1, duration:400, ease:'Sine', delay:500})
            me.sound.play(Asset.soundGameOver)
            me.player.destroy()
            me.player = null
        })
        // Called by plasma when it hits a player
        this.events.on(Event.playerHit,(player:Player,plasma:Plasma)=>{
            me.add.tween({
                targets:plasma, alpha:0, scale:'*=1.5', ease:'Sine', duration:600,
                onComplete: ()=>{plasma}
            })
            player.takeDamage(1000)
        })

    }
    phase: 'pre' | 'play' = 'play'
    update(time:number, delta:number) { 
        // bg update
        if (this.phase == 'play') {
            this.bgBack.tilePositionX += this.vel/delta/20
            this.bgTop.tilePositionX += this.vel/delta
            this.bgBot.tilePositionX += this.vel/delta
            if (this.player) this.player.update(time,delta)
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
