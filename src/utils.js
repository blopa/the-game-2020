/* globals IS_DEV */
import Phaser, { GameObjects } from 'phaser';
import {
    BUILDING,
    DINO,
    JET,
    LASER_BEAM_DEPTH,
    MISSILE,
    NOTHING,
    ROBOT_MOVEMENT_SIZE,
    ROBOT_MOVEMENT_TIME,
    ROBOT_OCCUPATION_SIZE,
    ROBOT_STAGE_CURRENT_POSITION_DATA_KEY,
    ROBOT_STAGE_LAYOUT_DATA_KEY,
} from './constants';
import Ufo from './sprites/Ufo';
import Building from './sprites/Building';
import Dino from './sprites/Dino';

/**
 * Simulate a key event.
 * @param {Number} keyCode The keyCode of the key to simulate
 * @param {String} type (optional) The type of event : down, up or press. The default is down
 */
export const simulateKeyEvent = (keyCode, type) => {
    const evtName = (typeof (type) === 'string') ? `key${type}` : 'keydown';
    const event = document.createEvent('HTMLEvents');
    event.initEvent(evtName, true, false);
    event.keyCode = keyCode;

    document.dispatchEvent(event);
};

export const isObjectEmpty = (obj) =>
    obj !== null
    && typeof obj === 'object'
    // https://stackoverflow.com/a/32108184/4307769
    && Object.keys(obj).length === 0
    && obj.constructor === Object;

export const isset = (...args) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        if (
            isObjectEmpty(arg)
            || arg === undefined
            || arg === null
            || (Array.isArray(arg) && !arg.length)
        ) {
            return false;
        }
    }

    return true;
};

/**
 * @this Phaser.GameObject.Sprite
 */
function onDragEvent(pointer, x, y) {
    this.setX(x);
    this.setY(y);
}

/**
 * @this Phaser.GameObject.Sprite
 */
function onDragStartEvent() {
    this.setScale(this.scale + 1);
}

/**
 * @this Phaser.GameObject.Sprite
 */
function onDragEndEvent() {
    this.setScale(this.scale - 1);
}

/**
 * @this Phaser.GameObject.Sprite
 */
export function setSpriteDraggable() {
    this.setInteractive();

    this.scene.input.dragDistanceThreshold = 5;
    this.scene.input.setDraggable(this);
    this.on('dragstart', this::onDragStartEvent);
    this.on('drag', this::onDragEvent);
    this.on('dragend', this::onDragEndEvent);
}

/**
 * @this Phaser.GameObject.Sprite
 */
export function handleSpriteMovement() {
    if (this.isGettingHit) {
        return;
    }

    const cursors = this.scene.input.keyboard.createCursorKeys();
    const keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    const keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const velocity = 200;

    if (cursors.left.isDown || keyA.isDown) {
        this.body.setVelocityX(-velocity);
        this.body.setVelocityY(0);
        this.setAnimation('walk');
        this.scaleX = 1;
        if (this.body.offset.x !== 0) {
            this.setX(this.x - 30);
            this.body.offset.x = 0;
        }
    } else if (cursors.right.isDown || keyD.isDown) {
        this.body.setVelocityX(velocity);
        this.body.setVelocityY(0);
        this.setAnimation('walk');
        this.scaleX = -1;
        if (this.body.offset.x !== 30) {
            this.setX(this.x + 30);
            this.body.offset.x = 30;
        }
    } else if (cursors.up.isDown || keyW.isDown) {
        this.body.setVelocityY(-velocity);
        this.body.setVelocityX(0);
        this.setAnimation('walk');
    } else if (cursors.down.isDown || keyS.isDown) {
        this.body.setVelocityY(velocity);
        this.body.setVelocityX(0);
        this.setAnimation('walk');
    } else {
        this.body.setVelocity(0, 0);
        if (this.currentAnimationName === 'walk') {
            this.setAnimation('idle');
        }
    }
}

/**
 * @this RobotStageScene
 */
