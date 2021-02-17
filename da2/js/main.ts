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
enum HexDir { NE, E, SE, SW, W, NW }
/** Tile types specific to Royal Ambush */
enum TileType { start, escape, normal }
/** Unit types specific to Royal Ambush */
enum UnitType { merc, guard, king}
/** Simple Color object: rgb as a hex between 0 and 0xffffff, and alpha from 0-1 */
type Fill = {rgb:number,a:number}
/** Color theme for the board specific to Royal Ambush. */
type BoardColor = {
    normal: Fill
    cold: Fill
    warm: Fill
    hot: Fill
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
        normal: {rgb:0x444444,a:0.5},
        cold: {rgb:0x444466,a:0.7},
        warm: {rgb:0x664444,a:0.7},
        hot: {rgb:0x773344,a:0.8}
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
                    if (x+y+z == 0) // Only add hexes within the rings 
                        this.tiles[`${x},${y},${z}`] = new Hex(this,{x:x,y:y,z:z})
                }
            }
        }
    }
}
/** Visual and interactive states of a hex tile */
enum HexState { 
    /**
     * Neutral color, warm on mouse-over, but no dropping units. 
     */
    normal
}
/** Hex tiles as a part of a hex board */
class Hex{
    /** The object representing the physical hex in the world */
    object:Polygon
    /** Position on hex grid, using hex x, y, z axises */
    pos: {x:integer,y:integer,z:integer}
    /** The parent board this tile belongs to.*/
    board: HexBoard
    /** State of the tile, determining response and grabbing behavior. */
    state: HexState = HexState.normal
    /** 
     * Creates new hex, and backing polygon.
     * @param board The hex board under which this hex tile is being made
     * @param pos The position of this tile on the board in xyz hex coordinates. 
     */
    constructor(board:HexBoard,pos:Vec3) {
        let brd = this.board = board
        this.pos = pos
        let sPos = Hex.hexToScreenPos(brd.center,brd.radius,this.pos) 
        this.object = brd.scene.add.polygon(sPos.x,sPos.y,hexPoints(brd.radius))
            .setOrigin(0,0).setVisible(true).setScale(1,1).setFillStyle(0x8888ff,0.3)
        //this.object.setInteractive(this.object.geom,Phaser.Geom.Polygon.Contains)

        //this.setState(HexState.normal)
    }
    /** Converts a hex xyz position to top-left-origin 2d coordinates.*/
    static hexToScreenPos(center:Vec2,rad:number,hPos:Vec3) : Vec2 {
        let pos = {x:center.x,y:center.y}
        pos.x += ( hPos.x*Math.cos(deg30) - hPos.y*Math.cos(deg30) ) * rad
        pos.y += ( hPos.x*Math.cos(deg60) + hPos.y*Math.cos(deg60) - hPos.z ) * rad 
        return pos
    }
    /** Changes state of the hex, affecting interactivity and visuals */
    setState(state:HexState) {
        let brd = this.board
        switch (state) {
            case HexState.normal:
                this.object.setActive(true).off('pointerover').off('pointerout').setScale(0.9,0.9)
                .on('pointerover', ()=>{
                    this.board.scene.tweens.add(
                        { targets: this.object, 
                            fillColor: this.board.theme.normal.rgb, 
                            fillAlpha: this.board.theme.normal.a,
                            scale: 0.9,
                            duration: 400
                        }
                    )
                })
                .on('pointerout', ()=>{
                    this.board.scene.tweens.add(
                        { targets: this.object, 
                            fillColor: this.board.theme.warm.rgb, 
                            fillAlpha: this.board.theme.warm.a,
                            scale: 1,
                            duration: 400
                        }
                    )
                })
                .setVisible(true)
                break
            default:
                break
        }
        this.state = state
    }

}

/** Player pieces specific to Royal Ambush */
class Unit {
    /** The game object in the scene */
    object:Ellipse
    /** The Unit type */
    type: UnitType
    /** The current location of the unit on the grid */
    currentHex:Hex
    /** Base color  */
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
    rad:number = 40
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
