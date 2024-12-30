export function format(first?: string, middle?: string, last?: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export const OverflowFinder = (function () {
  // Función para obtener el elemento padre con overflow
  function getClosestOverflowParent(element) {
      if (!element) return null;

      let parent = element.parentElement;

      while (parent) {
          const style = window.getComputedStyle(parent);
          const overflow = style.overflow + style.overflowX + style.overflowY;

          if (/(hidden|scroll|auto)/.test(overflow)) {
              return parent;
          }

          parent = parent.parentElement;
      }

      return null; // Si no se encuentra ningún padre con overflow
  }

  return {
      find: getClosestOverflowParent
  };
})();