const app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    habits: [],
    selectedDate: new Date(new Date().toDateString()).getTime(),
    locale: app.globalData.locale.index,
    statusBarHeight: app.globalData.systemInfo.statusBarHeight
  },

  /**
   * Lifecycle function--Called when page load
   */
  async onLoad(options) {
    await this.login()
    this.retrieveHabitsFromStorage()
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    this.retrieveHabitsFromStorage()
  },
  retrieveHabitsFromStorage() {
    let habits = wx.getStorageSync('habits')
    if (!!habits) {
      this.updateHabitsProgressByDate(habits, this.data.selectedDate)
    } else {
      this.retrieveHabitsFromServer()
    }
  },
  retrieveHabitsFromServer() {
    if (!app.globalData.openId) {
      return
    }
    let db = wx.cloud.database()
    db.collection('UserHabit').where({
      _openid: app.globalData.openId
    }).get({
      success: res => {
        let habits = res.data
        this.updateHabitsProgressByDate(habits, this.data.selectedDate)
        wx.setStorage({
          data: habits,
          key: 'habits',
        })
      }
    })
  },
  updateHabitsProgressByDate(habits, date) {
    for (let i in habits) {
      let habit = habits[i]
      let currentProgress = 0
      for (let j in habit.progresses) {
        if (habit.progresses[j].date == date) {
          currentProgress = habit.progresses[j].progress
          break
        }
      }
      habit.currentProgress = currentProgress
    }
    this.setData({
      habits: habits,
      selectedDate: date
    })
  },
  async login() {
    wx.showLoading({
      title: '正在登录',
      mask: true
    })
    let callLoginFunction = await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          resolve(res)
        },
        fail: () => {
          reject()
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    }).catch(() => {
      wx.navigateTo({
        url: '../error/loginfailed',
      })
    })
    app.globalData.openId = callLoginFunction.result.openid
    wx.getSetting({
      success: setting => {
        if (setting.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: ui => {
              app.globalData.userInfo = ui.userInfo
              app.saveUserInfoToServer(app.globalData.openId, ui.userInfo)
            },
            fail: err => {
              console.error(err)
            }
          })
        }
      }
    })
  },
  addHabit() {
    wx.vibrateShort()
    wx.navigateTo({
      url: '../addHabit/addHabit',
    })
  },
  dateSelected(e) {
    wx.vibrateShort()
    this.updateHabitsProgressByDate(this.data.habits, e.detail.selectedDate)
  }
})