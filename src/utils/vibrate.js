/**
 * Vibration utility
 * Provides haptic feedback for mobile devices
 */

/**
 * Vibrate the device
 * @param {number|number[]} pattern - Vibration pattern (ms or array of ms)
 */
export function vibrate(pattern) {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (error) {
      // Vibration not supported or failed
    }
  }
}

/**
 * Success vibration pattern
 */
export function vibrateSuccess() {
  vibrate([20, 30, 20]);
}

/**
 * Error vibration pattern
 */
export function vibrateError() {
  vibrate([40, 30, 40]);
}

/**
 * Tap vibration pattern
 */
export function vibrateTap() {
  vibrate(10);
}

/**
 * Long press vibration pattern
 */
export function vibrateLongPress() {
  vibrate(50);
}