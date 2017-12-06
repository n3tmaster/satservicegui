function calSetWhen(_y, _m, _d) {
  vm.when = new Date(_y, _m, _d)
}
function calendar(startDate, hotDates) {
  var m = startDate.getMonth(), y = startDate.getFullYear();
  var html ='';
  var days_labels = ['D', 'L', 'Ma', 'Me', 'G', 'V', 'S'];

  var days_in_month = monthDays(m, y),
      first_day_date = new Date(y, m, 1),
      first_day_weekday = first_day_date.getDay();

  var prevM = m == 0 ? 11 : m - 1,
      prevY = prevM == 11 ? y - 1 : y,
      prevDays = monthDays(prevM, prevY);

  // 0 = last day of the previous month
  function monthDays(_m, _y) { return new Date(_y, _m + 1, 0).getDate(); }

  function dateToYMD(date) {
    var _d=date.getDate(), _m=date.getMonth()+1, _y=date.getFullYear();
    return ''+_y+'-'+(_m<=9 ? '0' + _m : _m)+'-'+(_d <= 9 ? '0' + _d : _d);
  }

  html += '<table class="calendar-table">';

  // week days labels
  html += '<tr class="week-days">';
  for (var i = 0; i <= 6; i++) { html += '<td class="day">'+days_labels[i]+'</td>'; }
  html += '</tr>';

  var w = 0; // week day
  var n = 1; // next days date
  var c = 1; // current date

  // dates loop
  for (var i = 0; i < 6*days_labels.length; i++) {
    if (w == 0) {
      // first week's day
      html += '<tr class="week">';
    }
    if (i < new Date(y, m, 1).getDay()) {
      // previous month's day
      html += '<td class="day off">' + (prevDays - first_day_weekday + i + 1) + '</td>';
    } else if (c > days_in_month) {
      // next month's day
      html += '<td class="day off">' + n + '</td>';
      n++;
    } else {
      // current month's day
      var display_date = new Date(y, m, c);
      var dayClasses = ['day'];
      if (display_date.toDateString() == (new Date).toDateString()) { dayClasses.push('today') }
      var isHot = hotDates.indexOf(dateToYMD(display_date)) >= 0
      var cellContent = c;
      if (isHot) {
        dayClasses.push('dayOn')
        var a = document.createElement('a');
        a.setAttribute("onclick", "vm.when='"+dateToYMD(display_date)+"';" );
        a.setAttribute("href", "javascript:void(0)");
        a.innerHTML = c;
        cellContent = a.outerHTML;
      }
      html += '<td class="'+dayClasses.join(' ')+'">'+cellContent+'</td>';
      c++;
    }

    if (w == days_labels.length - 1) {
      // last week's day
      html += '</tr>'; w = 0;
    } else { w++; }
  }

  html += '</tr></table>';
  return html;
}