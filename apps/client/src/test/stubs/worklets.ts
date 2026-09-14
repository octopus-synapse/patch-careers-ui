/** `react-native-worklets` has no JS form; anything reaching it in jsdom gets no-ops. */
export const runOnJS = <T extends (...args: never[]) => unknown>(fn: T): T => fn;
export const runOnUI = <T extends (...args: never[]) => unknown>(fn: T): T => fn;
export default {};
