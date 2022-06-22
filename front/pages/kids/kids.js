var app = getApp()
var util = require('../../utils/util.js')

Page({
    data:{
        default:null,
        kids:[],
        select:false,
        addKidModal:false,
        kidName:'',
        idx:'',
        selectedAvatarWord:'',
        selectedKidName:'',
        selectedKidName2:'',
        disabled:true,
        inputWidth:'',
        placeholder:'输入孩子昵称',
        tapArray:[],
        tapArray2:[0],
        tapCount:0,
        tapCount2:0,
        firstKid:false
    },
    selectKid(e){
        this.data.tapArray.push(e.currentTarget.dataset.index)
        if(this.data.tapCount > 0){
            this.data.kids[this.data.tapArray[this.data.tapCount-1]].selected = false
        }
        this.data.tapCount ++
        this.data.idx = e.currentTarget.dataset.index        
        this.data.kids[this.data.idx].selected = true
        this.setData({
            default:this.data.kids[this.data.idx].default,
            inputWidth:this.data.kids[this.data.idx].name.length,
            selectedKidName:this.data.kids[this.data.idx].name,
            selectedAvatarWord:this.data.kids[this.data.idx].avatarWord,
            select:true,
            kids:this.data.kids,
            disabled:true
        })
    },
    changeName(){
        this.setData({
            selectedKidName2:this.data.selectedKidName,
            disabled:false
        })
    },
    cancelChange(){
        this.setData({
            selectedKidName: this.data.selectedKidName2,
            inputWidth:this.data.selectedKidName2.length,
            disabled : true
        })	
    },
    confirmChange(){
        var url = "https://ywsp.yuyihub.com/updatekid"
        wx.request( {
            url: url,
            method:"PUT",
            data:{
                creater: this.data.kids[this.data.idx].creater,
                kidid: this.data.kids[this.data.idx].kidId,
                name: this.data.selectedKidName
            },
            success: res => {
                console.log(res.data)
                if(res.data.code == 200){
                    this.data.kids[this.data.idx].name = this.data.selectedKidName
                    this.data.kids[this.data.idx].avatarWord = this.data.selectedKidName.slice(0,1)
                    this.data.selectedAvatarWord = this.data.selectedKidName.slice(0,1)
                    this.setData({
                        selectedAvatarWord:this.data.selectedAvatarWord,
                        kids:this.data.kids,
                        disabled : true
                    })
                    app.globalData.kidobjs[this.data.idx].name = this.data.selectedKidName
                    app.globalData.kidsNameChanged = true
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
            fail: res => {
                util.alert(res)
            },
            timeout: res => {
                util.alert(res)
            }
        })
    },
    input(){
        this.setData({
            inputWidth:this.data.selectedKidName.length > 0 ? this.data.selectedKidName.length : 1,
        })  
    },	
    setDefault(){
        var url = "https://ywsp.yuyihub.com/updateuser"
        wx.request( {
            url: url,
            method:"PUT",
            data:{
                openid: app.globalData.data.openid,
                defaultkid:this.data.kids[this.data.idx].kidId
            },
            success: res => {
                console.log(res.data)
                if(res.data.code == 200){
                    this.data.tapArray2.push(this.data.idx)
                    this.data.tapCount2 ++
                    this.data.kids[this.data.tapArray2[this.data.tapCount2-1]].default = false
                    this.data.kids[this.data.idx].default = true
                    this.setData({
                        default:true,
                        kids:this.data.kids
                    })
                    // app.globalData.kidobjs = this.data.kids
                    app.globalData.kidsChanged = true
                    wx.showToast({
                        title: '设置成功',
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
            fail: res => {
                util.alert(res)
            },
            timeout: res => {
                util.alert(res)
            }
        })

    },
    deleteKid(){
        this.setData({
            deleteModal:true
        })
    },
    cancelDelete(){
        this.setData({
            deleteModal:false
        })
    },
    confirmDelete(){
        var url = "https://ywsp.yuyihub.com/delkid"
        wx.request({
            url: url,
            method: "DELETE",
            data: {
                kidid: this.data.kids[this.data.idx].kidId,
            },
            success: res => {
                console.log(res.data)
                if(res.data.code == 200){
                    if(this.data.kids[this.data.idx].default = true){
                        this.data.kids.splice(this.data.idx,1)
                        if(this.data.kids.length > 0){
                            var url = "https://ywsp.yuyihub.com/updateuser"
                            wx.request( {
                                url: url,
                                method:"PUT",
                                data:{
                                    openid: app.globalData.data.openid,
                                    defaultkid:this.data.kids[0].kidId
                                },
                                success: res => {
                                    console.log(res.data)
                                    if(res.data.code == 200){
                                        this.data.kids[0].default = true
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
                        else{
                            this.setData({
                                firstKid:true,
                                addKidModal:true,
                            })                                
                        }
                    }
                    else{
                        this.data.kids.splice(this.data.idx,1)
                    }
                    app.globalData.kidsChanged = true
                    this.setData({
                        kids:this.data.kids,
                        select:false,
						deleteModal:false,
                        tapArray:[],
                        tapArray2:[0],
                        tapCount:0,
                        tapCount2:0                
                    })
                    wx.showToast({
                        title: '删除成功',
                        icon: 'success',
                        duration: 1500
                    })
                }
                else{
                    console.log(res.data)
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
    cancel(){
        this.data.kids[this.data.idx].selected = false
        this.setData({
            tapArray:[],
            tapCount:0,
            kids:this.data.kids,
            select:false,
            disabled:true
        })
    },
    addKid(){
        this.setData({
            addKidModal:true,
        })
    },
    kidInputFocus(){
        this.setData({
            placeholder:''
        })
    },  
    kidInputBlur(){
        this.setData({
            placeholder:'输入孩子昵称'
        })
    },    
    confirmAdd(){
        if(this.data.kidName){
            this.confirmadd(this.data.kidName)
        }
    },
    defaultAdd(){
        this.confirmadd('宝宝')
    },
    confirmadd(kidName){
        var url = "https://ywsp.yuyihub.com/addkid"
        wx.request({
            url: url,
            method: "POST",
            data: {
                kidname: kidName,
                openid: app.globalData.data.openid
            },
            success: res => {
                console.log(res.data)
                if(res.data.code == 200){
                    var id = res.data.content.kidid
                    if(this.data.firstKid){
                        var url = "https://ywsp.yuyihub.com/updateuser"
                        wx.request( {
                            url: url,
                            method:"PUT",
                            data:{
                                openid: app.globalData.data.openid,
                                defaultkid:id
                            },
                            success: res => {
                                console.log(res.data)
                                if(res.data.code == 200){
                                    this.data.kids.push({
                                        creater:app.globalData.data.openid,
                                        name: kidName,
                                        kidId: id,
                                        avatarWord:kidName.slice(0,1),
                                        selected:false,
                                        default:true                
                                    })
                                    app.globalData.kidsChanged = true
                                    this.setData({
                                        addKidModal: null,
                                        kids:this.data.kids,
                                        kidName:'',
                                        firstKid:false
                                    })
                                    wx.showToast({
                                        title: '添加成功',
                                        icon: 'success',
                                        duration: 1500
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
                    else{
                        this.data.kids.push({
                            creater:app.globalData.data.openid,
                            name: kidName,
                            kidId: id,
                            avatarWord:kidName.slice(0,1),
                            selected:false,
                            default:false                 
                        })
                        app.globalData.kidsChanged = true
                        this.setData({
                            addKidModal: null,
                            kids:this.data.kids,
                            kidName:'',
                            firstKid:false
                        })
                        wx.showToast({
                            title: '添加成功',
                            icon: 'success',
                            duration: 1500
                        })
                    }
                }
                if(res.data.code == 400){
                    wx.showToast({
                        title: '昵称已存在',
                        icon: 'error',
                        duration: 1500
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
    cancelAdd(){
        this.setData({
            addKidModal:false,
            kidName:''
        })
    },
    onLoad(){
        for(var i=0;i < app.globalData.kidobjs.length;i++){
            this.data.kids.push({
                creater:app.globalData.kidobjs[i].creater,
                name:app.globalData.kidobjs[i].name,
                kidId:app.globalData.kidobjs[i].kidid,
                avatarWord:app.globalData.kidobjs[i].name.slice(0,1),
                selected:false,
                default:i==0 ? true : false
            })
        }
        this.setData({
            kids:this.data.kids,
        })
    },
    onUnload(){
        if(app.globalData.kidsChanged){          
            var array = []
            var defaultkid = []
            for(var i=0;i<this.data.kids.length;i++){
                array.push({
                    name:this.data.kids[i].name,
                    kidid:this.data.kids[i].kidId,
                    creater:this.data.kids[i].creater
                })
                if(this.data.kids[i].default == true){
                    defaultkid = {
                        name:this.data.kids[i].name,
                        kidid:this.data.kids[i].kidId,
                        creater:this.data.kids[i].creater
                    }
                }
            }
            array.unshift(defaultkid)
            for(var i=1;i<array.length;i++){
              if(array[i].kidid == array[0].kidid){
                array.splice(i,1)
                break        
              }
            };
            app.globalData.kidobjs = array
        }
    }
})