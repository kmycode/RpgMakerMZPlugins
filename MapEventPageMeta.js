//=============================================================================
// RPG Maker MZ - MapEventPageMeta
//=============================================================================

/*:
 * @target MZ
 * @plugindesc イベントのページのメタ情報を設定します
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help イベントのページのメタ情報を設定するプラグインです。
 * 
 * 【使い方】
 * これは他のプラグインから参照するためのものです。ゲームに直接は影響しません。
 * 他のプラグインから参照されますので、必ずこのプラグインの呼び出し順番を上位にしてください。
 * 
 * 他のプラグインからこのプラグインの機能を利用するときは、setupPage呼び出し後にメタ情報が更新されますので
 * event.pageMetaを参照してください。
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 */

(() => {
  const PLUGIN_NAME = 'MapEventPageMeta';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const Game_Event_setupPage = Game_Event.prototype.setupPage;
  Game_Event.prototype.setupPage = function() {
    Game_Event_setupPage.call(this);
    this.updatePageMeta();
  }

  Game_Event.prototype.updatePageMeta = function() {
    const comments = this.getCurrentPageFirstComments();
    if (!comments) {
      this.pageMeta = {};
      return;
    }

    const tmpObj = { note: comments, meta: {} };
    DataManager.extractMetadata(tmpObj);

    this.pageMeta = tmpObj.meta;
  }

  Game_Event.prototype.getCurrentPageFirstComments = function() {
    if (!this.page() || !this.list()) return;

    const list = this.list();
    const comments = [];
    for (const command of list) {
      if (!command || ![108, 408].includes(command.code)) {
        break;
      } else {
        // コメント（注釈）
        comments.push(command.parameters[0]);
      }
    }

    if (comments.length === 0) {
      return null;
    }

    return comments.join('\n');
  }
})();
