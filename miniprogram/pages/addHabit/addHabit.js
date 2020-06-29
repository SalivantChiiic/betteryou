// miniprogram/pages/addHabit/addHabit.js
const app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    locale: app.globalData.locale.addHabit,
    selectedColor: '#c1cbd7',
    name: '',
    goal: 10,
    unit: '',
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
      '#f0ebe5',
      '#cac3bb',
      '#a6a6a8',
      '#7a7281',
      '#a27e7e',
      '#ead0d1',
      '#faead3',
      '#c7b8a1',
      '#c9c0d3',
      '#eee5f8'
    ]
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    
  },
  selectColor(e) {
    this.setData({
      selectedColor: e.currentTarget.dataset.color
    })
  },
  inputName(e) {
    this.setData({
      name: e.detail.value
    })
  },
  inputGoal(e) {
    this.setData({
      goal: Number(e.detail.value)
    })
  },
  inputUnit(e) {
    this.setData({
      unit: e.detail.value
    })
  },
})