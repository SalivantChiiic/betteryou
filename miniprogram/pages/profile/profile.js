var app = getApp()
Page({

  data: {
    windowHeight: 0,
    windowWidth: 0,
    screenHeight: 0,
    groupMembers: [],
    updateGroupSettingPageTitle: '标题定制',
    userInfo: {
      points: 0
    },
    swiperIndex: 0,
    showGroupSettings: false,
    groupSettings: {},
    defaultRankPageTitle: '能量排名',
    defaultProfilePageTitle: '我的主页',
    defaultUserPointsTitle: '总能量'
  },

  onLoad: function (options) {
    let sysInfo = wx.getSystemInfoSync()
    this.setData({
      windowHeight: sysInfo.windowHeight,
      screenHeight: sysInfo.screenHeight,
      windowWidth: sysInfo.windowWidth,
      groupSettings: app.globalData.groupSettings
    })
  },
  onShow: function () {
    if (!!app.globalData.groupSettings && !!app.globalData.groupSettings.rankPageTitle && !!app.globalData.groupSettings.rankPageTitle.length > 0) {
      wx.setNavigationBarTitle({
        title: app.globalData.groupSettings.rankPageTitle
      })
    }
    else {
      wx.setNavigationBarTitle({
        title: this.data.defaultRankPageTitle
      })
    }
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
    this.getGroupMembers()

    if (!!app.globalData.groupSettings && !!app.globalData.groupSettings.userPointsTitle) {
      this.setData({
        userPointsTitle: app.globalData.groupSettings.userPointsTitle
      })
    }
    else {
      this.setData({
        userPointsTitle: this.data.defaultUserPointsTitle
      })
    }
    if((!app.globalData.userInfo && !!app.globalData.openId)){
      wx.switchTab({
        url: '/pages/index/index',
      })
      app.checkIfNeedToShowJoinPage()
      return
    }
  },
  getGroupMembers: async function () {
    let members = await app.getGroupMembers()
    this.setData({
      groupMembers: members
    })
    for (let i in this.data.groupMembers) {
      if (app.globalData.openId == this.data.groupMembers[i]._id) {
        this.setData({
          userInfo: this.data.groupMembers[i]
        })
        break
      }
    }
  },
  switchEntrances: function () {
    wx.navigateTo({
      url: '../entrance/entrance',
    })
  },
  onSwiperChanged: function (e) {
    let swiperIndex = e.detail.current
    if (swiperIndex == 0) {
      wx.setNavigationBarTitle({
        title: !app.globalData.groupSettings || !app.globalData.groupSettings.rankPageTitle ? this.data.defaultRankPageTitle : app.globalData.groupSettings.rankPageTitle
      })
    }
    else if (swiperIndex == 1) {
      wx.setNavigationBarTitle({
        title: !!app.globalData.groupSettings || app.globalData.groupSettings.profilePageTitle ? this.data.defaultProfilePageTitle : app.globalData.groupSettings.profilePageTitle
      })
    }
    else if (swiperIndex == 2) {
      wx.setNavigationBarTitle({
        title: this.data.updateGroupSettingPageTitle
      })
    }
  },
  showGroupSettings: function () {
    this.setData({
      showGroupSettings: true
    })
    setTimeout(() => {
      this.setData({
        swiperIndex: 2
      }), 500
    })
  },
  showRanking: function () {
    this.setData({
      swiperIndex: 0
    })
  },
  showProfile: function () {
    this.setData({
      swiperIndex: 1
    })
  },
  closeGroupSettingsPage: function () {
    this.setData({
      swiperIndex: 1
    })
    setTimeout(() => {
      this.setData({
        showGroupSettings: false
      })
    }, 1000)
  },
  formSubmit: function (e) {
    const db = wx.cloud.database()
    db.collection('Groups').doc(app.globalData.openGId).update({
      data: {
        settings: e.detail.value
      },
      success: () => {
        app.globalData.groupSettings = e.detail.value
        this.setData({
          groupSettings: app.globalData.groupSettings,
        })
      }
    })
    app.globalData.needRefreshIndexPage = true
    wx.switchTab({
      url: '/pages/index/index',
    })
    this.setData({
      swiperIndex: 0,
      showGroupSettings: false
    })
  },
  formReset: function () {
  },
})