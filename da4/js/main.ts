import { Scene } from "phaser"
import "./phaser.js"

const DEBUG_MODE = false
// You can copy-and-paste the code from any of the examples at https://examples.phaser.io here.
// You will need to change the `parent` parameter passed to `new Phaser.Game()` from
// `phaser-example` to `game`, which is the id of the HTML element where we
// want the game to go.
// The assets (and code) can be found at: https://github.com/photonstorm/phaser3-examples
// You will need to change the paths you pass to `this.load.image()` or any other
// loading functions to reflect where you are putting the assets.
// All loading functions will typically all be found inside `preload()`.

// The simplest class example: https://phaser.io/examples/v3/view/scenes/scene-from-es6-class

type Vec2 = {x:number,y:number}
type Vec3 = {x:number,y:number,z:number}
/**
 * Testing function to get a string representation of one of our custom vector types
 * @param v Vec2 or Vec3 to get representation of
 */
function vecStr(v:Vec2|Vec3|null): string {
    if (v == null) return '(null)'
    let msg = `(${v.x},${v.y}`
    if ((<Vec3>v).z != null) { // manual check type-guard for vec3
        let v3 = <Vec3>v
        msg += `,${v3.z}`
    }
    msg += ')'
    return msg
}
type Polygon = Phaser.GameObjects.Polygon
type Ellipse = Phaser.GameObjects.Ellipse
/** Directions corresponding to edges of a hexagon */
enum Dir { NE, E, SE, SW, W, NW }
/** Tile types specific to Royal Ambush */
enum HexType { start, escape, normal }
/** Unit types specific to Royal Ambush */
enum UnitType { merc, guard, king }
/** Color theme for the board specific to Royal Ambush. Numbers are values from 0-0xffffff*/
type BoardColor = {
    normal: number
    start: number
    escape: number
    ambusher: number
    royalty: number
}
/** Convenient radian value (angle of hex cardinal directions)*/
const deg60:number = 60*Math.PI/180
/** Convenient radian value (half angle of hex cardinal directions)*/
const deg30:number = 30*Math.PI/180
/**
 * A uniform board of regular hexagon tiles. The board itself is shaped of concentric hex rings.
 */