function containsEnemyAtPosition(position) {
    const stageLayoutData = this.data.get(ROBOT_STAGE_LAYOUT_DATA_KEY);

    return [JET, DINO, BUILDING, MISSILE].includes(stageLayoutData[position]);
}

/**
 * @this RobotStageScene
 */
function handlePunchAction(enemy) {
    console.log('punching');
    this.robot.setAnimation('punch');
    this.robot.robotPunch.play();

    this.time.delayedCall(
        ROBOT_MOVEMENT_TIME,
        () => {
            enemy.setAnimation('die');
            this.time.delayedCall(
                ROBOT_MOVEMENT_TIME / 2,
                () => {
                    enemy.destroy();
                    this::startRobotMovement();
                }
            );
        }
    );
}

/**
 * @this RobotStageScene
 */
function handleShieldAction(enemy) {
    console.log('shielding');
    this.robot.setAnimation('shield');
    this.robot.robotShilding.play();
    this.tweens.add({
        x: (ROBOT_OCCUPATION_SIZE - 1) * ROBOT_MOVEMENT_SIZE,
        y: enemy.y,
        targets: enemy,
        t: 1,
        ease: 'Linear',
        duration: ROBOT_MOVEMENT_TIME / 2,
        repeat: 0,
        yoyo: false,
        onComplete: (tween) => {
            tween.stop();
            enemy.setAnimation('die');
        },
    });

    this.time.delayedCall(
        ROBOT_MOVEMENT_TIME,
        () => {
            enemy.destroy();
            this::startRobotMovement();
        }
    );
}

/**
 * @this RobotStageScene
 */
function handleShootingAction(enemy) {
    console.log('shooting');
    this.robot.setAnimation('shoot');
    this.robot.robotLaser.play();
    this.time.delayedCall(
        ROBOT_MOVEMENT_TIME,
        () => {
            const startPointObj = { x: 100, y: 65 };
            const endPointObj = { x: 205, y: 90 };
            const laserBeam = this.add.line(
                0,
                0,
                startPointObj.x,
                startPointObj.y,
                endPointObj.x,
                endPointObj.y,
                0xff0000
            ).setOrigin(0, 0).setDepth(LASER_BEAM_DEPTH);
            enemy.setAnimation('die');

            this.time.delayedCall(
                ROBOT_MOVEMENT_TIME / 2,
                () => {
                    laserBeam.destroy();
                    enemy.destroy();
                    this.time.delayedCall(
                        ROBOT_MOVEMENT_TIME / 2,
                        () => {
                            this::startRobotMovement();
                        }
                    );
                }
            );
        }
    );
}

/**
 * @this RobotStageScene
 */
function handleActionQueue(position) {
    let actionTaken = false;
    const stageLayoutData = this.data.get(ROBOT_STAGE_LAYOUT_DATA_KEY);
    const enemyType = stageLayoutData[position];
    const enemy = this.enemies[position];
    const { inGameActions } = window;
    const {
        willDuck,
        willShootLaser,
        willShield,
        willDestroyBuilding,
    } = inGameActions;

    if (willShootLaser && enemyType === JET) {
        this::handleShootingAction(enemy);
        window.inGameActions.willShootLaser = false;
        actionTaken = true;
    }

    // if (willShield && enemyType === MISSILE) {
    //     this::handleShieldAction(enemy);
    //     window.inGameActions.willShield = false;
    //     actionTaken = true;
    // }

    if (willShield && enemyType === DINO) {
        this::handleShieldAction(enemy);
        window.inGameActions.willShield = false;
        actionTaken = true;
    }

    if (willDestroyBuilding && enemyType === BUILDING) {
        this::handlePunchAction(enemy);
        window.inGameActions.willDestroyBuilding = false;
        actionTaken = true;
    }

    // if (willDuck && enemyType === METEOR) {
    //     // TODO
    // }

    if (actionTaken) {
        stageLayoutData[position] = NOTHING;
        this.data.set(ROBOT_STAGE_LAYOUT_DATA_KEY, stageLayoutData);

        return true;
    }

    return false;
}

/**
 * @this RobotStageScene
 */
