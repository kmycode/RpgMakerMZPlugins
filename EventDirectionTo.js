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
 * 
 * 
 * @command moveToByEventId
 * @text 移動先イベントID指定して移動開始
 * @desc 対象イベントとの当たり判定は普通にあります。対象イベントへ移動できずコマンド完了できない現象に注意
 * @arg eventId
 * @text イベントID
 * @arg targetEventId
 * @text 移動先のイベントID
 * @type number
 * @arg wait
 * @text ウェイトするか
 * @type boolean
 * @default true
 * 
 * 
 * @command moveToByRegionId
 * @text 移動先リージョンID指定して移動開始
 * @desc 同じリージョン番号が複数ある場合、どれが使われるかは保証されません
 * @arg eventId
 * @text イベントID。0または指定なしなら主人公が移動
 * @arg targetRegionId
 * @text 移動先のリージョンID
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

  const Game_CharacterBase_update = Game_CharacterBase.prototype.update;
  const Game_Character_update = Game_Character.prototype.update;
  Game_Character.prototype.update = function() {
    (Game_Character_update ?? Game_CharacterBase_update).call(this);
    this.updateForceMovePosition();
  }

  Game_Character.prototype.updateForceMovePosition = function() {
    if (this._forceMovePosition && !this.isMoving()) {
      const direction = this.findDirectionTo(this._forceMoveX, this._forceMoveY);
      if (direction > 0) {
        this.moveStraight(direction);
      } else {
        this._forceMovePosition = false;
      }
    }
  }

  Game_Character.prototype.forceMovePosition = function(x, y) {
    this._forceMovePosition = true;
    this._forceMoveX = x;
    this._forceMoveY = y;
  }

  Game_Character.prototype.forceMovingPosition = function() {
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

  Game_Interpreter.prototype.moveEventToPosition = function(eventId, x, y, wait) {
    if (eventId <= 0 || eventId === undefined) {
      $gamePlayer.forceMovePosition(x, y);
      if (wait) {
        this._characterId = -1;
        this.setWaitMode('eventMove');
      }
    } else {
      $gameMap.event(eventId)?.forceMovePosition(x, y);
      if (wait) {
        this._characterId = eventId;
        this.setWaitMode('eventMove');
      }
    }
  }

  PluginManager.registerCommand(PLUGIN_NAME, "moveTo", function(args) {
    const { eventId, x, y, wait } = args;
    this.moveEventToPosition(parseInt(eventId), parseInt(x), parseInt(y), wait === 'true');
  });

  PluginManager.registerCommand(PLUGIN_NAME, "moveToByEventId", function(args) {
    const { eventId, targetEventId, wait } = args;
    const event = $gameMap.event(parseInt(targetEventId))?.event();
    if (!event) return;

    this.moveEventToPosition(parseInt(eventId), event.x, event.y, wait === 'true');
  });

  PluginManager.registerCommand(PLUGIN_NAME, "moveToByRegionId", function(args) {
    const { eventId, targetRegionIdRaw, wait } = args;
    const width = $dataMap.width;
    const height = $dataMap.height;

    const targetRegionId = parseInt(targetRegionIdRaw);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const regionId = $dataMap.data[(5 * height * y) * width + x] || 0;
        if (regionId === targetRegionId) {
          this.moveEventToPosition(parseInt(eventId), x, y, wait === 'true');
          return;
        }
      }
    }
  });
})();
