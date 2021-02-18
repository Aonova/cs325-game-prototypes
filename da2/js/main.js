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
            ambusher: 0xbb5555,
            royalty: 0x5555bb
        };
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
        this.tiles = new Array(numTiles);
        this.initTiles();
    }
    HexBoard.prototype.initTiles = function () {
        for (var x = -this.size; x <= this.size; x++) {
            for (var y = -this.size; y <= this.size; y++) {
                for (var z = -this.size; z <= this.size; z++) {
                    if (x + y + z == 0) {
                        var type = HexType.normal;
                        if (x * y * z == 0 && (Math.abs(x) + Math.abs(y) + Math.abs(z)) == 2 * this.size)
                            type = HexType.escape;
                        else if (x == 0 && y == 0 && z == 0)
                            type = HexType.start;
                        this.tiles[x + "," + y + "," + z] = new Hex(this, { x: x, y: y, z: z }, type);
                    }
                }
            }
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
})(HexState || (HexState = {}));
var Hex = (function (_super) {
    __extends(Hex, _super);
    function Hex(board, pos, type) {
        var _this = _super.call(this, board.scene, Hex.hexToScreenPos(board.center, board.radius, pos).x, Hex.hexToScreenPos(board.center, board.radius, pos).y, hexPoints(board.radius)) || this;
        _this.hType = HexType.normal;
        _this.hState = HexState.normal;
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
        _this.setHexState(HexState.normal);
        return _this;
    }
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
        switch (state) {
            case HexState.normal:
                Hex.popTween(self, 0.9, 0.5);
                this.off('pointerover').off('pointerout')
                    .on('pointerout', function () { Hex.popTween(self, 0.9, 0.5); })
                    .on('pointerover', function () { Hex.popTween(self, 0.95, 0.8); });
                break;
            case HexState.dim:
                Hex.popTween(self, 0.5, 0.7);
                this.off('pointerover').off('pointerout');
            default:
                break;
        }
        this.state = state;
        return this;
    };
    Hex.popTween = function (object, scale, alpha) {
        object.scene.tweens.add({ targets: object,
            fillAlpha: alpha,
            scale: scale,
            duration: 300,
            ease: 'sine'
        });
    };
    Hex.hexToScreenPos = function (center, rad, hPos) {
        var pos = { x: center.x, y: center.y };
        pos.x += (hPos.x * Math.cos(deg30) - hPos.y * Math.cos(deg30)) * rad;
        pos.y += (hPos.x * Math.cos(deg60) + hPos.y * Math.cos(deg60) - hPos.z) * rad;
        return pos;
    };
    return Hex;
}(Phaser.GameObjects.Polygon));
var Unit = (function () {
    function Unit() {
    }
    return Unit;
}());
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
        _this.rad = 43;
        _this.size = 3;
        _this.center = { x: 400, y: 300 };
        return _this;
    }
    Demo.prototype.preload = function () {
    };
    Demo.prototype.create = function () {
        this.mainBoard = new HexBoard(this, this.size, this.rad);
    };
    Demo.prototype.update = function () {
    };
    return Demo;
}(Phaser.Scene));
var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    scene: Demo
};
var game = new Phaser.Game(config);
//# sourceMappingURL=main.js.map