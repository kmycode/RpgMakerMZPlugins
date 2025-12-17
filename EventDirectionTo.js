//=============================================================================
// RPG Maker MZ - EventDirectionTo
//=============================================================================

/*:
 * @target MZ
 * @plugindesc イベントが指定座標へ向かって移動する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help イベントが指定座標へ向かって移動します。
 * 
 * 【使い方】
 * プラグインコマンドを呼び出して座標指定するだけ
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @command moveTo
 * @text 座標指定して移動開始
 * @arg eventId
 * @text イベントID
 * @type number
 * @arg x
 * @text 移動先X
 * @type number
 * @arg y
 * @text 移動先Y
 * @type number
 * @arg wait
 * @text ウェイトするか
 * @type boolean
 * @default true
 */

(() => {
  const PLUGIN_NAME = 'EventDirectionTo';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const Game_Event_initMembers = Game_Event.prototype.initMembers;
  Game_Event.prototype.initMembers = function() {
    Game_Event_initMembers.call(this);
    this._forceMovePosition = false;
    this._forceMoveX = 0;
    this._forceMoveY = 0;
  }

  const Game_Event_update = Game_Event.prototype.update;
  Game_Event.prototype.update = function() {
    Game_Event_update.call(this);
    this.updateForceMovePosition();
  }

  Game_Event.prototype.updateForceMovePosition = function() {
    if (this._forceMovePosition && !this.isMoving()) {
      const direction = this.findDirectionTo(this._forceMoveX, this._forceMoveY);
      if (direction > 0) {
        this.moveStraight(direction);
      } else {
        this._forceMovePosition = false;
      }
    }
  }

  Game_Event.prototype.forceMovePosition = function(x, y) {
    this._forceMovePosition = true;
    this._forceMoveX = x;
    this._forceMoveY = y;
  }

  Game_Event.prototype.forceMovingPosition = function() {
    return !!this._forceMovePosition;
  }

  const Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === 'eventMove') {
      character = this.character(this._characterId);
      const waiting = character && character.forceMovingPosition();
      if (!waiting) {
        this._waitMode = '';
      }
      return waiting;
    }
    return Game_Interpreter_updateWaitMode.call(this);
  }

  PluginManager.registerCommand(PLUGIN_NAME, "moveTo", function(args) {
    const { eventId, x, y, wait } = args;
    $gameMap.event(parseInt(eventId))?.forceMovePosition(parseInt(x), parseInt(y));
    if (wait === 'true') {
      this._characterId = parseInt(eventId);
      this.setWaitMode('eventMove');
    }
  });
})();