class HexBoard{
    theme: BoardColor = {
        normal: 0x444444,
        start: 0x667799,
        escape: 0x669966,
        ambusher: 0xffaaaa,
        royalty: 0xaaaaff
    }
    /** Center of the hex board as a position in the scene */
    center: Vec2
    /** The apothem of contained hexagons. This is generated. */
    apothem: number
    /** The radius of contained hexagons */
    radius: number
    /** The size of the board as a number of rings. 0->1 hex, 1->7 hexes, and so on. */
    size: integer
    /** Reference to the scene the board is to be rendered in */
    scene: Phaser.Scene
    /** Under-laying collection of hex tiles. Keys are string in form 'x,y,z' */
    tiles: {[key:string]:Hex} = {}
    /** Special reference to start tile */
    startTile: Hex
    /** Special references to escape tiles */
    escapeTile: Hex[]
    /** Debug text object */
    debugText: Phaser.GameObjects.Text
    /** Creates and initializes the board tiles. Takes about 2 seconds for the animations */
    constructor(scene:Phaser.Scene,size:integer,radius:number,center?:Vec2,theme?:BoardColor) {
        this.scene = scene
        this.size = size
        this.radius = radius
        this.apothem = radius * Math.cos(deg30)
        if (center!==undefined) this.center = center
        else this.center = {x:this.scene.cameras.main.centerX,y:this.scene.cameras.main.centerY}
        if (theme!==undefined) this.theme = theme
        let numTiles = 1
        for (let i = 1; i < size; i++)
            numTiles+=i*6
        this.escapeTile = new Array<Hex>()
        this.initTiles()
        if (DEBUG_MODE) this.showDebugText()
    }
    /** Initializes and shows tiles over the specified duration. Default is about 1.5 secs including fadeout time. */
    private initTiles(ms?:number) {
        if (ms===undefined) ms = 800
        let tileNum = 0
        let numTiles = 1
        for (let i = 1; i < this.size; i++)
            numTiles+=i*6
        for (let x=-this.size;x<=this.size;x++) {
            for (let y=-this.size;y<=this.size;y++) {
                for (let z=-this.size;z<=this.size;z++) {
                    if (x+y+z == 0){ // Only add hexes within the rings 
                        let type = HexType.normal
                        if ( x*y*z==0 && (Math.abs(x)+Math.abs(y)+Math.abs(z)) == 2*this.size) {
                            type = HexType.escape
                            this.tiles[`${x},${y},${z}`] = new Hex(this, {x:x,y:y,z:z}, type)
                            this.escapeTile.push(this.tiles[`${x},${y},${z}`])
                        }
                        else if (x==0 && y==0 && z==0) {
                            type = HexType.start
                            this.startTile = this.tiles[`${x},${y},${z}`] = new Hex(this, {x:x,y:y,z:z}, type)
                        }
                        else this.tiles[`${x},${y},${z}`] = new Hex(this, {x:x,y:y,z:z}, type)
                        delay(this.scene,ms/numTiles*tileNum++,this,()=>this.tiles[`${x},${y},${z}`].setState('normal'))
                    }
                }
            }
        }
        if (DEBUG_MODE) this.forEachTile(h=>h.showDebugText())
    }
    showDebugText() {
        let pos = {
            x:this.center.x - Math.cos(15) * this.radius * this.size * 2, 
            y:this.center.y + this.radius * this.size}
        this.debugText = this.scene.add.text(pos.x,pos.y,`init`,{fontSize:'12px'})
    }
    /**
     * An efficient way to do hit detection for tiles on the board, rather than every tile checking.
     * @param pos scene position to convert from
     * @param strict if true, check against hex object current bounds (including scale, etc). Default false.
     * @returns the Hex tile that overlaps that position, or null if out of bounds
     */
    pixelToTile(pos:Vec2,strict?:boolean): Vec3{ // STILL BROKEN, DON'T USE

        let offset_left = this.center.x - pos.x
        let offset_up = this.center.y - pos.y
        let hy = offset_left / Math.cos(15) / this.radius  
        let hz = offset_up / this.radius / 1.5
        let hx = -hy - hz
        
        return {x:hx,y:hy,z:hz}
    }
    /**
     * Shortcut to perform a function for each tile on the board
     * @param callback Callback functions which gets a hex tile as a parameter
     */
    forEachTile(callback:(hex:Hex)=>void) {
        for (const key in this.tiles) {
            const hex = <Hex>this.tiles[key]
            callback(hex)
        }
    }
    /** Initializes the king piece with a visual flourish taking 700ms total. */
    initKing() {
        this.startTile.setUnit(new Unit(this.startTile,UnitType.king))
    }
     /** Initializes the king piece with a visual flourish taking 2.4 secs*/
    initMercs() {
        let inter = 400
        for (let i=0; i<6; i++) {
            delay(this.scene,inter*i,this,()=>{
                this.escapeTile[i].setUnit(new Unit(this.escapeTile[i],UnitType.merc,200,100,200))
            })
        }
    }
    /**
     * Gets the hex at a certain position on the board. Can use single Vec3, or 3 coordinates.
     * @param pos Vec3 position of Hex or x position if using y and z.
     * @param y y position of Hex to get
     * @param z z position of Hex to get
     * @returns the Hex at that position or null if it is outside the board.
     */
    get(pos:Vec3|integer,y?:integer,z?:integer) : Hex | null {
        if (y !== undefined && z !== undefined){ // if given 3 params
            let x = <integer>pos
            if (x+y+z != 0 || Math.max(Math.abs(x),Math.abs(y),Math.abs(z))>this.size)
                return null
            return (<Hex>this.tiles[`${x},${y},${z}`])
        }
        else { // if given a single vec3
            let p = <Vec3>pos
            if (p.x+p.y+p.z != 0 || Math.max(Math.abs(p.x),Math.abs(p.y),Math.abs(p.z))>this.size)
                return null
            return (<Hex>this.tiles[`${p.x},${p.y},${p.z}`])
        }
    }
    /** Removes all hexes and units gracefully over a 1.5 secs or so */
    clear(ms?:number) {
        if (ms===undefined) ms = 800
        for (let x=-this.size;x<=this.size;x++) {
            for (let y=-this.size;y<=this.size;y++) {
                for (let z=-this.size;z<=this.size;z++) {
                    if (x+y+z == 0){ // Only add hexes within the rings 
                        let ringNum = Math.max(Math.abs(x),Math.abs(y),Math.abs(z))
                        delay(this.scene,ms/this.size*ringNum,this,()=>this.tiles[`${x},${y},${z}`].remove())
                    }
                }
            }
        }
    }
    /** Returns units on the board which pass the specified test function. Default: get all units. */
    getUnits(test?:(unit:Unit)=>boolean): Unit[] {
        if (test===undefined) test = ()=>true
        let ret: Unit[] = []
        this.forEachTile((tile) => {if (!tile.isEmpty() && test(tile.getUnit())) ret.push(tile.getUnit()) })
        return ret
    }

}
/**
 * Animates a shape object fill color to the given color over the given duration
 * @param scene Scene to attach tween
 * @param object shape object to tween fill color
 * @param toColor color to tween to
 * @param duration duration of tween in ms
 * @param callback optional oncomplete callback given (tween, target object) parameters 
 * @returns the tween object
 */
