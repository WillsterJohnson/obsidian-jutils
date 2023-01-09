import { JSettings } from "internals/settings.js";
import { App, Plugin, PluginManifest } from "obsidian";
import { DataJsonContract } from "safety/appData.js";

export default class JUtils extends Plugin {
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    DataJsonContract.new(this).then((contract) => {
      this.appData = contract;
      this.addSettingTab(
        new JSettings(this, [
          /* TODO: feature storage */
        ]),
      );
    });
  }

  public appData!: DataJsonContract;
}
