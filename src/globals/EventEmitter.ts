import { EventEmitter as EventEmitterFactory } from "fbemitter";

export const EventEmitter = new EventEmitterFactory();

// for testing purposes only
// @ts-ignore
window.EventEmitter = EventEmitter;
