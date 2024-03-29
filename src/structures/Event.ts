import EventManager from '../managers/EventManager';
import { Client, ClientEvents } from 'discord.js';
import { HandlerEvents } from '../types';
import SLHandler from '..';

type EventKey = keyof HandlerEvents | keyof ClientEvents;

export class Event<K extends EventKey = EventKey> {
  /**
   * Creates a SLEvent
   *
   * @param name - The event name (key of DiscordJS ClientEvents)
   * @param callback - The function which will be executed when the event is emitted
   */
  constructor(
    public name: K,
    public callback: (
      ctx: {
        client: Client;
        handler: SLHandler;
      },
      ...args: K extends keyof HandlerEvents
        ? Parameters<HandlerEvents[K]>
        : K extends keyof ClientEvents
        ? ClientEvents[K]
        : never
    ) => any,
    public once?: boolean,
  ) {
    if (!name || !callback) {
      throw new TypeError(
        'SLHandler > You must provide name and callback for every event.',
      );
    }

    EventManager.registerEvent(this as any);
  }
}