function colorTween(scene:Phaser.Scene,object:Phaser.GameObjects.Shape,toColor:number, duration:number,
    callback?:(tween:Phaser.Tweens.Tween,targets:Phaser.GameObjects.Shape[])=>void): Phaser.Tweens.Tween
{   
    let fromColorObj = Phaser.Display.Color.IntegerToColor(object.fillColor)
    let toColorObj = Phaser.Display.Color.IntegerToColor(toColor)
    if (callback===undefined) callback = ()=>{} // noop
    function getTweenColor()
    {
        let tweenColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            fromColorObj,
            toColorObj,
            100,
            tween.getValue()
        )
        return Phaser.Display.Color.ObjectToColor(tweenColor).color;
    }
    let tween = scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: duration,
        ease: 'Sine',
        onUpdate: ()=>object.fillColor=getTweenColor() ,
        onComplete: callback
    })
    return tween
}
/** Returns a clone of a vector object. */
function cloneVec(vec: Vec3) : Vec3 {
    let ret = {x:vec.x,y:vec.y,z:vec.z}
    return ret
}
function delay(scene:Phaser.Scene,ms:number,scope,callback:Function) {
    scene.time.delayedCall(ms,callback,[],scope)
}
/** Hex tiles as a part of a hex board */
class Hex extends Phaser.GameObjects.Polygon {
    /** Position on hex grid, using hex x, y, z axises */
    hPos: Vec3
    /** The parent board this tile belongs to.*/
    board: HexBoard
    /** Hex type, under the rules of the game */
    hType: HexType = HexType.normal
    /** The inhabiting unit on this tile, or null if empty. */
    private unit: Unit = null
    /** Debug text drawn atop the hex */
    debugText: Phaser.GameObjects.Text = null
    /** 
     * Creates new hex, and backing polygon. Starts off as hidden.
     * @param board The hex board under which this hex tile is being made
     * @param pos The position of this tile on the board in xyz hex coordinates. 
     */
    constructor(board:HexBoard,pos:Vec3,type:HexType) {
        super(board.scene,
            Hex.hexToScreenPos(board.center,board.radius,pos).x,
            Hex.hexToScreenPos(board.center,board.radius,pos).y,
            hexPoints(board.radius)
        )
        this.setOrigin(0,0).setScale(0,0).setActive(true).setVisible(true)
        this.scene.add.existing(this)
        this.board = board
        this.hPos = pos
        this.hType = type

        switch(type) {
            case HexType.normal:   this.setFillStyle(board.theme.normal); break;
            case HexType.escape:   this.setFillStyle(board.theme.escape); break;
            case HexType.start:    this.setFillStyle(board.theme.start); break;
        }
        this.setInteractive(this.geom,Phaser.Geom.Polygon.Contains)

        this.setState("hidden")
    }
    /** Returns true if there is no unit on this tile */
    isEmpty(): boolean {return this.unit==null}
    /**
     * Get neighboring hex on board in the specified direction.
     * @param dir Hex cardinal direction (NE,E,SE,SW,...) to get bordering hex
     * @returns The hex tile neighbor, or null if it's the edge of the board.
     */ 
    getNbr(dir:Dir): Hex {
        let nbrPos:Vec3 = cloneVec(this.hPos)
        switch (dir) {
            case Dir.NE: nbrPos.z++; nbrPos.y--; break;
            case Dir.E:  nbrPos.x++; nbrPos.y--; break;
            case Dir.SE: nbrPos.x++; nbrPos.z--; break;
            case Dir.SW: nbrPos.y++; nbrPos.z--; break;
            case Dir.W:  nbrPos.y++; nbrPos.x--; break;
            case Dir.NW: nbrPos.z++; nbrPos.x--; break;
        }
        return this.board.get(nbrPos)
    }
    /** Returns all neighboring hexes to this hex. May include null values if its on the border. */
    getNbrs(): Hex[] {
        let ret = new Array<Hex>()
        for (let i=0;i<6;i++) ret.push(this.getNbr(i))
        return ret
    }
    /**
     * Calls passed function for each non-null neighbor of this hex 
     * @param callback Function with a neighbor hex as a parameter, and the relative of that neighbor 
     */
    forEachNbr(callback:(nbr:Hex,dir:Dir)=>void) {
        let nbrs = this.getNbrs()
        for (let i=0; i<6; i++)
            if (nbrs[i]!=null) callback(nbrs[i],i)
    }
    /**
     * Get neighbor hex and its flanking tiles in the specified direction.
     * @param dir Hex cardinal direction of neighbor.
     * @returns List of neighbor and 3 flanking hexes with respect to this hex. Null for out of bounds.
     * */
    getNbrFlanks(dir:Dir): {nbr:Hex,left:Hex,back:Hex,right:Hex} {
        let nbr = this.getNbr(dir)
        if (nbr === null) return {nbr:nbr,left:null,back:null,right:null}
        return {
            nbr:    nbr,
            left:   nbr.getNbr((dir-1)%6),
            back:   nbr.getNbr(dir),
            right:  nbr.getNbr((dir+1)%6)
        }
    }
    private initDebugText() {
        this.debugText = this.scene.add.text(this.x,this.y,`init`,
            {fontSize:'11px',align:'center'}
        ).setVisible(false).setAlpha(0.6).setOrigin(0.5,0.5)
            .setDepth(3)
        
    }
    private updateDebugText() {
        if (this.debugText==null) return
        this.debugText.setPosition(this.x,this.y)
            .setText(vecStr(this.hPos)
                +`\ns[${this.state}]`
                +`\nu[${this.isEmpty()?'-1':this.unit.uType}] t[${this.team}]`)
    }   
    showDebugText() {
        if (this.debugText==null) // init if not exist 
            this.initDebugText()
        this.updateDebugText()
        this.debugText.setVisible(true)
    }
    hideDebugText() {
        if (this.debugText==null) return
        this.debugText.setVisible(false)
    }
    /** Team which captured this hex: -1=neutral, 0=royalty, 1=ambushers */
    private team: -1|0|1 = -1
    /** Returns team which captured this hex: -1=neutral, 0=royalty, 1=ambushers. Only set by changing attached unit. */
    getTeam(): -1|0|1 {
        return this.team
    }
    /** Update team according to inhabiting unit. Should be called whenever unit gets changed. Slightly changes color according to team.*/
    private updateTeam() {
        if (this.unit==null) {
            if (this.hType == HexType.start) {
                this.team = 1 // start tile counts as ambusher when empty
                colorTween(this.scene,this,this.board.theme.ambusher,500) // change color of start tile on move
            }
            else this.team = -1
        }
        else this.team = this.unit.team
        if (this.hType == HexType.start && this.team==0) { // reset color on board reset (king getting placed automatically on start tile)
            colorTween(this.scene,this,this.board.theme.start,500)
        }
    }
    /** Returns true if this tile is not yet captured by either team. Short for getTeam()==-1 */
    isNeutral(): boolean {
        return (this.team==-1)
    }
    /** Change the unit attached to the hex. Set to null to detach unit. */
    setUnit(unit:Unit): this {
        this.unit = unit
        this.updateTeam()
        if (this.debugText!=null) this.updateDebugText()
        return this
    }
    /** Get unit object attached to this hex */
    getUnit(): Unit {
        return this.unit   
    }
    /**
     * @override Visual state of the Hex. Controls appearance and visual response to mouse-overs. 'bright' also enables drop zone.
     */
    setState(state:'normal'|'dim'|'hidden'|'bright'): this {
        var self = <Hex>this
        self.off('pointerover').off('pointerout').off('pointerdown').off('pointerup')
        switch (state) {
            case 'normal':
                Hex.popTween(self,0.9,0.5,500)
                self
                .on('pointerout', () => {Hex.popTween(self,0.9,0.5,400)})
                .on('pointerover', () => {Hex.popTween(self,0.95,0.8,400)})
                .input.dropZone = false
                break
            case 'dim':
                Hex.popTween(self,0.5,0.7,500)
                self.input.dropZone = false
                break
            case 'hidden':
                Hex.popTween(self,0,0,500)
                self.input.dropZone = false
                break
            case 'bright':
                Hex.popTween(self,0.98,0.7,500)
                self
                .on('pointerout', () => {Hex.popTween(self,0.98,0.7,400)})
                .on('pointerover', () => {Hex.popTween(self,0.8,0.95,400)})
                .input.dropZone = true
                break
            default:
                break
        }
        super.setState(state)
        this.updateDebugText()
        return this
    }

