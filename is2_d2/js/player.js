import { Theme, Helper, Event, Dir, SETTINGS, Asset } from './common.js';
var Player = (function () {
    function Player(scene, id, size, start, inputs) {
        var _this = this;
        this.queuedAction = null;
        this.hasBomb = false;
        this.died = false;
        this.scene = scene;
        this.id = id;
        start.players.push(this);
        this.tile = start;
        if (inputs)
            this.inputs = inputs;
        this.obj = this.scene.add.ellipse(this.tile.sPos.x, this.tile.sPos.y, size, size, Theme.playerColor[id], .85)
            .setOrigin(.5);
        this.scene.events
            .on(Event.phaseAction, function () { _this.onAction(); })
            .on(Event.phaseForce, function () { _this.onForce(); })
            .on(Event.phaseMove, function () { _this.onMove(); })
            .on(Event.phaseBuild, function () { _this.onBuild(); });
        if (this.inputs) {
            var me_1 = this;
            var qa = me_1.queuedAction;
            var queueAction_1 = function (out) {
                if (me_1.queuedAction)
                    return;
                if (me_1.hasBomb) {
                    me_1.queuedAction = { action: 'force', offset: out ? 1 : -1 };
                    me_1.icon.setTexture(Asset.bombAction).setScale(.6);
                    me_1.scene.add.tween({
                        targets: me_1.icon, scale: .4, alpha: .8, ease: 'Sine', duration: 400
                    });
                }
                else {
                    var dir = _this.getCardDirRelPointer();
                    if (dir == null)
                        return;
                    var qa_1 = me_1.queuedAction = { action: 'build', timeLeft: 1, offset: out ? 1 : -1, dir: dir };
                    me_1.icon.setTexture(qa_1.offset == 1 ? Asset.buildAction : Asset.digAction).setScale(.6);
                    me_1.icon2.obj.setTexture(qa_1.offset == 1 ? Asset.buildUp : Asset.buildDown).setScale(.6);
                    var xyDir = Helper.dirToXY(qa_1.dir);
                    me_1.icon2.offset = { x: xyDir.x * SETTINGS.tileSize, y: -xyDir.y * SETTINGS.tileSize };
                    me_1.scene.add.tween({
                        targets: [me_1.icon, me_1.icon2.obj], scale: .4, alpha: .8, ease: 'Sine', duration: 400
                    });
                }
                _this.scene.sound.play(Asset.audioQueue);
            };
            this.inputs.out.on('down', function () { queueAction_1(true); });
            this.inputs["in"].on('down', function () { queueAction_1(false); });
        }
        this.icon = scene.add.image(this.obj.x, this.obj.y, Asset.digAction)
            .setAlpha(0).setOrigin(.5).setScale(.4).setTint(Theme.playerColor[this.id] + 0x205025).setDepth(2);
        this.icon2 = {
            obj: scene.add.image(this.obj.x, this.obj.y, Asset.buildDown).setAlpha(0).setOrigin(.5)
                .setTint(Theme.playerColor[this.id] + 0x205025).setScale(.4).setDepth(1),
            offset: { x: 0, y: 0 }
        };
        var me = this;
        var updateIconPos = function () {
            if (!me || !me.obj || !me.icon || !me.icon2)
                me.obj.scene.events.off('prerender', updateIconPos);
            me.icon.setPosition(me.obj.x, me.obj.y).setAlpha(me.icon.alpha * me.obj.alpha);
            me.icon2.obj.setPosition(me.obj.x + me.icon2.offset.x, me.obj.y + me.icon2.offset.y)
                .setAlpha(me.icon2.obj.alpha * me.obj.alpha);
        };
        this.obj.scene.events.on('prerender', updateIconPos);
    }
    Player.prototype.getCardDirRelPointer = function () {
        var input = this.scene.input;
        input.activePointer.updateWorldPoint(this.scene.cameras.main);
        var pPos = { x: input.activePointer.worldX, y: input.activePointer.worldY };
        var vec = new Phaser.Math.Vector2(pPos.x - this.obj.x, pPos.y - this.obj.y);
        if (vec.length() < this.obj.width)
            return null;
        var theta = vec.angle();
        var PI = Math.PI;
        var dir = Dir.E;
        if (theta > PI / 4)
            dir = Dir.S;
        if (theta > 3 * PI / 4)
            dir = Dir.W;
        if (theta > 5 * PI / 4)
            dir = Dir.N;
        if (theta > 7 * PI / 4)
            dir = Dir.E;
        console.log(dir);
        return dir;
    };
    Player.prototype.showTextMote = function (msg) {
        var obj = this.obj;
        var textObj = this.scene.add.text(this.obj.x, this.obj.y - obj.height / 2, msg, Theme.fontDebug)
            .setAlpha(0).setOrigin(.5).setTint(Theme.playerColor[this.id]).setShadowFill(true).setShadowBlur(8);
        var timeline = this.scene.tweens.createTimeline();
        timeline
            .add({ targets: textObj, y: textObj.y - obj.height / 2, ease: 'Cubic.easeInOut', duration: 1000, onComplete: function () { textObj.destroy(); } })
            .add({ targets: textObj, alpha: 1, ease: 'Sine', yoyo: true, hold: 300, duration: 300, offset: 0 })
            .play();
    };
    Player.prototype.onAction = function () {
        if (!this.tile)
            return;
        var qa = this.queuedAction;
        var me = this;
        if (qa)
            return;
        else if (this.inputs) {
            var dir = this.getCardDirRelPointer();
            if (dir != null) {
                this.queuedAction = { action: 'move', dir: dir };
            }
        }
        else {
            while (this.queuedAction == null) {
                var randMove = Math.random();
                var randDir = Math.random();
                var dir = Math.floor(randDir * 4) * 2;
                var tile = this.getTile(dir);
                var randOut = Math.random();
                if (this.hasBomb)
                    randMove = Math.min(.999, randMove + .4);
                if (randMove < .9) {
                    if (tile && tile.type == 0)
                        this.queuedAction = { action: 'move', dir: dir };
                }
                else {
                    if (this.hasBomb) {
                        var offset = randOut < .5 ? -1 : 1;
                        this.queuedAction = { action: 'force', offset: offset };
                    }
                    else {
                        if (!tile)
                            continue;
                        var offset = randOut < .5 ? -1 : 1;
                        if (tile.type == 1)
                            offset = -1;
                        else if (tile.type == -1)
                            offset = 1;
                        this.queuedAction = { action: 'build', offset: offset, dir: dir, timeLeft: 1 };
                    }
                }
            }
            qa = this.queuedAction;
            if (this.queuedAction.action != 'move')
                this.scene.sound.play(Asset.audioQueue, { detune: SETTINGS.aTune });
            if (this.queuedAction.action == 'build') {
                this.icon.setTexture(qa.offset == 1 ? Asset.buildAction : Asset.digAction).setScale(.6);
                this.icon2.obj.setTexture(qa.offset == 1 ? Asset.buildUp : Asset.buildDown).setScale(.6);
                var xyDir = Helper.dirToXY(qa.dir);
                this.icon2.offset = { x: xyDir.x * SETTINGS.tileSize, y: -xyDir.y * SETTINGS.tileSize };
                this.scene.add.tween({
                    targets: [me.icon, me.icon2.obj], scale: .4, alpha: .8, ease: 'Sine', duration: 400
                });
            }
            else if (qa.action == 'force') {
                me.icon.setTexture(Asset.bombAction).setScale(.6);
                me.scene.add.tween({
                    targets: me.icon, scale: .4, alpha: .8, ease: 'Sine', duration: 250
                });
            }
        }
    };
    Player.prototype.onForce = function () {
        var _this = this;
        if (!this.tile)
            return;
        var qa = this.queuedAction;
        var me = this;
        if (qa && qa.action == 'force') {
            this.showTextMote('Force-' + (qa.offset == 1 ? 'out' : 'in'));
            this.hasBomb = false;
            this.queuedAction = null;
            var pos_1 = this.tile.pos;
            var xDif = SETTINGS.boardWidth - 1 - pos_1.x;
            var yDif = SETTINGS.boardHeight - 1 - pos_1.y;
            var inRange_1 = function (x, a, b) { return x >= a && x <= b; };
            var addForceToTile = function (dx, dy, dir) {
                var tPos = { x: pos_1.x + dx, y: pos_1.y + dy };
                if (inRange_1(tPos.x, 0, SETTINGS.boardWidth - 1) && inRange_1(tPos.y, 0, SETTINGS.boardHeight - 1))
                    _this.tile.board[tPos.x][tPos.y].addForce(dir);
            };
            var forceDir = function (dir) { return qa.offset == 1 ? dir : (dir + 4) % 8; };
            for (var i = 1; i <= pos_1.y; i++)
                addForceToTile(0, -i, forceDir(Dir.N));
            for (var i = 1; i <= Math.min(pos_1.x, pos_1.y); i++)
                addForceToTile(-i, -i, forceDir(Dir.NW));
            for (var i = 1; i <= pos_1.x; i++)
                addForceToTile(-i, 0, forceDir(Dir.W));
            for (var i = 1; i <= Math.min(pos_1.x, yDif); i++)
                addForceToTile(-i, +i, forceDir(Dir.SW));
            for (var i = 1; i <= yDif; i++)
                addForceToTile(0, +i, forceDir(Dir.S));
            for (var i = 1; i <= Math.min(xDif, yDif); i++)
                addForceToTile(+i, +i, forceDir(Dir.SE));
            for (var i = 1; i <= xDif; i++)
                addForceToTile(+i, 0, forceDir(Dir.E));
            for (var i = 1; i <= Math.min(xDif, pos_1.y); i++)
                addForceToTile(+i, -i, forceDir(Dir.NE));
            this.scene.events.emit(Event.bombSpawn, this.id);
            me.scene.sound.play(Asset.audioForceBomb, me.id == 0 ? {} : { detune: SETTINGS.aTune });
            me.scene.add.tween({
                targets: me.icon, alpha: 0, scale: .6, duration: 250, ease: 'Sine', delay: me.id == 200 ? 0 : 250
            });
        }
    };
    Player.prototype.onMove = function () {
        if (!this.tile)
            return;
        var me = this;
        var delay = 0;
        var qAct = this.queuedAction;
        if (this.tile.getForce() != null) {
            var loseFlag_1 = false;
            var dest = this.tile;
            var _loop_1 = function () {
                var nbr = dest.getNbrTile(dest.getForce());
                if (nbr && nbr.type == 1) {
                    me.obj.scene.time.delayedCall(400, function () {
                        nbr.setType(0);
                        me.scene.sound.play(Asset.audioBreak);
                        nbr.showTextMote('Force-break!');
                    });
                    return "break";
                }
                dest = nbr;
            };
            while (dest && dest.getForce() != null && dest.type == 0) {
                var state_1 = _loop_1();
                if (state_1 === "break")
                    break;
            }
            if (dest == null || dest.type == -1)
                loseFlag_1 = true;
            var destPos = dest ? dest.sPos : null;
            if (dest == null) {
                var screenRect = new Phaser.Geom.Rectangle(0, 0, 1280, 720);
                var pos = this.tile.sPos;
                var dxy = Helper.dirToXY(this.tile.getForce());
                var dirVec = new Phaser.Geom.Line(pos.x, pos.y, pos.x + dxy.x * 2000, pos.y - dxy.y * 2000);
                var endPos = Phaser.Geom.Intersects.GetLineToRectangle(dirVec, screenRect)[0];
                destPos = { x: endPos.x, y: endPos.y };
            }
            var a = loseFlag_1 ? 0 : me.obj.alpha;
            this.scene.add.tween({
                targets: me.obj, x: destPos.x, y: destPos.y, alpha: a, ease: 'Sine', duration: 400,
                onComplete: function () {
                    if (loseFlag_1)
                        me.obj.scene.events.emit(Event.gameOver, me.id);
                }
            });
            me.tile.players = me.tile.players.filter(function (p) { return p != me; });
            me.tile = dest;
            if (me.tile)
                me.tile.players.push(me);
            delay = 400;
        }
        if (me.tile && qAct && qAct.action == 'move') {
            this.tryMoveCard(qAct.dir, delay);
            this.queuedAction = null;
        }
    };
    Player.prototype.onBuild = function () {
        if (!this.tile)
            return;
        var me = this;
        var qa = this.queuedAction;
        if (qa && qa.action == 'build') {
            if (qa.timeLeft > 0) {
                qa.timeLeft--;
                return;
            }
            this.tryBuildCard(qa.offset, qa.dir);
            this.queuedAction = null;
            me.icon.setAlpha(1);
            me.scene.tweens.add({
                targets: [me.icon, me.icon2.obj], scale: .6, alpha: 0, ease: 'Sine', duration: 400
            });
        }
    };
    Player.prototype.tryBuildCard = function (offset, dir) {
        if (dir % 2)
            return;
        dir /= 2;
        var me = this;
        var dx = dir % 2 ? dir - 1 ? -1 : 1 : 0;
        var dy = dir % 2 ? 0 : dir ? 1 : -1;
        var pos = me.tile.pos;
        var sPos = me.tile.sPos;
        var buildOn = null;
        try {
            buildOn = me.tile.board[pos.x + dx][pos.y + dy];
        }
        catch (e) { }
        if (buildOn == null || Math.abs(buildOn.type + offset) > 1)
            return;
        buildOn.setType(buildOn.type + offset);
        me.scene.sound.play(offset == -1 ? Asset.audioDig : Asset.audioBuild);
    };
    Player.prototype.getTile = function (dir) {
        var dxy = Helper.dirToXY(dir);
        var tpos = { x: this.tile.pos.x + dxy.x, y: this.tile.pos.y - dxy.y };
        if (this.tile.board[tpos.x])
            return this.tile.board[tpos.x][tpos.y];
        return null;
    };
    Player.prototype.tryMoveCard = function (dir, delay) {
        if (!this.tile || dir % 2)
            return;
        dir /= 2;
        var me = this;
        var dx = dir % 2 ? dir - 1 ? -1 : 1 : 0;
        var dy = dir % 2 ? 0 : dir ? 1 : -1;
        var pos = me.tile.pos;
        var sPos = me.tile.sPos;
        var success = 0;
        var newTile = null;
        try {
            newTile = me.tile.board[pos.x + dx][pos.y + dy];
        }
        catch (e) { }
        if (newTile == null)
            return;
        if (newTile.type) {
            this.scene.add.tween({ targets: me.obj, duration: 250, ease: 'Circ', yoyo: true, delay: delay,
                x: sPos.x + (newTile.sPos.x - sPos.x) / 2,
                y: sPos.y + (newTile.sPos.y - sPos.y) / 2
            });
        }
        else {
            this.scene.add.tween({ targets: me.obj, duration: 500, ease: 'Circ', delay: delay,
                x: newTile.sPos.x,
                y: newTile.sPos.y, onComplete: function () { after(); }
            });
        }
        function after() {
            me.tile.players = me.tile.players.filter(function (p) { return p != me; });
            me.tile = me.tile.board[pos.x + dx][pos.y + dy];
            me.tile.players.push(me);
            if (me.tile.bomb == me.id) {
                me.scene.events.emit(Event.bombTaken, me.id, me.tile.pos);
                me.hasBomb = true;
                me.scene.sound.play(Asset.audioSelect, me.id == 0 ? {} : { detune: SETTINGS.aTune });
            }
        }
    };
    return Player;
}());
export { Player };
//# sourceMappingURL=player.js.map