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
                        var type = TileType.normal;
                        if (x * y * z == 0 && (Math.abs(x) + Math.abs(y) + Math.abs(z)) == 2 * this.size)
                            type = TileType.escape;
                        else if (x == 0 && y == 0 && z == 0)
                            type = TileType.start;
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
var Hex = (function () {
    function Hex(board, pos, type) {
        this.type = TileType.normal;
        this.state = HexState.normal;
        var brd = this.board = board;
        this.pos = pos;
        this.type = type;
        var screenPos = Hex.hexToScreenPos(brd.center, brd.radius, this.pos);
        this.object = brd.scene.add.polygon(screenPos.x, screenPos.y, hexPoints(brd.radius))
            .setOrigin(0, 0).setVisible(true);
        switch (type) {
            case TileType.normal:
                this.object.setFillStyle(brd.theme.normal);
                break;
            case TileType.escape:
                this.object.setFillStyle(brd.theme.escape);
                break;
            case TileType.start:
                this.object.setFillStyle(brd.theme.start);
                break;
        }
        this.object.setInteractive(this.object.geom, Phaser.Geom.Polygon.Contains);
        this.setState(HexState.normal);
    }
    Hex.prototype.getNbr = function (dir) {
        var nbrPos = cloneVec(this.pos);
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
                Hex.popTween(self.object, 0.9, 0.5);
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