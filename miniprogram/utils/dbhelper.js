const db = wx.cloud.database()
function addToTable(tableName, objectToAdd) {
    db.collection(tableName).add({
      data: objectToAdd,
      fail: err => {
        console.error('Failed to insert data to ' + tableName, err)
      }
    })
}


module.exports = {
  addToTable: addToTable
}