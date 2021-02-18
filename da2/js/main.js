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
                        delay(this_1.scene, ms / numTiles * tileNum++, this_1, function () { return _this.tiles[x + "," + y + "," + z].setHexState(HexState.normal); });
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
    };
    HexBoard.prototype.initKing = function () {
        this.startTile.unit = new Unit(this.startTile, UnitType.king);
    };
    HexBoard.prototype.initMercs = function () {
        var _this = this;
        var inter = 600;
        var _loop_4 = function (i) {
            delay(this_2.scene, inter * i, this_2, function () {
                _this.escapeTile[i].unit = new Unit(_this.escapeTile[i], UnitType.merc);
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
    return HexBoard;
}());
function cloneVec(vec) {
    var ret = { x: vec.x, y: vec.y, z: vec.z };
    return ret;
}
var HexState;
(function (HexState) {
    HexState[HexState["normal"] = 0] = "normal";
    HexState[HexState["bright"] = 1] = "bright";
    HexState[HexState["dim"] = 2] = "dim";
    HexState[HexState["hidden"] = 3] = "hidden";
})(HexState || (HexState = {}));
function delay(scene, ms, scope, callback) {
    scene.time.delayedCall(ms, callback, [], scope);
}
var Hex = (function (_super) {
    __extends(Hex, _super);
    function Hex(board, pos, type) {
        var _this = _super.call(this, board.scene, Hex.hexToScreenPos(board.center, board.radius, pos).x, Hex.hexToScreenPos(board.center, board.radius, pos).y, hexPoints(board.radius)) || this;
        _this.hType = HexType.normal;
        _this.hState = HexState.normal;
        _this.unit = null;
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
        _this.setHexState(HexState.hidden);
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
    Hex.prototype.setHexState = function (state) {
        var brd = this.board;
        var self = this;
        self.off('pointerover').off('pointerout').off('pointerdown').off('pointerup');
        switch (state) {
            case HexState.normal:
                Hex.popTween(self, 0.9, 0.5, 500);
                self
                    .on('pointerout', function () { Hex.popTween(self, 0.9, 0.5); })
                    .on('pointerover', function () { Hex.popTween(self, 0.95, 0.8); });
                break;
            case HexState.dim:
                Hex.popTween(self, 0.5, 0.7, 500);
                break;
            case HexState.hidden:
                Hex.popTween(self, 0, 0, 500);
                break;
            case HexState.bright:
                Hex.popTween(self, 0.98, 0.7, 500);
                self
                    .on('pointerout', function () { Hex.popTween(self, 0.98, 0.7); })
                    .on('pointerover', function () { Hex.popTween(self, 0.8, 0.95); });
                break;
            default:
                break;
        }
        this.state = state;
        return this;
    };
    Hex.prototype.remove = function () {
        var _this = this;
        this.removeInteractive();
        Hex.popTween(this, 0, 0, 500, function () { return _this.destroy(); });
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
    function Unit(hex, uType) {
        var _this = _super.call(this, hex.board.scene, 0, 0, uType == UnitType.merc ? 'unit_merc' : uType == UnitType.guard ? 'unit_guard' : 'unit_king') || this;
        _this.uType = uType;
        _this.team = uType == UnitType.merc ? 1 : 0;
        _this.hex = hex;
        _this.setOrigin(.5).setPosition(hex.x, hex.y);
        _this.setTint(_this.team == 0 ? hex.board.theme.royalty : hex.board.theme.ambusher);
        _this.showGrand(300, 200, 300, 2);
        return _this;
    }
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
        _this.HexRad = 43;
        _this.boardSize = 3;
        _this.gamePhase = 0;
        _this.scoreAmbusher = 0;
        _this.scoreRoyalty = 0;
        return _this;
    }
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
            .image('win_royalty', 'assets/royaltywins.png');
    };
    Demo.prototype.create = function () {
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
        function onClickConfirm() {
            var _this = this;
            titleCard.hide(300);
            confButton.hide(300);
            delay(this, 400, this, function () { return _this.initDeployPhase(); });
        }
    };
    Demo.prototype.initDeployPhase = function () {
        var _this = this;
        this.mainBoard = new HexBoard(this, this.boardSize, this.HexRad);
        var phaseCard = new Label(this, this.cameras.main.width - 10, 10, 'card_deploy', { x: 1, y: 0 }).setScale(0.9);
        var royalCard = new Label(this, 10, 10, 'card_royalty', { x: 0, y: 0 }, this.mainBoard.theme.royalty).setScale(0.6);
        var ambushCard = new Label(this, 10, this.cameras.main.height - 10, 'card_ambusher', { x: 0, y: 1 }, this.mainBoard.theme.ambusher).setScale(0.6);
        var time = 1400;
        delay(this, time, this, function () { return phaseCard.showGrand(400, 500, 500); });
        delay(this, time += 1300, this, function () { return royalCard.showGrand(400, 500, 400); });
        delay(this, time += 1300, this, function () { return ambushCard.showGrand(400, 500, 400); });
        delay(this, time += 1300 + 500, this, function () { ambushCard.unfocus(true); royalCard.focus(true); });
        delay(this, time += 200, this, function () { return _this.mainBoard.initKing(); });
        delay(this, time += 700, this, function () { ambushCard.focus(true); royalCard.unfocus(true); });
        delay(this, time += 200, this, function () { return _this.mainBoard.initMercs(); });
        delay(this, time += 4200, this, function () { return royalTurn(0, _this.mainBoard); });
        function royalTurn(turn, board) {
            var _this = this;
            ambushCard.unfocus(true);
            royalCard.focus(true);
            var pending = turn == 0 ? 2 : 1;
            setBrightOpenTeamHex(0, board);
            var _loop_8 = function (key) {
                var hex = board.tiles[key];
                if (hex.state != HexState.bright)
                    return "continue";
                hex.on('pointerup', function () {
                    hex.unit = new Unit(hex, UnitType.guard);
                    pending--;
                    hex.setHexState(HexState.normal);
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
                if (turn != 4)
                    ambushTurn(turn + 1, board);
                else
                    console.log('STUB: should be going to battle phase!');
            }
        }
        function ambushTurn(turn, board) {
            var _this = this;
            ambushCard.focus(true);
            royalCard.unfocus(true);
            setBrightOpenTeamHex(1, board);
            var _loop_9 = function (key) {
                var hex = board.tiles[key];
                if (hex.state != HexState.bright)
                    return "continue";
                hex.on('pointerup', function () {
                    hex.unit = new Unit(hex, UnitType.merc);
                    resetState(board);
                    delay(hex.scene, 500, _this, doFinally);
                }, this_5);
            };
            var this_5 = this;
            for (var key in board.tiles) {
                _loop_9(key);
            }
            function doFinally() {
                royalTurn(turn + 1, board);
            }
        }
        function setBrightOpenTeamHex(team, board) {
            for (var key in board.tiles) {
                var hex = board.tiles[key];
                if (hex.unit != null && hex.unit.team == team) {
                    hex.getNbrs().forEach(function (nbr) {
                        if (nbr != null && nbr.isEmpty)
                            nbr.setHexState(HexState.bright);
                    });
                }
                else if (hex.isEmpty)
                    hex.setHexState(HexState.dim);
            }
        }
        function resetState(board) {
            for (var key in board.tiles) {
                var hex = board.tiles[key];
                hex.setHexState(HexState.normal);
            }
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