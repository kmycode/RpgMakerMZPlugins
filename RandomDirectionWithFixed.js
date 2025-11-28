//=============================================================================
// RPG Maker MZ - RandomDirectionWithFixed
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 向きが固定されているマップ上のイベントがランダム移動するときに、下へ行きがちなのを改善する
 * @author 雪あすか
 * 
 * 
 * @help このゲーム向けの調整です
 * 
 * 【破壊】
 * このプラグインは、下記のメソッドを書き換えます。そのため、実行順位で上位に移動させることをおすすめします
 *   Game_Event.prototype.moveTypeRandom
 *   Game_Character.prototype.moveRandom
 * 
 * 【利用規約】
 * WTFPL
 */

(() => {
  const PLUGIN_NAME = "randomDirectioNWithFixed";

  const Game_CharacterBase_moveStraight = Game_CharacterBase.prototype.moveStraight;
  const Game_Event_moveStraight = Game_Event.prototype.moveStraight;
  if (Game_Event_moveStraight) {
    Game_Event.prototype.moveStraight = function(d) {
      Game_Event_moveStraight.call(this, d);
      this.recordLastDirection(d);
    }
  } else {
    Game_Event.prototype.moveStraight = function(d) {
      Game_CharacterBase_moveStraight.call(this, d);
      this.recordLastDirection(d);
    }
  }

  Game_Event.prototype.recordLastDirection = function(d) {
    this._lastMoveDirection = d;
  };

  // 既存メソッド破壊
  Game_Character.prototype.moveRandom = function() {
    const directions = [2, 4, 6, 8];

    while (directions.length > 0) {
      const index = Math.randomInt(directions.length);
      const d = directions[index];
      if (!d) {
        break;
      } else if (this.canPass(this.x, this.y, d)) {
        this.moveStraight(d);
        break;
      } else {
        directions.splice(index, 1);
      }
    }
  };

  // 既存メソッド破壊
  Game_Event.prototype.moveTypeRandom = function() {
    switch (Math.randomInt(6)) {
      case 0:
      case 1:
        this.moveRandom();
        break;
      case 2:
      case 3:
      case 4:
        {
          if (typeof this._lastMoveDirection === 'number') {
            this.moveStraight(this._lastMoveDirection);
          } else {
            this.moveRandom();
          }
        }
        break;
      case 5:
        this.resetStopCount();
        break;
    }
  };

})();
