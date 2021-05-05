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
import { Asset, DEBUG, Theme, Event } from "./common.js";
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(scene, gVel) {
        var _this = _super.call(this, scene, scene.cameras.main.centerX, scene.cameras.main.centerY) || this;
        _this.hud = [];
        _this.vel = { x: 1, y: 1 };
        _this.gAccel = new Phaser.Math.Vector2(0, 0);
        _this.traveled = 0;
        _this.thrusters = [];
        _this.gVel = gVel;
        _this.mech = new Phaser.GameObjects.Image(scene, 0, 0, Asset.mechBlue).setOrigin(0.5);
        _this.setScale(1);
        _this.thrusters[1] = new Phaser.GameObjects.Image(scene, 14, -144, Asset.thrustUp);
        _this.thrusters[2] = new Phaser.GameObjects.Image(scene, 115, -6, Asset.thrustRight);
        _this.thrusters[0] = new Phaser.GameObjects.Image(scene, -6, 186, Asset.thrustDown);
        _this.thrusters[3] = new Phaser.GameObjects.Image(scene, -82, 3, Asset.thrustLeft);
        _this.thrusters.forEach(function (e) { return e.setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN); });
        _this.thrustController = new ThrustController(scene, 'thruster');
        _this.thrustController.connectPlayer(_this);
        _this.hud[1] = new Phaser.GameObjects.Text(scene, -120, -100, "debug", Theme.fontHUD)
            .setOrigin(0, 0);
        _this.hud[2] = new Phaser.GameObjects.Text(scene, 70, -100, "debug", Theme.fontHUD)
            .setOrigin(0, 0);
        _this.setState('normal');
        _this.add([_this.mech, _this.hud[1], _this.hud[2]].concat(_this.thrusters));
        _this.sendToBack(_this.thrusters[2]);
        _this.scene.input.keyboard.addKey('SPACE').on('down', function () { _this.takeDamage(1000); });
        _this.allowControl(true);
        _this.hitBox = new Phaser.GameObjects.Rectangle(_this.scene, 0, 0, 90, 160, 0, 0).setOrigin(.5);
        if (DEBUG)
            _this.hitBox.setStrokeStyle(1, 0xff0000, 1);
        _this.add(_this.hitBox);
        scene.add.existing(_this);
        var me = _this;
        me.mech.tintFill = false;
        scene.events.on(Event.gravShift, function (vec) {
            scene.tweens.addCounter({
                from: 0, to: 1, duration: 2000, ease: 'Sine',
                onUpdate: function (tween) { return me.gAccel = me.gAccel.lerp(vec, tween.getValue()); }
            });
        });
        return _this;
    }
    Player.prototype.setGlobalVel = function (gVel) {
        this.gVel = gVel;
        return this;
    };
    Player.prototype.allowControl = function (allow) {
        if (allow) {
        }
        this.thrustController.allowControl(allow);
        return this;
    };
    Player.prototype.update = function (time, delta) {
        if (this.state == 'disabled') {
            if (this.disabledTime > 0) {
                this.disabledTime -= delta;
            }
            else
                this.recover();
        }
        if (this.hud[1] != null) {
            var xTerm = this.vel.x > 0 ? 'V_FWD|' : 'V_BCK|';
            xTerm += this.state == 'disabled' ? 'ERROR' : (Math.abs(this.vel.x) * 10).toFixed(1);
            var yTerm = this.vel.y > 0 ? 'V_DWN|' : 'V__UP|';
            yTerm += this.state == 'disabled' ? 'ERROR' : (Math.abs(this.vel.y) * 10).toFixed(1);
            this.hud[1].setText([xTerm, yTerm]);
        }
        if (this.hud[2] != null) {
            var xTerm = 'THRUST|';
            xTerm += this.state == 'disabled' ? 'ERROR' : (Math.abs(this.thrustController.getImpulse()) * 10).toFixed(1);
            var yTerm = 'GRAVTY|';
            yTerm += this.state == 'disabled' ? 'ERROR' : (Math.abs(this.gAccel.length() * 10).toFixed(1));
            this.hud[2].setText([xTerm, yTerm]);
        }
        if (this.thrustController.isFiring("up"))
            this.vel.y -= this.thrustController.getImpulse() / delta;
        if (this.thrustController.isFiring("down"))
            this.vel.y += this.thrustController.getImpulse() / delta;
        if (this.thrustController.isFiring("left"))
            this.vel.x -= this.thrustController.getImpulse() / delta;
        if (this.thrustController.isFiring("right"))
            this.vel.x += this.thrustController.getImpulse() / delta;
        this.vel.x += this.gAccel.x / delta;
        this.vel.y += this.gAccel.y / delta;
        this.setPosition(this.x + this.vel.x / delta, this.y + this.vel.y / delta);
        this.traveled += this.gVel * 10 / delta;
        var Vector = Phaser.Math.Vector2;
        var cam = this.scene.cameras.main;
        if (new Vector(this.x - cam.centerX, this.y - cam.centerY).length() > cam.width * .75) {
            this.scene.events.emit(Event.gameOver, this);
        }
        _super.prototype.update.call(this, time, delta);
    };
    Player.prototype.setState = function (state) {
        _super.prototype.setState.call(this, state);
        if (state == "normal") {
            [this.hud[1], this.hud[2]].forEach(function (e) { return e.setStyle({ stroke: '#379' }); });
        }
        else if (state == "disabled") {
            [this.hud[1], this.hud[2]].forEach(function (e) { return e.setStyle({ stroke: '#D77' }); });
        }
        return this;
    };
    Player.prototype.recover = function () {
        var _this = this;
        this.disabledTime = 0;
        this.mech.setTexture(Asset.mechBlue);
        var after = function () {
            _this.setState('normal');
            _this.thrustController.setWorking(true);
        };
        after();
    };
    Player.prototype.takeDamage = function (time) {
        if (!this.scene)
            return;
        this.scene.sound.play(Asset.soundHit);
        if (time < 5)
            return;
        this.setState("disabled");
        this.disabledTime += time;
        this.thrustController.setWorking(false);
        this.mech.setTexture(Asset.mechRed);
    };
    return Player;
}(Phaser.GameObjects.Container));
export { Player };
var ThrustController = (function (_super) {
    __extends(ThrustController, _super);
    function ThrustController(scene, tag) {
        var _this = _super.call(this, scene, tag) || this;
        _this.working = true;
        _this.impulse = 1;
        _this.firing = [false, false, false, false];
        _this.player = null;
        _this.keysEnabled = false;
        _this.keys = {
            W: scene.input.keyboard.addKey('W'), A: scene.input.keyboard.addKey('A'),
            S: scene.input.keyboard.addKey('S'), D: scene.input.keyboard.addKey('D'),
            tUp: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R, true),
            tDown: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F, true),
            tSet: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)
        };
        var me = _this;
        me.keys.tSet.on('down', function () {
            me.impulse = me.player.gAccel.length();
        });
        scene.events.on('update', function (_, delta) {
            if (!me.active)
                return;
            if (me.keys.tDown.isDown)
                me.impulse -= .025 / delta;
            if (me.keys.tUp.isDown)
                me.impulse += .025 / delta;
        });
        _this.thrustSound = scene.sound.add(Asset.soundThrust, { loop: true, volume: 0 });
        _this.thrustSound.play();
        return _this;
    }
    ThrustController.prototype.d2i = function (dir) {
        switch (dir) {
            case 'up': return 0;
            case 'down': return 1;
            case 'left': return 2;
            case 'right': return 3;
        }
    };
    ThrustController.prototype.isFiring = function (dir) {
        return this.firing[this.d2i(dir)];
    };
    ThrustController.prototype.fire = function (dir) {
        if (this.working) {
            var me = this;
            this.firing[this.d2i(dir)] = true;
            this.scene.sound.play(Asset.soundThrustStart, { volume: Math.min(1, me.impulse * 1.8) });
            this.thrustSound.setVolume(Math.min(this.thrustSound.volume + 1, 1));
            this.scene.add.tween({
                targets: this.player.thrusters[this.d2i(dir)],
                alpha: Math.min(1, me.impulse * 1.8),
                duration: 300
            });
        }
        return this;
    };
    ThrustController.prototype.halt = function (dir) {
        if (!this.active)
            return;
        this.firing[this.d2i(dir)] = false;
        if (!(this.isFiring('up') || this.isFiring('down') || this.isFiring('left') || this.isFiring('right')))
            this.thrustSound.setVolume(0);
        this.scene.add.tween({
            targets: this.player.thrusters[this.d2i(dir)],
            alpha: 0,
            duration: 300
        });
        return this;
    };
    ThrustController.prototype.haltAll = function () {
        this.halt('up').halt("down").halt("left").halt("right");
        return this;
    };
    ThrustController.prototype.getImpulse = function () {
        return this.impulse;
    };
    ThrustController.prototype.setWorking = function (val) {
        if (!this.active)
            return;
        if (!val)
            this.haltAll();
        this.working = val;
        if (val && this.keysEnabled) {
            if (this.keys.W.isDown)
                this.fire("up");
            if (this.keys.S.isDown)
                this.fire("down");
            if (this.keys.A.isDown)
                this.fire("left");
            if (this.keys.D.isDown)
                this.fire("right");
        }
        return this;
    };
    ThrustController.prototype.destroy = function () {
        [this.keys.W, this.keys.S, this.keys.A, this.keys.D, this.keys.tSet].forEach(function (k) {
            k.off('down').off('up');
        });
        _super.prototype.destroy.call(this);
    };
    ThrustController.prototype.connectPlayer = function (player) {
        this.player = player;
    };
    ThrustController.prototype.allowControl = function (allow) {
        var _this = this;
        if (allow) {
            this.keys.W.on('down', function () { _this.fire('up'); }).on('up', function () { _this.halt('up'); });
            this.keys.S.on('down', function () { _this.fire('down'); }).on('up', function () { _this.halt('down'); });
            this.keys.A.on('down', function () { _this.fire('left'); }).on('up', function () { _this.halt('left'); });
            this.keys.D.on('down', function () { _this.fire('right'); }).on('up', function () { _this.halt('right'); });
        }
        else {
            for (var key in this.keys) {
                this.keys[key].off('down').off('up');
            }
        }
        this.keysEnabled = allow;
        return this;
    };
    return ThrustController;
}(Phaser.GameObjects.GameObject));
//# sourceMappingURL=player.js.map