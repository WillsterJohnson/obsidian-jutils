import { JSettings } from "internals/settings.js";
import { App, Plugin, PluginManifest } from "obsidian";
import { DataJsonContract } from "safety/appData.js";
import { debug } from "utils.js";

export default class JUtils extends Plugin {
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.appData = new DataJsonContract(this);
    this.appData.subscribe(debug);
    this.addSettingTab(new JSettings(this));
  }

  public appData!: DataJsonContract;
}