    remove() {
        this.removeInteractive()
        Hex.popTween(this,0,0,500,()=>{
            this.destroy()
            if (this.debugText != null) this.debugText.destroy()
        })
    }
    /** Animation to pop an object to a specified scale and alpha */
    static popTween(object:Polygon,scale:number,alpha:number,duration?:number,callback?:Function) {
        let conf: Phaser.Types.Tweens.TweenBuilderConfig | any = {
            targets: object, 
            fillAlpha: alpha,
            scale: scale,
            duration: duration===undefined ? 300 : duration,
            ease: 'Sine',
        }
        if (callback!==undefined) {
            conf.onComplete = callback
            conf.onCompleteScope = object
        }
        object.scene.tweens.add(conf)
    }
    /** Converts a hex xyz position to top-left-origin 2d coordinates.*/
    static hexToScreenPos(center:Vec2,rad:number,hPos:Vec3) : Vec2 {
        let pos = {x:center.x,y:center.y}
        pos.x += ( hPos.x*Math.cos(deg30) - hPos.y*Math.cos(deg30) ) * rad
        pos.y += ( hPos.x*Math.cos(deg60) + hPos.y*Math.cos(deg60) - hPos.z ) * rad 
        return pos
    }

}
class Label extends Phaser.GameObjects.Image {
    /** 0=hidden, 1=normal, 2=focused, 3=unfocused */
    state = 0 
    /** Make a grand, centered entrance, before moving into place */
    showGrand(ms1:number, msHold: number, ms2:number, scaleMult?:number):this {
        let finalScale = this.scale
        if (scaleMult===undefined) scaleMult = 1.5
        let finalPos:Vec2 = {x:this.x,y:this.y}
        let centerPos:Vec2 = {x:this.scene.cameras.main.centerX, y:this.scene.cameras.main.centerY}
        this.setScale(finalScale*scaleMult).setX(centerPos.x+this.displayOriginX-this.displayWidth/2)
            .setY(this.displayOriginY).setAlpha(0)
        this.scene.tweens.add({targets:this,y:centerPos.y+this.displayOriginY-this.displayHeight/2,alpha:1,duration:ms1,ease:'Sine'})
        delay(this.scene,ms1+msHold,this,()=>{
            this.scene.tweens.add({
                targets:this, x:finalPos.x,y:finalPos.y, scale:finalScale,
                duration:ms2, ease:'Sine', onComplete: after, onCompleteScope: this
            })}
        )
        function after() {
            let self = <Label>this
            self.setState(1)
        }
        return this
    }
    show(ms:number):this {
        this.setY(this.y-this.displayHeight/2)
        this.scene.tweens.add({
            targets: this,
            y: this.y+this.displayHeight/2,
            alpha: 1,
            ease: 'Sine',
            duration: ms
        })
        this.setState(1)
        return this
    }
    hide(ms: number) {
        this.scene.tweens.add({
            targets: this,
            scale: this.scale + this.scale/2,
            alpha: 0,
            ease: 'Sine',
            duration: ms
        })
        this.state=0
    }
    /** Toggles focus, or sets it according to passed param */
    focus(focus?:boolean): this {
        if (this.state == 0) return
        let offset = 0
        if (focus===undefined) {
            switch(this.state) {
                case 1: offset = 0.1; this.state = 2; break;
                case 2: offset = -0.1; this.state = 1; break;
                case 3: offset = 0.2; this.state = 2; break;
            }
        } else {
            switch(this.state) {
                case 1: offset = focus? 0.1 : 0; break;
                case 2: offset = focus? 0: -0.1; break;
                case 3: offset = focus? 0.2: 0.1; break;
            }
            this.state = focus? 2: 1
        }
        this.scene.tweens.add({
            targets: this,
            scale: this.scale + offset,
            alpha: 1,
            duration: 300,
            ease: 'Sine'
        })
        return this
    }
    unfocus(unfocus?:boolean):this{
        if (this.state == 0) return
        let offset = 0
        if (unfocus===undefined) {
            switch(this.state) {
                case 1: offset = -0.1; this.state = 3; break;
                case 2: offset = -0.2; this.state = 3; break;
                case 3: offset = 0.1; this.state = 1; break;
            }
        } else {
            switch(this.state) {
                case 1: offset = unfocus? -0.1 : 0; break;
                case 2: offset = unfocus? -0.2: -0.1; break;
                case 2: offset = unfocus? 0: 0.1; break;
            }
            this.state = unfocus? 3: 1
        }
        this.scene.tweens.add({
            targets: this,
            scale: this.scale + offset,
            alpha: this.state==3 ? .5: 1,
            duration: 300,
            ease: 'Sine'
        })
        return this
    }
    /** Create new Label. Starts hidden: reveal with show() */
    constructor(scene:Phaser.Scene,x:number,y:number,tex:string,origin?:Vec2,tint?:number) {
        super(scene,x,y,tex); scene.add.existing(this);
        if (tint!==undefined) this.setTint(tint)
        if (origin!==undefined) this.setOrigin(origin.x,origin.y)
        this.setAlpha(0)
    }
}
class Button extends Label {
    constructor(scene:Phaser.Scene,x:number,y:number,texture:string) {
        super(scene,x,y,texture)
        this.setInteractive({useHandCursor:true})
        this.on('pointerover',()=>this.setTint(0x44ff88))
            .on('pointerout',()=>this.clearTint())
    }
    /** Sets a onetime on click function, replacing any existing one */
    setOnClickOnce(fn:Function,context:any,args?:any[]): Button{
        this.off('pointerup').once('pointerup',fn,context)
        return this
    }
}
/** Player pieces specific to Royal Ambush */
class Unit extends Label {
    /** The Unit type */
    uType: UnitType
    /** 0 = royalty, 1 = ambusher */
    team: 0|1
    /** The current tile of the unit on the board. */
    hex: Hex
    /** Base color */
    /** Creates a Unit at the specified tile, with a flourishing entrance taking 700 ms */
    constructor(hex:Hex,uType:UnitType,ms1?,ms2?,ms3?) {
        super(hex.board.scene,0,0,uType==UnitType.merc?'unit_merc':uType==UnitType.guard?'unit_guard':'unit_king')
        this.uType = uType
        this.team = uType==UnitType.merc? 1 : 0
        this.hex = hex
        this.hex.setUnit(this)
        this.setOrigin(.5).setPosition(hex.x,hex.y)
        this.setTint(this.team==0?hex.board.theme.royalty:hex.board.theme.ambusher)
        this.setInteractive({
            draggable:true,
            hitArea:new Phaser.Geom.Circle(this.width/2,this.height/2,this.width/2*0.9),
            hitAreaCallback: Phaser.Geom.Circle.Contains
        })
        if (ms1===undefined) ms1=300,ms2=200,ms3=300
        this.showGrand(ms1,ms2,ms3,2)
    }
    /** Check if any adjacent enemy units can be captured.
     *  Should be called after the player moves the unit on their turn.
     * 
     *  Has no persistent effect, simply generates capture objects and returns them. 
     *  @returns array of capture objects, with 'enemy' captured and array of 'buddies' who flanked
    */
    checkCapture(): {enemy:Unit,buddies:Unit[],directions:Dir[]}[] {
        let toCapture: {enemy:Unit,buddies:Unit[],directions:Dir[]}[] = []
        if (this.uType==UnitType.king) return toCapture// Kings cannot initiate capture
        this.hex.forEachNbr((nbr,dir)=>{
            if (!nbr.isEmpty() && nbr.getUnit().team != this.team) { // for each enemy unit neighbor
                let buddies: Unit[] = []
                let directions: Dir[] = []
                let flanks = this.hex.getNbrFlanks(dir)
                let score = 0 // evaluate flanking score -> abstraction of flank rules
                if (flanks.back!=null && flanks.back.getTeam() == this.team) {
                    if (!flanks.back.isEmpty()) {
                        buddies.push(flanks.back.getUnit())
                        directions.push((dir+3)%6)
                    }
                    score+=2
                }
                else {
                    if (flanks.right!=null && flanks.right.getTeam() == this.team) {
                        if (!flanks.right.isEmpty()) {
                            buddies.push(flanks.right.getUnit())
                            directions.push((dir+4)%6)
                        }
                        score+=1
                    }
                    if (flanks.left!=null && flanks.left.getTeam() == this.team) {
                        if (!flanks.left.isEmpty()) {
                            buddies.push(flanks.left.getUnit())
                            directions.push((dir+2)%6)
                        }
                        score+=1
                    }
                }
                if (score>1 || flanks.nbr.hType == HexType.escape && score>0) {// Special rule: allowance for escape hex
                    buddies.push(this); directions.push(dir)
                    toCapture.push({enemy:flanks.nbr.getUnit(),buddies:buddies,directions:directions}) 
                }
            }
        })
        return toCapture
    }
    /** A timed animation lasting 700ms representing a set of units overpowering an enemy. Optionally, calls passed function after completion.*/
    showAttack(buddies:Unit[],directions:Dir[],callback?:(tween,targets:Unit[],unit:this)=>void) {
        this.scene.add.tween({
            targets:buddies, duration: 350, yoyo: true, onComplete: callback, onCompleteParams: this, ease: 'Sine',
            scale: this.scale * 1.2
        })
        buddies.forEach((unit,i)=>{
            let x = Math.cos((60-60*directions[i])*Math.PI/180) * unit.hex.board.radius/1.5
            let y = Math.sin((60-60*directions[i])*Math.PI/180) * unit.hex.board.radius/1.5
            if (DEBUG_MODE) console.log([vecStr(unit.hex.hPos),Dir[directions[i]]])
            this.scene.add.tween({
                targets:unit, duration: 350, yoyo: true, ease: 'Sine', x:unit.x+x, y:unit.y-y
            })
            unit.x
        })
        
    }
    /** A timed animation lasting 700ms representing a unit getting overpowered. Optionally, calls passed function after completion. */
    showDefeat(callback?:(tween,targets:Unit[],unit:this)=>void) {
        this.scene.add.tween({    
            targets:this, duration: 350, yoyo: true, ease: 'Sine',
            scale: this.scale * 0.5
        })
        this.scene.add.tween({
            targets:this, duration: 700, ease: 'Sine', onComplete: callback, onCompleteParams: this, 
            alpha: 0
        })
    }
    /**
     * @override Call to remove Unit from the scene permanently (don't try to access afterwards)
     */
    destroy() {
        this.hex.setUnit(null)
        super.destroy()
    }
    /**
     * Returns list of hex tiles to which this unit could legally move.
     */
    getLegalTiles(): Hex[] {
        /** Recursively returns movable hexes in a direction; stops when blocked */
        function getAllInDir(tile:Hex,dir:Dir): Hex[] {
            let nbr = tile.getNbr(dir)
            if (nbr!=null && nbr.isNeutral()) // units can only land/pass over neutral tiles
                return [nbr].concat(getAllInDir(nbr,dir))
            else return []
        }
        let ret = []
        for (let dir=0;dir<6; dir++) {
            ret = ret.concat(getAllInDir(this.hex,dir))
        }
        return ret
    }
    /** Changes the home tile of this unit logically. Smoothly moves unit to location of new tile.*/
    moveTo(newHex:Hex,duration?:number): this {
        if (duration===undefined) duration = 500
        if (!newHex.isEmpty()) throw Error('Cannot move unit to already occupied hex!')
        this.hex.setUnit(null)
        this.hex = newHex.setUnit(this)
        this.scene.add.tween({targets:this,duration:duration,ease:'Sine',x:newHex.x,y:newHex.y})
        return this
    }
    /** Smoothly animates unit back to the location of its home tile */
    moveHome(duration?:number): this {
        if (duration===undefined) duration = 500
        this.scene.add.tween({targets:this,duration:duration,ease:'Sine',x:this.hex.x,y:this.hex.y})
        return this
    }
}
/** 
 * Returns the 2d coordinates of hexagon corners with given radius centered at the origin.
 * User for constructing a hexagon shape using Polygon constructor
 * */
