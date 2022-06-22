var app = getApp()
var util = require('../../utils/util.js')

Page({
    data: {
        gotKidsModal:false,
        reLoadModal:false,
        kidsGot:[],
    },
    confirmGot(){
        this.setData({
            gotKidsModal:false
        })
        wx.switchTab({ 
            url: '/pages/home/home'
        })
    },
    reLoad(){
      this.setData({
        reLoadModal:false,
      })
      app.globalData.statusChanged = true
      wx.switchTab({ 
        url: '/pages/home/home'
      })
    },
    onLoad(opt){
      if(opt.statusChanged){
        this.setData({
          reLoadModal:true,
        })    
      }
      if(opt.kidstoshare){
          wx.showLoading({
              title: '加载中',
          })  
          let receivedData = JSON.parse(decodeURIComponent(opt.kidstoshare))
          var array1 =[]
          var array2 =[]
          for(var i=0;i < receivedData.length + 1;i++){
              if(i < receivedData.length){
                  array1.push(receivedData[i].slice(0,36)),
                  array2.push({
                      name:receivedData[i].slice(36),
                      avatarWord:receivedData[i].slice(36).slice(0,1)
                  })
              }
              else{
                  wx.login({
                      success: res => {
                        console.log(res.code)
                        var url = "https://ywsp.yuyihub.com/login"
                        wx.request( {
                          url: url,
                          method: "POST",
                          data: {
                            jsCode:res.code,
                            sharedkids:array1
                          },
                          success:( res )=> {
                            util.setGlobalData(res.data)
                            wx.hideLoading()
                              this.setData({
                                  gotKidsModal:true,
                                  kidsGot:array2,
                              })            
                          },
                          fail: res => {
                            util.alert(res)
                          },
                          timeout: res => {
                            util.alert(res)
                          }    
                        })
                      },
                      fail: res => {
                        util.alert(res)
                      },
                      timeout: res => {
                        util.alert(res)
                      }
                  })
              
              }
          }
      }
    }

})