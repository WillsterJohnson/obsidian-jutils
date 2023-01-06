import type JUtils from "index.js";
import {
  PluginSettingTab,
  Setting,
  ToggleComponent,
  ValueComponent,
} from "obsidian";
import { SavedPluginData } from "safety/appData.js";

export class JSettings extends PluginSettingTab {
  constructor(protected readonly plugin: JUtils) {
    super(plugin.app, plugin);
    this.buildSettings();
  }

  // TODO: sync with appData
  private settings: Record<string, Setting> = {
    test1: new Setting(this.containerEl)
      .setName("Test 1")
      .setDesc("Test 1 desc"),
    test2: new Setting(this.containerEl)
      .setName("Test 2")
      .setDesc("Test 2 desc"),
  };

  private async bindValue<T>(
    cmp: ValueComponent<T>,
    cb: (settingsTab: SavedPluginData["settingsTab"]) => T,
  ) {
    await this.plugin.appData.subscribe(({ settingsTab }) =>
      cmp.setValue(cb(settingsTab)),
    );
  }

  private handleToggle(
    tog: ToggleComponent,
    cb: (data: SavedPluginData, value: boolean) => void,
  ) {
    tog.toggleEl.onclick = async (e: MouseEvent) => {
      await this.plugin.appData.update((data) => {
        cb(data, (e.currentTarget as HTMLElement).hasClass("is-enabled"));
        return data;
      });
    };
  }

  private buildSettings() {
    this.settings.test1.addToggle(async (tog) => {
      this.bindValue(tog, (settingsTab) => settingsTab.test1);
      this.handleToggle(tog, (data, value) => (data.settingsTab.test1 = value));
    });
    this.settings.test2.addToggle(async (tog) => {
      this.bindValue(tog, (settingsTab) => settingsTab.test1);
      this.handleToggle(tog, (data, value) => (data.settingsTab.test1 = value));
    });
  }

  public async display() {}
}
