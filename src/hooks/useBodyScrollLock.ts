import { useEffect } from 'react';

/**
 * Hook to prevent body scrolling when modals are open
 * @param isOpen - Whether the modal is open
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);
}