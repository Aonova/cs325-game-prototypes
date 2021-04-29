import { Theme, Helper, SETTINGS, Asset, Event } from './common.js';
var Tile = (function () {
    function Tile(scene, tDim, bPos, cPos, bDim, board) {
        var _this = this;
        this.players = [];
        this.bomb = null;
        this.type = 0;
        this.forceDir = null;
        this.pos = bPos;
        this.sPos = {
            x: cPos.x + (bPos.x - bDim.w / 2 + .5) * tDim.w,
            y: cPos.y + (bPos.y - bDim.h / 2 + .5) * tDim.h
        };
        this.board = board;
        var scale = (this.pos.x + this.pos.y) % 2 ? .65 : .95;
        if (this.pos.x * this.pos.y == 0 || this.pos.x + 1 == bDim.w || this.pos.y + 1 == bDim.h)
            scale = .95;
        this.rect = scene.add.rectangle(this.sPos.x, this.sPos.y, tDim.w * scale, tDim.h * scale, Theme.colorBG, 1).setOrigin(.5);
        this.forceArrow = scene.add.image(this.sPos.x, this.sPos.y, Asset.forceArrow).setOrigin(.5).setAlpha(0)
            .setScale(.25).setTint(Theme.colorHL).setDepth(3);
        scene.events.on(Event.phaseMove, function () {
            if (_this.forceDir != null)
                _this.showForce(_this.forceDir);
        });
        scene.events.on(Event.phaseAction, function () {
            _this.forceDir = null;
        });
    }
    Tile.prototype.setType = function (type) {
        var duration = 300;
        this.type = type < 0 ? -1 : type > 0 ? 1 : 0;
        if (type == -1)
            this.rect.scene.add.tween({ targets: this.rect, alpha: .2, duration: duration });
        else {
            this.rect.scene.add.tween({ targets: this.rect, alpha: 1, duration: duration });
            if (type == 0)
                this.rect.scene.tweens
                    .addCounter(Helper.tweenFillStyle([this.rect], this.rect.fillColor, Theme.colorBG, duration));
            else if (type == 1)
                this.rect.scene.tweens
                    .addCounter(Helper.tweenFillStyle([this.rect], this.rect.fillColor, Theme.wallColor, duration));
        }
    };
    Tile.prototype.getNbrTile = function (dir) {
        var offset = Helper.dirToXY(dir);
        try {
            return this.board[this.pos.x + offset.x][this.pos.y - offset.y];
        }
        catch (e) {
            return null;
        }
    };
    Tile.prototype.showTextMote = function (msg) {
        var obj = this.rect;
        var textObj = obj.scene.add.text(obj.x, obj.y - obj.height / 2, msg, Theme.fontDebug)
            .setAlpha(0).setOrigin(.5).setShadowFill(true).setShadowBlur(8);
        var timeline = obj.scene.tweens.createTimeline();
        timeline
            .add({ targets: textObj, y: textObj.y - obj.height / 2, ease: 'Cubic.easeInOut', duration: 1000, onComplete: function () { textObj.destroy(); } })
            .add({ targets: textObj, alpha: 1, ease: 'Sine', yoyo: true, hold: 300, duration: 300, offset: 0 })
            .play();
    };
    Tile.prototype.showForce = function (dir) {
        var arrow = this.forceArrow;
        arrow.setRotation(dir / 8 * 2 * Math.PI);
        var doFrom = Helper.dirToXY((dir + 4) % 8);
        var doTo = Helper.dirToXY(dir);
        var dist = SETTINGS.tileSize / 4;
        var oPos = {
            from: { x: this.sPos.x + dist * doFrom.x, y: this.sPos.y - dist * doFrom.y },
            to: { x: this.sPos.x + dist * doTo.x, y: this.sPos.y - dist * doTo.y }
        };
        arrow.setPosition(oPos.from.x, oPos.from.y);
        arrow.scene.add.tween({
            targets: arrow, x: oPos.to.x, y: oPos.to.y, duration: 800, ease: 'Linear'
        });
        arrow.scene.add.tween({
            targets: arrow, alpha: .5, yoyo: true, duration: 400, ease: 'Sine'
        });
    };
    Tile.prototype.addForce = function (dir) {
        if (this.forceDir != null && this.forceDir != dir)
            this.forceDir = -1;
        else
            this.forceDir = dir;
    };
    Tile.prototype.clearForce = function () {
        this.forceDir = null;
    };
    Tile.prototype.getForce = function () {
        return this.forceDir;
    };
    return Tile;
}());
export { Tile };
//# sourceMappingURL=tile.js.map