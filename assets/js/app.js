document.addEventListener('DOMContentLoaded', () => {
  // Add a small UX guard to destructive-looking actions.
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', () => {
      const button = form.querySelector('button[type="submit"], button:not([type])');
      if (button && !button.dataset.keepLabel) {
        button.dataset.keepLabel = button.textContent.trim();
        button.disabled = true;
        button.textContent = 'Please wait…';
        window.setTimeout(() => {
          button.disabled = false;
          button.textContent = button.dataset.keepLabel;
        }, 5000);
      }
    });
  });
});
