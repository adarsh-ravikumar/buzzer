import { writable, type Writable } from "svelte/store";
import PocketBase, { type RecordModel } from 'pocketbase';

export const TEAM_NAME: Writable<string> = writable("")
export const BUZZER: Writable<RecordModel | undefined> = writable(undefined)
export const PB: Writable<PocketBase | undefined> = writable(undefined);
