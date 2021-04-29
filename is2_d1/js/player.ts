import { Theme,Helper,Inputs,DEBUG,Event,Dir,SETTINGS } from './common.js'
import { Tile } from './tile.js'
/**
 * Player unit on the board. 
 * Can move once per tick in a cardinal direction on the board.
 * Can pick up bomb if not carrying bomb.
 * Can dig or build if not carrying bomb (takes 2 ticks).
 * Can use carried bomb to push or pull.
 */
export class Player {
    scene: Phaser.Scene
    id: number
    /** Tile of player */
    tile: Tile
    /** Graphical game-object of player (simple circle for now) */
    obj: Phaser.GameObjects.Ellipse
    /** Bound input keys if this is a human-controlled player */
    inputs:Inputs
    /** The action currently queued, waiting for timer to be zero -- basically just builds for now*/
    queuedAction: {timeLeft?:number,action:'move'|'force'|'build',offset?:-1|1,dir?:number} = null
    /** true if this player has a bomb -- changes build actions to force actions. */
    hasBomb: boolean = false
    /** True if fell out of bound i.e. died. Set during movement phase */
    died = false
    constructor(scene:Phaser.Scene,id:number,size:number,start:Tile,inputs?:Inputs) {
        this.scene = scene
        this.id = id
        start.players.push(this)
        this.tile = start
        if (inputs) this.inputs = inputs // only the human-controlled player needs inputs bound
        // make visual player piece on board
        this.obj = this.scene.add.ellipse(this.tile.sPos.x,this.tile.sPos.y,size,size,Theme.playerColor[id],.85)
            .setOrigin(.5)
        this.scene.events // register actions on each turn phase
            .on(Event.phaseAction,()=>{this.onAction()})
            .on(Event.phaseForce,()=>{this.onForce()})
            .on(Event.phaseMove,()=>{this.onMove()})
            .on(Event.phaseBuild,()=>{this.onBuild()})

        if (this.inputs) { // add input-based actions on human controlled player 
            const me = this
            this.inputs.out.on('down',()=>{ // queue build/force out on out input press
                if (me.queuedAction) return
                if (me.hasBomb) {
                    me.queuedAction = {action:'force', offset:1}
                    me.showTextMote('Queue Force-out')
                } else {
                    const dir = this.getHeldDirInput()
                    if (dir == null) return
                    me.queuedAction = {action:'build', timeLeft:1, offset:1, dir:dir}
                    me.showTextMote('Queue Build '+Helper.dirToStr(dir))
                }
            })
            this.inputs.in.on('down',()=>{ // queue dig/force in on in input press
                if (me.queuedAction) return
                if (me.hasBomb) {
                    me.queuedAction = {action:'force', offset:-1}
                    me.showTextMote('Queue Force-in')
                } else {
                    const dir = this.getHeldDirInput()
                    if (dir == null) return
                    me.queuedAction = {action:'build', timeLeft:1, offset:-1, dir:dir}
                    me.showTextMote('Queue Dig '+Helper.dirToStr(dir))
                }
            })
        }
    }
    /** convert held input keys into a direction number from 0-7 */
    private getHeldDirInput():Dir {
        let offset = {x:0,y:0}
        if (this.inputs.up.isDown) offset.y++
        if (this.inputs.down.isDown) offset.y--
        if (this.inputs.left.isDown) offset.x--
        if (this.inputs.right.isDown) offset.x++
        return Helper.xyToDir(offset)
    }
    /** Display a little message temporarily over the player piece. */
    showTextMote(msg:string) {
        const obj = this.obj
        const textObj = this.scene.add.text(this.obj.x, this.obj.y-obj.height/2, msg, Theme.fontDebug)
            .setAlpha(0).setOrigin(.5).setTint(Theme.playerColor[this.id]).setShadowFill(true).setShadowBlur(8)
        const timeline = this.scene.tweens.createTimeline()
        timeline
            .add({targets:textObj, y:textObj.y-obj.height/2, ease:'Cubic.easeInOut', duration:1000, onComplete:()=>{textObj.destroy()}})
            .add({targets:textObj, alpha:1, ease:'Sine', yoyo:true, hold:300, duration:300, offset:0})
            .play()
    }
    /** First phase, all players lock in actions for this turn. */
    onAction() {
        if (!this.tile) return
        const qa = this.queuedAction
        // don't allow a new action if we have one queued (e.g. build/force)
        if (qa) return
        else if (this.inputs) { // if this player is human-controlled (bound to inputs) queue movement
            if (this.inputs.up.isDown) this.queuedAction = {action:'move',dir:Dir.N}
            else if (this.inputs.right.isDown) this.queuedAction = {action:'move',dir:Dir.E}
            else if (this.inputs.down.isDown) this.queuedAction = {action:'move',dir:Dir.S}
            else if (this.inputs.left.isDown) this.queuedAction = {action:'move',dir:Dir.W}
        } else { // if inputs not bound = AI player. Very basic AI for now, mostly random moves
            while (this.queuedAction==null) { // re-roll until an OK action is decided
                let randMove = Math.random() // seed for action type
                let randDir = Math.random() // random direction
                const dir = Math.floor(randDir*4)*2
                const tile = this.getTile(dir) // look at the tile in that direction
                let randOut = Math.random() // coin toss on in vs out for build/force
                if (this.hasBomb) randMove = Math.min(.999,randMove+.4) // extra chance to force when carrying bomb
                if (randMove<.9) { // 90% to move
                    if (tile && tile.type == 0) this.queuedAction = {action:'move',dir:dir}
                } else { // 20% chance to build or force
                    if (this.hasBomb) { 
                        let offset:-1|1 = randOut<.5?-1:1
                        this.showTextMote(`Queue Force-${offset==1?'out':'in'} ${Helper.dirToStr(dir)}`)
                        this.queuedAction = {action:'force',offset:offset}
                    }
                    else {
                        if (!tile) continue // dont consider building oobs
                        let offset:-1|1 = randOut<.5?-1:1
                        if (tile.type==1) offset = -1
                        else if (tile.type==-1) offset = 1
                        this.showTextMote(`Queue ${offset==1?'Build':'Dig'} ${Helper.dirToStr(dir)}`)
                        this.queuedAction = {action:'build',offset:offset,dir:dir,timeLeft:1}
                    }
                }
                
            }
        }
    }
    /** Phase 2, all players calculate force if applicable */
    onForce() {
        if (!this.tile) return
        const qa = this.queuedAction
        if ( qa && qa.action == 'force' ) {
            this.showTextMote('Force-'+(qa.offset==1?'out':'in'))
            this.hasBomb = false
            this.queuedAction = null
            const pos = this.tile.pos
            // distance from current position to right/lower edge of board
            const xDif = SETTINGS.boardWidth - 1 - pos.x
            const yDif = SETTINGS.boardHeight - 1 - pos.y
            const inRange = (x,a,b) => x>=a&&x<=b
            const addForceToTile = (dx:number,dy:number,dir:Dir)=>{
                const tPos = {x:pos.x+dx, y:pos.y+dy}
                if (inRange(tPos.x,0,SETTINGS.boardWidth-1)&&inRange(tPos.y,0,SETTINGS.boardHeight-1))
                    this.tile.board[tPos.x][tPos.y].addForce(dir)
            }
            /** invert direction if force is in vs out. */
            const forceDir = (dir) => qa.offset==1?dir:(dir+4)%8
            // calculate force on queen's move tiles relative to this player's position
            for (let i=1;i<=pos.y;i++) 
                addForceToTile(0,-i,forceDir(Dir.N))
            for (let i=1;i<=Math.min(pos.x,pos.y);i++) 
                addForceToTile(-i,-i,forceDir(Dir.NW))
            for (let i=1;i<=pos.x;i++) 
                addForceToTile(-i,0,forceDir(Dir.W))
            for (let i=1;i<=Math.min(pos.x,yDif);i++) 
                addForceToTile(-i,+i,forceDir(Dir.SW))
            for (let i=1;i<=yDif;i++) 
                addForceToTile(0,+i,forceDir(Dir.S))
            for (let i=1;i<=Math.min(xDif,yDif);i++) 
                addForceToTile(+i,+i,forceDir(Dir.SE))
            for (let i=1;i<=xDif;i++) 
                addForceToTile(+i,0,forceDir(Dir.E))
            for (let i=1;i<=Math.min(xDif,pos.y);i++) 
                addForceToTile(+i,-i,forceDir(Dir.NE))

            this.scene.events.emit(Event.bombSpawn,this.id)
        }
    }
    /** Phase 3, all players conduct their board movement */
    onMove() {
        if (!this.tile) return
        const me = this
        let delay = 0
        const qAct = this.queuedAction
        // TODO do force moves according to tiles
        if (this.tile.getForce()!=null) { // if this player is on a force move area of effect
            // get destination of force movement
            let loseFlag = false
            let dest:Tile = this.tile
            while (dest && dest.getForce()!=null && dest.type==0) {
                const nbr = dest.getNbrTile(dest.getForce())
                if (nbr && nbr.type==1) { // if the neighbor is a wall, break it and end force.
                    me.obj.scene.time.delayedCall(400,()=>{
                        nbr.setType(0)
                        nbr.showTextMote('Force-break!')
                    })
                    break
                }
                dest = nbr // move to that neighbor
            }
            if (dest==null || dest.type==-1) loseFlag=true
            let destPos = dest?dest.sPos:null
            if (dest==null) { // fly off-screen
                const screenRect = new Phaser.Geom.Rectangle(0,0,1280,720)
                const pos = this.tile.sPos
                const dxy = Helper.dirToXY(this.tile.getForce())
                const dirVec = new Phaser.Geom.Line(pos.x,pos.y,pos.x+dxy.x*2000,pos.y-dxy.y*2000)
                const endPos:Phaser.Geom.Point = Phaser.Geom.Intersects.GetLineToRectangle(dirVec,screenRect)[0]
                destPos = {x:endPos.x,y:endPos.y}
            }
            const a = loseFlag?0:me.obj.alpha
            this.scene.add.tween({
                targets:me.obj, x:destPos.x, y:destPos.y, alpha:a, ease: 'Sine', duration: 400,
                onComplete: ()=>{
                    if (loseFlag) me.obj.scene.events.emit(Event.gameOver,me.id)
                }
            })
            me.tile.players = me.tile.players.filter(p => p != me)
            me.tile = dest
            if (me.tile) me.tile.players.push(me)
            delay = 400
        } 
        if (me.tile && qAct && qAct.action == 'move') {
            this.tryMoveCard(qAct.dir,delay)
            this.queuedAction = null
        }      
    }
    /** Phaser 4, all players conduct their build actions, affecting tiles */
    onBuild() {
        if (!this.tile) return
        const qa = this.queuedAction
        if (qa && qa.action=='build') {
            if (qa.timeLeft>0) {qa.timeLeft--;return;}
            this.tryBuildCard(qa.offset,qa.dir)
            this.showTextMote(`${qa.offset==-1?'Dig':'Build'} ${Helper.dirToStr(qa.dir)}`)
            this.queuedAction = null
        }
    }
    /** Build up or down in a cardinal on the board, direction go 0=N 2=E 4=S 6=W. */
    private tryBuildCard(offset:number, dir:number) {
        if (dir%2) return // dont allow non-cardinal movement
        dir/=2
        const me = this
        const dx = dir%2 ? dir-1 ? -1 : 1 : 0
        const dy = dir%2 ? 0: dir ? 1 : -1
        const pos = me.tile.pos
        const sPos = me.tile.sPos
        let buildOn:Tile = null
        try {buildOn = me.tile.board[pos.x+dx][pos.y+dy]} catch(e) {}
        // skip if tile to build on is out of bounds or is at highest/lowest build.
        if (buildOn==null || Math.abs(buildOn.type+offset) > 1 ) return 
        buildOn.setType(buildOn.type+offset)

    }
    private getTile(dir:number):Tile { // returns tile in relative direction to player
        const dxy = Helper.dirToXY(dir)
        const tpos = {x:this.tile.pos.x + dxy.x,y:this.tile.pos.y - dxy.y}
        if (this.tile.board[tpos.x]) return this.tile.board[tpos.x][tpos.y]
        return null
    }
    /** move one tile in a cardinal on the board, directions go 0=N 2=E 4=S 6=W with a delay in ms*/
    private tryMoveCard(dir:number,delay:number) {
        if (!this.tile || dir%2) return // dont allow non-cardinal movement
        dir/=2
        const me = this
        const dx = dir%2 ? dir-1 ? -1 : 1 : 0
        const dy = dir%2 ? 0: dir ? 1 : -1
        const pos = me.tile.pos
        const sPos = me.tile.sPos  
        let success = 0
        let newTile:Tile = null
        try {newTile = me.tile.board[pos.x+dx][pos.y+dy]} catch(e) {}
        if (newTile==null) return // invalid move
        if (newTile.type) { // cannot move over wall or hole -- fail animation
            this.scene.add.tween({targets:me.obj,duration:250,ease:'Circ',yoyo:true,delay:delay,
                x:sPos.x+(newTile.sPos.x-sPos.x)/2,
                y:sPos.y+(newTile.sPos.y-sPos.y)/2,
            })
        } else { // successful move: animate and set tiles
            this.scene.add.tween({targets:me.obj,duration:500,ease:'Circ',delay:delay,
                x:newTile.sPos.x,
                y:newTile.sPos.y,
                onComplete: ()=>{after()}
            })
        }
        function after() {
            me.tile.players = me.tile.players.filter(p => p != me) // remove me from my old tile
            me.tile = me.tile.board[pos.x+dx][pos.y+dy] // update my tile ref to the new tile
            me.tile.players.push(me) // add me to the new tile
            if (me.tile.bomb == me.id) {
                me.scene.events.emit(Event.bombTaken,me.id,me.tile.pos)
                me.hasBomb=true
            }
        }
    }

}