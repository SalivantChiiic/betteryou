// miniprogram/pages/addHabit/addHabit.js
const app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    locale: app.globalData.locale.addHabit,
    selectedColor: '#c1cbd7',
    selectedIcon: '/images/1.png',
    colors: [
      '#c1cbd7',
      '#afb0b2',
      '#939391',
      '#bfbfbf',
      '#e0e5df',
      '#b5c4b1',
      '#8696a7',
      '#9ca8b8',
      '#ececea',
      '#fffaf4',
      '#96a48b',
      '#7b8b6f',
      '#dfd7d7',
      '#656565',
      '#d8caaf',
      '#c5b8a5',
      '#fdf9ee',
      '#f0ebe5',
      '#d3d4cc',
      '#e0cdcf',
      '#b7b1a5',
      '#a29988',
      '#dadad8',
      '#f8ebd8',
      '#965454',
      '#6b5152',
      '#cac3bb',
      '#a6a6a8',
      '#7a7281',
      '#a27e7e',
      '#ead0d1',
      '#faead3',
      '#c7b8a1',
      '#c9c0d3',
      '#eee5f8'
    ],
    icons: [
      '/images/1.png',
      '/images/2.png',
      '/images/3.png',
      '/images/4.png',
      '/images/5.png',
      '/images/6.png',
      '/images/7.png',
      '/images/8.png',
      '/images/9.png',
      '/images/10.png',
      '/images/11.png',
      '/images/12.png',
      '/images/13.png',
      '/images/14.png',
      '/images/15.png',
      '/images/16.png',
      '/images/17.png',
      '/images/18.png',
      '/images/19.png',
      '/images/20.png',
    ],
    goalPeriod: [{
        id: 'daily',
        value: app.globalData.locale.addHabit.daily
      },
      {
        id: 'weekly',
        value: app.globalData.locale.addHabit.weekly
      },
      {
        id: 'monthly',
        value: app.globalData.locale.addHabit.monthly
      },
      {
        id: 'yearly',
        value: app.globalData.locale.addHabit.yearly
      }
    ],
    trackDays: [{
        id: '0',
        value: app.globalData.locale.addHabit.sun
      },
      {
        id: '1',
        value: app.globalData.locale.addHabit.mon
      },
      {
        id: '2',
        value: app.globalData.locale.addHabit.tue
      },
      {
        id: '3',
        value: app.globalData.locale.addHabit.wed
      },
      {
        id: '4',
        value: app.globalData.locale.addHabit.thu
      },
      {
        id: '5',
        value: app.globalData.locale.addHabit.fri
      },
      {
        id: '6',
        value: app.globalData.locale.addHabit.sat
      }
    ],
    privacySetting: [{
        id: 'public',
        value: app.globalData.locale.addHabit.public
      },
      {
        id: 'private',
        value: app.globalData.locale.addHabit.private
      }
    ],
    habitToSave: {
      color: '#c1cbd7',
      goalPeriod: 'daily',
      trackDays: ['0', '1', '2', '3', '4', '5', '6'],
      privacySetting: 'public',
      motivateNotes: '',
      iconUrl: '/images/1.png'
    }
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    let randomIndex = Math.round(Math.random() * 10)
    if (!!app.globalData.habitToEdit) {
      let goalPeriodSelectedButton
      switch (app.globalData.habitToEdit.goalPeriod) {
        case "daily":
          goalPeriodSelectedButton = [0]
          break;
        case "weekly":
          goalPeriodSelectedButton = [1]
          break;
        case "monthly":
          goalPeriodSelectedButton = [2]
          break;
        case "yearly":
          goalPeriodSelectedButton = [3]
          break;
      }
      this.setData({
        goalPeriodSelectedButton: goalPeriodSelectedButton,
        habitToSave: app.globalData.habitToEdit
      })
      app.globalData.habitToEdit = null
    }
  },
  selectColor(e) {
    this.setData({
      selectedColor: e.currentTarget.dataset.color
    })
    this.data.habitToSave.color = this.data.selectedColor
  },
  selectIcon(e) {
    this.setData({
      selectedIcon: e.currentTarget.dataset.url
    })
    this.data.habitToSave.iconUrl = this.data.selectedIcon
  },
  inputName(e) {
    this.data.habitToSave.name = e.detail.value
  },
  inputGoal(e) {
    this.data.habitToSave.goal = e.detail.value
  },
  inputUnit(e) {
    this.data.habitToSave.unit = e.detail.value
  },
  updateGoalPeriod(e) {
    this.data.habitToSave.goalPeriod = e.detail.selectedItem
  },
  updateTrackDays(e) {
    this.data.habitToSave.trackDays = e.detail.selectedItems
  },
  inputMotivateNotes(e) {
    this.data.habitToSave.motivateNotes = e.detail.value
  },
  updatePrivacySetting(e) {
    this.data.habitToSave.privacySetting = e.detail.selectedItem
  },
  saveHabit() {
    if (!this.data.habitToSave.createDate) {
      this.data.habitToSave.createDate = Date.now()
      this.data.habitToSave.openId = app.globalData.openId
      this.data.habitToSave.progresses = []
      this.data.habitToSave._id = Date.now().toString()
      let habits = wx.getStorageSync('habits')
      habits.push(this.data.habitToSave)
      wx.setStorage({
        data: habits,
        key: 'habits',
      })
      let db = wx.cloud.database()
      db.collection('UserHabit').add({
        data: this.data.habitToSave
      })
    }
    wx.navigateBack({
      delta: 0,
    })
  }
})