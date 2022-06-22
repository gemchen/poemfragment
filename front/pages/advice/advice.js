Page({
  data:{
    commentValue:'',
  },
  submitContent(){
    if(this.data.commentValue){
      var url = "https://ywsp.yuyihub.com/voc"
      wx.request( {
        url: url,
        method: "POST",
        data: {
          time:new Date().getTime(),
          voc:this.data.commentValue
        },
        success:( res )=> {
          console.log(res.data)
          if(res.data.code == 200){
            this.setData({
              commentValue:''
            },()=>{
              wx.showToast({
                title: '发送成功',
                icon: 'success',
                duration: 1500
              })
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
    }
  },
  clear(){
    this.setData({
      commentValue:''
    })
  },
  setValue(e){
    this.data.commentValue = e.detail.value
  },
})