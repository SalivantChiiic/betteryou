function convertDateToString(date, displayInEnglish) {
  let mon = date.getMonth() + 1
  mon = mon < 10 ? '0' + mon : mon
  let d = date.getDate()
  d = d < 10 ? '0' + d : d
  return mon + '/' + d + ' ' + getDayOfDate(date, displayInEnglish)
}

function getDayOfDate(date, displayInEnglish) {
  let day = date.getDay()
  switch (day) {
    case 0:
      return displayInEnglish? 'SUN' : '周日';
    case 1:
      return displayInEnglish? 'MON' : '周一';
    case 2:
      return displayInEnglish? 'TUE' : '周二';
    case 3:
      return displayInEnglish? 'WED' : '周三';
    case 4:
      return displayInEnglish? 'THU' : '周四';
    case 5:
      return displayInEnglish? 'FRI' : '周五';
    case 6:
      return displayInEnglish? 'SAT' : '周六';
  }
}

module.exports = {
  convertDateToString: convertDateToString
}