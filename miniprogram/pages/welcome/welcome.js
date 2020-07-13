const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    locale: app.globalData.locale.welcome
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {},
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let clickId = '#title'
    this.animate(clickId, [{
        opacity: 0
      },
      {
        opacity: 1
      }
    ], 3000)
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index',
      })
    }, 3000)
  },
})