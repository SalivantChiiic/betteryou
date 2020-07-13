// components/toptabbar/toptabbar.js
const app = getApp()
Component({
  /**
   * Component properties
   */
  properties: {
    tabItems: Array,
    selectedIndex: Number
  },

  lifetimes: {
    attached: function () {
      this.setData({
        itemWidth: 100 / this.properties.tabItems.length
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
    },
  },
  /**
   * Component initial data
   */
  data: {
    selectedIndex: 0
  },

  /**
   * Component methods
   */
  methods: {
    topBarClicked(e) {
      this.setData({
        selectedIndex: e.currentTarget.dataset.index
      })
      var eventDetail = {
        selectedIndex: e.currentTarget.dataset.index
      }
      var eventOption = {
        composed: true
      }
      this.triggerEvent('topbarclicked', eventDetail, eventOption)
    }
  }
})