function hexPoints(rad:number): Vec2[] {
    let n1 = (Math.sqrt(3)/2) * rad
    return [
        {x:0, y:1*rad}, 
        {x:n1, y:1/2*rad},
        {x:n1, y:-1/2*rad},
        {x:0, y:-1*rad},
        {x:-n1, y:-1/2*rad},
        {x:-n1, y:1/2*rad}
    ]
}
class Demo extends Phaser.Scene {
    /** Side length and circum-circle radius of a hex. Effectively controls the size of each hex. */
    HexRad:number = 50
    /** Number of rings on the hex board. Effectively controls the number of hexes on the board.*/
    boardSize:integer = 3
    /** Score for Ambusher player */
    scoreAmbusher = 0
    scoreAmbushText: Phaser.GameObjects.Text
    /** Score for Royalty player */
    scoreRoyalty = 0
    scoreRoyaltyText: Phaser.GameObjects.Text
    /** Update score text with current score, if the text objects are initialized */
    updateScore() {
        if (this.scoreRoyaltyText) this.scoreRoyaltyText.setText(this.scoreRoyalty.toLocaleString('en-US',{minimumIntegerDigits:2}))
        if (this.scoreAmbushText) this.scoreAmbushText.setText(this.scoreAmbusher.toLocaleString('en-US',{minimumIntegerDigits:2}))
    }
    /** Looping background music */
    bgm: Phaser.Sound.BaseSound
    /** Variations for certain sound effects */
    private soundCounter = [0,0,0]
    /** Play alternating 'attack' sfx */
    playSoundAttack() {
        this.sound.play('attack'+this.soundCounter[0]++)
        this.soundCounter[0] %= 2  
    }
    /** Play alternating 'drum' sfx */
    playSoundDrum() {
        this.sound.play('drum'+this.soundCounter[1]++)
        this.soundCounter[1] %= 2
    }
    /** Play alternating 'move drum' sfx */
    playSoundMove() {
        this.sound.play('move'+this.soundCounter[2]++)
        this.soundCounter[2] %= 2
    }
    constructor() {
        super('demo');
    }

