import { Theme,Helper,Inputs,DEBUG,Event,Asset,SETTINGS } from './common.js'
import { Tile } from './tile.js'
import { Player } from './player.js'
class Main extends Phaser.Scene {
    constructor() {super('MainScene')}

    preload() {
        this.load.image(Asset.buildUp,'res/buildUp.png')
        this.load.image(Asset.buildDown,'res/buildDown.png')
        this.load.image(Asset.forceArrow,'res/force.png')
    }
    testText:Phaser.GameObjects.Text = null
    create() {
        addBorder(this,2)
        const scene = this
        const cam = this.cameras.main
        this.bindKeys()
        let KC = Phaser.Input.Keyboard.KeyCodes
        this.input.keyboard.addCapture([KC.W,KC.A,KC.S,KC.D,KC.CTRL,KC.SHIFT])
        this.initBoard(SETTINGS.boardWidth,SETTINGS.boardHeight,60)
        this.players[0] = new Player(this,0,50,this.board[1][1],this.playerInput)
        this.players[1] = new Player(this,1,50,this.board[SETTINGS.boardWidth-2][SETTINGS.boardHeight-2])
        this.tickBars[0] = this.add.rectangle(20,cam.height-20,40,40,Theme.colorBG,1).setOrigin(0,1)
        this.tickBars[1] = this.add.rectangle(cam.width-20,20,40,40,Theme.colorBG,1).setOrigin(1,0)
        let debugText = null
        if (DEBUG) debugText=this.add.text(cam.centerX,20,"debug",Theme.fontDebug).setOrigin(0)
        const tickBars = this.tickBars
        const tickSpeed = 1000 // ms per tick: 1 second
        this.tickCounter = this.tweens.addCounter({
            from: 0,to: 260, duration:tickSpeed, yoyo:true, ease:'Circ.easeInOut', loop:-1,
            onUpdate: (tw)=>{
                tickBars.forEach(bar=>{bar.setDisplaySize(bar.width,tw.getValue()+40)})
            },
            onYoyo: ()=>{
                // do tick in the middle of the animation
                scene.time.delayedCall(tickSpeed/2,()=>{scene.events.emit(Event.tick)})
                tickBars.forEach(bar=>{ // switch direction of bar
                    const bounds = bar.getBounds()
                    const newY = bar.originY ? bounds.top : bounds.bottom
                    bar.setOrigin(bar.originX,bar.originY?0:1)
                    bar.setPosition(bar.x,newY)
                })
            },
            onLoop: ()=>{
                scene.time.delayedCall(tickSpeed/2,()=>{scene.events.emit(Event.tick)})
            }
        })
        /** Every tick, run the logic of each turn's phases */
        this.events.on(Event.tick,()=>{
                // flash the turn indicator
                scene.tweens.addCounter(Helper.tweenFillStyle(tickBars,Theme.colorHL,Theme.colorTick,500))
                scene.events.emit(Event.phaseAction)
                scene.events.emit(Event.phaseForce)
                scene.events.emit(Event.phaseMove)
                scene.events.emit(Event.phaseBuild) 
        })
        let bombs:Phaser.GameObjects.Ellipse[] = []
        // spawn all bombs once at the start of the game
        this.events.once(Event.tick,()=>{
            spawnBomb(0)
            spawnBomb(1)
        })
        // keep track when a player picks up a bomb -- update board graphcis
        this.events.on(Event.bombTaken,(id:number, pos:{x:number,y:number})=>{
            if (bombs[id]) {
                scene.add.tween({
                    targets:bombs[id], scale:2.5, alpha:0, duration:500, ease:'Sine', 
                    onComplete:()=>{bombs[id] = null}})
                    scene.board[pos.x][pos.y].bomb = null
            }
        })
        //Respawn bomb when called for
        this.events.on(Event.bombSpawn, (id:number)=>{
            scene.events.once(Event.tick,()=>{ // queue the respawn for the next tick
                spawnBomb(id)
            })
        })
        function spawnBomb(id:number) {
            let tile:Tile = null
            const width = SETTINGS.boardWidth
            const height = SETTINGS.boardHeight
            do { // randomly find a suitable (no players and not a hole) tile for spawning
                let x = Math.floor(Math.random() * width/2)+Math.floor(width/4)
                let y = Math.floor(Math.random() * height/2)+Math.floor(height/4)
                tile = scene.board[x][y]
                // dont spawn bomb on tiles which has a player, is a hole, or already has a bomb
                if (tile.type==-1||tile.players.length>0||tile.bomb!=null) tile=null
            } while (tile == null)
            tile.bomb = id
            bombs[id] = scene.add.ellipse(tile.sPos.x,tile.sPos.y,30,30,Theme.playerColor[id]+0x202020,1)
                .setOrigin(.5).setAlpha(0).setScale(2.5).setDepth(2)
            scene.add.tween({targets:bombs[id],scale:1,alpha:.6,duration:500,ease:'Sine'})
        } 
        this.events.on(Event.gameOver,(id:number)=>{
            scene.tickCounter.stop()
            scene.time.clearPendingEvents()
            let winMsg = id==0?'LOSES by being knocked out!':'WINS by knocking out all opponents!'
            scene.add.text(cam.centerX,cam.centerY,'Player 0 '+winMsg,Theme.fontStandard)
                .setOrigin(.5).setScale(1.5).setDepth(6)
            scene.input.keyboard.destroy()
            scene.input.keyboard.once('keydown',()=>{scene.scene.start('TitleScreen')})
        })
                    
    }
    update(time:number, delta:number) {
    }
    /** Tick visual bars which grow and shrink. Go from 40 to 300 length */
    tickBars: Phaser.GameObjects.Rectangle[] = []
    /** Singleton tick counter to synchronize moves on the board. */
    tickCounter: Phaser.Tweens.Tween
    /** Ref to players on the board. */
    players: Player[] = []
    /** Reference to all tiles in play */
    board: Tile[][] = []
    /** Reference to possible player0 inputs, bound to keyboard buttons by bindKeys */
    playerInput: Inputs
    /** Init board at center of screen with given width and height in tiles */
    private initBoard(bWidth:number,bHeight:number,tileSize:number) {
        let bDim = {w:bWidth,h:bHeight}
        let cPos = {x:this.cameras.main.centerX,y:this.cameras.main.centerY}
        for (let i=0;i<bDim.w;i++) {
            this.board[i] = []
            for (let j=0;j<bDim.h;j++) {
                this.board[i][j] = new Tile(this,{w:tileSize,h:tileSize},{x:i,y:j},cPos,bDim,this.board)
                // build walls on outer edge
                if (i==0||i==bDim.w-1||j==0||j==bDim.h-1) this.board[i][j].setType(1)
            }
        }
    }
    /** Set key bindings to possible inputs: currently WASD and ctrl and shift */
    private bindKeys() {
        let KC = Phaser.Input.Keyboard.KeyCodes
        let binding = {'up':KC.W, 'down':KC.S, 'left':KC.A, 'right':KC.D, 'out':KC.R, 'in':KC.F}
        this.playerInput = <Inputs>this.input.keyboard.addKeys(binding)
    }
}