export function startRobotMovement() {
    const currentPosition = this.data.get(ROBOT_STAGE_CURRENT_POSITION_DATA_KEY);
    this.robot.setAnimation('walk');

    this.data.set(ROBOT_STAGE_CURRENT_POSITION_DATA_KEY, currentPosition + 1);

    this.buildingsBackground.forEach((parallaxBackground, index) => {
        this::moveRobotRelatedSprite(parallaxBackground, true);
    });

    this.enemies.forEach((enemy, index) => {
        if (enemy && enemy.spriteKey !== 'missile') {
            this::moveRobotRelatedSprite(enemy);
        }
    });

    this.time.delayedCall(
        ROBOT_MOVEMENT_TIME,
        () => {
            let continueLooping = true;
            const stageLayoutData = this.data.get(ROBOT_STAGE_LAYOUT_DATA_KEY);
            this.robot.setAnimation('idle');

            // TODO the robot occupies 3 positions
            if (this::containsEnemyAtPosition(currentPosition + ROBOT_OCCUPATION_SIZE)) {
                console.log('Game over...');
                this.robot.setAnimation('die');
                this.robot.robotDying.play();
                this.time.delayedCall(
                    ROBOT_MOVEMENT_TIME / 2,
                    () => {
                        const gameOver = new GameObjects.Image(
                            this,
                            0,
                            0,
                            'game_over_screen'
                        ).setOrigin(0, 0).setDepth(1000);
                        this.add.existing(gameOver);

                        this.time.delayedCall(
                            ROBOT_MOVEMENT_TIME,
                            () => {
                                this.robot.destroy();
                                this.cameras.main.fadeOut(ROBOT_MOVEMENT_TIME / 2);
                                this.time.delayedCall(
                                    ROBOT_MOVEMENT_TIME / 2,
                                    () => {
                                        this.scene.get('ControlRoomScene').mainThemeMusic.stop();
                                        this.scene.stop('ControlRoomScene');
                                        this.scene.start('MainMenuScene');
                                        this.scene.stop('RobotStageScene');
                                    }
                                );
                            }
                        );
                    }
                );

                return;
            }

            if (reachedFinishedline(currentPosition, stageLayoutData)) {
                console.log('You won yay');
                const winningQuantity = parseInt(localStorage.getItem('winningQuantity') || 0, 10);
                localStorage.setItem('winningQuantity', winningQuantity + 1);
                if (winningQuantity > 8) {
                    localStorage.setItem('enableUpload', true);
                }

                this.scene.get('ControlRoomScene').mainThemeMusic.stop();
                this.victorySfx.play();
                this.time.delayedCall(
                    ROBOT_MOVEMENT_TIME,
                    () => {
                        const youWon = new GameObjects.Image(
                            this,
                            0,
                            0,
                            'you_won_screen'
                        ).setOrigin(0, 0).setDepth(1000);
                        this.add.existing(youWon);

                        this.time.delayedCall(
                            ROBOT_MOVEMENT_TIME,
                            () => {
                                this.cameras.main.fadeOut(ROBOT_MOVEMENT_TIME / 2);
                                this.time.delayedCall(
                                    ROBOT_MOVEMENT_TIME / 2,
                                    () => {
                                        this.scene.start('MainMenuScene');
                                        this.scene.stop('RobotStageScene');
                                        this.scene.stop('ControlRoomScene');
                                    }
                                );
                            }
                        );
                    }
                );

                return;
            }

            // does the next block contains an enemy? If yes we need to check our actions
            if (this::containsEnemyAtPosition(currentPosition + ROBOT_OCCUPATION_SIZE + 1)) {
                console.log('Incoming enemy...');
                const earlyReturn = this::handleActionQueue(currentPosition + ROBOT_OCCUPATION_SIZE + 1);
                continueLooping = !earlyReturn;
            }

            if (continueLooping) {
                this.time.delayedCall(
                    ROBOT_MOVEMENT_TIME,
                    this::startRobotMovement
                );
            }
        }
    );
}

/**
 * @this RobotStageScene
 */
