// components/hintbar/hintbar.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    tipContent: String,
    displayColor: String
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    showTopTip(content) {
      this.setData({
        tipContent: content
      })
      this.animate('#toptips', [{
          opacity: 0
        },
        {
          opacity: 1
        }
      ], 200, () => {
        setTimeout(() => {
          this.animate('#toptips', [{
              opacity: 1
            },
            {
              opacity: 0
            }
          ], 200, () => {
            this.setData({
              tipContent: ''
            })
          })
        }, 1000)
      })
    }
  }
})