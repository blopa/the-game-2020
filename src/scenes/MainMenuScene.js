import { GameObjects, Scene } from 'phaser';
import Background from '../sprites/Background';
import { BUILDING, DINO, JET, NOTHING } from '../constants';
import DecorationWire from '../sprites/DecorationWire';

class MainMenuScene extends Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        // TODO
    }

    create() {
        this.background = new Background({
            scene: this,
            x: 0,
            y: 0,
            asset: 'selection_screen',
        }).setOrigin(0, 0);
        this.add.existing(this.background);

        this.gameLogo = new GameObjects.Image(
            this, 250, 15, 'game_logo'
        ).setOrigin(0, 0);
        this.add.existing(this.gameLogo);
        const redWire = new DecorationWire({
            scene: this,
            x: 739,
            y: 408,
            type: 'red',
            frame: 'red_wire_01',
        });
        this.add.existing(redWire);
        const greenWire = new DecorationWire({
            scene: this,
            x: 0,
            y: 402,
            type: 'green',
            frame: 'green_wire_01',
        });
        this.add.existing(greenWire);

        this.createStages([
            [
                // JET,
                // DINO,
                // MISSILE,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                JET,
                NOTHING,
                NOTHING,
                DINO,
                NOTHING,
                NOTHING,
                NOTHING,
                BUILDING,
                NOTHING,
            ],
            [
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
                DINO,
            ],
            [
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
                NOTHING,
            ],
        ], false);
    }

    addEndlessStage = () => {
        const stageSelectionImage = new GameObjects.Image(
            this,
            100,
            180,
            'stage'
        );
        this.add.existing(stageSelectionImage);
        stageSelectionImage.setInteractive();
        const text = this.add.text(
            68,
            170,
            'endless'
        );

        stageSelectionImage.on('pointerup', () => {
            this.scene.start('ControlRoomScene', []);
        });

        stageSelectionImage.on('pointerover', () => {
            stageSelectionImage.setScale(0.98);
            text.setScale(0.9);
        });

        stageSelectionImage.on('pointerout', () => {
            stageSelectionImage.setScale(1);
            text.setScale(1);
        });
    }

    createStages = (stageData, addEndless) => {
        let posX = 100;
        let posY = 180;
        let max = 4;

        if (addEndless) {
            posX += 140;
            max = 3;
            this.addEndlessStage();
        }

        stageData.forEach((data, index) => {
            const stageSelectionImage = new GameObjects.Image(
                this,
                posX,
                posY,
                'stage'
            );
            this.add.existing(stageSelectionImage);
            stageSelectionImage.setInteractive();
            const text = this.add.text(
                posX - 30,
                posY - 10,
                `stage ${index + 1}`
            );

            stageSelectionImage.on('pointerup', () => {
                this.scene.start('ControlRoomScene', data);
            });

            stageSelectionImage.on('pointerover', () => {
                stageSelectionImage.setScale(0.98);
                text.setScale(0.9);
            });

            stageSelectionImage.on('pointerout', () => {
                stageSelectionImage.setScale(1);
                text.setScale(1);
            });

            if (index === max) {
                posX = 100;
                posY += 140;
            } else {
                posX += 140;
            }
        });
    }

    update() {
        // TODO
    }
}

export default MainMenuScene;
