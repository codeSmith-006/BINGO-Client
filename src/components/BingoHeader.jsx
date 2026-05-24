/**
 * BingoHeader — Displays B-I-N-G-O letters with progressive highlighting.
 * Each letter lights up when a line is completed.
 */
import { BINGO_LETTERS } from '../utils/constants';
import { bingoLetterActiveClass, bingoLetterBaseClass } from '../utils/uiClasses';

export default function BingoHeader({ lineCount = 0, label = '', compact = false }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className={`${compact ? 'text-[0.62rem]' : 'text-xs'} font-semibold text-[#6F7F89] uppercase tracking-[0.15em]`}>
          {label}
        </span>
      )}
      <div className={`flex ${compact ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-3'}`}>
        {BINGO_LETTERS.map((letter, index) => (
          <span
            key={letter}
            className={`${bingoLetterBaseClass} ${compact ? 'text-[clamp(1rem,4vw,1.45rem)]' : ''} ${index < lineCount ? bingoLetterActiveClass : ''}`}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
