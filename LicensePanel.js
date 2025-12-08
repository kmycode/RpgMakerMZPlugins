//=============================================================================
// RPG Maker MZ - LicensePanel
//=============================================================================

/*:
 * @target MZ
 * @plugindesc タイトル画面にライセンス情報を追加します
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help タイトル画面にライセンス情報を表示するプラグインです。
 * 
 * 【使い方】
 * プラグインを有効にして、プラグインのデータにライセンス情報を設定するだけ
 * テキストは「===」だけの行を設定すると、改ページを行います
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @param LicenseText
 * @text ライセンステキスト
 * @desc ライセンステキストを設定します。「===」で改ページ
 * @type multiline_string
 */

(() => {
  const PLUGIN_NAME = 'LicensePanel';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const licenseTextFrames = (params.LicenseText ?? '').split('===').map((text) => text.trim());

  const Window_TitleCommand_makeCommandList = Window_TitleCommand.prototype.makeCommandList;
  Window_TitleCommand.prototype.makeCommandList = function() {
    Window_TitleCommand_makeCommandList.call(this);
    this.addCommand('ライセンス', 'license');
  };

  const Scene_Title_commandWindowRect = Scene_Title.prototype.commandWindowRect;
  Scene_Title.prototype.commandWindowRect = function() {
    const rect = Scene_Title_commandWindowRect.call(this);

    const height = this.calcWindowHeight(4, true);
    return new Rectangle(rect.x, rect.y, rect.width, height);
  };

  const Scene_Title_createCommandWindow = Scene_Title.prototype.createCommandWindow;
  Scene_Title.prototype.createCommandWindow = function() {
    Scene_Title_createCommandWindow.call(this);
    this._commandWindow.setHandler("license", this.commandLicense.bind(this));
  }

  Scene_Title.prototype.commandLicense = function() {
    this._commandWindow.close();
    SceneManager.push(Scene_License);
  };

  function Scene_License() {
    this.initialize(...arguments);
  }

  Scene_License.prototype = Object.create(Scene_Base.prototype);
  Scene_License.prototype.constructor = Scene_License;

  Scene_License.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
  };

  Scene_License.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createWindowLayer();
    this.createLicenseWindow();
  };

  Scene_License.prototype.createLicenseWindow = function() {
    const rect = this.licenseWindowRect();
    this._licenseWindow = new Window_License(rect);
    this._licenseWindow.setHandler("cancel", this.popScene.bind(this));
    this.addWindow(this._licenseWindow);
    this._licenseWindow.activate();
  };

  Scene_License.prototype.licenseWindowRect = function() {
    const ww = Graphics.boxWidth;
    const wh = Graphics.boxHeight;
    const wx = 0;
    const wy = 0;
    return new Rectangle(wx, wy, ww, wh);
  };

  function Window_License() {
    this.initialize(...arguments);
  }

  Window_License.prototype = Object.create(Window_Selectable.prototype);
  Window_License.prototype.constructor = Window_License;

  Window_License.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this._frameIndex = 0;

    this.setHandler('ok', this.nextText.bind(this));
    this.refresh();
  }

  Window_License.prototype.nextText = function() {
    if (licenseTextFrames.length > this._frameIndex + 1) {
      this._frameIndex++;
      this.refresh();
      this.activate();
    } else {
      this.callHandler('cancel');
    }
  };

  Window_License.prototype.refresh = function() {
    this.contents.clear();
    this.drawTextEx(licenseTextFrames[this._frameIndex], 0, 0, this.innerWidth);
  }
})();
