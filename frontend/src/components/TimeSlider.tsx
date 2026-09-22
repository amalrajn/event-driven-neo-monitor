import { fullDate } from "../lib/format";

interface TimeSliderProps {
    days: number;
    onChange: (days: number) => void;
    disabled?: boolean;
    max?: number;
}

const DAY_MS = 86_400_000;

// Scrubs the activity window back through history: 0 = now, `max` = max days ago.
export function TimeSlider({ days, onChange, disabled, max = 90 }: TimeSliderProps) {
    const at = new Date(Date.now() - days * DAY_MS).toISOString();

    return (
        <div className={`slider${disabled ? " is-disabled" : ""}`}>
            <button
                type="button"
                className="slider-step"
                aria-label="Step back one day"
                disabled={disabled || days >= max}
                onClick={() => onChange(Math.min(max, days + 1))}
            >
                ◀
            </button>
            <input
                type="range"
                min={0}
                max={max}
                value={max - days}
                disabled={disabled}
                aria-label="Activity window"
                aria-valuetext={days === 0 ? "Now" : `${days} days ago`}
                onChange={(event) => onChange(max - Number(event.target.value))}
            />
            <button
                type="button"
                className="slider-step"
                aria-label="Step forward one day"
                disabled={disabled || days === 0}
                onClick={() => onChange(Math.max(0, days - 1))}
            >
                ▶
            </button>
            <span className="slider-readout">{days === 0 ? "Now" : fullDate(at)}</span>
        </div>
    );
}
