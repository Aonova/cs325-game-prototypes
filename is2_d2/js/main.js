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
import { Theme, Helper, DEBUG, Event, Asset, SETTINGS } from './common.js';
import { Tile } from './tile.js';
import { Player } from './player.js';
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super.call(this, 'MainScene') || this;
        _this.testText = null;
        _this.tickBars = [];
        _this.players = [];
        _this.board = [];
        return _this;
    }
    Main.prototype.preload = function () {
        this.load.image(Asset.buildUp, 'res/buildUp.png');
        this.load.image(Asset.buildDown, 'res/buildDown.png');
        this.load.image(Asset.forceArrow, 'res/force.png');
    };
    Main.prototype.create = function () {
        addBorder(this, 2);
        var scene = this;
        var cam = this.cameras.main;
        this.bindKeys();
        var KC = Phaser.Input.Keyboard.KeyCodes;
        this.input.keyboard.addCapture([KC.W, KC.A, KC.S, KC.D, KC.CTRL, KC.SHIFT]);
        this.initBoard(SETTINGS.boardWidth, SETTINGS.boardHeight, 60);
        this.players[0] = new Player(this, 0, 50, this.board[1][1], this.playerInput);
        this.players[1] = new Player(this, 1, 50, this.board[SETTINGS.boardWidth - 2][SETTINGS.boardHeight - 2]);
        this.tickBars[0] = this.add.rectangle(20, cam.height - 20, 40, 40, Theme.colorBG, 1).setOrigin(0, 1);
        this.tickBars[1] = this.add.rectangle(cam.width - 20, 20, 40, 40, Theme.colorBG, 1).setOrigin(1, 0);
        var debugText = null;
        if (DEBUG)
            debugText = this.add.text(cam.centerX, 20, "debug", Theme.fontDebug).setOrigin(0);
        var tickBars = this.tickBars;
        var tickSpeed = 1000;
        this.tickCounter = this.tweens.addCounter({
            from: 0, to: 260, duration: tickSpeed, yoyo: true, ease: 'Circ.easeInOut', loop: -1,
            onUpdate: function (tw) {
                tickBars.forEach(function (bar) { bar.setDisplaySize(bar.width, tw.getValue() + 40); });
            },
            onYoyo: function () {
                scene.time.delayedCall(tickSpeed / 2, function () { scene.events.emit(Event.tick); });
                tickBars.forEach(function (bar) {
                    var bounds = bar.getBounds();
                    var newY = bar.originY ? bounds.top : bounds.bottom;
                    bar.setOrigin(bar.originX, bar.originY ? 0 : 1);
                    bar.setPosition(bar.x, newY);
                });
            },
            onLoop: function () {
                scene.time.delayedCall(tickSpeed / 2, function () { scene.events.emit(Event.tick); });
            }
        });
        this.events.on(Event.tick, function () {
            scene.tweens.addCounter(Helper.tweenFillStyle(tickBars, Theme.colorHL, Theme.colorTick, 500));
            scene.events.emit(Event.phaseAction);
            scene.events.emit(Event.phaseForce);
            scene.events.emit(Event.phaseMove);
            scene.events.emit(Event.phaseBuild);
        });
        var bombs = [];
        this.events.once(Event.tick, function () {
            spawnBomb(0);
            spawnBomb(1);
        });
        this.events.on(Event.bombTaken, function (id, pos) {
            if (bombs[id]) {
                scene.add.tween({
                    targets: bombs[id], scale: 2.5, alpha: 0, duration: 500, ease: 'Sine',
                    onComplete: function () { bombs[id] = null; }
                });
                scene.board[pos.x][pos.y].bomb = null;
            }
        });
        this.events.on(Event.bombSpawn, function (id) {
            scene.events.once(Event.tick, function () {
                spawnBomb(id);
            });
        });
        function spawnBomb(id) {
            var tile = null;
            var width = SETTINGS.boardWidth;
            var height = SETTINGS.boardHeight;
            do {
                var x = Math.floor(Math.random() * width / 2) + Math.floor(width / 4);
                var y = Math.floor(Math.random() * height / 2) + Math.floor(height / 4);
                tile = scene.board[x][y];
                if (tile.type == -1 || tile.players.length > 0 || tile.bomb != null)
                    tile = null;
            } while (tile == null);
            tile.bomb = id;
            bombs[id] = scene.add.ellipse(tile.sPos.x, tile.sPos.y, 30, 30, Theme.playerColor[id] + 0x202020, 1)
                .setOrigin(.5).setAlpha(0).setScale(2.5).setDepth(2);
            scene.add.tween({ targets: bombs[id], scale: 1, alpha: .6, duration: 500, ease: 'Sine' });
        }
        this.events.on(Event.gameOver, function (id) {
            scene.tickCounter.stop();
            scene.time.clearPendingEvents();
            var winMsg = id == 0 ? 'LOSES by being knocked out!' : 'WINS by knocking out all opponents!';
            scene.add.text(cam.centerX, cam.centerY, 'Player 0 ' + winMsg, Theme.fontStandard)
                .setOrigin(.5).setScale(1.5).setDepth(6);
            scene.input.keyboard.destroy();
            scene.input.keyboard.once('keydown', function () { scene.scene.start('TitleScreen'); });
        });
    };
    Main.prototype.update = function (time, delta) {
    };
    Main.prototype.initBoard = function (bWidth, bHeight, tileSize) {
        var bDim = { w: bWidth, h: bHeight };
        var cPos = { x: this.cameras.main.centerX, y: this.cameras.main.centerY };
        for (var i = 0; i < bDim.w; i++) {
            this.board[i] = [];
            for (var j = 0; j < bDim.h; j++) {
                this.board[i][j] = new Tile(this, { w: tileSize, h: tileSize }, { x: i, y: j }, cPos, bDim, this.board);
                if (i == 0 || i == bDim.w - 1 || j == 0 || j == bDim.h - 1)
                    this.board[i][j].setType(1);
            }
        }
    };
    Main.prototype.bindKeys = function () {
        var KC = Phaser.Input.Keyboard.KeyCodes;
        var binding = { 'up': KC.W, 'down': KC.S, 'left': KC.A, 'right': KC.D, 'out': KC.R, 'in': KC.F };
        this.playerInput = this.input.keyboard.addKeys(binding);
    };
    return Main;
}(Phaser.Scene));
function addBorder(scene, scale) {
    var cam = scene.cameras.main;
    var s = scale;
    scene.add.rectangle(10 * s, 10 * s, 50 * s, 50 * s, Theme.colorBG, 1).setOrigin(0);
    scene.add.rectangle(70 * s, 0, 160 * s, 30 * s, Theme.colorBG, 1).setOrigin(0);
    scene.add.rectangle(0, 70 * s, 30 * s, 90 * s, Theme.colorBG, 1).setOrigin(0);
    scene.add.rectangle(10 * s, 170 * s, 20 * s, 20 * s, Theme.colorBG).setOrigin(0);
    scene.add.rectangle(cam.width - 10 * s, cam.height - 10 * s, 50 * s, 50 * s, Theme.colorBG, 1).setOrigin(1);
    scene.add.rectangle(cam.width, cam.height - 70 * s, 30 * s, 90 * s, Theme.colorBG, 1).setOrigin(1);
    scene.add.rectangle(cam.width - 70 * s, cam.height, 160 * s, 30 * s, Theme.colorBG, 1).setOrigin(1);
    scene.add.rectangle(cam.width - 10 * s, cam.height - 170 * s, 20 * s, 20 * s, Theme.colorBG).setOrigin(1);
}
var Title = (function (_super) {
    __extends(Title, _super);
    function Title() {
        return _super.call(this, 'TitleScene') || this;
    }
    Title.prototype.preload = function () { };
    Title.prototype.create = function () {
        var cam = this.cameras.main;
        addBorder(this, 3.1);
        this.add.text(240, 55, "Force Out! (proto-1)", Theme.fontStandard).setColor('#' + Theme.colorHL.toString(16))
            .setStyle({ fontSize: 'xxx-large' }).setOrigin(0, .5);
        this.add.text(cam.centerX, cam.centerY + 100, "Press any key to continue", Theme.fontStandard).setOrigin(.5);
        var me = this;
        this.input.keyboard.once('keydown', function () { me.scene.start('MainScene'); });
    };
    return Title;
}(Phaser.Scene));
var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    scene: [Title, Main]
};
var game = new Phaser.Game(config);
//# sourceMappingURL=main.js.map