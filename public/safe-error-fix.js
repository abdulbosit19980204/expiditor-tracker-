// Safe error fix that doesn't interfere with React's internal operations
// This version only fixes critical forEach errors without overriding other array methods

if (typeof window !== "undefined") {
  console.log("[Safe Error Fix] Initializing minimal error prevention");

  // Only override forEach as it's the most critical and safe
  const originalForEach = Array.prototype.forEach;
  Array.prototype.forEach = function(callback, thisArg) {
    if (this == null) {
      console.warn("[Safe Error Fix] forEach called on null/undefined, skipping");
      return;
    }
    if (typeof callback !== 'function') {
      throw new TypeError('forEach callback must be a function');
    }
    return originalForEach.call(this, callback, thisArg);
  };

  // Safe Object.prototype.toString override
  const originalToString = Object.prototype.toString;
  Object.prototype.toString = function() {
    if (this == null) {
      return '[object Null]';
    }
    return originalToString.call(this);
  };

  console.log("[Safe Error Fix] Minimal error prevention initialized successfully");
}
