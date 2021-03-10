var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import "./phaser.js";
var DEBUG_MODE = false;
function vecStr(v) {
    if (v == null)
        return '(null)';
    var msg = "(" + v.x + "," + v.y;
    if (v.z != null) {
        var v3 = v;
        msg += "," + v3.z;
    }
    msg += ')';
    return msg;
}
var Dir;
(function (Dir) {
    Dir[Dir["NE"] = 0] = "NE";
    Dir[Dir["E"] = 1] = "E";
    Dir[Dir["SE"] = 2] = "SE";
    Dir[Dir["SW"] = 3] = "SW";
    Dir[Dir["W"] = 4] = "W";
    Dir[Dir["NW"] = 5] = "NW";
})(Dir || (Dir = {}));
var HexType;
(function (HexType) {
    HexType[HexType["start"] = 0] = "start";
    HexType[HexType["escape"] = 1] = "escape";
    HexType[HexType["normal"] = 2] = "normal";
})(HexType || (HexType = {}));
var UnitType;
(function (UnitType) {
    UnitType[UnitType["merc"] = 0] = "merc";
    UnitType[UnitType["guard"] = 1] = "guard";
    UnitType[UnitType["king"] = 2] = "king";
})(UnitType || (UnitType = {}));
var deg60 = 60 * Math.PI / 180;
var deg30 = 30 * Math.PI / 180;
var HexBoard = (function () {
    function HexBoard(scene, size, radius, center, theme) {
        this.theme = {
            normal: 0x444444,
            start: 0x667799,
            escape: 0x669966,
            ambusher: 0xffaaaa,
            royalty: 0xaaaaff
        };
        this.tiles = {};
        this.scene = scene;
        this.size = size;
        this.radius = radius;
        this.apothem = radius * Math.cos(deg30);
        if (center !== undefined)
            this.center = center;
        else
            this.center = { x: this.scene.cameras.main.centerX, y: this.scene.cameras.main.centerY };
        if (theme !== undefined)
            this.theme = theme;
        var numTiles = 1;
        for (var i = 1; i < size; i++)
            numTiles += i * 6;
        this.escapeTile = new Array();
        this.initTiles();
        if (DEBUG_MODE)
            this.showDebugText();
    }
    HexBoard.prototype.initTiles = function (ms) {
        var _this = this;
        if (ms === undefined)
            ms = 800;
        var tileNum = 0;
        var numTiles = 1;
        for (var i = 1; i < this.size; i++)
            numTiles += i * 6;
        var _loop_1 = function (x) {
            var _loop_2 = function (y) {
                var _loop_3 = function (z) {
                    if (x + y + z == 0) {
                        var type = HexType.normal;
                        if (x * y * z == 0 && (Math.abs(x) + Math.abs(y) + Math.abs(z)) == 2 * this_1.size) {
                            type = HexType.escape;
                            this_1.tiles[x + "," + y + "," + z] = new Hex(this_1, { x: x, y: y, z: z }, type);
                            this_1.escapeTile.push(this_1.tiles[x + "," + y + "," + z]);
                        }
                        else if (x == 0 && y == 0 && z == 0) {
                            type = HexType.start;
                            this_1.startTile = this_1.tiles[x + "," + y + "," + z] = new Hex(this_1, { x: x, y: y, z: z }, type);
                        }
                        else
                            this_1.tiles[x + "," + y + "," + z] = new Hex(this_1, { x: x, y: y, z: z }, type);
                        delay(this_1.scene, ms / numTiles * tileNum++, this_1, function () { return _this.tiles[x + "," + y + "," + z].setState('normal'); });
                    }
                };
                for (var z = -this_1.size; z <= this_1.size; z++) {
                    _loop_3(z);
                }
            };
            for (var y = -this_1.size; y <= this_1.size; y++) {
                _loop_2(y);
            }
        };
        var this_1 = this;
        for (var x = -this.size; x <= this.size; x++) {
            _loop_1(x);
        }
        if (DEBUG_MODE)
            this.forEachTile(function (h) { return h.showDebugText(); });
    };
    HexBoard.prototype.showDebugText = function () {
        var pos = {
            x: this.center.x - Math.cos(15) * this.radius * this.size * 2,
            y: this.center.y + this.radius * this.size
        };
        this.debugText = this.scene.add.text(pos.x, pos.y, "init", { fontSize: '12px' });
    };
    HexBoard.prototype.pixelToTile = function (pos, strict) {
        var offset_left = this.center.x - pos.x;
        var offset_up = this.center.y - pos.y;
        var hy = offset_left / Math.cos(15) / this.radius;
        var hz = offset_up / this.radius / 1.5;
        var hx = -hy - hz;
        return { x: hx, y: hy, z: hz };
    };
    HexBoard.prototype.forEachTile = function (callback) {
        for (var key in this.tiles) {
            var hex = this.tiles[key];
            callback(hex);
        }
    };
    HexBoard.prototype.initKing = function () {
        this.startTile.setUnit(new Unit(this.startTile, UnitType.king));
    };
    HexBoard.prototype.initMercs = function () {
        var _this = this;
        var inter = 400;
        var _loop_4 = function (i) {
            delay(this_2.scene, inter * i, this_2, function () {
                _this.escapeTile[i].setUnit(new Unit(_this.escapeTile[i], UnitType.merc, 200, 100, 200));
            });
        };
        var this_2 = this;
        for (var i = 0; i < 6; i++) {
            _loop_4(i);
        }
    };
    HexBoard.prototype.get = function (pos, y, z) {
        if (y !== undefined && z !== undefined) {
            var x = pos;
            if (x + y + z != 0 || Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) > this.size)
                return null;
            return this.tiles[x + "," + y + "," + z];
        }
        else {
            var p = pos;
            if (p.x + p.y + p.z != 0 || Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)) > this.size)
                return null;
            return this.tiles[p.x + "," + p.y + "," + p.z];
        }
    };
    HexBoard.prototype.clear = function (ms) {
        var _this = this;
        if (ms === undefined)
            ms = 800;
        var _loop_5 = function (x) {
            var _loop_6 = function (y) {
                var _loop_7 = function (z) {
                    if (x + y + z == 0) {
                        var ringNum = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
                        delay(this_3.scene, ms / this_3.size * ringNum, this_3, function () { return _this.tiles[x + "," + y + "," + z].remove(); });
                    }
                };
                for (var z = -this_3.size; z <= this_3.size; z++) {
                    _loop_7(z);
                }
            };
            for (var y = -this_3.size; y <= this_3.size; y++) {
                _loop_6(y);
            }
        };
        var this_3 = this;
        for (var x = -this.size; x <= this.size; x++) {
            _loop_5(x);
        }
    };
    HexBoard.prototype.getUnits = function (test) {
        if (test === undefined)
            test = function () { return true; };
        var ret = [];
        this.forEachTile(function (tile) { if (!tile.isEmpty() && test(tile.getUnit()))
            ret.push(tile.getUnit()); });
        return ret;
    };
    return HexBoard;
}());
function colorTween(scene, object, toColor, duration, callback) {
    var fromColorObj = Phaser.Display.Color.IntegerToColor(object.fillColor);
    var toColorObj = Phaser.Display.Color.IntegerToColor(toColor);
    if (callback === undefined)
        callback = function () { };
    function getTweenColor() {
        var tweenColor = Phaser.Display.Color.Interpolate.ColorWithColor(fromColorObj, toColorObj, 100, tween.getValue());
        return Phaser.Display.Color.ObjectToColor(tweenColor).color;
    }
    var tween = scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: duration,
        ease: 'Sine',
        onUpdate: function () { return object.fillColor = getTweenColor(); },
        onComplete: callback
    });
    return tween;
}
function cloneVec(vec) {
    var ret = { x: vec.x, y: vec.y, z: vec.z };
    return ret;
}
function delay(scene, ms, scope, callback) {
    scene.time.delayedCall(ms, callback, [], scope);
}
var Hex = (function (_super) {
    __extends(Hex, _super);
    function Hex(board, pos, type) {
        var _this = _super.call(this, board.scene, Hex.hexToScreenPos(board.center, board.radius, pos).x, Hex.hexToScreenPos(board.center, board.radius, pos).y, hexPoints(board.radius)) || this;
        _this.hType = HexType.normal;
        _this.unit = null;
        _this.debugText = null;
        _this.team = -1;
        _this.setOrigin(0, 0).setScale(0, 0).setActive(true).setVisible(true);
        _this.scene.add.existing(_this);
        _this.board = board;
        _this.hPos = pos;
        _this.hType = type;
        switch (type) {
            case HexType.normal:
                _this.setFillStyle(board.theme.normal);
                break;
            case HexType.escape:
                _this.setFillStyle(board.theme.escape);
                break;
            case HexType.start:
                _this.setFillStyle(board.theme.start);
                break;
        }
        _this.setInteractive(_this.geom, Phaser.Geom.Polygon.Contains);
        _this.setState("hidden");
        return _this;
    }
    Hex.prototype.isEmpty = function () { return this.unit == null; };
    Hex.prototype.getNbr = function (dir) {
        var nbrPos = cloneVec(this.hPos);
        switch (dir) {
            case Dir.NE:
                nbrPos.z++;
                nbrPos.y--;
                break;
            case Dir.E:
                nbrPos.x++;
                nbrPos.y--;
                break;
            case Dir.SE:
                nbrPos.x++;
                nbrPos.z--;
                break;
            case Dir.SW:
                nbrPos.y++;
                nbrPos.z--;
                break;
            case Dir.W:
                nbrPos.y++;
                nbrPos.x--;
                break;
            case Dir.NW:
                nbrPos.z++;
                nbrPos.x--;
                break;
        }
        return this.board.get(nbrPos);
    };
    Hex.prototype.getNbrs = function () {
        var ret = new Array();
        for (var i = 0; i < 6; i++)
            ret.push(this.getNbr(i));
        return ret;
    };
    Hex.prototype.forEachNbr = function (callback) {
        var nbrs = this.getNbrs();
        for (var i = 0; i < 6; i++)
            if (nbrs[i] != null)
                callback(nbrs[i], i);
    };
    Hex.prototype.getNbrFlanks = function (dir) {
        var nbr = this.getNbr(dir);
        if (nbr === null)
            return { nbr: nbr, left: null, back: null, right: null };
        return {
            nbr: nbr,
            left: nbr.getNbr((dir - 1) % 6),
            back: nbr.getNbr(dir),
            right: nbr.getNbr((dir + 1) % 6)
        };
    };
    Hex.prototype.initDebugText = function () {
        this.debugText = this.scene.add.text(this.x, this.y, "init", { fontSize: '11px', align: 'center' }).setVisible(false).setAlpha(0.6).setOrigin(0.5, 0.5)
            .setDepth(3);
    };
    Hex.prototype.updateDebugText = function () {
        if (this.debugText == null)
            return;
        this.debugText.setPosition(this.x, this.y)
            .setText(vecStr(this.hPos)
            + ("\ns[" + this.state + "]")
            + ("\nu[" + (this.isEmpty() ? '-1' : this.unit.uType) + "] t[" + this.team + "]"));
    };
    Hex.prototype.showDebugText = function () {
        if (this.debugText == null)
            this.initDebugText();
        this.updateDebugText();
        this.debugText.setVisible(true);
    };
    Hex.prototype.hideDebugText = function () {
        if (this.debugText == null)
            return;
        this.debugText.setVisible(false);
    };
    Hex.prototype.getTeam = function () {
        return this.team;
    };
    Hex.prototype.updateTeam = function () {
        if (this.unit == null) {
            if (this.hType == HexType.start) {
                this.team = 1;
                colorTween(this.scene, this, this.board.theme.ambusher, 500);
            }
            else
                this.team = -1;
        }
        else
            this.team = this.unit.team;
        if (this.hType == HexType.start && this.team == 0) {
            colorTween(this.scene, this, this.board.theme.start, 500);
        }
    };
    Hex.prototype.isNeutral = function () {
        return (this.team == -1);
    };
    Hex.prototype.setUnit = function (unit) {
        this.unit = unit;
        this.updateTeam();
        if (this.debugText != null)
            this.updateDebugText();
        return this;
    };
    Hex.prototype.getUnit = function () {
        return this.unit;
    };
    Hex.prototype.setState = function (state) {
        var self = this;
        self.off('pointerover').off('pointerout').off('pointerdown').off('pointerup');
        switch (state) {
            case 'normal':
                Hex.popTween(self, 0.9, 0.5, 500);
                self
                    .on('pointerout', function () { Hex.popTween(self, 0.9, 0.5, 400); })
                    .on('pointerover', function () { Hex.popTween(self, 0.95, 0.8, 400); })
                    .input.dropZone = false;
                break;
            case 'dim':
                Hex.popTween(self, 0.5, 0.7, 500);
                self.input.dropZone = false;
                break;
            case 'hidden':
                Hex.popTween(self, 0, 0, 500);
                self.input.dropZone = false;
                break;
            case 'bright':
                Hex.popTween(self, 0.98, 0.7, 500);
                self
                    .on('pointerout', function () { Hex.popTween(self, 0.98, 0.7, 400); })
                    .on('pointerover', function () { Hex.popTween(self, 0.8, 0.95, 400); })
                    .input.dropZone = true;
                break;
            default:
                break;
        }
        _super.prototype.setState.call(this, state);
        this.updateDebugText();
        return this;
    };
    Hex.prototype.remove = function () {
        var _this = this;
        this.removeInteractive();
        Hex.popTween(this, 0, 0, 500, function () {
            _this.destroy();
            if (_this.debugText != null)
                _this.debugText.destroy();
        });
    };
    Hex.popTween = function (object, scale, alpha, duration, callback) {
        var conf = {
            targets: object,
            fillAlpha: alpha,
            scale: scale,
            duration: duration === undefined ? 300 : duration,
            ease: 'Sine'
        };
        if (callback !== undefined) {
            conf.onComplete = callback;
            conf.onCompleteScope = object;
        }
        object.scene.tweens.add(conf);
    };
    Hex.hexToScreenPos = function (center, rad, hPos) {
        var pos = { x: center.x, y: center.y };
        pos.x += (hPos.x * Math.cos(deg30) - hPos.y * Math.cos(deg30)) * rad;
        pos.y += (hPos.x * Math.cos(deg60) + hPos.y * Math.cos(deg60) - hPos.z) * rad;
        return pos;
    };
    return Hex;
}(Phaser.GameObjects.Polygon));
var Label = (function (_super) {
    __extends(Label, _super);
    function Label(scene, x, y, tex, origin, tint) {
        var _this = _super.call(this, scene, x, y, tex) || this;
        _this.state = 0;
        scene.add.existing(_this);
        if (tint !== undefined)
            _this.setTint(tint);
        if (origin !== undefined)
            _this.setOrigin(origin.x, origin.y);
        _this.setAlpha(0);
        return _this;
    }
    Label.prototype.showGrand = function (ms1, msHold, ms2, scaleMult) {
        var _this = this;
        var finalScale = this.scale;
        if (scaleMult === undefined)
            scaleMult = 1.5;
        var finalPos = { x: this.x, y: this.y };
        var centerPos = { x: this.scene.cameras.main.centerX, y: this.scene.cameras.main.centerY };
        this.setScale(finalScale * scaleMult).setX(centerPos.x + this.displayOriginX - this.displayWidth / 2)
            .setY(this.displayOriginY).setAlpha(0);
        this.scene.tweens.add({ targets: this, y: centerPos.y + this.displayOriginY - this.displayHeight / 2, alpha: 1, duration: ms1, ease: 'Sine' });
        delay(this.scene, ms1 + msHold, this, function () {
            _this.scene.tweens.add({
                targets: _this, x: finalPos.x, y: finalPos.y, scale: finalScale,
                duration: ms2, ease: 'Sine', onComplete: after, onCompleteScope: _this
            });
        });
        function after() {
            var self = this;
            self.setState(1);
        }
        return this;
    };
    Label.prototype.show = function (ms) {
        this.setY(this.y - this.displayHeight / 2);
        this.scene.tweens.add({
            targets: this,
            y: this.y + this.displayHeight / 2,
            alpha: 1,
            ease: 'Sine',
            duration: ms
        });
        this.setState(1);
        return this;
    };
    Label.prototype.hide = function (ms) {
        this.scene.tweens.add({
            targets: this,
            scale: this.scale + this.scale / 2,
            alpha: 0,
            ease: 'Sine',
            duration: ms
        });
        this.state = 0;
    };
    Label.prototype.focus = function (focus) {
        if (this.state == 0)
            return;
        var offset = 0;
        if (focus === undefined) {
            switch (this.state) {
                case 1:
                    offset = 0.1;
                    this.state = 2;
                    break;
                case 2:
                    offset = -0.1;
                    this.state = 1;
                    break;
                case 3:
                    offset = 0.2;
                    this.state = 2;
                    break;
            }
        }
        else {
            switch (this.state) {
                case 1:
                    offset = focus ? 0.1 : 0;
                    break;
                case 2:
                    offset = focus ? 0 : -0.1;
                    break;
                case 3:
                    offset = focus ? 0.2 : 0.1;
                    break;
            }
            this.state = focus ? 2 : 1;
        }
        this.scene.tweens.add({
            targets: this,
            scale: this.scale + offset,
            alpha: 1,
            duration: 300,
            ease: 'Sine'
        });
        return this;
    };
    Label.prototype.unfocus = function (unfocus) {
        if (this.state == 0)
            return;
        var offset = 0;
        if (unfocus === undefined) {
            switch (this.state) {
                case 1:
                    offset = -0.1;
                    this.state = 3;
                    break;
                case 2:
                    offset = -0.2;
                    this.state = 3;
                    break;
                case 3:
                    offset = 0.1;
                    this.state = 1;
                    break;
            }
        }
        else {
            switch (this.state) {
                case 1:
                    offset = unfocus ? -0.1 : 0;
                    break;
                case 2:
                    offset = unfocus ? -0.2 : -0.1;
                    break;
                case 2:
                    offset = unfocus ? 0 : 0.1;
                    break;
            }
            this.state = unfocus ? 3 : 1;
        }
        this.scene.tweens.add({
            targets: this,
            scale: this.scale + offset,
            alpha: this.state == 3 ? .5 : 1,
            duration: 300,
            ease: 'Sine'
        });
        return this;
    };
    return Label;
}(Phaser.GameObjects.Image));
var Button = (function (_super) {
    __extends(Button, _super);
    function Button(scene, x, y, texture) {
        var _this = _super.call(this, scene, x, y, texture) || this;
        _this.setInteractive({ useHandCursor: true });
        _this.on('pointerover', function () { return _this.setTint(0x44ff88); })
            .on('pointerout', function () { return _this.clearTint(); });
        return _this;
    }
    Button.prototype.setOnClickOnce = function (fn, context, args) {
        this.off('pointerup').once('pointerup', fn, context);
        return this;
    };
    return Button;
}(Label));
var Unit = (function (_super) {
    __extends(Unit, _super);
    function Unit(hex, uType, ms1, ms2, ms3) {
        var _this = _super.call(this, hex.board.scene, 0, 0, uType == UnitType.merc ? 'unit_merc' : uType == UnitType.guard ? 'unit_guard' : 'unit_king') || this;
        _this.uType = uType;
        _this.team = uType == UnitType.merc ? 1 : 0;
        _this.hex = hex;
        _this.hex.setUnit(_this);
        _this.setOrigin(.5).setPosition(hex.x, hex.y);
        _this.setTint(_this.team == 0 ? hex.board.theme.royalty : hex.board.theme.ambusher);
        _this.setInteractive({
            draggable: true,
            hitArea: new Phaser.Geom.Circle(_this.width / 2, _this.height / 2, _this.width / 2 * 0.9),
            hitAreaCallback: Phaser.Geom.Circle.Contains
        });
        if (ms1 === undefined)
            ms1 = 300, ms2 = 200, ms3 = 300;
        _this.showGrand(ms1, ms2, ms3, 2);
        return _this;
    }
    Unit.prototype.checkCapture = function () {
        var _this = this;
        var toCapture = [];
        if (this.uType == UnitType.king)
            return toCapture;
        this.hex.forEachNbr(function (nbr, dir) {
            if (!nbr.isEmpty() && nbr.getUnit().team != _this.team) {
                var buddies = [];
                var directions = [];
                var flanks = _this.hex.getNbrFlanks(dir);
                var score = 0;
                if (flanks.back != null && flanks.back.getTeam() == _this.team) {
                    if (!flanks.back.isEmpty()) {
                        buddies.push(flanks.back.getUnit());
                        directions.push((dir + 3) % 6);
                    }
                    score += 2;
                }
                else {
                    if (flanks.right != null && flanks.right.getTeam() == _this.team) {
                        if (!flanks.right.isEmpty()) {
                            buddies.push(flanks.right.getUnit());
                            directions.push((dir + 4) % 6);
                        }
                        score += 1;
                    }
                    if (flanks.left != null && flanks.left.getTeam() == _this.team) {
                        if (!flanks.left.isEmpty()) {
                            buddies.push(flanks.left.getUnit());
                            directions.push((dir + 2) % 6);
                        }
                        score += 1;
                    }
                }
                if (score > 1 || flanks.nbr.hType == HexType.escape && score > 0) {
                    buddies.push(_this);
                    directions.push(dir);
                    toCapture.push({ enemy: flanks.nbr.getUnit(), buddies: buddies, directions: directions });
                }
            }
        });
        return toCapture;
    };
    Unit.prototype.showAttack = function (buddies, directions, callback) {
        var _this = this;
        this.scene.add.tween({
            targets: buddies, duration: 350, yoyo: true, onComplete: callback, onCompleteParams: this, ease: 'Sine',
            scale: this.scale * 1.2
        });
        buddies.forEach(function (unit, i) {
            var x = Math.cos((60 - 60 * directions[i]) * Math.PI / 180) * unit.hex.board.radius / 1.5;
            var y = Math.sin((60 - 60 * directions[i]) * Math.PI / 180) * unit.hex.board.radius / 1.5;
            if (DEBUG_MODE)
                console.log([vecStr(unit.hex.hPos), Dir[directions[i]]]);
            _this.scene.add.tween({
                targets: unit, duration: 350, yoyo: true, ease: 'Sine', x: unit.x + x, y: unit.y - y
            });
            unit.x;
        });
    };
    Unit.prototype.showDefeat = function (callback) {
        this.scene.add.tween({
            targets: this, duration: 350, yoyo: true, ease: 'Sine',
            scale: this.scale * 0.5
        });
        this.scene.add.tween({
            targets: this, duration: 700, ease: 'Sine', onComplete: callback, onCompleteParams: this,
            alpha: 0
        });
    };
    Unit.prototype.destroy = function () {
        this.hex.setUnit(null);
        _super.prototype.destroy.call(this);
    };
    Unit.prototype.getLegalTiles = function () {
        function getAllInDir(tile, dir) {
            var nbr = tile.getNbr(dir);
            if (nbr != null && nbr.isNeutral())
                return [nbr].concat(getAllInDir(nbr, dir));
            else
                return [];
        }
        var ret = [];
        for (var dir = 0; dir < 6; dir++) {
            ret = ret.concat(getAllInDir(this.hex, dir));
        }
        return ret;
    };
    Unit.prototype.moveTo = function (newHex, duration) {
        if (duration === undefined)
            duration = 500;
        if (!newHex.isEmpty())
            throw Error('Cannot move unit to already occupied hex!');
        this.hex.setUnit(null);
        this.hex = newHex.setUnit(this);
        this.scene.add.tween({ targets: this, duration: duration, ease: 'Sine', x: newHex.x, y: newHex.y });
        return this;
    };
    Unit.prototype.moveHome = function (duration) {
        if (duration === undefined)
            duration = 500;
        this.scene.add.tween({ targets: this, duration: duration, ease: 'Sine', x: this.hex.x, y: this.hex.y });
        return this;
    };
    return Unit;
}(Label));
function hexPoints(rad) {
    var n1 = (Math.sqrt(3) / 2) * rad;
    return [
        { x: 0, y: 1 * rad },
        { x: n1, y: 1 / 2 * rad },
        { x: n1, y: -1 / 2 * rad },
        { x: 0, y: -1 * rad },
        { x: -n1, y: -1 / 2 * rad },
        { x: -n1, y: 1 / 2 * rad }
    ];
}
var Demo = (function (_super) {
    __extends(Demo, _super);
    function Demo() {
        var _this = _super.call(this, 'demo') || this;
        _this.HexRad = 50;
        _this.boardSize = 3;
        _this.scoreAmbusher = 0;
        _this.scoreRoyalty = 0;
        _this.soundCounter = [0, 0, 0];
        return _this;
    }
    Demo.prototype.updateScore = function () {
        if (this.scoreRoyaltyText)
            this.scoreRoyaltyText.setText(this.scoreRoyalty.toLocaleString('en-US', { minimumIntegerDigits: 2 }));
        if (this.scoreAmbushText)
            this.scoreAmbushText.setText(this.scoreAmbusher.toLocaleString('en-US', { minimumIntegerDigits: 2 }));
    };
    Demo.prototype.playSoundAttack = function () {
        this.sound.play('attack' + this.soundCounter[0]++);
        this.soundCounter[0] %= 2;
    };
    Demo.prototype.playSoundDrum = function () {
        this.sound.play('drum' + this.soundCounter[1]++);
        this.soundCounter[1] %= 2;
    };
    Demo.prototype.playSoundMove = function () {
        this.sound.play('move' + this.soundCounter[2]++);
        this.soundCounter[2] %= 2;
    };
    Demo.prototype.preload = function () {
        this.load.image('title', 'assets/titlecard.png')
            .image('but_cont', 'assets/but_continue.png')
            .image('card_deploy', 'assets/phase_deploy.png')
            .image('card_battle', 'assets/phase_battle.png')
            .image('card_ambusher', 'assets/ambushercard.png')
            .image('card_royalty', 'assets/royaltycard.png')
            .image('unit_merc', 'assets/ambusher.png')
            .image('unit_guard', 'assets/guard.png')
            .image('unit_king', 'assets/king.png')
            .image('win_ambusher', 'assets/ambusherwins.png')
            .image('win_royalty', 'assets/royaltywins.png')
            .audio('bgm_main', 'assets/drum_loop.mp3')
            .audio('accent_royalty', 'assets/kagura1.mp3')
            .audio('accent_ambusher', 'assets/kagura2.mp3')
            .audio('accent_battle', 'assets/horagai.mp3')
            .audio('victory', 'assets/victory.mp3')
            .audio('attack0', 'assets/attack1.mp3').audio('attack1', 'assets/attack2.mp3')
            .audio('drum0', 'assets/drum1.wav').audio('drum1', 'assets/drum2.wav')
            .audio('positive', 'assets/positive.wav').audio('negative', 'assets/negative.wav')
            .audio('move0', 'assets/move1.wav').audio('move1', 'assets/move2.wav');
    };
    Demo.prototype.create = function () {
        this.input.setTopOnly(false);
        this.bgm = this.sound.add('bgm_main', { loop: true, volume: 0.7 });
        this.bgm.play();
        this.initTitlePhase();
    };
    Demo.prototype.update = function () {
    };
    Demo.prototype.initTitlePhase = function () {
        var _this = this;
        var titleCard = new Label(this, this.cameras.main.centerX, this.cameras.main.displayHeight / 3, 'title');
        var confButton = new Button(this, this.cameras.main.centerX, this.cameras.main.displayHeight * 2 / 3, 'but_cont').setScale(0.8);
        titleCard.show(800);
        delay(this, 800, this, function () { return confButton.show(800); });
        delay(this, 700, this, function () { return confButton.setOnClickOnce(onClickConfirm, _this); });
        var scene = this;
        function onClickConfirm() {
            var _this = this;
            titleCard.hide(300);
            confButton.hide(300);
            scene.sound.play('positive');
            delay(this, 400, this, function () { return _this.initDeployPhase(_this); });
        }
    };
    Demo.prototype.initDeployPhase = function (scene, board, royalCard, ambushCard) {
        var _this = this;
        var firstTime = board == null;
        board = firstTime ? new HexBoard(this, this.boardSize, this.HexRad) : board;
        var phaseCard = new Label(this, this.cameras.main.width - 10, 10, 'card_deploy', { x: 1, y: 0 }).setScale(0.9);
        royalCard = firstTime ? new Label(this, 10, 10, 'card_royalty', { x: 0, y: 0 }, board.theme.royalty).setScale(0.6) : royalCard;
        ambushCard = firstTime ? new Label(this, 10, this.cameras.main.height - 10, 'card_ambusher', { x: 0, y: 1 }, board.theme.ambusher).setScale(0.6) : ambushCard;
        var time = firstTime ? 1600 : 100;
        delay(this, time, this, function () { return phaseCard.showGrand(400, 400, 400); });
        if (firstTime) {
            delay(this, time += 1100, this, function () { return royalCard.showGrand(400, 400, 400); });
            delay(this, time += 1100, this, function () { return ambushCard.showGrand(400, 400, 400); });
            delay(this, time += 1200, this, function () {
                var style = {
                    fontFamily: 'DotGothic16', fontSize: '100px', stroke: '#76C', strokeThickness: 8
                };
                var royalScore = scene.scoreRoyaltyText = _this.add.text(royalCard.getBounds().left, royalCard.getBounds().bottom - 50, '00', style).setOrigin(0, 0).setAlpha(0).setScale(1.5);
                style.stroke = '#C66';
                var ambushScore = scene.scoreAmbushText = _this.add.text(ambushCard.getBounds().left, ambushCard.getBounds().top - 150, '00', style).setOrigin(0, 1).setAlpha(0).setScale(1.5);
                _this.add.tween({
                    targets: [royalScore, ambushScore], duration: 400, ease: 'Sine', alpha: 1, scale: 1, y: '+=100'
                });
            });
        }
        delay(this, time += firstTime ? 500 : 1100, this, function () { ambushCard.unfocus(true); royalCard.focus(true); });
        delay(this, time += 200, this, function () { return board.initKing(); });
        delay(this, time += 700, this, function () { ambushCard.focus(true); royalCard.unfocus(true); });
        delay(this, time += 200, this, function () { return board.initMercs(); });
        delay(this, time += 2800, this, function () { return royalTurn(0, board, scene); });
        function royalTurn(turn, board, scene) {
            var _this = this;
            ambushCard.unfocus(true);
            royalCard.focus(true);
            scene.sound.play('accent_royalty');
            var pending = turn == 0 ? 2 : 1;
            setBrightOpenTeamHex(0, board);
            var _loop_8 = function (key) {
                var hex = board.tiles[key];
                if (hex.state != 'bright')
                    return "continue";
                hex.on('pointerup', function () {
                    hex.setUnit(new Unit(hex, UnitType.guard));
                    scene.playSoundDrum();
                    pending--;
                    hex.setState('normal');
                    if (pending == 0) {
                        resetState(board);
                        delay(hex.scene, 500, _this, doFinally);
                    }
                }, this_4);
            };
            var this_4 = this;
            for (var key in board.tiles) {
                _loop_8(key);
            }
            function doFinally() {
                var _this = this;
                if (turn != 4)
                    ambushTurn(turn + 1, board, scene);
                else {
                    royalCard.focus(false);
                    ambushCard.focus(false);
                    delay(scene, 500, this, function () {
                        phaseCard.hide(1000);
                        delay(scene, 1200, _this, function () { phaseCard.destroy(); });
                        scene.initBattlePhase(scene, board, royalCard, ambushCard);
                    });
                }
            }
        }
        function ambushTurn(turn, board, scene) {
            var _this = this;
            ambushCard.focus(true);
            royalCard.unfocus(true);
            scene.sound.play('accent_ambusher');
            setBrightOpenTeamHex(1, board);
            var _loop_9 = function (key) {
                var hex = board.tiles[key];
                if (hex.state != 'bright')
                    return "continue";
                hex.on('pointerup', function () {
                    scene.playSoundDrum();
                    hex.setUnit(new Unit(hex, UnitType.merc));
                    resetState(board);
                    delay(hex.scene, 500, _this, doFinally);
                }, this_5);
            };
            var this_5 = this;
            for (var key in board.tiles) {
                _loop_9(key);
            }
            function doFinally() {
                royalTurn(turn + 1, board, scene);
            }
        }
        function setBrightOpenTeamHex(team, board) {
            var toRet = [];
            board.forEachTile(function (hex) {
                if (!hex.isEmpty() && hex.getUnit().team == team) {
                    var nbrs = hex.getNbrs();
                    for (var i = 0; i < 6; i++) {
                        var nbr = nbrs[i];
                        if (nbr != null && nbr.isEmpty()) {
                            nbr.setState('bright');
                            toRet.push(nbr);
                        }
                    }
                }
                else if (hex.isEmpty() && hex.state == 'normal')
                    hex.setState('dim');
            });
            return toRet;
        }
        function resetState(board) {
            for (var key in board.tiles) {
                var hex = board.tiles[key];
                hex.setState('normal');
            }
        }
    };
    Demo.prototype.initBattlePhase = function (scene, board, royalCard, ambushCard) {
        var phaseCard = new Label(this, this.cameras.main.width - 10, 10, 'card_battle', { x: 1, y: 0 }, 0xffdd99).setScale(0.9);
        phaseCard.showGrand(400, 400, 400);
        scene.sound.play('accent_battle');
        delay(scene, 1500, this, function () {
            startTurn(board, Math.random() > 0.5 ? 0 : 1);
        });
        function startTurn(board, team) {
            var _this = this;
            if (team == 0) {
                royalCard.focus(true);
                ambushCard.unfocus(true);
                scene.sound.play('accent_royalty');
            }
            else {
                ambushCard.focus(true);
                royalCard.unfocus(true);
                scene.sound.play('accent_ambusher');
            }
            var friendly = board.getUnits(function (u) { return u.team == team; });
            var enemy = board.getUnits(function (u) { return u.team != team; });
            scene.input.setDraggable(enemy, false);
            scene.input.setDraggable(friendly);
            scene.input.on('dragstart', function (pnt, obj) {
                var legal = obj.getLegalTiles();
                legal.forEach(function (tile) { return tile.setState("bright"); });
                board.forEachTile(function (tile) { if (tile.isNeutral() && tile.state != 'bright')
                    tile.setState("dim"); });
                obj.setAlpha(0.5).setDepth(3);
            });
            scene.input.on('drag', function (pnt, obj, dragX, dragY) {
                obj.setPosition(dragX, dragY);
            });
            var dest = null;
            scene.input.on('dragenter', function (p, o, target) { return dest = target; }).on('dragleave', function (p, o, target) { return dest = null; });
            scene.input.on('dragend', function (pnt, obj) {
                obj.setAlpha(1).setDepth(1);
                board.forEachTile(function (hex) { return hex.setState('normal'); });
                if (dest == null) {
                    obj.moveHome(500);
                    scene.sound.play('negative');
                }
                else {
                    var winFlag = null;
                    obj.moveTo(dest, 300);
                    scene.playSoundMove();
                    var tOffset = 400;
                    if (obj.uType == UnitType.king && dest.hType == HexType.escape)
                        winFlag = 'royalty';
                    var captures_1 = obj.checkCapture();
                    var _loop_10 = function (i) {
                        delay(scene, tOffset, _this, function () {
                            obj.showAttack(captures_1[i].buddies, captures_1[i].directions);
                            captures_1[i].enemy.showDefeat(function (tween, targets, u) { return u.destroy(); });
                            scene.playSoundAttack();
                        });
                        tOffset += 800;
                        if (captures_1[i].enemy.uType == UnitType.king)
                            winFlag = "ambusher";
                        if (i == captures_1.length - 1)
                            tOffset += 300;
                    };
                    for (var i = 0; i < captures_1.length && winFlag == null; i++) {
                        _loop_10(i);
                    }
                    scene.input.off('dragstart').off('drag').off('dragenter').off('dragleave').off('dragend');
                    if (winFlag == null)
                        delay(scene, tOffset, _this, function () { return startTurn(board, team == 0 ? 1 : 0); });
                    else {
                        if (DEBUG_MODE)
                            console.log([vecStr(dest.hPos), winFlag]);
                        var imageTag_1 = null;
                        if (winFlag == 'ambusher') {
                            scene.scoreAmbusher++;
                            imageTag_1 = 'win_ambusher';
                        }
                        else {
                            scene.scoreRoyalty++;
                            imageTag_1 = 'win_royalty';
                        }
                        delay(scene, tOffset, _this, function () {
                            var winCard = scene.add.existing(new Label(scene, scene.cameras.main.centerX, scene.cameras.main.centerY, imageTag_1))
                                .setOrigin(0.5).show(500).setDepth(5);
                            delay(scene, 500, _this, function () {
                                winCard.setInteractive().on('pointerover', function () { this.focus(true); })
                                    .on('pointerout', function () { this.focus(false); })
                                    .once('pointerup', function () {
                                    scene.updateScore();
                                    scene.sound.play('positive');
                                    winCard.off('pointerover').off('pointerout').hide(300);
                                    var units = board.getUnits();
                                    units.forEach(function (unit) { return unit.hide(300); });
                                    phaseCard.hide(300);
                                    delay(scene, 400, _this, function () {
                                        winCard.destroy;
                                        units.forEach(function (unit) { return unit.destroy(); });
                                        phaseCard.destroy();
                                        scene.initDeployPhase(scene, board, royalCard, ambushCard);
                                    });
                                });
                            });
                            scene.sound.play('victory');
                        });
                    }
                }
            });
        }
    };
    return Demo;
}(Phaser.Scene));
var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    scene: Demo
};
var game = new Phaser.Game(config);
//# sourceMappingURL=main.js.map