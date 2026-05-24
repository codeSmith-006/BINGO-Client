import { gameCellBaseClass, setupCellBaseClass } from '../utils/uiClasses';

/**
 * Cell — Individual Bingo grid cell component.
 * Handles display for both setup and gameplay phases.
 */
export default function Cell({ number, isMarked, onClick, disabled, variant = 'game' }) {
  const baseClass = variant === 'game' ? gameCellBaseClass : setupCellBaseClass;

  let variantClass = 'hover:bg-[#FFD7B8] hover:text-[#25343F]';
  if (variant === 'setup-empty') {
    variantClass = 'border-dashed border-[#8D99A1] bg-[#EAEFEF] shadow-none hover:border-[#FF9B51] hover:bg-[#D9E1E6]';
  } else if (variant === 'setup-filled') {
    variantClass = 'bg-[#FF9B51] text-[#25343F] ring-2 ring-[#25343F]/15';
  } else if (isMarked) {
    variantClass = "border-[#25343F] bg-[#FF9B51] text-[#25343F] shadow-[0_0_0_2px_#25343F,inset_0_-4px_0_rgba(37,52,63,0.18)] after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.65),transparent_55%)]";
  } else {
    variantClass = 'bg-[#EAEFEF] text-[#25343F] shadow-[1px_1px_0_#25343F] hover:bg-[#FFE7D3] sm:shadow-[2px_2px_0_#25343F]';
  }

  if (disabled) {
    variantClass += isMarked ? '' : ' cursor-not-allowed opacity-70';
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
