import { gameCellBaseClass, setupCellBaseClass } from '../utils/uiClasses';

/**
 * Cell — Individual Bingo grid cell component.
 * Handles display for both setup and gameplay phases.
 */
export default function Cell({ number, isMarked, onClick, disabled, variant = 'game' }) {
    const baseClass = variant === 'game' ? gameCellBaseClass : setupCellBaseClass;

    let variantClass = 'hover:bg-[#FF9B51] hover:text-[#25343F]';
    if (variant === 'setup-empty') {
        variantClass = 'border-dashed border-[#8D99A1] bg-[#EAEFEF] shadow-none hover:border-[#FF9B51] hover:bg-[#BFC9D1]';
    } else if (variant === 'setup-filled') {
        variantClass = 'bg-[#FF9B51] text-[#25343F]';
    } else if (isMarked) {
        variantClass = "border-[#25343F] bg-[#25343F] text-[#EAEFEF] shadow-[1px_1px_0_#FF9B51] after:pointer-events-none after:absolute after:text-[1.7rem] after:font-black after:opacity-[0.18] after:content-['X'] sm:shadow-[2px_2px_0_#FF9B51]";
    }

    if (disabled) {
        variantClass += ' cursor-not-allowed opacity-55';
    }

    return (
        <button
            className={`${baseClass} ${variantClass}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={number ? `Number ${number}` : 'Empty cell'}
        >
            {number || ''}
        </button>
    );
}
