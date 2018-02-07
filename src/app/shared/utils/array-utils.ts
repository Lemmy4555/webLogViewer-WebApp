export class ArrayUtils {

  static getLast<T>(array: Array<T>): T {
    return array.length > 0 ? array[array.length - 1] : null;
  }

  static getFirst<T>(array: Array<T>): T {
    return array.length > 0 ? array[0] : null;
  }

  static remove<T>(array: Array<T>, index: number = 0) {
    if(array.length > index) {
      array.splice(index, 1)
    }
  }

  static removeLast<T>(array: Array<T>, index: number = 0) {
    if(array.length > 0) {
      array.splice(array.length - 1, 1);
    }
  }

  static removeFirst<T>(array: Array<T>, index: number = 0) {
    if(array.length > 0) {
      array.splice(0, 1);
    }
  }

  static set<T>(array: Array<T>, index: number = 0, item: T) {
    if(array.length > index) {
      array.splice(index, 0, item);
    }
  }
}