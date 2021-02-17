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
var HexDir;
(function (HexDir) {
    HexDir[HexDir["NE"] = 0] = "NE";
    HexDir[HexDir["E"] = 1] = "E";
    HexDir[HexDir["SE"] = 2] = "SE";
    HexDir[HexDir["SW"] = 3] = "SW";
    HexDir[HexDir["W"] = 4] = "W";
    HexDir[HexDir["NW"] = 5] = "NW";
})(HexDir || (HexDir = {}));
var TileType;
(function (TileType) {
    TileType[TileType["start"] = 0] = "start";
    TileType[TileType["escape"] = 1] = "escape";
    TileType[TileType["normal"] = 2] = "normal";
})(TileType || (TileType = {}));
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
            normal: { rgb: 0x444444, a: 0.5 },
            cold: { rgb: 0x444466, a: 0.7 },
            warm: { rgb: 0x664444, a: 0.7 },
            hot: { rgb: 0x773344, a: 0.8 }
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
                    if (x + y + z == 0)
                        this.tiles[x + "," + y + "," + z] = new Hex(this, { x: x, y: y, z: z });
                }
            }
        }
    };
    return HexBoard;
}());
var HexState;
(function (HexState) {
    HexState[HexState["normal"] = 0] = "normal";
})(HexState || (HexState = {}));
var Hex = (function () {
    function Hex(board, pos) {
        this.state = HexState.normal;
        var brd = this.board = board;
        this.pos = pos;
        var sPos = Hex.hexToScreenPos(brd.center, brd.radius, this.pos);
        this.object = brd.scene.add.polygon(sPos.x, sPos.y, hexPoints(brd.radius))
            .setOrigin(0, 0).setVisible(true).setFillStyle(0x556655, 0.5).setScale(0.3, 0.9);
        this.object.setInteractive(this.object.geom, Phaser.Geom.Polygon.Contains);
        this.setState(HexState.normal);
    }
    Hex.hexToScreenPos = function (center, rad, hPos) {
        var pos = { x: center.x, y: center.y };
        pos.x += (hPos.x * Math.cos(deg30) - hPos.y * Math.cos(deg30)) * rad;
        pos.y += (hPos.x * Math.cos(deg60) + hPos.y * Math.cos(deg60) - hPos.z) * rad;
        return pos;
    };
    Hex.prototype.setState = function (state) {
        var brd = this.board;
        var self = this;
        switch (state) {
            case HexState.normal:
                this.object.setActive(true).setVisible(true).off('pointerover').off('pointerout')
                    .on('pointerout', function () { Hex.popTween(self.object, 0.9, 0.5); })
                    .on('pointerover', function () { Hex.popTween(self.object, 0.95, 0.8); });
                break;
            default:
                break;
        }
        this.state = state;
    };
    Hex.popTween = function (object, scale, alpha) {
        object.scene.tweens.add({ targets: object,
            fillAlpha: alpha,
            scale: scale,
            duration: 300,
            ease: 'sine'
        });
    };
    return Hex;
}());
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