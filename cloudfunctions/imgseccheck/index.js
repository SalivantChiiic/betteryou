// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const fileId = event.fileId
  try {
    const res = await cloud.downloadFile({
      fileID: fileId,
    })
    const buffer = res.fileContent
    var result = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: event.contentType,
        value: buffer
      }
    })
    return result
  } catch (err) {
    return err
  }
}