/** Add minimalistic square border graphics to scene */
function addBorder(scene:Phaser.Scene,scale:number) {
    let cam = scene.cameras.main
    let s=scale
    scene.add.rectangle(10*s,10*s,50*s,50*s,Theme.colorBG,1).setOrigin(0) //top-corner
    scene.add.rectangle(70*s,0,160*s,30*s,Theme.colorBG,1).setOrigin(0) // top bar
    scene.add.rectangle(0,70*s,30*s,90*s,Theme.colorBG,1).setOrigin(0) // left bar
    scene.add.rectangle(10*s,170*s,20*s,20*s, Theme.colorBG).setOrigin(0) // left square
    scene.add.rectangle(cam.width-10*s,cam.height-10*s,50*s,50*s,Theme.colorBG,1).setOrigin(1)
    scene.add.rectangle(cam.width,cam.height-70*s,30*s,90*s,Theme.colorBG,1).setOrigin(1)
    scene.add.rectangle(cam.width-70*s,cam.height,160*s,30*s,Theme.colorBG,1).setOrigin(1)
    scene.add.rectangle(cam.width-10*s,cam.height-170*s,20*s,20*s, Theme.colorBG).setOrigin(1) // right square
}

class Title extends Phaser.Scene {
    constructor() {super('TitleScene')}
    preload() {}
    create() {
        let cam = this.cameras.main
        // add bg image/color
        addBorder(this,3.1)
        this.add.text(240,55,"Force Out! (proto-1)",Theme.fontStandard).setColor('#'+Theme.colorHL.toString(16))
            .setStyle({fontSize:'xxx-large'}).setOrigin(0,.5)
        this.add.text(cam.centerX,cam.centerY+100,"Press any key to continue",Theme.fontStandard).setOrigin(.5)
        const me = this
        this.input.keyboard.once('keydown',()=>{me.scene.start('MainScene')})
    }
}
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    scene: [Title,Main],
}
const game = new Phaser.Game(config)
