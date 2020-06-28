// miniprogram/pages/error/loginfailed.js
Page({

  /**
   * Page initial data
   */
  data: {

  },
  retry: function(){
    wx.reLaunch({
      url: '../index/index',
    })
  }

})