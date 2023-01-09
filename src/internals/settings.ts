import { Feature } from "features/base.js";
import { PluginSettingTab, Setting } from "obsidian";
import type JUtils from "index.js";
import type { BaseComponent, ToggleComponent, ValueComponent } from "obsidian";
import type { SavedPluginData } from "safety/appData.js";

type InputType<T extends string> = Extract<
  Exclude<Feature["optionSchema"][number]["inputs"], { type: string }>[number],
  { type: T }
>;

export class JSettings extends PluginSettingTab {
  constructor(protected readonly plugin: JUtils, features: Feature[]) {
    super(plugin.app, plugin);
    this.buildSettings(features);
  }

  private settings: Record<string, Setting> = {};

  private safeAssignSetting(key: string, setting: Setting, feature: Feature) {
    if (this.settings[key])
      throw new Error(
        `Setting ${key} already exists (feature: ` +
          `${feature.identifier}/${feature.name} tried to overwrite this)`,
      );
    this.settings[key] = setting;
  }

  private featureHeading(id: string, feature: Feature) {
    const heading = new Setting(this.containerEl)
      .setName(feature.name)
      .setHeading()
      .addToggle(async (tog) => {
        tog.setTooltip(`Enable/Disable ${feature.name}`);
        await this.bindValue(
          tog,
          (data) => data.settings[id] ?? (data.settings[id] = true),
        );
        this.handleToggle(tog, (data, value) => (data.settings[id] = value));
      });
    if (feature.description) heading.setDesc(feature.description);
    if (feature.tooltip) heading.setTooltip(feature.tooltip);
    this.handleUnsafeOverride(feature.unsafeOverride, heading);
    this.safeAssignSetting(id, heading, feature);
  }

  private handleUnsafeOverride(
    overrides: Feature["optionSchema"][number]["unsafeOverride"],
    cmp: Setting | BaseComponent,
  ) {
    if (!overrides) return;
    for (const [key, args] of overrides) {
      if (key in cmp && typeof cmp[key as keyof typeof cmp] === "function")
        cmp[key as keyof typeof cmp](...(args as [any]));
    }
  }

  private async bindValue<T extends string | number | boolean>(
    cmp: ValueComponent<T>,
    cb: (settings: SavedPluginData) => string | number | boolean,
  ) {
    await this.subscribe(cmp, (s) => cmp.setValue(cb(s) as T));
  }

  private async subscribe(
    cmp: BaseComponent,
    cb: (settings: SavedPluginData) => void,
  ) {
    await this.plugin.appData.subscribe((data) => cb(data));
  }

  private setupInput<T extends BaseComponent>(
    input: InputType<string>,
    cmp: T,
  ) {
    if (
      input.tooltip &&
      "setTooltip" in cmp &&
      typeof cmp.setTooltip === "function"
    )
      cmp.setTooltip(input.tooltip);
    this.handleUnsafeOverride(input.unsafeOverride, cmp);
    this.subscribe(cmp, (data) =>
      cmp.setDisabled(input.disableCriteria!(data)),
    );
  }

  private addButton(setting: Setting, input: InputType<"button">, key: string) {
    setting.addButton(async (btn) => {
      btn.setButtonText(input.label);
      this.setupInput(input, btn);
      btn.onClick((event) =>
        this.plugin.appData.update((data) => {
          input.action(event, data, key);
          return data;
        }),
      );
    });
  }

  /** INTERNAL USE {@link JSettings.addToggle} instead */
  private handleToggle(
    tog: ToggleComponent,
    cb: (data: SavedPluginData, value: boolean) => void,
  ) {
    tog.toggleEl.onclick = async (e: MouseEvent) => {
      await this.plugin.appData.update((data) =>
        cb(data, (e.currentTarget as HTMLElement).hasClass("is-enabled")),
      );
    };
  }

  private addToggle(
    setting: Setting,
    input: InputType<"checkbox">,
    key: string,
  ) {
    setting.addToggle(async (tog) => {
      this.setupInput(input, tog);
      await this.bindValue(
        tog,
        (data) => data.settings[key] ?? (data.settings[key] = input.default),
      );
      this.handleToggle(tog, (data, value) => (data.settings[key] = value));
    });
  }

  private addIButton(
    setting: Setting,
    input: InputType<"iButton">,
    key: string,
  ) {
    setting.addExtraButton(async (btn) => {
      btn.setIcon(input.icon);
      this.setupInput(input, btn);
      btn.onClick(() =>
        this.plugin.appData.update((data) => {
          input.action(data, key);
          return data;
        }),
      );
    });
  }

  private addNumber(setting: Setting, input: InputType<"number">, key: string) {
    setting.addSlider(async (num) => {
      this.setupInput(input, num);
      await this.bindValue(
        num,
        (data) => data.settings[key] ?? (data.settings[key] = input.default),
      );
      num.sliderEl.oninput = async (e) =>
        this.plugin.appData.update(
          (data) =>
            (data.settings[key] = (e.currentTarget as HTMLInputElement).value),
        );
    });
  }

  private addSelect(setting: Setting, input: InputType<"select">, key: string) {
    setting.addDropdown(async (select) => {
      this.setupInput(input, select);
      select.addOptions(input.options);
      await this.bindValue(
        select,
        (data) => data.settings[key] ?? (data.settings[key] = input.default),
      );
      select.selectEl.oninput = async (e) =>
        this.plugin.appData.update(
          (data) =>
            (data.settings[key] = (e.currentTarget as HTMLSelectElement).value),
        );
    });
  }

  private addText(setting: Setting, input: InputType<"text">, key: string) {
    setting.addText(async (text) => {
      this.setupInput(input, text);
      await this.bindValue(
        text,
        (data) => data.settings[key] ?? (data.settings[key] = input.default),
      );
      text.inputEl.oninput = async (e) =>
        this.plugin.appData.update(
          (data) =>
            (data.settings[key] = (e.currentTarget as HTMLInputElement).value),
        );
    });
  }

  private buildSettings(features: Feature[]) {
    for (const feature of features) {
      // setup feature setting section
      const featureId = `${feature.identifier}-heading`;
      this.featureHeading(featureId, feature);
      for (const option of feature.optionSchema) {
        // setup each option
        const id = option.identifier;
        const setting = new Setting(this.containerEl).setName(option.title);
        if (option.description) setting.setDesc(option.description);
        if (option.tooltip) setting.setTooltip(option.tooltip);
        // setup inputs
        const disabler =
          (fallBack: (data: SavedPluginData) => boolean = () => false) =>
          (data: SavedPluginData) =>
            !data.settings[featureId] || fallBack(data);
        if (!Array.isArray(option.inputs)) setting.setHeading();
        else
          for (const input of option.inputs) {
            input.disableCriteria = disabler(input.disableCriteria);
            const key =
              input.identifier ?? `${id}-${option.inputs.indexOf(input)}`;
            if (input.type === "button") this.addButton(setting, input, key);
            if (input.type === "checkbox") this.addToggle(setting, input, key);
            if (input.type === "iButton") this.addIButton(setting, input, key);
            if (input.type === "number") this.addNumber(setting, input, key);
            if (input.type === "select") this.addSelect(setting, input, key);
            if (input.type === "text") this.addText(setting, input, key);
          }
        this.handleUnsafeOverride(option.unsafeOverride, setting);
        this.safeAssignSetting(id, setting, feature);
      }
    }
  }

  public async display() {}
}
