import { writable, type Writable } from "svelte/store";

export const LoggedIn : Writable<boolean> = writable(false)