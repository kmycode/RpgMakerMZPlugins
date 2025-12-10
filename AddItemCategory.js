//=============================================================================
// RPG Maker MZ - AddItemCategory
//=============================================================================

/*:
 * @target MZ
 * @plugindesc アイテム選択画面で、カテゴリを追加する
 * @author 雪あすか
 * @url https://github.com/kmycode/RpgMakerMZPlugins
 * 
 * 
 * @help アイテムのカテゴリを追加します。
 * 
 * 【破壊】
 * このプラグインは以下のメソッドを破壊します
 *   Window_ItemCategory.prototype.maxCols
 * 
 * 【使い方】
 * １．このプラグインの設定で、カテゴリ一覧を改行区切りで設定します 例:素材
 * ２．アイテムのメモにタグを追加 例:<categoryName:素材>
 * ３．アイテム一覧画面の「アイテム」の隣に、設定したカテゴリが追加されます
 * 
 * 
 * 【利用規約】
 * 独自ライセンス https://github.com/kmycode/RpgMakerMZPlugins/blob/main/LICENSE.md
 * 
 * 【更新履歴】
 * 1.0 初版公開
 * 
 * 
 * @param CategoryList
 * @text カテゴリ一覧
 * @desc 追加するカテゴリを改行区切りで設定します
 * @type multiline_string
 */

(() => {
  const PLUGIN_NAME = 'AddItemCategory';
  const params = PluginManager.parameters(PLUGIN_NAME);

  const extraCategories = params.CategoryList
    .replaceAll('\r', '')
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name)
    .map((name, index) => ({ name, symbol: `extraCategory_${index}`, }));

  const Window_ItemCategory_makeCommandList = Window_ItemCategory.prototype.makeCommandList;
  Window_ItemCategory.prototype.makeCommandList = function() {
    Window_ItemCategory_makeCommandList.call(this);

    const insertIndex = (() => {
      const find = this._list.findIndex((item) => item.symbol === 'item');
      return find >= 0 ? find + 1 : 1;
    })();
    for (const { name, symbol } of extraCategories) {
      this._list.splice(insertIndex, 0, { name, symbol, enabled: true, ext: null, });
    }
  }

  // 破壊
  Window_ItemCategory.prototype.maxCols = function() {
    const existCategories = [
      this.needsCommand('item'),
      this.needsCommand('weapon'),
      this.needsCommand('armor'),
      this.needsCommand('keyItem'),
    ].filter((category) => category);

    return existCategories.length + extraCategories.length;
  }

  const Window_ItemList_setCategory = Window_ItemList.prototype.setCategory;
  Window_ItemList.prototype.setCategory = function(category) {
    if (this._category !== category) {
      this._extraCategory = extraCategories.find((cate) => cate.symbol === category);
    }
    Window_ItemList_setCategory.call(this, category);
  }

  const Window_ItemList_includes = Window_ItemList.prototype.includes;
  Window_ItemList.prototype.includes = function(item) {
    if (this._extraCategory) {
      if (item?.meta.categoryName === this._extraCategory?.name) {
        return true;
      }
    } else {
      if (item?.meta.categoryName) {
        return false;
      }
    }

    return Window_ItemList_includes.call(this, item);
  }
})();
