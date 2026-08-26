// https://github.com/TitanInvest/react-native-easy-markdown/pull/14
declare module 'react-native-easy-markdown' {
  import React from 'react';
  import { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';

  export enum TextType {
    h1 = 'h1',
    h2 = 'h2',
    h3 = 'h3',
    h4 = 'h4',
    h5 = 'h5',
    h6 = 'h6',
    strong = 'strong',
    del = 'del',
    em = 'em',
    u = 'u',
  }

  interface IProps {
    debug?: boolean;
    parseInline?: boolean;
    useDefaultStyles?: boolean;
    renderImage?: (
      src: string,
      alt: string,
      title: string,
      key: string,
    ) => React.ReactNode;
    renderLink?: (
      href: string,
      title: string,
      children: React.ReactNode,
      key: string,
      extraThing: boolean,
    ) => React.ReactNode;
    renderListBullet?: (ordered: boolean, index: number) => React.ReactNode;
    renderLine?: (key: string) => React.ReactNode;
    renderText?: (
      children: React.ReactNode,
      key: string,
      extras: { styles: StyleProp<TextStyle> },
      textType: TextType,
    ) => React.ReactNode;
    renderBlockQuote?: (
      children: React.ReactNode,
      key: string,
    ) => React.ReactNode;
    renderBlockText?: (
      children: React.ReactNode,
      key: string,
    ) => React.ReactNode;
    renderBlock?: (children: React.ReactNode, key: string) => React.ReactNode;
    markdownStyles?: {
      block?: StyleProp<ViewStyle>;
      blockQuote?: StyleProp<TextStyle>;
      del?: StyleProp<TextStyle>;
      em?: StyleProp<TextStyle>;
      h1?: StyleProp<TextStyle>;
      h2?: StyleProp<TextStyle>;
      h3?: StyleProp<TextStyle>;
      h4?: StyleProp<TextStyle>;
      h5?: StyleProp<TextStyle>;
      h6?: StyleProp<TextStyle>;
      hr?: StyleProp<TextStyle>;
      image?: StyleProp<TextStyle>;
      imageWrapper?: StyleProp<ViewStyle>;
      link?: StyleProp<TextStyle>;
      linkWrapper?: StyleProp<TextStyle>;
      list?: StyleProp<TextStyle>;
      listItem?: StyleProp<TextStyle>;
      listItemBullet?: StyleProp<TextStyle>;
      listItemContent?: StyleProp<TextStyle>;
      listItemNumber?: StyleProp<TextStyle>;
      strong?: StyleProp<TextStyle>;
      text?: StyleProp<TextStyle>;
      u?: StyleProp<TextStyle>;
    };
  }

  // eslint-disable-next-line import/no-default-export
  export default class Markdown extends React.Component<IProps & ViewProps> {}
}
