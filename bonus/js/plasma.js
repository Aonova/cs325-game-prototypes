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
import { Asset, Com, Theme, Event, Settings } from "./common.js";
var Plasma = (function (_super) {
    __extends(Plasma, _super);
    function Plasma(scene) {
        var _this = this;
        var cam = scene.cameras.main;
        var Vec2 = Phaser.Math.Vector2;
        var x = cam.width + 50;
        var y = Com.randRange(50, cam.height - 50);
        _this = _super.call(this, scene, x, y, Asset.plasma) || this;
        _this.vel = new Vec2(-1, 0).rotate(Com.randRange(-Math.PI / 8, Math.PI / 8))
            .scale(Settings.pVelMult + Com.randRange(-Settings.pVelVar, Settings.pVelVar));
        _this.setScale(Com.randRange(.25, .75)).setTint(Theme.plasmaColor).setBlendMode(Phaser.BlendModes.SCREEN)
            .setAlpha(1).setVisible(true).setDepth(6).setOrigin(.5).setRotation(Math.random() * 2 * Math.PI);
        scene.add.existing(_this);
        return _this;
    }
    Plasma.prototype.reset = function () {
        var cam = this.scene.cameras.main;
        var Vec2 = Phaser.Math.Vector2;
        var x = cam.width + 50;
        var y = Com.randRange(50, cam.height - 50);
        this.setPosition(x, y);
        this.vel = new Vec2(-1, 0).rotate(Com.randRange(-Math.PI / 8, Math.PI / 8))
            .scale(Settings.pVelMult + Com.randRange(-Settings.pVelVar, Settings.pVelVar));
        this.setScale(Com.randRange(.25, .75)).setTint(Theme.plasmaColor).setBlendMode(Phaser.BlendModes.SCREEN)
            .setAlpha(1).setVisible(true).setDepth(6).setOrigin(.5).setRotation(Math.random() * 2 * Math.PI);
        this.setActive(true);
    };
    Plasma.prototype.setPlayer = function (player) { this.player = player; };
    Plasma.prototype.update = function (time, delta) {
        this.setPosition(this.x + this.vel.x / delta, this.y + this.vel.y / delta);
        this.setRotation(this.rotation + Com.randRange(-20, 40) / delta);
        if (this.x < this.scene.cameras.main.x - 50)
            this.setActive(false);
        if (this.player &&
            !Phaser.Geom.Rectangle.Intersection(this.player.hitBox.getBounds(), this.getBounds()).isEmpty()) {
            this.scene.events.emit(Event.playerHit, this.player, this);
            this.setActive(false);
        }
    };
    return Plasma;
}(Phaser.GameObjects.Image));
export { Plasma };
//# sourceMappingURL=plasma.js.map