    preload() {
        this.load.image('title','assets/titlecard.png')
            .image('but_cont','assets/but_continue.png')
            .image('card_deploy','assets/phase_deploy.png')
            .image('card_battle','assets/phase_battle.png')
            .image('card_ambusher','assets/ambushercard.png')
            .image('card_royalty','assets/royaltycard.png')
            .image('unit_merc','assets/ambusher.png')
            .image('unit_guard', 'assets/guard.png')
            .image('unit_king', 'assets/king.png')
            .image('win_ambusher', 'assets/ambusherwins.png')
            .image('win_royalty', 'assets/royaltywins.png')
            .audio('bgm_main', 'assets/drum_loop.mp3')
            .audio('accent_royalty','assets/kagura1.mp3')
            .audio('accent_ambusher','assets/kagura2.mp3')
            .audio('accent_battle','assets/horagai.mp3')
            .audio('victory','assets/victory.mp3')
            .audio('attack0','assets/attack1.mp3').audio('attack1','assets/attack2.mp3')
            .audio('drum0','assets/drum1.wav').audio('drum1','assets/drum2.wav')
            .audio('positive','assets/positive.wav').audio('negative','assets/negative.wav')
            .audio('move0','assets/move1.wav').audio('move1','assets/move2.wav')
    }
    
