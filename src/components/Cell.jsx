/**
 * Cell — Individual Bingo grid cell component.
 * Handles display for both setup and gameplay phases.
 */
export default function Cell({ number, isMarked, onClick, disabled, variant = 'game' }) {
    const baseClass = `bingo-cell ${variant === 'game' ? 'game-cell' : 'setup-cell'}`;

    let variantClass = '';
    if (variant === 'setup-empty') {
        variantClass = 'empty-setup';
    } else if (variant === 'setup-filled') {
        variantClass = 'filled-setup';
    } else if (isMarked) {
        variantClass = 'marked';
    }

    if (disabled) {
        variantClass += ' disabled';
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
