const app = getApp()
Component({
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#3cc51f",
    list: [{
      pagePath: "/pages/index/index",
      iconPath: "/images/home.png",
      selectedIconPath: "/images/home2.png",
    },
    {
      pagePath: "/pages/profile/profile",
      iconPath: "/images/crown.png",
      selectedIconPath: "/images/crown2.png",
    }],
    uploadImgUrl: '/images/upload.png'
  },
  attached() {
  },
  methods: {
    switchTab(e) {
      if (this.data.selected != e.currentTarget.dataset.index) {
        wx.switchTab({
          url: e.currentTarget.dataset.path,
        })
        this.setData({
          selected: e.currentTarget.dataset.index
        })
      }
    },
    goAdd: function () {
      if((!app.globalData.userInfo && !!app.globalData.openId)){
        app.checkIfNeedToShowJoinPage()
        return
      }
      if(!app.globalData.openGId){
        return
      }
      if (this.data.selected == 1) {
        wx.navigateTo({
          url: '../addAnniversary/addAnniversary',
        })
      }
      else {
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album'],
          success: res => {
            let filePath = res.tempFilePaths[0]
            let fileSize = res.tempFiles[0].size
            wx.navigateTo({
              url: '../uploadImg/uploadImg?path=' + filePath + '&size=' + fileSize,
            })
          }
        })
      }
    },
  }
})