    create() {
        this.input.setTopOnly(false)
        this.bgm = this.sound.add('bgm_main',{loop:true,volume:0.7})
        this.bgm.play()
        this.initTitlePhase()
    }
    
    update() { // do nothing on explicitly per update since game logic is entirely lock-step/event-based
    }

    initTitlePhase() {
        let titleCard = new Label(this,this.cameras.main.centerX,this.cameras.main.displayHeight/3,'title')
        let confButton = new Button(this,this.cameras.main.centerX,this.cameras.main.displayHeight*2/3,'but_cont').setScale(0.8)
        titleCard.show(800)
        delay(this,800,this,()=>confButton.show(800))
        delay(this,700,this,()=>confButton.setOnClickOnce(onClickConfirm,this))
        let scene = this
        function onClickConfirm() {
            titleCard.hide(300)
            confButton.hide(300)
            scene.sound.play('positive')
            delay(this,400,this,()=>this.initDeployPhase(<Demo>this))
        }
    }
    initDeployPhase(scene:Demo,board?:HexBoard,royalCard?:Label,ambushCard?:Label) {
        let firstTime = board==null
        // initialize game-objects if first time being called (no parameters), else use passed references
        board = firstTime ? new HexBoard(this,this.boardSize,this.HexRad) : board
        let phaseCard = new Label(this,this.cameras.main.width-10,10,'card_deploy',{x:1,y:0}).setScale(0.9)
        royalCard = firstTime ? new Label(this,10,10,'card_royalty',{x:0,y:0},board.theme.royalty).setScale(0.6) : royalCard
        ambushCard = firstTime ? new Label(this,10,this.cameras.main.height-10,'card_ambusher',{x:0,y:1},board.theme.ambusher).setScale(0.6) : ambushCard
        let time = firstTime ? 1600 : 100 // initial time taken for making board
        delay(this,time,this,()=>phaseCard.showGrand(400,400,400)) 
        if (firstTime) {
            delay(this,time+=1100,this,()=>royalCard.showGrand(400,400,400))
            delay(this,time+=1100,this,()=>ambushCard.showGrand(400,400,400))
            delay(this,time+=1200,this,()=>{
                let style: Phaser.Types.GameObjects.Text.TextStyle = {
                    fontFamily: 'DotGothic16', fontSize: '100px', stroke: '#76C', strokeThickness: 8
                } 
                let royalScore = scene.scoreRoyaltyText = this.add.text(royalCard.getBounds().left,royalCard.getBounds().bottom - 50,'00',style).setOrigin(0,0).setAlpha(0).setScale(1.5)
                style.stroke = '#C66'
                let ambushScore = scene.scoreAmbushText = this.add.text(ambushCard.getBounds().left,ambushCard.getBounds().top - 150,'00',style).setOrigin(0,1).setAlpha(0).setScale(1.5)
                this.add.tween({
                    targets: [royalScore,ambushScore], duration:400, ease: 'Sine', alpha: 1, scale: 1, y: '+=100'
                })
            })
        }
        delay(this,time+=firstTime ? 500 : 1100,this,()=>{ambushCard.unfocus(true);royalCard.focus(true)})
        delay(this,time+=200,this,()=>board.initKing())
        delay(this,time+=700,this,()=>{ambushCard.focus(true);royalCard.unfocus(true)})
        delay(this,time+=200,this,()=>board.initMercs())
        delay(this,time+=2800,this,()=>royalTurn(0,board,scene))

        /** Even turns for royal team */
        function royalTurn(turn:number,board:HexBoard,scene:Demo){
            ambushCard.unfocus(true);royalCard.focus(true)
            scene.sound.play('accent_royalty')
            let pending = turn==0 ? 2 : 1
            setBrightOpenTeamHex(0,board)
            for (const key in board.tiles) { // set bright hexes clickable - placing a unit
                const hex = <Hex>board.tiles[key]
                if (hex.state != 'bright') continue
                hex.on('pointerup',()=>{
                    hex.setUnit( new Unit(hex,UnitType.guard) )
                    scene.playSoundDrum()
                    pending--
                    hex.setState('normal')
                    if (pending==0) {
                        resetState(board)
                        delay(hex.scene,500,this,doFinally)
                    }
                },this)
            }
            function doFinally() {
                if (turn!=4) ambushTurn(turn+1,board, scene)
                else {
                    royalCard.focus(false);ambushCard.focus(false) // set normal visuals
                    delay(scene,500,this,()=> {
                        phaseCard.hide(1000)
                        delay(scene,1200,this,()=>{phaseCard.destroy()})
                        scene.initBattlePhase(scene,board,royalCard,ambushCard)
                    })
                }
            }
        }
        /** Odd turns for ambush team */
        function ambushTurn(turn:number,board:HexBoard, scene:Demo) {
            ambushCard.focus(true);royalCard.unfocus(true)
            scene.sound.play('accent_ambusher')
            setBrightOpenTeamHex(1,board)
            for (const key in board.tiles) { // set bright hexes clickable - placing a unit
                const hex = <Hex>board.tiles[key]
                if (hex.state != 'bright') continue
                hex.on('pointerup',()=>{
                    scene.playSoundDrum()
                    hex.setUnit(new Unit(hex,UnitType.merc))
                    resetState(board)
                    delay(hex.scene,500,this,doFinally)
                },this)
            }
            function doFinally() {
                royalTurn(turn+1,board, scene)
            }
        }
        /** Sets team adj open hexes to be bright, and other to be dim, taking 500 ms. Occupied hexes are normal. Returns brightened hexes */
        function setBrightOpenTeamHex(team:0|1, board:HexBoard): Hex[] {
            let toRet:Hex[] = []
            board.forEachTile(hex=>{
                if (!hex.isEmpty() && hex.getUnit().team==team) { // team occupied hex
                    let nbrs = hex.getNbrs()
                    for (let i=0; i<6; i++) {
                        let nbr = nbrs[i] 
                        if (nbr!=null && nbr.isEmpty()) {
                            nbr.setState('bright')
                            toRet.push(nbr)
                        } // unoccupied team-adjacent hex 
                    }
                } else if (hex.isEmpty() && hex.state=='normal') hex.setState('dim') // unoccupied neutral hex
            })
            return toRet
        }
        /** Sets all the board tiles to be normal, clearing on-clicks as usual. */
        function resetState(board:HexBoard) {
            for (const key in board.tiles) {
                const hex = <Hex>board.tiles[key]
                hex.setState('normal')
            }
        }
    }
    initBattlePhase(scene:Demo,board:HexBoard,royalCard:Label,ambushCard:Label) {
        
        let phaseCard = new Label(this,this.cameras.main.width-10,10,'card_battle',{x:1,y:0},0xffdd99).setScale(0.9)
        phaseCard.showGrand(400,400,400)
        scene.sound.play('accent_battle')
        delay(scene,1500,this,()=>{
            // randomly select which team goes first
            startTurn(board, Math.random()>0.5 ? 0 : 1)
        })

        function startTurn(board:HexBoard,team:0|1) {
            // show team card transition and accent sound
            if (team == 0) {royalCard.focus(true);ambushCard.unfocus(true);scene.sound.play('accent_royalty')}
            else {ambushCard.focus(true);royalCard.unfocus(true);scene.sound.play('accent_ambusher')}
            let friendly = board.getUnits(u=>{return u.team == team})
            let enemy = board.getUnits(u=>{return u.team != team})
            scene.input.setDraggable(enemy,false)
            scene.input.setDraggable(friendly)
            scene.input.on('dragstart', (pnt,obj:Unit)=>{
                let legal = obj.getLegalTiles()
                legal.forEach(tile=>tile.setState("bright")) // brighten all the moveable tiles
                board.forEachTile(tile=>{if (tile.isNeutral() && tile.state!='bright') tile.setState("dim")}) // dim all the empty non-movable tiles
                obj.setAlpha(0.5).setDepth(3)
            })
            scene.input.on('drag',(pnt,obj:Unit,dragX:number,dragY:number)=>{ // have it follow the pointer
                obj.setPosition(dragX,dragY)
            })
            let dest:Hex = null
            scene.input.on('dragenter',(p,o,target:Hex)=>dest=target).on('dragleave',(p,o,target:Hex)=>dest=null)
            scene.input.on('dragend',(pnt,obj:Unit)=>{
                obj.setAlpha(1).setDepth(1)
                board.forEachTile(hex=>hex.setState('normal'))
                if (dest==null) { // not a valid drop target
                    obj.moveHome(500)
                    scene.sound.play('negative')
                }
                else { // on valid move
                    let winFlag: null | 'royalty' | 'ambusher' = null
                    obj.moveTo(dest,300)
                    scene.playSoundMove()
                    let tOffset = 400
                    if (obj.uType==UnitType.king && dest.hType == HexType.escape) winFlag = 'royalty'
                    let captures = obj.checkCapture() // attempt capture at new position
                    for (let i=0;i<captures.length && winFlag==null;i++) {
                        delay(scene,tOffset,this,()=>{
                            obj.showAttack(captures[i].buddies,captures[i].directions)
                            captures[i].enemy.showDefeat((tween,targets,u)=>u.destroy())
                            scene.playSoundAttack()
                        })
                        tOffset += 800
                        if (captures[i].enemy.uType == UnitType.king)
                            winFlag = "ambusher"
                        if (i == captures.length - 1) tOffset += 300
                    }
                    scene.input.off('dragstart').off('drag').off('dragenter').off('dragleave').off('dragend')
                    if (winFlag==null) delay(scene,tOffset,this,()=>startTurn(board,team==0?1:0))
                    else {
                        if (DEBUG_MODE) console.log([vecStr(dest.hPos),winFlag])
                        let imageTag = null
                        if (winFlag=='ambusher') {
                            scene.scoreAmbusher++
                            imageTag = 'win_ambusher'
                        } else {
                            scene.scoreRoyalty++
                            imageTag = 'win_royalty'
                        }
                        delay(scene,tOffset,this,()=>{
                            let winCard = scene.add.existing(new Label(scene,scene.cameras.main.centerX,scene.cameras.main.centerY,imageTag))
                                .setOrigin(0.5).show(500).setDepth(5)
                            delay(scene,500,this,()=>{
                                winCard.setInteractive().on('pointerover',function(this:Label){this.focus(true)})
                                .on('pointerout',function(this:Label){this.focus(false)})
                                .once('pointerup',()=>{
                                    scene.updateScore()
                                    scene.sound.play('positive')
                                    winCard.off('pointerover').off('pointerout').hide(300)
                                    let units = board.getUnits()
                                    units.forEach(unit=>unit.hide(300))
                                    phaseCard.hide(300)
                                    delay(scene,400,this,()=>{
                                        winCard.destroy
                                        units.forEach(unit=>unit.destroy())
                                        phaseCard.destroy()
                                        scene.initDeployPhase(scene,board,royalCard,ambushCard)
                                    })
                                })
                            })
                            scene.sound.play('victory')
                        })
                    }
                }
            })
        }
    }
}


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    scene: Demo
}
const game = new Phaser.Game(config)
