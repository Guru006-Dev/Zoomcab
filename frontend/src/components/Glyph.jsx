import { isValidElement } from 'react';
import {
    Briefcase, Car, Coffee, Crown, Fire, Heart, House, Lightning, MapPin, Medal, Moon,
    PersonSimpleRun, Bed, ForkKnife, GasPump, Star, Sun, Ticket, Trophy, Wrench,
} from '@phosphor-icons/react';

const GLYPHS = {
    bed: Bed, car: Car, coffee: Coffee, crown: Crown, fire: Fire, food: ForkKnife, fuel: GasPump,
    heart: Heart, home: House, lightning: Lightning, medal: Medal, moon: Moon, pin: MapPin,
    run: PersonSimpleRun, star: Star, sun: Sun, ticket: Ticket, trophy: Trophy, work: Briefcase,
    wrench: Wrench,
};

// places saved before the restyle stored an emoji in the browser
const SAVED = { '\u{1F3E0}': 'home', '\u{1F4BC}': 'work', '\u{1F4CD}': 'pin' };

/** An icon chosen by name, for lists kept as data. Unknown names (older saved data) show a pin. */
export default function Glyph({ name, size = '1em' }) {
    if (isValidElement(name)) return name; // some lists use a photo instead
    const Icon = GLYPHS[SAVED[name] ?? name] ?? MapPin;
    return <Icon size={size} weight="duotone" aria-hidden />;
}
