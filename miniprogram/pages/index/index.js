const app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    habits: [],
    selectedDate: new Date(new Date().toDateString()).getTime()
  },

  /**
   * Lifecycle function--Called when page load
   */
  async onLoad(options) {
    await this.login()
    this.retrieveHabits()
  },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },
  retrieveHabits() {
    let habits = wx.getStorageSync('habits')
    if (!!habits) {
      this.calculateHabitsCurrentProgress(habits)
      this.setData({
        habits: habits
      })
    }
    this.retrieveHabitsFromServer()
  },
  retrieveHabitsFromServer() {
    let db = wx.cloud.database()
    db.collection('UserHabit').where({
      _openid: app.globalData.openId
    }).get({
      success: res => {
        let habits = res.data
        this.calculateHabitsCurrentProgress(habits)
        debugger
        this.setData({
          habits: habits
        })
        wx.setStorage({
          data: habits,
          key: 'habits',
        })
      }
    })
  },
  calculateHabitsCurrentProgress(habits) {
    for (let i in habits) {
      let habit = habits[i]
      let currentProgress = 0
      for (let j in habit.progresses) {
        if (habit.progresses[j].date == this.data.selectedDate) {
          currentProgress = habit.progresses[j].progress
          break
        }
      }
      habit.currentProgress = currentProgress
    }
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
    wx.navigateTo({
      url: '../addHabit/addHabit',
    })
  }
})