import { getAlias, capitalizeFirstLetter } from '../utils';

const bosses = new URL('../Images/Bosses.png', import.meta.url).href;
const filters = new URL('../Images/Filters.png', import.meta.url).href;
const sifters = new URL('../Images/Sifters.png', import.meta.url).href;
const minions = new URL('../Images/Minions.png', import.meta.url).href;
const foundation = new URL('../Images/foundation.png', import.meta.url).href;
const dashboards = new URL('../Images/Dashboards.png', import.meta.url).href;
const underbosses = new URL('../Images/UnderBosses.png', import.meta.url).href;
const instructions = new URL('../Images/Instructions.png', import.meta.url).href;
const lowersifters = new URL('../Images/LowerSifters.png', import.meta.url).href;
const highersifters = new URL('../Images/HigherSifters.png', import.meta.url).href;
const lowerunderbosses = new URL('../Images/LowerUnderBosses.png', import.meta.url).href;
const higherunderbosses = new URL('../Images/HigherUnderBosses.png', import.meta.url).href;

export type IconKey = keyof typeof Icons;

export const Icons = {
  Admins: bosses,
  Filters: filters,
  Sifters: sifters,
  Members: minions,
  Root: foundation,
  Steps: instructions,
  Sievers: lowersifters,
  Partitions: dashboards,
  Mediators: underbosses,
  Classifiers: highersifters,
  Managers: higherunderbosses,
  Overseers: lowerunderbosses,
} as const;

export function iconForEntity(entityName: string): string {
  const key = capitalizeFirstLetter(getAlias(entityName)) as IconKey;
  return Icons[key];
}
