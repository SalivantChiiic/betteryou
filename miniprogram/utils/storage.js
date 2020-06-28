function saveImageToLocalStorage(groupImage, page) {
  wx.saveFile({
    tempFilePath: groupImage.path,
    success: res => {
      groupImage.path = res.savedFilePath
      page.data.allGroupImages.push(groupImage)
      page.setData({
        allGroupImages: page.data.allGroupImages
      })
      wx.setStorageSync(groupImage.fileId, groupImage)
    },
    fail: console.error
  })
}

module.exports = {
  saveImageToLocalStorage: saveImageToLocalStorage
}