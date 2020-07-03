const app = getApp()
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
    previousDate: ''
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
        currentDate: this.data.locale.today,
        previousDate: this.data.locale.yesterday
      })
      let eventDetail = {
        selectedDate: new Date(new Date().toDateString()).getTime()
      }
      let eventOption = {
        composed: true
      }
      this.triggerEvent('dateSelected', eventDetail, eventOption)
    },
    goToPreviousDay() {
      if(this.data.currentDate == this.data.locale.today) {
        this.data.currentDate = new Date(new Date().toDateString())
        this.data.currentDate = this.data.currentDate.setDate(this.data.currentDate.getDate() - 1)
      }

      let eventDetail = {
        selectedDate: this.data.currentDate
      }
      let eventOption = {
        composed: true
      }
      this.triggerEvent('dateSelected', eventDetail, eventOption)
    }
  }
})