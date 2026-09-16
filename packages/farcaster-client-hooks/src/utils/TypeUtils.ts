export type Mutable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type Primitive =
  | string
  | Function
  | number
  | boolean
  | symbol
  | undefined
  | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepOmitArray<T extends any[], K> = {
  [P in keyof T]: DeepOmit<T[P], K>;
};

// https://stackoverflow.com/questions/55539387/deep-omit-with-typescript
export type DeepOmit<T, K> = T extends Primitive
  ? T
  : {
      [P in Exclude<keyof T, K>]: T[P] extends infer TP
        ? TP extends Primitive
          ? TP // leave primitives and functions alone
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            TP extends any[]
            ? DeepOmitArray<TP, K> // Array special handling
            : DeepOmit<TP, K>
        : never;
    };
