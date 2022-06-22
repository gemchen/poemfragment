var app = getApp()
var util = require('../../utils/util.js')

Page({
    data:{
        source:'',
        loaded:false,
        cardData:null,
        index:'',
        updated:false,
        updateTime:'',
        reviewInfo:'',
        interval:'',
        reviewInterval: [86460000, 86460000, 172860000, 259260000, 691260000, 1296060000, 2592060000],
    },
    checkStatus(){
        let reviewTimeStamp = this.data.updated ? this.data.updateTime+this.data.reviewInterval[this.data.cardData.status] : this.data.cardData.reviewTime
        console.log(reviewTimeStamp)
        this.data.reviewInfo = util.getDateDiff2(reviewTimeStamp)
        console.log(this.data.reviewInfo)
        this.setData({ 
            reviewInfo:this.data.reviewInfo
        })
    },
    check(){
        if(this.data.cardData.status < 9){
            this.checkStatus()
            if(this.data.interval){
                clearInterval(this.data.interval)
            }    
            this.data.interval = setInterval(this.checkStatus,20000)
        }
    },
    onShareAppMessage(){
        var cardData = encodeURIComponent(JSON.stringify(this.data.cardData))
        return {
            title: '卡片信息分享',
            path: '/pages/myCard/myCard?cardData=' + cardData + '&source=' + 'share' ,
            imageUrl:'',
        }
    },
    onload(){
        this.setData({
            loaded: true,
            cardData : this.data.cardData,
            type:this.data.cardData.title ? 1 : 0
        },() => {
            if(this.data.cardData.status > 0){
                this.check()
            }
        })
    },
    
    onLoad(opt){
        this.data.cardData = JSON.parse(decodeURIComponent(opt.cardData))             
        if(opt.source){
            this.data.source = 'share'
            if(!app.globalData.data){
                wx.showLoading({
                    title: '加载中',
                  })            
                wx.login({
                  success: res => {
                    console.log(res.code)
                    var url = "https://ywsp.yuyihub.com/login"
                    wx.request({
                      url: url,
                      method: "POST",
                      data: {
                        jsCode:res.code
                      },
                      success:( res )=> {
                        wx.hideLoading()
                        util.setGlobalData(res.data)
                        this.onload()
                      },
                      fail: res => {
                        util.alert(res) //刷新
                      },
                      timeout: res => {
                        util.alert(res) //刷新
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
            else{
                this.onload()
            }        
        }
        else{
            this.setData({
                loaded:true,
                cardData :this.data.cardData,
                index:opt.index,
                type:this.data.cardData.title ? 1 : 0
            },() => {
                if(this.data.cardData.status > 0){
                    this.check()
                }
            })
        }
    },
    onUnload(){
        if(this.data.interval){
            clearInterval(this.data.interval)
        }
    }, 
    updation(){
        var url = "https://ywsp.yuyihub.com/updatecard"
        wx.request({
          url: url,
          method: "PUT",
          data: {
            cardid: this.data.cardData.cardId,
            status: this.data.cardData.status + 1,
            updater: app.globalData.data.openid,
            updaterAvatar: app.globalData.hasUserProfile ? app.globalData.userInfo.avatarUrl : '',
            updaterName: app.globalData.name,
            updatetime: new Date().getTime(),
            reviewtime: new Date().getTime() + this.data.reviewInterval[this.data.cardData.status]
          },
          success: res => {
            console.log(res.data)
            if(res.data.code == 200){
                app.globalData.sharedCardUpdated = true
                this.updated()
            }
            if(res.data.code == 500){
                wx.navigateTo({ 
                    url: '/pages/notice/notice?statusChanged=' + 'true'
                })        
            }
          },
          fail: res => {
                util.alert(res)   
          },
          timeout: res => {
                util.alert(res)
          }
        })
    },
    updated(){
        this.setData({
            updated:true
        })
        this.data.updateTime = new Date().getTime()
        if(this.data.interval){
            clearInterval(this.data.interval)
        }
        if(this.data.cardData.status < 7 ){
            this.check()
        }
        wx.showToast({
            title: '打卡成功',
            icon: 'success',
            duration: 1500
        })      

    },
    update(){
        if (app.globalData.requested == false) {
            wx.getUserProfile({
            desc: '更新卡片状态',
              success: (res) => {
                app.globalData.userInfo = res.userInfo
                app.globalData.hasUserProfile = true
              },
              complete: () => {
                app.globalData.requested = true
                if(this.data.source){
                    this.updation()
                }
                else{
                    let pages = getCurrentPages()
                    let prevPage = pages[pages.length - 2]
                    prevPage.setData({
                        sonIndex: this.data.index,
                    });
                    prevPage.cardUpdation(this.updated())
                }
              },
              fail: res => {
                  util.alert(res)           
              },
              timeout: res => {
                  util.alert(res)
              }           
            })
          }
          else {
            if(this.data.source){
                this.updation()
            }
            else{
                let pages = getCurrentPages()
                let prevPage = pages[pages.length - 2]
                prevPage.setData({
                    sonIndex: this.data.index,
                });
                prevPage.cardUpdation(this.updated())
            }
      }       
    }
})