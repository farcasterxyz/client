export type ValueOf<T> = T[keyof T];

declare const brand: unique symbol;

// https://twitter.com/mattpocockuk/status/1625173884885401600?s=46&t=EGeP1ok69hbddrS-SQk77g
export type Brand<T, TBrand extends string> = T & {
  [brand]: TBrand;
};
