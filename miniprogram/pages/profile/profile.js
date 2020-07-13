const app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    tabItems: ['111','222']
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {

  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    app.checkIfNeedToShowJoinPage()
  },
  onTopBarClicked(e) {
    
  }
})