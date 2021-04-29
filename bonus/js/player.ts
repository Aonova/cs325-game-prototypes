import { Asset } from "./asset.js"

export class Player extends Phaser.GameObjects.Container {
    // Main player sprite
    mech: Phaser.GameObjects.Image
    thrustController: ThrustController
    /** Hud text elements. Ordered by position: top left, top right, bottom right, bottom left. */
    hud: Phaser.GameObjects.Text[] = []
    /** Current velocity of player in x (right) and y (down) directions */
    vel: {x:number,y:number} = {x:1,y:1}
    /** Global velocity, only to the right */
    gVel: number
    /** Gravity acceleration from anomalies */
    gAccel: number = 0
    /** Gravitational anomaly direction: -1=none, 0=up, 1=right, 2=down, 3=left */
    gDir: number = -1
    /** Total units traveled */
    traveled: number = 0
    /** The HUD text style object */
    hudStyle =  {stroke:'#379',strokeThickness:4,fontSize:'14px',fontFamily:'monospace'}
    /** Thruster firing graphics. Indexed by firing direction: up, down, left, right */
    thrusters: Phaser.GameObjects.Image[] = []
    /** Must pass the initial global velocity */
    constructor(scene:Phaser.Scene, gVel:number) {
        super(scene,scene.cameras.main.centerX,scene.cameras.main.centerY)
        this.gVel = gVel
        // add mech graphic
        this.mech = new Phaser.GameObjects.Image(scene,0,0,Asset.mechBlue).setOrigin(0.5)
        this.setScale(1)
        // add thruster graphics
        this.thrusters[1] = new Phaser.GameObjects.Image(scene,14,-144,Asset.thrustUp)
        this.thrusters[2] = new Phaser.GameObjects.Image(scene,115,-6,Asset.thrustRight)
        this.thrusters[0] = new Phaser.GameObjects.Image(scene,-6,186,Asset.thrustDown)
        this.thrusters[3] = new Phaser.GameObjects.Image(scene,-82,3,Asset.thrustLeft)
        this.thrusters.forEach(e=>e.setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN))
        // initialize thruster logic (which attaches to keyboard controls)
        this.thrustController = new ThrustController(scene,'thruster')
        this.thrustController.connectPlayer(this)
        // initialize hud elements
        this.hud[1] = new Phaser.GameObjects.Text(scene,-120,-100,"debug",this.hudStyle)
            .setOrigin(0,0)
        this.hud[2] = new Phaser.GameObjects.Text(scene,70,-100,"debug",this.hudStyle)
            .setOrigin(0,0)
        this.setState('normal')
        // add objects to the container
        this.add([this.mech,this.hud[1],this.hud[2]].concat(this.thrusters))
        this.sendToBack(this.thrusters[2]) // make sure to render the right thruster behind the mech
        // test
        this.scene.input.keyboard.addKey('SPACE').on('down',()=>{this.takeDamage(1000)})
        this.allowControl(true)
        
