const app = getApp()
var dateHelper = require('../../utils/datehelper.js')
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    locale: app.globalData.locale.index,
    currentDate: '',
    previousDate: '',
    currentDateLabel: '',
    previousDateLabel: ''
  },

  lifetimes: {
    attached() {
      this.backToToday()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    backToToday() {
      this.setData({
        currentDateLabel: this.data.locale.today,
        previousDateLabel: this.data.locale.yesterday
      })
      this.data.currentDate = new Date(new Date().toDateString())
      let eventDetail = {
        selectedDate: this.data.currentDate.getTime()
      }
      let eventOption = {
        composed: true
      }
      this.triggerEvent('dateSelected', eventDetail, eventOption)
    },
    goToPreviousDay() {
      let previousDate = new Date(this.data.currentDate)
      previousDate.setDate(previousDate.getDate() - 1)
      let dateBeforePreviousDate = new Date(previousDate.toDateString())
      dateBeforePreviousDate.setDate(dateBeforePreviousDate.getDate() - 1)
      if (this.data.currentDateLabel == this.data.locale.today) {
        this.setData({
          currentDateLabel: this.data.locale.yesterday,
          previousDateLabel: dateHelper.convertDateToString(dateBeforePreviousDate, app.globalData.displayInEnglish)
        })
      } else {
        this.setData({
          currentDateLabel: dateHelper.convertDateToString(previousDate, app.globalData.displayInEnglish),
          previousDateLabel: dateHelper.convertDateToString(dateBeforePreviousDate, app.globalData.displayInEnglish)
        })
      }
      this.data.currentDate = previousDate

      let eventDetail = {
        selectedDate: previousDate.getTime()
      }
      let eventOption = {
        composed: true
      }
      this.triggerEvent('dateSelected', eventDetail, eventOption)
    }
  }
})