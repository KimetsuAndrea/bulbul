/**
 * Defines and returns a command entry.
 *
 * @param entry - The command entry to be defined.
 * @returns The defined command entry.
 */
export function defineEntry(entry: CommandEntry): CommandEntry;

/**
 * Defines and returns a command entry.
 *
 * @param entry - The command entry to be defined.
 * @returns The defined command entry.
 */
export function defineEntry(
  entry: Record<string, CommandEntry>
): Record<string, CommandEntry>;

export function defineEntry(
  entry: CommandEntry | Record<string, CommandEntry>
) {
  return entry;
}

import { ReduxCMDHome } from "@cass-modules/reduxCMDHomeV2";
import { SpectralCMDHome } from "@cassidy/spectral-home";
import type { UserStatsManager } from "cassidy-userData";
import type OutputProps from "output-cassidy";

/**
 * Defines a home command entry for the SpectralCMD system.
 *
 * @param options - The primary configuration options for the `SpectralCMDHome` instance.
 * These options are passed as the first parameter to the `SpectralCMDHome` constructor.
 *
 * @param config - Additional configuration for the `SpectralCMDHome` instance.
 * This parameter corresponds to the second parameter of the `SpectralCMDHome` constructor.
 *
 * @returns A `CommandEntry` object representing the defined home command.
 */
export function defineHome(
  options: ConstructorParameters<typeof SpectralCMDHome>[0],
  config: ConstructorParameters<typeof SpectralCMDHome>[1]
): CommandEntry;

/**
 * Defines a command entry for a home object.
 *
 * @param home - The home object to define the command entry for.
 *               It can be either a `SpectralCMDHome` or a `ReduxCMDHome`.
 * @returns A `CommandEntry` object representing the defined command entry.
 */
export function defineHome(home: SpectralCMDHome | ReduxCMDHome): CommandEntry;

export function defineHome(
  optionsOrHome:
    | ConstructorParameters<typeof SpectralCMDHome>[0]
    | SpectralCMDHome
    | ReduxCMDHome,
  configOrNot?: ConstructorParameters<typeof SpectralCMDHome>[1]
): CommandEntry {
  if (
    (optionsOrHome instanceof SpectralCMDHome ||
      optionsOrHome instanceof ReduxCMDHome) &&
    !configOrNot
  ) {
    return (ctx) => optionsOrHome.runInContext(ctx);
  } else if (
    !(
      optionsOrHome instanceof SpectralCMDHome ||
      optionsOrHome instanceof ReduxCMDHome
    )
  ) {
    const home = new SpectralCMDHome(optionsOrHome, configOrNot);
    return (ctx) => home.runInContext(ctx);
  }
}

export type VNode = {
  tag: string;
  props: any;
  children: any[];
};


// export function defineOutputJSX(output: OutputProps) {
//   return ({ reply = false, send = false, children = "" }) => {
    
//   }
// }

// export function defineUserStatsJSX(money: UserStatsManager) {
//   return ({ reply = false, send = false, children = "" }) => {
    
//   }
// }