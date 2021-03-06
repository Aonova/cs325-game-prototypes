import "./phaser.js"
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
    tiles: Object = {}
    /** Special reference to start tile */
    startTile: Hex
    /** Special references to escape tiles */
    escapeTile: Hex[]
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
                        delay(this.scene,ms/numTiles*tileNum++,this,()=>this.tiles[`${x},${y},${z}`].setHexState(HexState.normal))
                    }
                }
            }
        }
        // this.forEachTile(h=>h.showDebugText()) // TODO: remove debug
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
     /** Initializes the king piece with a visual flourish taking 3.6 secs*/
    initMercs() {
        let inter = 600
        for (let i=0; i<6; i++) {
            delay(this.scene,inter*i,this,()=>{
                this.escapeTile[i].setUnit(new Unit(this.escapeTile[i],UnitType.merc))
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
}
/** Returns a clone of a vector object. */
function cloneVec(vec: Vec3) : Vec3 {
    let ret = {x:vec.x,y:vec.y,z:vec.z}
    return ret
}
/** Visual and interactive states of a hex tile */
enum HexState { 
    /** Regular visuals and slight pop effect on mouseover. Not a drop target. */
    normal,
    /** Pop visuals, slight un-pop effect on mouseover. Active drop target. */
    bright,
    /** Subdued visuals, no effect on mouseover. Not a drop target. */
    dim,
    /** Hidden, not yet shown, not interactive (default) */
    hidden
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
    /** State of the tile, determining visuals and interactivity. */
    hState: HexState = HexState.normal
    /** The inhabiting unit on this tile, or null if empty. */
    private unit: Unit = null
    /** Debug text drawn atop the hex */
    debugText: Phaser.GameObjects.Text = null
    /** 
     * Creates new hex, and backing polygon.
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

        this.setHexState(HexState.hidden)
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
                +` u[${this.isEmpty()?'-1':this.unit.uType}]`)
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
    /** Update team according to inhabiting unit. Should be called whenever unit gets changed. */
    private updateTeam() {
        if (this.unit==null) {
            if (this.hType == HexType.start) this.team = 1 // start tile counts as ambusher when empty
            else this.team = -1
        }
        else this.team = this.unit.team
    }
    /** Returns true if this tile is not yet captured by either team. Short for getTeam()==-1 */
    isNeutral(): boolean {
        return (this.team==-1)
    }
    /** Change the unit attached to the hex. Set to null to detach unit. */
    setUnit(unit:Unit) {
        this.unit = unit
        if (this.debugText!=null) this.updateDebugText()
    }
    /** Get unit object attached to this hex */
    getUnit(): Unit {
        return this.unit   
    }
    
    /** Changes state of the hex, affecting interactivity and visuals. Includes a 500 ms transition. */
    setHexState(state:HexState): Hex{
        let brd = this.board
        var self = <Hex>this
        self.off('pointerover').off('pointerout').off('pointerdown').off('pointerup')
        switch (state) {
            case HexState.normal:
                Hex.popTween(self,0.9,0.5,500)
                self
                .on('pointerout', () => {Hex.popTween(self,0.9,0.5)})
                .on('pointerover', () => {Hex.popTween(self,0.95,0.8)})
                break
            case HexState.dim:
                Hex.popTween(self,0.5,0.7,500)
                break
            case HexState.hidden:
                Hex.popTween(self,0,0,500)
                break
            case HexState.bright:
                Hex.popTween(self,0.98,0.7,500)
                self
                .on('pointerout', () => {Hex.popTween(self,0.98,0.7)})
                .on('pointerover', () => {Hex.popTween(self,0.8,0.95)})
                break
            default:
                break
        }
        this.state = state
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
    constructor(hex:Hex,uType:UnitType) {
        super(hex.board.scene,0,0,uType==UnitType.merc?'unit_merc':uType==UnitType.guard?'unit_guard':'unit_king')
        this.uType = uType
        this.team = uType==UnitType.merc? 1 : 0
        this.hex = hex
        this.setOrigin(.5).setPosition(hex.x,hex.y)
        this.setTint(this.team==0?hex.board.theme.royalty:hex.board.theme.ambusher)
        
        this.showGrand(300,200,300,2)
    }
    /** Try and capture any adjacent enemy units if you are able to.
     *  Should be called after moving a unit on the turn of the team. 
     *  @returns array of capture objects, with 'enemy' captured and 'buddies' which flanked 
    */
    attemptCapture(): {enemy:Unit,buddies:Unit[]}[] {
        let toCapture = new Array<{enemy:Unit,buddies:Unit[]}>()
        if (this.uType==UnitType.king) return toCapture// Kings cannot initiate capture
        this.hex.forEachNbr((nbr,dir)=>{
            if (!nbr.isEmpty() && nbr.getUnit().team != this.team) { // for each enemy unit neighbor
                let buddies = new Array<Unit>()
                let flanks = this.hex.getNbrFlanks(dir)
                let score = 0 // evaluate flanking score -> abstraction of flank rules
                if (flanks.back!=null && flanks.back.getTeam() == this.team) {
                    if (!flanks.back.isEmpty()) buddies.push(flanks.back.getUnit())
                    score+=2
                }
                else {
                    if (flanks.right!=null && flanks.right.getTeam() == this.team) {
                        if (!flanks.right.isEmpty()) buddies.push(flanks.right.getUnit())
                        score+=1
                    }
                    if (flanks.left!=null && flanks.left.getTeam() == this.team) {
                        if (!flanks.left.isEmpty()) buddies.push(flanks.left.getUnit())
                        score+=1
                    }
                }
                if (score>1 || flanks.nbr.hType == HexType.escape && score>0) {// Special rule: allowance for escape hex
                    toCapture.push({enemy:flanks.nbr.getUnit(),buddies:buddies}) 
                }
            }
        })
        return toCapture
    }
    /** A timed animation lasting 700ms representing a set of units overpowering an enemy. Optionally, calls passed function after completion.*/
    showAttack(buddies:Array<Unit>,callback?:(unit:Unit)=>void) {
        buddies.push(this)
        this.scene.add.tween({
            targets:buddies, duration: 350, yoyo: true, onComplete: callback, onCompleteParams: this, ease: 'Sine',
            scale: this.scale * 1.2
        })
    }
    /** A timed animation lasting 700ms representing a unit getting overpowered. Optionally, calls passed function after completion. */
    showDefeat(callback?:(unit:Unit)=>void) {
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
    HexRad:number = 43
    /** Number of rings on the hex board. Effectively controls the number of hexes on the board.*/
    boardSize:integer = 3
    /** Phases: 0=start, 1=deploy, 2=battle, 3=round-end */
    gamePhase = 0
    /** Score for Ambusher player */
    scoreAmbusher = 0
    /** Score for Royalty player */
    scoreRoyalty = 0
    /** Active hex board */
    mainBoard: HexBoard
    /** Looping background music */
    bgm: Phaser.Sound.BaseSound
    private attackCounter = 0
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
            .audio('attack0','assets/attack1.mp3')
            .audio('attack1','assets/attack2.mp3')
    }
    
    private playAttackSound() {
        this.sound.play('attack'+this.attackCounter++)
        this.attackCounter %= 2  
    }

    create() {
        this.bgm = this.sound.add('bgm_main',{loop:true})

        this.bgm.play()
        this.initTitlePhase()
    }
    
    update() { // do nothing on updates since game logic is entirely event based
    }

    initTitlePhase() {
        let titleCard = new Label(this,this.cameras.main.centerX,this.cameras.main.displayHeight/3,'title')
        let confButton = new Button(this,this.cameras.main.centerX,this.cameras.main.displayHeight*2/3,'but_cont').setScale(0.8)
        titleCard.show(800)
        delay(this,800,this,()=>confButton.show(800))
        delay(this,700,this,()=>confButton.setOnClickOnce(onClickConfirm,this))
        function onClickConfirm() {
            titleCard.hide(300)
            confButton.hide(300);
            delay(this,400,this,()=>this.initDeployPhase())
        }
    }
    initDeployPhase() {
        this.mainBoard = new HexBoard(this,this.boardSize,this.HexRad)
        let phaseCard = new Label(this,this.cameras.main.width-10,10,'card_deploy',{x:1,y:0}).setScale(0.9)
        let royalCard = new Label(this,10,10,'card_royalty',{x:0,y:0},this.mainBoard.theme.royalty).setScale(0.6)
        let ambushCard = new Label(this,10,this.cameras.main.height-10,'card_ambusher',{x:0,y:1},this.mainBoard.theme.ambusher).setScale(0.6)
        // TODO: show score text
        let time = 1600 // initial time taken for making board
        delay(this,time,this,()=>phaseCard.showGrand(400,500,500)) 
        delay(this,time+=1300,this,()=>royalCard.showGrand(400,500,400))
        delay(this,time+=1300,this,()=>ambushCard.showGrand(400,500,400))
        delay(this,time+=1300+500,this,()=>{ambushCard.unfocus(true);royalCard.focus(true)})
        delay(this,time+=200,this,()=>this.mainBoard.initKing())
        delay(this,time+=700,this,()=>{ambushCard.focus(true);royalCard.unfocus(true)})
        delay(this,time+=200,this,()=>this.mainBoard.initMercs())
        delay(this,time+=4200,this,()=>royalTurn(0,this.mainBoard))

        /** Even turns for royal team */
        function royalTurn(turn:number,board:HexBoard){
            ambushCard.unfocus(true);royalCard.focus(true)
            royalCard.scene.sound.play('accent_royalty')
            let pending = turn==0 ? 2 : 1
            setBrightOpenTeamHex(0,board)
            for (const key in board.tiles) { // set bright hexes clickable - placing a unit
                const hex = <Hex>board.tiles[key]
                if (hex.state != HexState.bright) continue
                hex.on('pointerup',()=>{
                    hex.setUnit( new Unit(hex,UnitType.guard) )
                    pending--
                    hex.setHexState(HexState.normal)
                    if (pending==0) {
                        resetState(board)
                        delay(hex.scene,500,this,doFinally)
                    }
                },this)
            }
            function doFinally() {
                if (turn!=4) ambushTurn(turn+1,board)
                else console.log('STUB: should be going to battle phase!')
            }
        }
        /** Odd turns for ambush team */
        function ambushTurn(turn:number,board:HexBoard) {
            ambushCard.focus(true);royalCard.unfocus(true)
            royalCard.scene.sound.play('accent_ambusher')
            setBrightOpenTeamHex(1,board)
            for (const key in board.tiles) { // set bright hexes clickable - placing a unit
                const hex = <Hex>board.tiles[key]
                if (hex.state != HexState.bright) continue
                hex.on('pointerup',()=>{
                    hex.setUnit(new Unit(hex,UnitType.merc))
                    resetState(board)
                    delay(hex.scene,500,this,doFinally)
                },this)
            }
            function doFinally() {
                royalTurn(turn+1,board)
            }
        }
        /** Sets team adj open hexes to be bright, and other to be dim, taking 500 ms. Occupied hexes are normal. Returns brightened hexes */
        function setBrightOpenTeamHex(team:number, board:HexBoard) {
            board.forEachTile(hex=>{
                let toRet = new Array()
                if (!hex.isEmpty() && hex.getUnit().team==team) { // team occupied hex
                    let nbrs = hex.getNbrs()
                    for (let i=0; i<6; i++) {
                        let nbr = nbrs[i] 
                        if (nbr!=null && nbr.isEmpty()) {
                            nbr.setHexState(HexState.bright)
                            toRet.push(nbr)
                        } // unoccupied team-adjacent hex 
                    }
                } else if (hex.isEmpty() && hex.state==HexState.normal) hex.setHexState(HexState.dim) // unoccupied neutral hex
            })
        }
        /** Sets all the board tiles to be normal, clearing on-clicks as usual. */
        function resetState(board:HexBoard) {
            for (const key in board.tiles) {
                const hex = <Hex>board.tiles[key]
                hex.setHexState(HexState.normal)
            }
        }
    }
}
//something

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    scene: Demo
}
const game = new Phaser.Game(config)
