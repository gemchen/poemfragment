var app = getApp()

const formatTime = date => {
  const year = date.getFullYear()+'年'
  const month = (date.getMonth() + 1)+'月'
  const day = date.getDate()+'日'+' '
  const hour = date.getHours()
  const minute = date.getMinutes()
  const Day = date.getDay() 
  const week = ['周日','周一','周二','周三','周四','周五','周六']

  return `${week[Day]} ${[year, month, day].map(formatNumber).join('')} ${[hour, minute].map(formatNumber).join(':')}`
}
const formatTime2 = date => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1)
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const Day = date.getDay() 
  const week = ['周日','周一','周二','周三','周四','周五','周六']

  return `${week[Day]} ${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}



function getDateDiff(updatedTimeStamp) {
  // let dateTimeStamp = new Date(dateTime).getTime();
  let result = '';
  let minute = 1000 * 60;
  let hour = minute * 60;
  let day = hour * 24;
  let halfamonth = day * 15;
  let month = day * 30;
  let year = day * 365;
  let now = new Date().getTime();
  let diffValue = now - updatedTimeStamp;
  if (diffValue < 0) {
    return;
  }
  let monthEnd = diffValue / month;
  let weekEnd = diffValue / (7 * day);
  let dayEnd = diffValue / day;
  let hourEnd = diffValue / hour;
  let minEnd = diffValue / minute;
  let yearEnd = diffValue / year;
  if (yearEnd >= 1) {
    result = this.formatTime2(updatedTimeStamp);
  } else if (monthEnd >= 1) {
    result = "" + parseInt(monthEnd) + "月前";
  } else if (weekEnd >= 1) {
    let tmp = diffValue - (parseInt(weekEnd))*7*day
    let dayTmp = tmp/day
    result = dayTmp < 1 ? "" + parseInt(weekEnd) + "周前" : "" + parseInt(weekEnd) + "周" + parseInt(dayTmp) + "天前";
  } else if (dayEnd >= 1) {
    let tmp = diffValue - (parseInt(dayEnd))*day
    let hourTmp = tmp/hour
    result = hourTmp < 1 ? "" + parseInt(dayEnd) + "天前" : "" + parseInt(dayEnd) + "天" + parseInt(hourTmp) + "小时前";
  } else if (hourEnd >= 1) {
    let tmp = diffValue - (parseInt(hourEnd)*hour)
    let minTmp = tmp/minute
    result = minTmp < 1 ? "" + parseInt(hourEnd) + "小时前" : "" + parseInt(hourEnd) + "小时" + parseInt(minTmp) + "分钟前";
  } else if (minEnd >= 1) {
    result = "" + parseInt(minEnd) + "分钟前";
  } else {
    result = "刚刚";
  }
  return result;
};
function getDateDiff2(reviewTimeStamp) {
  // let dateTimeStamp = new Date(dateTime).getTime();
  let result = '';
  let minute = 1000 * 60;
  let hour = minute * 60;
  let day = hour * 24;
  let halfamonth = day * 15;
  let month = day * 30;
  let year = day * 365;
  let now = new Date().getTime();
  let diffValue = reviewTimeStamp - now;
  if (diffValue < 0) {
    result = "";
    return result
  }
  let monthEnd = diffValue / month;
  let weekEnd = diffValue / (7 * day);
  let dayEnd = diffValue / day;
  let hourEnd = diffValue / hour;
  // let minEnd = diffValue / minute;
  let yearEnd = diffValue / year;
  if (yearEnd >= 1) {
    result = dateTime;
  } else if (monthEnd >= 1) {
    result = "" + parseInt(monthEnd) + "月后";
  } else if (weekEnd >= 1) {
    let tmp = diffValue - (parseInt(weekEnd))*7*day
    let dayTmp = tmp/day
    result = dayTmp < 1 ? "" + parseInt(weekEnd) + "周后" : "" + parseInt(weekEnd) + "周" + parseInt(dayTmp) + "天后";
  } else if (dayEnd >= 1) {
    let tmp = diffValue - (parseInt(dayEnd))*day
    let hourTmp = tmp/hour
    result = hourTmp < 1 ? "" + parseInt(dayEnd) + "天后" : "" + parseInt(dayEnd) + "天" + parseInt(hourTmp) + "小时后";
  } else if (hourEnd >= 1) {
    result = "" + parseInt(hourEnd) + "小时后";
  } else {
    result = "即将";
  }
  return result;
};

function alert(res){
  console.log(res)
  wx.showToast({
    title: '请稍后重试',
    icon: 'error',
    duration: 2000
  })
}
function setGlobalData(loginData){
  console.log(loginData)
  app.globalData.data = loginData
  app.globalData.name = loginData.name
  var array = loginData.kidobjs
  if(loginData.defaultkid){
    array.unshift(loginData.defaultkid)
    for(var i=1;i<array.length;i++){
      if(array[i].kidid == array[0].kidid){
        array.splice(i,1)
        break        
      }
    };
  }
  app.globalData.kidobjs = array
  app.globalData.currentKidId = app.globalData.kidobjs[0].kidid
} 

module.exports = {
  setGlobalData,
  alert,
  formatTime,
  formatTime2,
  getDateDiff,
  getDateDiff2
}
