/**
 * Source: https://gist.github.com/tjmehta/9204891?permalink_comment_id=3527084#gistcomment-3527084
 * Examples:
    objectToQueryString({
      name: 'John Doe',
      age: 20,
      children: [
        { name: 'Foo Doe' },
        { name: 'Bar Doe' }
      ],
      wife: {
        name: 'Jane Doe'
      }
    });
    => name=John%20Doe&age=20&children[0][name]=Foo%20Doe&children[1][name]=Bar%20Doe&wife[name]=Jane%20Doe
 */

export const objectToQueryString = (initialObj: any) => {
  const reducer =
    (obj: any, parentPrefix = null) =>
    (prev: any[], key: any) => {
      const val = obj[key];
      key = encodeURIComponent(key);
      const prefix = parentPrefix ? `${parentPrefix}[${key}]` : key;

      if (val == null || typeof val === "function") {
        prev.push(`${prefix}=`);
        return prev;
      }

      if (["number", "boolean", "string"].includes(typeof val)) {
        prev.push(`${prefix}=${encodeURIComponent(val)}`);
        return prev;
      }

      prev.push(Object.keys(val).reduce(reducer(val, prefix), []).join("&"));
      return prev;
    };

  return Object.keys(initialObj).reduce(reducer(initialObj), []).join("&");
};
