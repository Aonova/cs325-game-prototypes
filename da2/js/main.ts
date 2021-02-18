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
        ambusher: 0x663333,
        royalty: 0x7777dd
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
    /** Under-laying array of hex tiles. Indexed by string in form 'x,y,z' */
    tiles: Hex[]

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
        this.tiles = new Array<Hex>(numTiles)
        this.initTiles()
        
    }

    private initTiles() {
        for (let x=-this.size;x<=this.size;x++) {
            for (let y=-this.size;y<=this.size;y++) {
                for (let z=-this.size;z<=this.size;z++) {
                    if (x+y+z == 0){ // Only add hexes within the rings 
                        let type = HexType.normal
                        if ( x*y*z==0 && (Math.abs(x)+Math.abs(y)+Math.abs(z)) == 2*this.size) type = HexType.escape
                        else if (x==0 && y==0 && z==0) type = HexType.start 
                        this.tiles[`${x},${y},${z}`] = new Hex(this, {x:x,y:y,z:z}, type)
                    }
                }
            }
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
        if (y !== undefined && z !== undefined){
            let x = <integer>pos
            if (x+y+z != 0 || Math.max(Math.abs(x),Math.abs(y),Math.abs(z))>this.size)
                return null
            return (<Hex>this.tiles[`${x},${y},${z}`])
        }
        else {
            let p = <Vec3>pos
            if (p.x+p.y+p.z != 0 || Math.max(Math.abs(p.x),Math.abs(p.y),Math.abs(p.z))>this.size)
                return null
            return (<Hex>this.tiles[`${p.x},${p.y},${p.z}`])
        }
    }
    /** Removes all hexes and units gracefully over a second or so */
    clear() {
        for (let x=-this.size;x<=this.size;x++) {
            for (let y=-this.size;y<=this.size;y++) {
                for (let z=-this.size;z<=this.size;z++) {
                    if (x+y+z == 0){ // Only add hexes within the rings 
                        let ringNum = Math.max(Math.abs(x),Math.abs(y),Math.abs(z))
                        this.scene.time.delayedCall(
                            ringNum*250,
                            ()=>{this.tiles[`${x},${y},${z}`].remove()},[],
                            this
                        )
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
    dim
}
/** Hex tiles as a part of a hex board */
class Hex extends Phaser.GameObjects.Polygon {
    /** Position on hex grid, using hex x, y, z axises */
    hPos: {x:integer,y:integer,z:integer}
    /** The parent board this tile belongs to.*/
    board: HexBoard
    /** Hex type, under the rules of the game */
    hType: HexType = HexType.normal
    /** State of the tile, determining visuals and interactivity. */
    hState: HexState = HexState.normal
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

        this.setHexState(HexState.normal)
    }
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
    /** Changes state of the hex, affecting interactivity and visuals */
    setHexState(state:HexState): Hex{
        let brd = this.board
        var self = this
        switch (state) {
            case HexState.normal:
                Hex.popTween(self,0.9,0.5)
                this.off('pointerover').off('pointerout')
                .on('pointerout', () => {Hex.popTween(self,0.9,0.5)})
                .on('pointerover', () => {Hex.popTween(self,0.95,0.8)})
                break
            case HexState.dim:
                Hex.popTween(self,0.5,0.7)
                this.off('pointerover').off('pointerout')
            default:
                break
        }
        this.state = state
        return this
    }
    remove() {
        Hex.popTween(this,0,this.alpha)
    }
    /** Animation to pop an object to a specified scale and alpha */
    static popTween(object:Polygon,scale:number,alpha:number) {
        object.scene.tweens.add(
            { targets: object, 
                fillAlpha: alpha,
                scale: scale,
                duration: 300,
                ease: 'sine'
            }
        )
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
    show() {
        this.setY(this.y-this.displayHeight)
        this.scene.tweens.add({
            targets: this,
            y: this.y+this.displayHeight,
            alpha: 1,
            ease: 'sine'
        })
        this.state=1
    }
    hide() {
        this.scene.tweens.add({
            targets: this,
            y: this.y-this.displayHeight,
            alpha: 0,
            ease: 'sine'
        })
        this.state=0
    }
    /** Toggles focus, or sets it according to passed param */
    focus(focus?:boolean) {
        if (this.state !in [1,2,3]) return
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
            ease: 'sine'
        })
    }
    unfocus(unfocus?:boolean) {
        if (this.state !in [1,2,3]) return
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
            alpha: 1,
            ease: 'sine'
        })
    }
    constructor(scene:Phaser.Scene,x:number,y:number,tex:string,tint?:number,origin?:Vec2) {
        super(scene,x,y,tex)
        if (tint!==undefined) this.setTint(tint)
        if (origin!==undefined) this.setOrigin
    }
}
class Button extends Label {
    
}
/** Player pieces specific to Royal Ambush */
class Unit extends Phaser.GameObjects.Image {
    /** The Unit type */
    uType: UnitType
    /** The current location of the unit on the grid. */
    Pos: Hex
    /** Base color */


}
/** x,y points of a hex */
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
    /** Side length and circum-circle radius of a hex. Should geometrically match apothem.*/
    rad:number = 43
    /** Number of rings on the hex board. Effectively controls size of board in hexes.*/
    size:integer = 3
    /** Center of the hex board as a location on the scene (= pixels barring camera movement).*/
    center:Vec2 = {x:400,y:300}

    mainBoard: HexBoard

    constructor() {
        super('demo');
    }

    
    preload() {

    }
    
    create() {
        this.mainBoard = new HexBoard(this,this.size,this.rad)
    }
    
    update() {    
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    scene: Demo
}
const game = new Phaser.Game(config)
