var startPoint
var endPoint
var screenWidth
const app = getApp()
Component({
  /**
   * Component properties
   */
  properties: {
    imgUrl: String,
    habitName: String,
    habitValue: Number,
    habitUnit: String
  },

  /**
   * Component initial data
   */
  data: {
    sliderPos: 100
  },
  lifetimes: {
    attached() {
      screenWidth = app.globalData.systemInfo.screenWidth
    }
  },
  /**
   * Component methods
   */
  methods: {
    onTouchMove(e) {
      let posValue = this.data.sliderPos - ((e.touches[e.touches.length - 1].clientX - startPoint.clientX) / screenWidth * 100)
      if (posValue >= 0 && posValue <= 100 && posValue != this.data.sliderPos) {
        this.setData({
          sliderPos: posValue
        })
      }
    },
    onTouchStart(e) {
      startPoint = e.touches[0]
    },
    onTouchEnd(e) {
      endPoint = e.touches[0]
    }
  }
})