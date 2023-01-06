/*
Adapted from Svelte's writable store
*/

import type JUtils from "index.js";
import { merge } from "utils.js";

export interface SavedPluginData {
  /**
   * Stores the state of all settings forJUtils
   */
  settingsTab: {
    test1: boolean;
    test2: number;
  };
}

export class DataJsonContract {
  constructor(protected readonly plugin: JUtils) {}

  protected value!: SavedPluginData;

  private readonly subscribers: Set<(value: SavedPluginData) => void> =
    new Set();

  private stop = true;

  private readonly queue: [
    (value: SavedPluginData) => void,
    SavedPluginData,
  ][] = [];

  private async read(): Promise<SavedPluginData> {
    const defaultData: SavedPluginData = {
      settingsTab: {
        test1: false,
        test2: 0,
      },
    };
    const data = (await this.plugin.loadData()) as Partial<SavedPluginData>;
    return merge(defaultData, data);
  }

  private async write(): Promise<void> {
    await this.plugin.saveData(this.value);
  }

  private async set(newValue: SavedPluginData): Promise<void> {
    if (this.stop) return;

    this.value = newValue;
    const runQueue = !this.queue.length;
    for (const subscriber of this.subscribers)
      this.queue.push([subscriber, this.value]);

    if (!runQueue) return;
    for (let i = 0; i < this.queue.length; i++)
      this.queue[i][0](this.queue[i][1]);

    this.queue.length = 0;
    await this.write();
  }

  /**
   * @param updater - The function that updates the value
   */
  public async update(
    updater: (value: SavedPluginData) => SavedPluginData,
  ): Promise<void> {
    if (!this.value) this.value = await this.read();
    this.set(updater(this.value));
  }

  /**
   *
   * @param run - The subscription function
   * @returns A function that unsubscribes
   */
  public async subscribe(
    run: (value: SavedPluginData) => void,
  ): Promise<() => void> {
    if (!this.value) this.value = await this.read();
    this.subscribers.add(run);
    if (this.subscribers.size === 1) this.stop = false;
    run(this.value);
    return () => {
      this.subscribers.delete(run);
      if (this.subscribers.size === 0) this.stop = true;
    };
  }
}
