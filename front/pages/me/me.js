const util = require('../../utils/util.js')
var app = getApp()

Page({
  data: {
    kidName:'',
    userName:'',
    userName2:'',
    addResult:'',
    avatarUrl:null,
    inputWidth:null,
    disabled:true
  },
  toMyKids(){
    wx.navigateTo({ 
      url: '/pages/kids/kids'
    })

  },
  advise(){
    wx.navigateTo({ 
      url: '/pages/advice/advice'
    })

  },
  share(){
    wx.navigateTo({ 
      url: '/pages/share/share'
    })

  },
  readme(){
    wx.navigateTo({ 
      url: '/pages/readme/readme'
    })
  },

  requsetAvatar(){
    wx.getUserProfile({
      desc: '更新用户信息',
      success: (res) => {
        app.globalData.userInfo = res.userInfo
        app.globalData.hasUserProfile = true
        this.setData({
          avatarUrl:app.globalData.userInfo.avatarUrl
        })
      },
      complete: () => {
        app.globalData.requested = true
      }
    })
  },
  changeUserName(){
    this.setData({
      userName2:this.data.userName,
      disabled : false
    })
  },
  input(){
    this.setData({
      inputWidth:this.data.userName.length > 0 ? this.data.userName.length : 1,
    })  
  },
  cancel(){
    this.setData({
      userName: this.data.userName2,
      inputWidth:this.data.userName2.length,
      disabled : true
    })
  },
  confirm(){
    var url = "https://ywsp.yuyihub.com/updateuser"
    wx.request( {
      url: url,
      method:"PUT",
      data:{
        name:this.data.userName,
        openid:app.globalData.data.openid
      },
      success: res => {
        console.log(res.data)
        if(res.data.code == 200){
          this.setData({
            disabled : true
          })
          app.globalData.name = this.data.userName
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 1500
          })      
        }
        if(res.data.code == 500){
          wx.navigateTo({ 
            url: '/pages/notice/notice?statusChanged=' + 'true'
          })        
        }
      },
    })
  },    
  onLoad() {
  },
  tabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },
  onShow(){
    this.setData({
      userName:app.globalData.name,
    })
    this.tabBar()
    this.setData({
      avatarUrl:app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : null,
      inputWidth:this.data.userName ? this.data.userName.length : 2,
    })
  },
  onShareAppMessage(){
    return {
      title: '',
      path:'/pages/home/home',
      imageUrl:'/resource/images/miniapp.png',
    }
  },
})
