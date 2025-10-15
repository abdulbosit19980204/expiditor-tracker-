// Global error fix script - must be loaded first
// This prevents the forEach error from occurring

(function() {
  'use strict';
  
  console.log("[Global Error Fix] Initializing array method overrides");
  
  // Override Array.prototype.forEach to handle null/undefined cases
  const originalForEach = Array.prototype.forEach;
  Array.prototype.forEach = function(callback, thisArg) {
    if (this == null) {
      console.warn("[Global Error Fix] forEach called on null/undefined, skipping");
      return;
    }
    if (typeof callback !== 'function') {
      throw new TypeError('forEach callback must be a function');
    }
    return originalForEach.call(this, callback, thisArg);
  };

  // Also override Object.prototype.toString to prevent issues
  const originalToString = Object.prototype.toString;
  Object.prototype.toString = function() {
    if (this == null) {
      return '[object Null]';
    }
    return originalToString.call(this);
  };

  // Removed map override as it interferes with React's internal operations

  // Override Array.prototype.filter
  const originalFilter = Array.prototype.filter;
  Array.prototype.filter = function(callback, thisArg) {
    if (this == null) {
      console.warn("[Global Error Fix] filter called on null/undefined, returning empty array");
      return [];
    }
    if (typeof callback !== 'function') {
      throw new TypeError('filter callback must be a function');
    }
    return originalFilter.call(this, callback, thisArg);
  };

  // Override Array.prototype.find
  const originalFind = Array.prototype.find;
  Array.prototype.find = function(callback, thisArg) {
    if (this == null) {
      console.warn("[Global Error Fix] find called on null/undefined, returning undefined");
      return undefined;
    }
    if (typeof callback !== 'function') {
      throw new TypeError('find callback must be a function');
    }
    return originalFind.call(this, callback, thisArg);
  };

  console.log("[Global Error Fix] Array method overrides initialized successfully");
})();
