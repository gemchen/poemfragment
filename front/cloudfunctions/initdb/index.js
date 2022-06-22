// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db  = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try{
     return await db.collection('poetry').where({
       title:event.title,
       author:event.author
     }).get({success:function(res){
       console.log(res)
      return res
      }
    })
  } catch(e){
    console.error(e)
  }
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}