export var Asset;
(function (Asset) {
    Asset["mechBlue"] = "mech";
    Asset["mechRed"] = "mech-red";
    Asset["bgLower"] = "bg-1";
    Asset["bgBack"] = "bg-2";
    Asset["thrustDown"] = "thrust-down";
    Asset["thrustLeft"] = "thrust-left";
    Asset["thrustRight"] = "thrust-right";
    Asset["thrustUp"] = "thrust-up";
    Asset["plasma"] = "particle";
    Asset["soundGameOver"] = "gameOver";
    Asset["soundHit"] = "hit";
    Asset["soundClick"] = "click";
    Asset["soundThrustStart"] = "thrustStart";
    Asset["soundThrust"] = "thrust";
    Asset["soundBGM"] = "bgm";
})(Asset || (Asset = {}));
export var DEBUG = false;
var Theme = (function () {
    function Theme() {
    }
    Theme.fontHUD = { stroke: '#135', strokeThickness: 2, fontSize: '16px', fontFamily: 'monospace' };
    Theme.fontInfo = { stroke: '#135', strokeThickness: 2, fontSize: '24px', fontFamily: 'Arcade' };
    Theme.fontFocus = { stroke: '#135', strokeThickness: 2, fontSize: '42px', fontFamily: 'Arcade', align: 'center' };
    Theme.gravColor = 0x004010;
    Theme.plasmaColor = 0xe0ffe8;
    return Theme;
}());
export { Theme };
var Settings = (function () {
    function Settings() {
    }
    Settings.gravDelay = { min: 5, max: 20 };
    Settings.pVelMult = 10;
    Settings.pVelVar = 5;
    return Settings;
}());
export { Settings };
export var Event;
(function (Event) {
    Event["gravShift"] = "gravShift";
    Event["gameOver"] = "gameOver";
    Event["plasmaSpawn"] = "plasmaSpawn";
    Event["playerHit"] = "playerHit";
})(Event || (Event = {}));
var Com = (function () {
    function Com() {
    }
    Com.showTextAnim = function (obj, text, total, append) {
        var len = text.length;
        var delay = 40;
        if (total != undefined)
            delay = total / len;
        var i = 0;
        if (!append)
            obj.setText('');
        obj.scene.time.addEvent({
            repeat: len - 1, delay: delay,
            callback: function () {
                obj.text += text[i++];
                if (i % 5 == 0)
                    obj.scene.sound.play(Asset.soundClick, { volume: .5 });
            }
        });
    };
    Com.randRange = function (min, max) {
        return (Math.random() * (max - min)) + min;
    };
    Com.tweenFillStyle = function (targets, fromColor, toColor, duration) {
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
    return Com;
}());
export { Com };
//# sourceMappingURL=common.js.map