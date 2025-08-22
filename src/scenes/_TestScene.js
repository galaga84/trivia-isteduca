// src/scenes/_TestScene.js
export default class _TestScene extends Phaser.Scene {
  constructor() { super('_TestScene'); }
  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#0f0f13');
    this.add.rectangle(W/2, H/2, 400, 200, 0x4f0b7b).setStrokeStyle(6, 0xffffff);
    this.add.text(W/2, H/2, 'Phaser OK', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // log para confirmar arranque
    console.log('[Test] _TestScene create() OK');
  }
}
