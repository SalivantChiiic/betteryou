const app = getApp()
const db = wx.cloud.database()
Page({

  /**
   * Page initial data
   */
  data: {
    habits: [],
    selectedDate: new Date(new Date().toDateString()).getTime(),
    locale: app.globalData.locale.index,
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    dayOfToday: (new Date()).getDay(),
  },

  /**
   * Lifecycle function--Called when page load
   */
  async onLoad(options) {
    let habits = wx.getStorageSync('habits')
    await this.login(!!habits && habits.length > 0)
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
    if (!!habits && habits.length > 0) {
      this.updateHabitsProgressByDate(habits, this.data.selectedDate)
    } else {
      if (!!app.globalData.openId) {
        this.retrieveHabitsFromServer()
      }
    }
  },
  retrieveHabitsFromServer() {
    if (!app.globalData.openId) {
      return
    }
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
    let dayOfToday = new Date(date).getDay().toString()
    for (let i in habits) {
      let habit = habits[i]
      if (habit.trackDays.indexOf(dayOfToday) >= 0) {
        let currentProgress = 0
        for (let j in habit.progresses) {
          if (habit.progresses[j].date == date) {
            currentProgress = habit.progresses[j].progress
            break
          }
        }
        habit.currentProgress = currentProgress
        habit.trackToday = true
      } else {
        habit.trackToday = false
      }
    }
    this.setData({
      habits: habits,
      selectedDate: date,
      dayOfToday: dayOfToday
    })
  },
  async login(isHabitsInStorage) {
    if (!isHabitsInStorage) {
      wx.showLoading({
        title: this.data.locale.isLogin,
        mask: true
      })
    }
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
      wx.showToast({
        title: this.locale.loginFailedToast,
      })
      return
    })
    app.globalData.openId = callLoginFunction.result.openid
    this.syncHabitsToServer()
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
  syncHabitsToServer() {
    console.log('Syncing habits to server...')
    let habits = wx.getStorageSync('habits')
    for (let i in habits) {
      let id = habits[i]._id
      delete habits[i]._id
      delete habits[i]._openid
      db.collection('UserHabit').doc(id).set({
        data: habits[i],
        success: () => {
          console.log(habits[i].name + ' synced.')
        },
        fail: err => {
          console.error(err)
        }
      })
    }
  },
  addHabit() {
    wx.vibrateShort()
    wx.navigateTo({
      url: '../addHabit/addHabit',
    })
  },
  dateSelected(e) {
    wx.vibrateShort()
    let habits = wx.getStorageSync('habits')
    // let clickId = '#habitsection'
    // this.animate(clickId, [
    //   { opacity: 0.6, scale: [0.95]},
    //   { opacity: 1, scale: [1] }
    // ], 200, function () {
    //   this.clearAnimation(clickId)
    // }.bind(this))
    this.updateHabitsProgressByDate(habits, e.detail.selectedDate)
  }
})