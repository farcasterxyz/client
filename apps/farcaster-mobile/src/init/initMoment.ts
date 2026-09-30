import moment from 'moment';

const initMoment = () => {
  moment.updateLocale('en', {
    calendar: {
      lastDay: '[Yesterday]',
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      lastWeek: '[Last] dddd',
      nextWeek: '[Next] dddd',
      sameElse: 'L',
    },
    relativeTime: {
      future: 'in %s',
      past: '%s',
      s: function (_number, withoutSuffix) {
        return withoutSuffix ? 'now' : 'just now';
      },
      m: '1m',
      mm: '%dm',
      h: '1h',
      hh: '%dh',
      d: '1d',
      dd: '%dd',
      M: '1mth',
      MM: '%dmth',
      y: '1y',
      yy: '%dy',
    },
  });
};

export { initMoment };
