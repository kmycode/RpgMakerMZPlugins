//=============================================================================
// RPG Maker MZ - ActorStateGroup
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 戦闘画面で、ステートアイコンを一度に複数表示する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 戦闘画面で、ステートアイコンを一度に複数表示するプラグインです。
 * 他のプラグインとの競合にご注意ください。
 * 
 * 【使い方】
 * 一度に表示するステートの数を決めておきます。
 * あとは有効にするだけでステートが複数一度に並びます
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @param Length
 * @text 一度に表示する数
 * @desc 一度に表示するステートの数を指定します。
 * @type number
 * @default 1
 */

(() => {
  const PLUGIN_NAME = 'ActorStateGroup';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const stateLength = Math.max(1, parseInt(params.Length));
  if (stateLength === 1) return;

  const Sprite_StateIcon_initMembers = Sprite_StateIcon.prototype.initMembers;
  Sprite_StateIcon.prototype.initMembers = function() {
    Sprite_StateIcon_initMembers.call(this);
    this._numOfGroup = 1;
    this._indexInGroup = 0;
  };

  Sprite_StateIcon.prototype.setGroupInfo = function(numOfGroup, indexInGroup) {
    this._numOfGroup = numOfGroup;
    this._indexInGroup = indexInGroup;
  };

  // 破壊
  Sprite_StateIcon.prototype.updateIcon = function() {
    const icons = [];
    if (this.shouldDisplay()) {
      icons.push(...this._battler.allIcons());
    }
    if (icons.length > 0) {
      this._animationIndex += this._numOfGroup;
      if (this._animationIndex >= icons.length) {
        this._animationIndex = this._indexInGroup;
      }
      this._iconIndex = icons[this._animationIndex] ?? 0;
    } else {
      this._animationIndex = 0;
      this._iconIndex = 0;
    }
  };

  // 破壊（Window_StatusBaseのメソッドを上書き）
  Window_BattleStatus.prototype.placeStateIcon = function(actor, x, y) {
    for (let i = 0; i < stateLength; i++) {
      const key = `actor%1-stateIcon-${i}`.format(actor.actorId());
      const sprite = this.createInnerSprite(key, Sprite_StateIcon);
      sprite.setGroupInfo(stateLength, stateLength - i - 1);
      sprite.setup(actor);
      sprite.move(x - (stateLength - i - 1) * 36, y);
      sprite.show();
    }
  };

  function StateIconSpriteGroup() {
    this.initialize(...arguments);
  }

  StateIconSpriteGroup.prototype.initialize = function(list) {
    this._list = list;
  }

  StateIconSpriteGroup.prototype.setup = function(actor) {
    for (const sprite of this._list) {
      sprite.setup(actor);
    }
  }

  StateIconSpriteGroup.prototype.updatePositions = function() {
    if (typeof this.y !== 'number') return;

    let x = typeof this.x === 'number' ? this.x : 0;
    for (const sprite of this._list) {
      sprite.y = this.y;
      sprite.x = x;
      x += 36;
    }
  }

  // 破壊
  const Sprite_Enemy_createStateIconSprite = Sprite_Enemy.prototype.createStateIconSprite;
  Sprite_Enemy.prototype.createStateIconSprite = function() {
    this._stateIconSprites = [];
    for (let i = 0; i < stateLength; i++) {
      const sprite = new Sprite_StateIcon();
      sprite.setGroupInfo(stateLength, stateLength - i - 1);
      this.addChild(sprite);
      this._stateIconSprites.push(sprite);
    }

    this._stateIconSprite = new StateIconSpriteGroup(this._stateIconSprites);
  }

  const Sprite_Enemy_updateStateSprite = Sprite_Enemy.prototype.updateStateSprite;
  Sprite_Enemy.prototype.updateStateSprite = function() {
    Sprite_Enemy_updateStateSprite.call(this);
    this._stateIconSprite.updatePositions();
  }
})();