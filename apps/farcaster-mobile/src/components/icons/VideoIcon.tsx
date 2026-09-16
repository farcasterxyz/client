import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function VideoIcon({
  size: baseSize,
  color: baseColor,
  bgColor,
  unread,
}: {
  size: number;
  color: string;
  bgColor: string;
  unread?: boolean;
}) {
  const size = baseSize ?? 24;
  const color = baseColor ?? '#24292E';
  if (unread) {
    return (
      <Svg width={size} height={size} viewBox="0 0 23 23" fill="none">
        <Path
          d="M2.30005 7.44141H19.8883"
          stroke={color}
          strokeWidth="2.42"
          strokeLinejoin="round"
        />
        <Path
          d="M13.2251 3.4502L15.5251 7.43384"
          stroke={color}
          strokeWidth="2.42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M7.4751 3.4502L9.7751 7.43391"
          stroke={color}
          strokeWidth="2.42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.58385 16.2219C9.46705 16.1545 9.37007 16.0575 9.30268 15.9407C9.23529 15.8238 9.19986 15.6913 9.19995 15.5564V11.1196C9.19979 10.9846 9.23521 10.8519 9.30265 10.7349C9.37009 10.6179 9.46716 10.5207 9.58409 10.4532C9.70102 10.3856 9.83369 10.3501 9.96873 10.3501C10.1038 10.3501 10.2364 10.3857 10.3533 10.4533L14.1965 12.6721C14.3135 12.7396 14.4106 12.8366 14.4782 12.9535C14.5457 13.0704 14.5813 13.203 14.5813 13.338C14.5813 13.4731 14.5457 13.6057 14.4782 13.7226C14.4106 13.8395 14.3135 13.9365 14.1965 14.0039L10.3533 16.2228C10.2364 16.2903 10.1037 16.3259 9.96859 16.3259C9.83352 16.3259 9.70082 16.2903 9.58385 16.2228V16.2219Z"
          fill={color}
        />
        <Path
          d="M18.2083 2.875H4.79167C3.73312 2.875 2.875 3.73312 2.875 4.79167V18.2083C2.875 19.2669 3.73312 20.125 4.79167 20.125H18.2083C19.2669 20.125 20.125 19.2669 20.125 18.2083V4.79167C20.125 3.73312 19.2669 2.875 18.2083 2.875Z"
          stroke={color}
          strokeWidth="2.42"
          strokeLinecap="round"
          stroke-linejoin="round"
        />
        <Circle cx="19" cy="4" r="3.5" fill="#D51338" stroke={bgColor} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2 6.4707H17.2941"
        stroke={color}
        strokeWidth="1.92"
        strokeLinejoin="round"
      />
      <Path
        d="M11.5 3L13.5 6.46404"
        stroke={color}
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 3L8.5 6.4641"
        stroke={color}
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.33382 14.1059C8.23226 14.0473 8.14793 13.9629 8.08933 13.8614C8.03073 13.7598 7.99992 13.6445 8 13.5273V9.66917C7.99986 9.55174 8.03066 9.43635 8.0893 9.33461C8.14794 9.23287 8.23235 9.14838 8.33403 9.08964C8.43571 9.0309 8.55108 8.99998 8.6685 9C8.78593 9.00002 8.90128 9.03098 9.00294 9.08976L12.3449 11.0192C12.4466 11.0778 12.531 11.1622 12.5898 11.2638C12.6485 11.3655 12.6794 11.4808 12.6794 11.5982C12.6794 11.7156 12.6485 11.8309 12.5898 11.9326C12.531 12.0342 12.4466 12.1186 12.3449 12.1773L9.00294 14.1067C8.90122 14.1654 8.78584 14.1963 8.66838 14.1963C8.55093 14.1963 8.43554 14.1654 8.33382 14.1067V14.1059Z"
        fill={color}
      />
      <Path
        d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z"
        stroke={color}
        strokeWidth="1.92"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
