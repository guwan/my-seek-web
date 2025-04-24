/**
 * 字符串工具类
 *
 */
class StringUtil {

  /**
   * 判断字符串是否为空或undefined,不判断为0,不判断为false
   * @param str
   * @returns {boolean}
   */
  public static isEmpty = (str: any): boolean => {
    if (str === null || str === '' ||
      str === undefined || str.length === 0
    ) {
      return true
    }
    return false

  };

  /**
   * 判断字符串是否不为空或不undefined,不判断为0,不判断为false
   * @param str
   * @returns {boolean}
   */
  public static isNotEmpty = (str: any): boolean => {
    if (
      str === null || str === '' ||
      str === undefined || str.length === 0
    ) {
      return false
    }
    return true

  };
  /**
   * 指定长度和基数生成uuid
   */
  public static uuid = (len: number, radix: number): string => {
    const chars: string[] = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    const uuid = [];
    let i;
    const newRadix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * newRadix];
    } else {
      // rfc4122, version 4 form
      let r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  }
}

export default StringUtil
