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
    Asset["soundGameOver"] = "gameOver";
    Asset["soundHit"] = "hit";
    Asset["soundClick"] = "click";
    Asset["soundThrustStart"] = "thrustStart";
    Asset["soundThrust"] = "thrust";
    Asset["soundBGM"] = "bgm";
})(Asset || (Asset = {}));
export var DEBUG = true;
var Theme = (function () {
    function Theme() {
    }
    Theme.fontHUD = { stroke: '#135', strokeThickness: 2, fontSize: '16px', fontFamily: 'monospace' };
    Theme.fontInfo = { stroke: '#135', strokeThickness: 2, fontSize: '24px', fontFamily: 'Arcade' };
    Theme.fontFocus = { stroke: '#135', strokeThickness: 2, fontSize: '42px', fontFamily: 'Arcade', align: 'center' };
    return Theme;
}());
export { Theme };
export var Event;
(function (Event) {
    Event["gravShift"] = "gravShift";
    Event["gameOver"] = "gameOver";
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
                obj.scene.sound.play(Asset.soundClick, { volume: .5 });
            }
        });
    };
    return Com;
}());
export { Com };
//# sourceMappingURL=common.js.map