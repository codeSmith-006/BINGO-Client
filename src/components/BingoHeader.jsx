/**
 * BingoHeader — Displays B-I-N-G-O letters with progressive highlighting.
 * Each letter lights up when a line is completed.
 */
import { BINGO_LETTERS } from '../utils/constants';

export default function BingoHeader({ lineCount = 0, label = '' }) {
    return (
        <div className="flex flex-col items-center gap-1">
            {label && (
                <span className="text-xs font-semibold text-[#6F7F89] uppercase tracking-[0.15em]">
                    {label}
                </span>
            )}
            <div className="flex gap-2 sm:gap-3">
                {BINGO_LETTERS.map((letter, index) => (
                    <span
                        key={letter}
                        className={`bingo-letter ${index < lineCount ? 'active' : ''}`}
                    >
                        {letter}
                    </span>
                ))}
            </div>
        </div>
    );
}
