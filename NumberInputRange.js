//=============================================================================
// RPG Maker MZ - NumberInputRange
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 範囲付きの数値入力を表示する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help 範囲付きの数値入力を表示します。
 * 
 * 【使い方】
 * 数値入力表示前の、メッセージ表示前にコマンドを呼び出します
 * コマンドパラメータに変数と数値を両方指定した場合、変数が優先されます
 * 
 * 入力するコマンドは３行です
 * 　コマンド１：プラグイン呼び出し
 * 　コマンド２：メッセージ（任意・省略可能）
 * 　コマンド３：数値入力
 * 
 * また、数値入力後に設定リセットは不要です。
 * 
 * 
 * 【利用規約】
 * WTFPL
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @command setNumberInputRange
 * @text 数値入力の範囲を指定
 * @desc 直後の数値入力の入力範囲を指定します
 * 
 * @arg defaultValue
 * @text デフォルトの数値
 * @type number
 * @desc デフォルトの数値。-1の場合は指定なし（数値入力に設定した変数に入っている値が初期値になる）
 * @default -1
 * 
 * @arg defaultVariableId
 * @text デフォルトの数値（変数）
 * @type variable
 * @desc デフォルトの数値。-1の場合は指定なし（数値入力に設定した変数に入っている値が初期値になる）
 * @default 0
 * 
 * @arg maxValue
 * @text 最大値
 * @type number
 * @desc 最大値。-1の場合は指定なし
 * @default -1
 * 
 * @arg maxVariableId
 * @text 最大値（変数）
 * @type variable
 * @desc 最大値。-1の場合は指定なし
 * @default 0
 * 
 * @arg minValue
 * @text 最小値
 * @type number
 * @desc 最小値。-1の場合は指定なし
 * @default -1
 * 
 * @arg minVariableId
 * @text 最小値（変数）
 * @type variable
 * @desc 最小値。-1の場合は指定なし
 * @default 0
 */

(() => {
  const PLUGIN_NAME = 'NumberInputRange';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const Game_Message_initialize = Game_Message.prototype.initialize;
  Game_Message.prototype.initialize = function() {
    Game_Message_initialize.call(this);
    this.resetNumberRange();
  }

  Game_Message.prototype.setNumberRange = function(min, max, defaultValue) {
    this._minValue = min < 0 ? 0 : min;
    this._maxValue = max < 0 ? 99999999 : max;
    this._defaultValue = defaultValue;
  }

  Game_Message.prototype.resetNumberRange = function() {
    this._minValue = 0;
    this._maxValue = 99999999;
    this._defaultValue = 0;
  }

  Game_Message.prototype.numberMinValue = function() {
    return this._minValue;
  }

  Game_Message.prototype.numberMaxValue = function() {
    return this._maxValue;
  }

  Game_Message.prototype.numberDefaultValue = function() {
    return this._defaultValue;
  }

  Window_NumberInput.prototype.setNumber = function(number) {
    this._number = number;
    this.refresh();
  }

  const Window_NumberInput_start = Window_NumberInput.prototype.start;
  Window_NumberInput.prototype.start = function() {
    Window_NumberInput_start.call(this);
    if ($gameMessage.numberDefaultValue() >= 0 && $gameMessage.numberDefaultValue() !== this._number) {
      this.setNumber($gameMessage.numberDefaultValue());
    }
  }

  const Window_NumberInput_changeDigit = Window_NumberInput.prototype.changeDigit;
  Window_NumberInput.prototype.changeDigit = function(up) {
    const index = this.index();
    const place = Math.pow(10, this._maxDigits - 1 - index);
    let numberTmp = this._number;
    let n = Math.floor(numberTmp / place) % 10;
    numberTmp -= n * place;
    if (up) {
        n = (n + 1) % 10;
    } else {
        n = (n + 9) % 10;
    }
    numberTmp += n * place;

    if (numberTmp > $gameMessage.numberMaxValue()) {
      this._number = $gameMessage.numberMaxValue();
      this.refresh();
      this.playCursorSound();
    } else if (numberTmp < $gameMessage.numberMinValue()) {
      this._number = $gameMessage.numberMinValue();
      this.refresh();
      this.playCursorSound();
    } else {
      Window_NumberInput_changeDigit.call(this, up);
    }
  }

  const Window_NumberInput_processOk = Window_NumberInput.prototype.processOk;
  Window_NumberInput.prototype.processOk = function() {
    Window_NumberInput_processOk.call(this);
    $gameMessage.resetNumberRange();
  }

  const variableOrValue = (variableId, value) => {
    if (typeof variableId === 'string' && variableId !== '0') {
      const vid = parseInt(variableId);
      return $gameVariables.value(vid);
    }

    return parseInt(value);
  }

  PluginManager.registerCommand(PLUGIN_NAME, "setNumberInputRange", args => {
    $gameMessage.setNumberRange(
      variableOrValue(args.minVariableId, args.minValue),
      variableOrValue(args.maxVariableId, args.maxValue),
      variableOrValue(args.defaultVariableId, args.defaultValue),
    );
  });
})();
