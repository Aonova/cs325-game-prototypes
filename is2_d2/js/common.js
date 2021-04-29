export var Asset;
(function (Asset) {
    Asset["buildUp"] = "buildUp";
    Asset["buildDown"] = "buildDown";
    Asset["forceArrow"] = "force";
})(Asset || (Asset = {}));
var Theme = (function () {
    function Theme() {
    }
    Theme.fontStandard = { color: "#fff", fontFamily: "Arcade", fontSize: "xx-large" };
    Theme.fontDebug = { color: "#fff", fontFamily: "monospace", fontSize: "small" };
    Theme.colorBG = 0x161616;
    Theme.colorHL = 0xdaa520;
    Theme.colorTick = 0x367546;
    Theme.wallColor = 0x36a636;
    Theme.actionColor = {
        done: 0x85CB33,
        start: 0xA5CBC3
    };
    Theme.playerColor = {
        0: 0x4535a6,
        1: 0xa63545
    };
    return Theme;
}());
export { Theme };
export var Event;
(function (Event) {
    Event["tick"] = "tick";
    Event["phaseAction"] = "action";
    Event["phaseForce"] = "force";
    Event["phaseMove"] = "move";
    Event["phaseBuild"] = "build";
    Event["bombTaken"] = "btaken";
    Event["bombSpawn"] = "brspawn";
    Event["gameOver"] = "gameover";
})(Event || (Event = {}));
export var Dir;
(function (Dir) {
    Dir[Dir["N"] = 0] = "N";
    Dir[Dir["NE"] = 1] = "NE";
    Dir[Dir["E"] = 2] = "E";
    Dir[Dir["SE"] = 3] = "SE";
    Dir[Dir["S"] = 4] = "S";
    Dir[Dir["SW"] = 5] = "SW";
    Dir[Dir["W"] = 6] = "W";
    Dir[Dir["NW"] = 7] = "NW";
})(Dir || (Dir = {}));
export var SETTINGS = {
    boardWidth: 10,
    boardHeight: 8,
    tileSize: 60,
    playerSize: 50,
    tickSpeed: 1000
};
var Helper = (function () {
    function Helper() {
    }
    Helper.tweenFillStyle = function (targets, fromColor, toColor, duration) {
        return {
            from: 0, to: 100, duration: duration, ease: 'Sine',
            onUpdate: function (tw) {
                var colObj = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(fromColor), Phaser.Display.Color.ValueToColor(toColor), 100, tw.getValue());
                targets.forEach(function (obj) {
                    if (obj.setFillStyle)
                        obj.setFillStyle(Phaser.Display.Color.GetColor(colObj.r, colObj.g, colObj.b));
                    else if (obj.setTint)
                        obj.setTint(Phaser.Display.Color.GetColor(colObj.r, colObj.g, colObj.b));
                });
            }
        };
    };
    Helper.showMote = function (scene, tag, x, y, scale, duration, tint) {
        var mote = scene.add.image(x, y, tag).setOrigin(.5).setScale(scale).setAlpha(0).setTint(tint);
        scene.add.tween({
            targets: mote, alpha: 1, yoyo: true, ease: 'Sine', duration: (duration / 2)
        });
        scene.add.tween({
            targets: mote, y: mote.y + mote.displayHeight, ease: 'Sine', duration: duration,
            onComplete: function () { mote.destroy(); }
        });
    };
    Helper.xyToDir = function (xy) {
        var dir = null;
        if (xy.y == 1 && xy.x == 0)
            dir = 0;
        else if (xy.y == 1 && xy.x == 1)
            dir = 1;
        else if (xy.y == 0 && xy.x == 1)
            dir = 2;
        else if (xy.y == -1 && xy.x == 1)
            dir = 3;
        else if (xy.y == -1 && xy.x == 0)
            dir = 4;
        else if (xy.y == -1 && xy.x == -1)
            dir = 5;
        else if (xy.y == 0 && xy.x == -1)
            dir = 6;
        else if (xy.y == 1 && xy.x == -1)
            dir = 7;
        return dir;
    };
    Helper.dirToXY = function (dir) {
        if (dir == Dir.N)
            return { x: 0, y: 1 };
        else if (dir == Dir.NE)
            return { x: 1, y: 1 };
        else if (dir == Dir.E)
            return { x: 1, y: 0 };
        else if (dir == Dir.SE)
            return { x: 1, y: -1 };
        else if (dir == Dir.S)
            return { x: 0, y: -1 };
        else if (dir == Dir.SW)
            return { x: -1, y: -1 };
        else if (dir == Dir.W)
            return { x: -1, y: 0 };
        else if (dir == Dir.NW)
            return { x: -1, y: 1 };
    };
    Helper.dirToStr = function (dir) {
        if (dir > 7 || dir < 0)
            return null;
        var key = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return key[dir];
    };
    return Helper;
}());
export { Helper };
export var DEBUG = true;
//# sourceMappingURL=common.js.map