import { FeatureFunction, TimedFunction } from '../structures';
import FeatureManager from '../managers/FeatureManager';
import { FileManager, Logger } from '../util';
import { existsSync } from 'fs';
import SLHandler from '..';

class FeatureHandler {
  initFunctions: FeatureFunction[] = [];
  timedFunctions: TimedFunction[] = [];

  constructor(handler: SLHandler, dir: string) {
    if (!dir) return;

    if (!existsSync(dir)) {
      Logger.error(`The directory '${dir}' does not exists.`);
      return;
    }

    try {
      this.load(handler, dir);
    } catch (e) {
      Logger.error(`An error occurred while loading features.\n`, e);
    }
  }

  private load(handler: SLHandler, dir: string) {
    const featureFiles = FileManager.getAllFiles(dir);
    const { client } = handler;

    for (const file of featureFiles) {
      FileManager.import(file);
    }

    const { initFunctions, timedFunctions } = FeatureManager;
    const context = { handler, client };

    client.on('ready', () => {
      for (const initFunction of initFunctions) {
        initFunction(context);
      }

      for (const { timedFunction, interval } of timedFunctions) {
        setInterval(() => {
          timedFunction(context);
        }, interval);
      }
    });

    this.initFunctions = initFunctions;
    this.timedFunctions = timedFunctions;

    Logger.tag('FEATURES', `Loaded ${featureFiles.length} feature files.`);
  }
}

export = FeatureHandler;
