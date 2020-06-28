
const app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    anniversaries: [],
    refreshPage: false,
    popUpItem: null,
    paddingBottom: 0,
    windowHeight: 0,
    defaultNaviBarTitle: '活动纪念日'
  },
  addAnniversary: function (params) {
    wx.navigateTo({
      url: '../addAnniversary/addAnniversary',
    })
  },
  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    let sysInfo = wx.getSystemInfoSync()
    let paddingBottom = sysInfo.screenHeight - sysInfo.windowHeight
    this.setData({
      paddingBottom: paddingBottom,
      windowHeight: sysInfo.windowHeight
    })
    this.getAnniversariesPageData()
  },
  onPullDownRefresh: function () {
    this.getAnniversariesPageData()
  },
  getAnniversariesPageData: function () {
    const db = wx.cloud.database()
    if (!app.globalData.openGId) {
      wx.navigateTo({
        url: '../entrance/entrance',
      })
      return
    }
    db.collection('GroupDates').where({
      openGId: app.globalData.openGId
    }).orderBy('date', 'asc').orderBy('uploadTime', 'desc').get({
      success: res => {
        this.data.anniversaries = []
        let dates = res.data
        let now = new Date()
        for (let i in dates) {
          let remainDays = Math.ceil((new Date(dates[i].date) - now) / 1000 / 60 / 60 / 24)
          if (remainDays > 0) {
            dates[i].remainDays = remainDays + ' 天'
            this.data.anniversaries.push(dates[i])
          }
          else if (remainDays == 0) {
            dates[i].remainDays = '今天'
            this.data.anniversaries.push(dates[i])
          }
        }
        for (let i in this.data.anniversaries) {
          if (!!this.data.anniversaries[i].imageFileId && this.data.anniversaries[i].imageFileId.length > 0) {
            let cachedImgUrl = wx.getStorageSync(this.data.anniversaries[i].imageFileId)
            if (cachedImgUrl) {
              this.data.anniversaries[i].imageUrl = cachedImgUrl
            }
            else {
              this.downloadAnniversaryImage(this.data.anniversaries[i], i)
            }
          }
        }
        this.setData({
          anniversaries: this.data.anniversaries,
          popUpItem: null
        })
      },
      complete: () => {
        wx.stopPullDownRefresh()
      }
    })
  },
  downloadAnniversaryImage: function (anniversary, index) {
    wx.cloud.downloadFile({
      fileID: anniversary.imageFileId,
      success: downloadImgRes => {
        anniversary.imageUrl = downloadImgRes.tempFilePath
        wx.saveFile({
          tempFilePath: downloadImgRes.tempFilePath,
          success: res => {
            anniversary.imageUrl = res.savedFilePath
            wx.setStorageSync(anniversary.imageFileId, anniversary.imageUrl)
          },
          fail: err => {
            console.error(err)
            wx.setStorageSync(anniversary.imageFileId, downloadImgRes.tempFilePath)
          },
          complete: () => {
            let anni = 'anniversaries[' + index + ']'
            this.setData({
              [anni]: anniversary
            })
          }
        })
      },
      fail: console.error
    })
  },
  clickDateItem: function (e) {
    this.setData({
      popUpItem: e.currentTarget.dataset.selected
    })
    let id = '#popup'
    this.animate(id, [
      { opacity: 0 },
      { opacity: 1 }
    ], 400, function () {
    }.bind(this))
  },
  closeWindowMask: function () {
    let id = '#popup'
    this.animate(id, [
      { opacity: 1 },
      { opacity: 0 }
    ], 400, function () {
      this.setData({
        popUpItem: null
      })
    }.bind(this))
  },
  doNothing: function () {
    return false
  },
  onShow: function () {
    if(!!app.globalData.groupSettings && !!app.globalData.groupSettings.anniversariesPageTitle && !!app.globalData.groupSettings.anniversariesPageTitle.length > 0){
      wx.setNavigationBarTitle({
        title: app.globalData.groupSettings.anniversariesPageTitle,
      })
    }
    else{
      wx.setNavigationBarTitle({
        title: this.data.defaultNaviBarTitle
      })
    }
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    if (!!this.data.refreshPage) {
      this.getAnniversariesPageData()
      this.data.refreshPage = false
    }
  },
  onShareAppMessage: function () {
    var shareConfig = {
      title: '有人带来了奇怪的东西',
      path: '/pages/index/index'
    }
    return shareConfig
  },
})