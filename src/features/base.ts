import { Component } from "obsidian";
import type { Plugin } from "obsidian";
import type { SavedPluginData } from "safety/appData.js";

type CheckBox = { type: "checkbox"; default: boolean };

type TextField = { type: "text"; default: string };

type NumberSlider = { type: "number"; default: number };

type SelectOption = {
  type: "select";
  default: string;
  /**
   * options in the form `{ value: displayName }`
   */
  options: { [value: string]: string };
};

type Button = {
  type: "button";
  label: string;
  action: (
    event: MouseEvent,
    data: SavedPluginData,
    settingsKey: string,
  ) => void;
};

type IButton = {
  type: "iButton";
  icon: string;
  action: (data: SavedPluginData, settingsKey: string) => void;
};

type InputType =
  | CheckBox
  | TextField
  | NumberSlider
  | SelectOption
  | Button
  | IButton;

type UnsafeOverride = Array<[componentKey: string, args: unknown[]]>;

type InputSchema = {
  /**
   * Defaults to the index of the input.
   * Can be used to have multiple inputs for the same value.
   */
  identifier?: string;
  tooltip?: string;
  disableCriteria?: (settings: SavedPluginData) => boolean;
  unsafeOverride?: UnsafeOverride;
} & InputType;

interface OptionSchema {
  identifier: string;
  title: string | DocumentFragment;
  description?: string | DocumentFragment;
  tooltip?: string;
  inputs: InputSchema[] | { type: "heading" };
  unsafeOverride?: UnsafeOverride;
}

export abstract class Feature extends Component {
  constructor(protected readonly plugin: Plugin) {
    super();
  }
  public abstract readonly identifier: string;
  public abstract readonly name: string | DocumentFragment;
  public abstract readonly description?: string | DocumentFragment;
  public abstract readonly tooltip?: string;
  public abstract readonly unsafeOverride?: UnsafeOverride;
  /*
   * Heading for this feature will be automatically generated and take the form
   * `${this.identifier}-heading`
   * Toggle for enabling this feature will be automatically generated and take
   * the form `${this.identifier}-tog`
   */
  public abstract readonly optionSchema: OptionSchema[];
}
