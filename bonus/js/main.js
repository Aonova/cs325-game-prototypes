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
import { Asset, Com, Event, Theme, Settings } from "./common.js";
import { Plasma } from "./plasma.js";
import { Player } from "./player.js";
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super.call(this, 'MainScene') || this;
        _this.vel = 20;
        _this.edgeGlow = [];
        _this.gravState = 0;
        _this.phase = 'play';
        return _this;
    }
    Main.prototype.preload = function () {
        this.load.image(Asset.bgLower, './res/bg-1.png');
        this.load.image(Asset.bgBack, './res/galaxy.png');
        this.load.image(Asset.mechBlue, './res/mech.png');
        this.load.image(Asset.mechRed, './res/mech-red.png');
        this.load.image(Asset.thrustDown, './res/thrust_down.png');
        this.load.image(Asset.thrustLeft, './res/thrust_left.png');
        this.load.image(Asset.thrustRight, './res/thrust_right.png');
        this.load.image(Asset.thrustUp, './res/thrust_up.png');
        this.load.image(Asset.plasma, './res/particle.png');
        this.load.audio(Asset.soundGameOver, './res/sounds/gameover.wav');
        this.load.audio(Asset.soundHit, './res/sounds/hit.wav');
        this.load.audio(Asset.soundThrust, './res/sounds/engine.wav');
        this.load.audio(Asset.soundClick, './res/sounds/click.wav');
        this.load.audio(Asset.soundBGM, './res/sounds/bgm.mp3');
        this.load.audio(Asset.soundThrustStart, './res/sounds/engine-start.wav');
    };
    Main.prototype.create = function () {
        var _this = this;
        var cam = this.cameras.main;
        var me = this;
        this.bgBack = this.add.tileSprite(0, 0, cam.width, 0, Asset.bgBack).setOrigin(0);
        this.bgTop = this.add.tileSprite(0, -300, cam.width, 0, Asset.bgLower)
            .setOrigin(0, 0).setTileScale(0.65).setFlipY(true);
        this.bgBot = this.add.tileSprite(0, cam.height - 390, cam.width, 0, Asset.bgLower)
            .setOrigin(0).setTileScale(0.65);
        this.bgBot.tilePositionX += 2500;
        this.player = this.add.existing(new Player(this, this.vel));
        var gColor = Theme.gravColor;
        var gWidth = 200;
        this.edgeGlow[0] = this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(gColor, gColor, 0, 0, 1, 1, 0, 0)
            .fillRect(0, 0, cam.width, gWidth);
        this.edgeGlow[1] = this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(0, gColor, 0, gColor, 0, 1, 0, 1)
            .fillRect(cam.width - gWidth, 0, gWidth, cam.height);
        this.edgeGlow[2] = this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(0, 0, gColor, gColor, 0, 0, 1, 1)
            .fillRect(0, cam.height - gWidth, cam.width, gWidth);
        this.edgeGlow[3] = this.add.graphics().setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(5)
            .fillGradientStyle(gColor, 0, gColor, 0, 1, 0, 1, 0)
            .fillRect(0, 0, gWidth, cam.height);
        this.sound.play(Asset.soundBGM, { loop: true });
        this.plasma = this.add.group([], {
            classType: Plasma, runChildUpdate: true, visible: true,
            createCallback: function (p) { return p.setPlayer(me.player); }
        });
        var introText = this.add.text(50, 30, '', Theme.fontInfo).setOrigin(0);
        var tAnim = Com.showTextAnim;
        var t = 0;
        this.time.delayedCall(t += 500, function () {
            return tAnim(introText, "3-1-5, you have reached target orbit around the station core."
                + "\nThe core already sustained heavy damage, so watch out for gravitational anomalies."
                + "\nWe are switching you to manual: fire your thrusters [W,A,S,D] to avoid crashing.", 4000);
        });
        var Vec2 = Phaser.Math.Vector2;
        this.time.delayedCall(t += 8000, function () {
            me.time.delayedCall(2000, function () { return _this.events.emit(Event.gravShift, new Vec2(0, 0.5)); });
            tAnim(introText, "Anomaly detected towards orbit anti-normal. Thrust towards normal to compensate.", 1000);
            me.time.delayedCall(4500, function () { return tAnim(introText, "\nAdjust thrust acceleration for finer impulse control."
                + "\n[R] to increase, [F] to decrease, and [X] to match gravity level.", 1000, true); });
        });
        this.time.delayedCall(t += 8000, function () {
            me.events.emit(Event.gravShift, new Vec2(0, 0));
            tAnim(introText, "Anomaly receding."
                + "\nGravity anomalies can appear at any time and direction."
                + "\nBe vigilant for the signature green glow, and compensate using your thrusters.", 2000);
            me.time.delayedCall(2000, function () { return doGravShift(); });
        });
        this.time.delayedCall(t += 8000, function () {
            tAnim(introText, "Detecting plasma debris in your orbit - probably being spewed out by the core."
                + "\nThey wont pierce your hull, but will give your systems a nasty shock."
                + "\nEvasive manuevers recommended.", 2000);
            me.time.delayedCall(3000, function () {
                for (var i = 0; i < 10; i++)
                    me.time.delayedCall(Com.randRange(0, 2000), function () { return me.plasma.get(); });
            });
        });
        this.time.delayedCall(t += 8000, function () {
            tAnim(introText, "Try and stay in orbit as long as possible."
                + "\nBest of luck, Theta-315", 800);
            doPlasmaSpawn();
        });
        this.time.delayedCall(t += 8000, function () { return introText.setText(''); });
        var glow = this.edgeGlow;
        var hideAll = function () {
            var toHide = [];
            glow.forEach(function (g) { if (g.alpha > 0)
                toHide.push(g); });
            if (toHide.length > 0)
                me.add.tween({ targets: toHide, alpha: 0, duration: 1000, ease: 'Sine' });
        };
        var show = function (obj) {
            me.add.tween({ targets: obj, alpha: 1, duration: 1000, ease: 'Sine' });
        };
        var doPlasmaSpawn = function () {
            var delay = (Com.randRange(500, 1500));
            me.time.delayedCall(delay, function () {
                var p1 = me.plasma.get();
                var p2 = null;
                if (Math.random() < .5)
                    p2 = me.plasma.get();
                if (!p1.active)
                    p1.reset();
                if (p2 && !p2.active)
                    p2.reset();
                doPlasmaSpawn();
            });
        };
        var doGravShift = function () {
            var dir = 0;
            do {
                dir = Math.floor(Math.random() * 5);
            } while (dir == me.gravState);
            me.gravState = dir;
            var gVec = new Vec2();
            if (dir == 0)
                gVec.set(0, 0);
            else
                gVec.set(1, 0).rotate((dir - 1) / 2 * Math.PI).scale(Com.randRange(.25, .75));
            var gd = Settings.gravDelay;
            var delay = ((Math.random() * (gd.max - gd.min)) + gd.min) * 1000;
            me.time.delayedCall(delay, function () {
                me.events.emit(Event.gravShift, gVec);
                doGravShift();
            });
        };
        this.events.on(Event.gravShift, function (vec) {
            hideAll();
            if (vec.length() == 0)
                return;
            var a = vec.angle() / Math.PI * 2;
            show(glow[(Math.floor(a + 1.5)) % 4]);
        });
        this.events.once(Event.gameOver, function (player) {
            me.player.update = function () { };
            me.player.thrustController.destroy();
            var score = player.traveled;
            var endText = me.add.text(cam.centerX, cam.centerY - 50, "Game Over\nDistance: " + score.toFixed(1), Theme.fontFocus)
                .setOrigin(.5).setScale(2).setAlpha(0).setDepth(7);
            me.tweens.add({ targets: endText, alpha: 1, scale: 1, duration: 400, ease: 'Sine', delay: 500 });
            me.sound.play(Asset.soundGameOver);
            me.player.destroy();
            me.player = null;
        });
        this.events.on(Event.playerHit, function (player, plasma) {
            me.add.tween({
                targets: plasma, alpha: 0, scale: '*=1.5', ease: 'Sine', duration: 600,
                onComplete: function () { plasma; }
            });
            player.takeDamage(1000);
        });
    };
    Main.prototype.update = function (time, delta) {
        if (this.phase == 'play') {
            this.bgBack.tilePositionX += this.vel / delta / 20;
            this.bgTop.tilePositionX += this.vel / delta;
            this.bgBot.tilePositionX += this.vel / delta;
            if (this.player)
                this.player.update(time, delta);
        }
    };
    return Main;
}(Phaser.Scene));
var Title = (function (_super) {
    __extends(Title, _super);
    function Title() {
        return _super.call(this, 'TitleScene') || this;
    }
    Title.prototype.preload = function () {
        this.load.image('title', './res/title.png');
    };
    Title.prototype.create = function () {
        var cam = this.cameras.main;
        var bg = this.add.rectangle(0, 0, cam.width, cam.height, 0x050505, 1).setOrigin(0, 0);
        var fg = this.titleImg = this.add.image(cam.centerX, cam.centerY - 100, 'title')
            .setScale(0.7).setAlpha(0);
        var but = this.startBut = this.add.text(cam.width - 80, cam.centerY + 150, '[ START ]', { stroke: '#79A', strokeThickness: 10, fontSize: '50px', fontFamily: 'monospace' }).setOrigin(1, 0.5).setAlpha(0);
        this.add.tween({ targets: fg, duration: 1000, ease: 'Sine', y: '+=100', alpha: 1 });
        this.add.tween({ targets: but, duration: 1000, ease: 'Sine', y: '-=100', alpha: 1, delay: 1500, onComplete: function () { but.setInteractive(); } });
        but.on('pointerover', function () { but.setTint(0xaaffbb); }).on('pointerout', function () { but.clearTint(); })
            .on('pointerup', function () {
            but.scene.add.tween({
                targets: [but, fg], duration: 500, alpha: 0, ease: 'Sine',
                onComplete: function () { but.scene.scene.start('MainScene'); }
            });
        });
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