        scene.add.existing(this)
    }
    setGlobalVel(gVel:number):Player {
        this.gVel = gVel
        return this
    }
    /** Updates gravitation anomaly effect.
     *  @param gA the acceleration power of the anomaly
     *  @param gD the direction of the anomaly (-1=none, 0=up, 1=right, 2=bot, 3=left)
     */
    setGrav(gA:number,gD:number):Player {
        this.gAccel = gA
        return this
    }
    /** Allow keyboard inputs to affect the player entity if true. Turn on for gameplay, and off for on rails/cut-scene. Defaults to false.*/
    allowControl(allow:boolean):Player {
        if (allow) {
           // affect other player-level keyboard hooks
        }
        this.thrustController.allowControl(allow)
        return this
    }
    update(time:number,delta:number) {
        if (this.state == 'disabled') {
            if (this.disabledTime>0) { // disabled
                this.disabledTime -= delta
            } else this.recover() // after stun is over, recover
        }
        if (this.hud[1]!=null) { // update HUD text
            let xTerm = this.vel.x > 0 ? 'V_FWD|' : 'V_BCK|'
            xTerm += this.state=='disabled' ? 'ERROR' : (Math.abs(this.vel.x)).toFixed(1)
            let yTerm = this.vel.y > 0 ? 'V_DWN|' : 'V__UP|'
            yTerm += this.state=='disabled' ? 'ERROR' : (Math.abs(this.vel.y)).toFixed(1)
            this.hud[1].setText([xTerm,yTerm])
        }
        if (this.hud[2]!=null) {
            let xTerm = 'THRUST|'
            xTerm += this.state=='disabled' ? 'ERROR' : (Math.abs(this.thrustController.getImpulse())).toFixed(1)
            let yTerm = 'GRAVTY|'
            yTerm += this.state=='disabled' ? 'ERROR' : (Math.abs(this.gAccel).toFixed(1))
            this.hud[2].setText([xTerm,yTerm])
        }
        // reflect the change in velocity from thruster firing  
        if (this.thrustController.isFiring("up")) this.vel.y -= this.thrustController.getImpulse()/delta // up
        if (this.thrustController.isFiring("down")) this.vel.y += this.thrustController.getImpulse()/delta // downs
        if (this.thrustController.isFiring("left")) this.vel.x -= this.thrustController.getImpulse()/delta // left
        if (this.thrustController.isFiring("right")) this.vel.x += this.thrustController.getImpulse()/delta // right
        // reflect the change in position from current velocity
        this.setPosition(this.x + this.vel.x/delta, this.y + this.vel.y/delta)
        this.traveled += this.gVel/delta
        super.update(time,delta)
    }
    setState(state:'normal'|'disabled') {
        super.setState(state)
        if (state == "normal") {
            [this.hud[1],this.hud[2]].forEach(e=>e.setStyle({stroke:'#379'}))
        } else if (state == "disabled") {
            [this.hud[1],this.hud[2]].forEach(e=>e.setStyle({stroke:'#D77'}))
        }
        return this
    }
    /** Recover from disable */
    recover() {
        this.disabledTime = 0
        this.mech.setTexture(Asset.mechBlue)
        // fire retro thrusters animation
        let after = ()=>{
            this.setState('normal')
            this.thrustController.setWorking(true)
        }
        after()

    }
    disabledTime: number
    /** Taking damage and disabling thrusters for a time */
    takeDamage(time:number) {
        if (time<5) return 
        this.setState("disabled")
        this.disabledTime+=time
        this.thrustController.setWorking(false)
        this.mech.setTexture(Asset.mechRed)
    }
}
/** The central point of control and management for the player unit's thrusters. */
class ThrustController extends Phaser.GameObjects.GameObject{
    /** Keyboard keys which control the thrust */
    keys: {[key:string]:Phaser.Input.Keyboard.Key}
    /** True if the thrusters are able to produce impulses. Defaults to true - affected by damage. */
    private working: boolean = true
    /** Acceleration power of directional impulse thrusters (fired by w-a-s-d)*/
    private impulse: number = 1
    /** Firing state of thrusters in given direction: up, down, left, right */
    private firing: [boolean,boolean,boolean,boolean] = [false,false,false,false]
    /** Reference to player container under which this controller was initialized */
    private player: Player
    /** Convert direction string to thruster pod index */
    private d2i(dir:'up'|'down'|'left'|'right'): integer {
        switch(dir) {
            case 'up': return 0
            case 'down': return 1
            case 'left': return 2
            case 'right': return 3
        }
    }
    /** Returns true if the thrusters are firing in the given direction */
    isFiring(dir:'up'|'down'|'left'|'right') {
        return this.firing[this.d2i(dir)]    
    }
    fire(dir:'up'|'down'|'left'|'right') {
        if (this.working) {
            this.firing[this.d2i(dir)] = true
            this.scene.add.tween({
                targets: this.player.thrusters[this.d2i(dir)],
                alpha: 1,
                duration: 300,
            })
        }
        return this
    }
    halt(dir:'up'|'down'|'left'|'right') {
        this.firing[this.d2i(dir)] = false
        this.scene.add.tween({
            targets: this.player.thrusters[this.d2i(dir)],
            alpha: 0,
            duration: 300,
        })
        return this
    }
    haltAll() {
        this.halt('up').halt("down").halt("left").halt("right")
        return this
    }
    /** Returns the impulse acceleration value of thrusters */
    getImpulse() {
        return this.impulse
    }
    /** Enable or disable the thrusters. Also halts active thrust as expected. */
    setWorking(val: boolean) {
        if (!val) this.haltAll()
        this.working = val
        if (val&&this.keysEnabled) { // on restore working thrusters, activate thrusters as per held keys
            if (this.keys.W.isDown) this.fire("up")
            if (this.keys.S.isDown) this.fire("down")
            if (this.keys.A.isDown) this.fire("left")
            if (this.keys.D.isDown) this.fire("right")
        }
        return this
    }
    constructor(scene:Phaser.Scene,tag) {
        super(scene,tag)
        this.keys = {
            W: scene.input.keyboard.addKey('W'), A: scene.input.keyboard.addKey('A'),
            S: scene.input.keyboard.addKey('S'), D: scene.input.keyboard.addKey('D')
        }
    }
    /** Attach reference to player container */
    connectPlayer(player:Player) {
        this.player = player
    }
    /** Attach WASD controls to thruster firing if true. Defaults to false. */
    keysEnabled: boolean = false
    allowControl(allow:boolean): ThrustController {
        if (allow) {
            this.keys.W.on('down', ()=>{this.fire('up')}).on('up', ()=>{this.halt('up')})
            this.keys.S.on('down', ()=>{this.fire('down')}).on('up', ()=>{this.halt('down')})
            this.keys.A.on('down', ()=>{this.fire('left')}).on('up', ()=>{this.halt('left')})
            this.keys.D.on('down', ()=>{this.fire('right')}).on('up', ()=>{this.halt('right')})
        } else {
            for (let key in this.keys){
                this.keys[key].off('down').off('up')
            }
        }
        this.keysEnabled = allow
        return this
    }
    
}