function moveRobotRelatedSprite(robotRelatedSprite, loop = false) {
    this.tweens.add({
        x: robotRelatedSprite.x - ROBOT_MOVEMENT_SIZE,
        y: robotRelatedSprite.y,
        targets: robotRelatedSprite,
        t: 1,
        ease: 'Linear',
        duration: ROBOT_MOVEMENT_TIME,
        repeat: 0,
        yoyo: false,
        onComplete: (tween) => {
            if (loop) {
                const { width } = robotRelatedSprite.getBounds();
                if (robotRelatedSprite.x + width <= 0) {
                    robotRelatedSprite.setX(width);
                }
            }

            tween.stop();
        },
    });
}

/**
 * @this RobotStageScene
 */
export function renderStageEnemies() {
    const data = this.data.get(ROBOT_STAGE_LAYOUT_DATA_KEY);
    const currentPosition = this.data.get(ROBOT_STAGE_CURRENT_POSITION_DATA_KEY);
    let x = currentPosition * ROBOT_MOVEMENT_SIZE;
    data.forEach((enemyType, index) => {
        const enemy = this::createEnemyByType(enemyType, index, x);
        this.enemies.push(enemy);
        if (enemy) {
            this.add.existing(enemy);
        }

        x += ROBOT_MOVEMENT_SIZE;
    });
}

/**
 * @this RobotStageScene
 */
function createEnemyByType(enemyType, index, x) {
    switch (enemyType) {
        case JET: {
            return new Ufo({
                scene: this,
                x,
                y: 80,
            }).setOrigin(0, 0);
        }

        // case MISSILE: {
        //     const missile = new Missile({
        //         scene: this,
        //         x,
        //         y: 50,
        //     }).setOrigin(0, 0);
        //
        //     const totalTravelTime = (index + 1) * 1000;
        //     this.tweens.add({
        //         x: (ROBOT_OCCUPATION_SIZE) * ROBOT_MOVEMENT_SIZE,
        //         y: missile.y,
        //         targets: missile,
        //         t: 1,
        //         ease: 'Linear',
        //         duration: totalTravelTime,
        //         repeat: 0,
        //         yoyo: false,
        //         onComplete: (tween) => {
        //             tween.stop();
        //         },
        //     });
        //
        //     return missile;
        // }

        case DINO: {
            return new Dino({
                scene: this,
                x,
                y: 10,
            }).setOrigin(0, 0);
        }

        case BUILDING: {
            return new Building({
                scene: this,
                x,
                y: 16,
            }).setOrigin(0, 0);
        }

        case NOTHING:
        default: {
            return null;
        }
    }
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * @this RobotStageScene
 */
export function generateInfiniteData() {
    const enemyTypes = [JET, BUILDING, DINO];
    let random = getRandomArbitrary(3, 6) + 4;
    const newData = this.data.get(ROBOT_STAGE_LAYOUT_DATA_KEY) || [];
    new Array(20).fill().forEach(() => {
        if (random > 0) {
            random -= 1;
            newData.push(NOTHING);
            return;
        }

        newData.push(enemyTypes[
            Math.round(getRandomArbitrary(0, 2))
        ]);
        random = getRandomArbitrary(3, 6);
    });

    this.data.set(ROBOT_STAGE_LAYOUT_DATA_KEY, newData);

    this.time.delayedCall(
        ROBOT_MOVEMENT_TIME * 30,
        () => {
            this::generateInfiniteData();
            this::renderStageEnemies();
        }
    );
}

function reachedFinishedline(currentPosition, stageLayoutData) {
    return currentPosition + ROBOT_OCCUPATION_SIZE + 1 >= stageLayoutData.length;
}

export function handleSpikeCollision(hero, spikes) {
    if (spikes.isOn && !hero.isGettingHit) {
        hero.setIsGettingHit(true);
        const sign = hero.body.offset.x === 0 ? 1 : -1;
        hero.body.setVelocityX(400 * sign);
        hero.scene.time.delayedCall(
            ROBOT_MOVEMENT_TIME / 5,
            () => {
                hero.setIsGettingHit(false);
                hero.body.setVelocityX(0);
            }
        );
    }
}
