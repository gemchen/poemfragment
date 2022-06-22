# activate eventlet
from db import DBHelper
import json
import uuid
# from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
from flask import Flask, request
import eventlet
import requests
eventlet.monkey_patch()
import wxapi.WXBizMsgCrypt as WXBizMsgCrypt
import wxapi.OfficialAccountAPI as OAAPI
import xml.etree.ElementTree as ET
import time
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret!'

load_dotenv()
DB_URL = os.getenv('DB_URL')
USERNAME = os.getenv('USERNAME')
PASSWORD = os.getenv('PASSWORD')

MP_AppID = os.getenv('MiniProgram_AppID')
MP_AppSecret = os.getenv('MiniProgram_AppSecret')

BizMsg_Token = os.getenv('BizMsg_Token')
BizMsg_Appid = os.getenv('BizMsg_Appid')
BizMsg_EncodingAESKey = os.getenv('BizMsg_EncodingAESKey')
BizMsg_AppSecret = os.getenv('BizMsg_AppSecret')

#########
# query data with Openid
#########
def queryByOpenid(openid):
    ReturnVal = {}
    ReturnVal['openid'] = openid
    userInfo = DBHelper.instance.getUser(openid)

    ReturnVal['name'] = userInfo['name']

    if 'kids' not in userInfo or not userInfo['kids']:
        kidObj = {}
        kidObj['name'] = '宝宝'
        kidObj['creater'] = openid
        kidObj['relations'] = [openid]

        kid_id = str(uuid.uuid4())
        kidObj['kidid'] = kid_id
        # add an empty kid
        DBHelper.instance.addKid(kidObj)
        kidobjs = DBHelper.instance.getKids([kid_id])
        ReturnVal['kidobjs'] = list(kidobjs)

        # ReturnVal['kids'] = [kid_id]
        ReturnVal['defaultkid'] = kidobjs[0]

        ReturnVal['cardobjs'] = []
    else:
        kidobjs = DBHelper.instance.getKids(userInfo['kids'])
        ReturnVal['kidobjs'] = list(kidobjs)

        # Get default kid
        defaultkid = ''
        if 'defaultkid' in userInfo:
            defaultkid = userInfo['defaultkid']
        else:
            defaultkid = userInfo['kids'][0]

        for k in kidobjs:
            if k['kidid'] == defaultkid:
                ReturnVal['defaultkid'] = k

        Cards = DBHelper.instance.getCardsByKidid(defaultkid, 0)
        ReturnVal['cardobjs'] = Cards

    return ReturnVal

@app.route("/openid", methods=['POST'])
def testOpenid():
    jsonObj = request.get_json()
    openid = jsonObj['openid']

    userInfo = DBHelper.instance.getUser(openid)
    if not userInfo:
        DBHelper.instance.addUser({"openid": openid, "name": "家长"})

    if 'sharedkids' in jsonObj:
        sharedkids = jsonObj['sharedkids']
        DBHelper.instance.addUserKids(openid, sharedkids)
        DBHelper.instance.addKidsRelation(sharedkids, openid)

    ret = queryByOpenid(openid)
    return ret

@app.route("/login", methods=['POST'])
def login():
    jsonObj = request.get_json()
    if 'jsCode' not in jsonObj:
        return {'code':400, 'msg':'param error'}

    jsCode = jsonObj['jsCode']

    # get user info with jscode
    url = "https://api.weixin.qq.com/sns/jscode2session?appid={0}&secret={1}&js_code={2}&grant_type=authorization_code".format(
        MP_AppID, MP_AppSecret, jsCode)
    response = requests.get(url)
    resJson = json.loads(response.text)
    if 'errcode' in resJson:
        return resJson
    else:
        print("----------------------------")
        print(resJson)
        openid = resJson['openid']
        unionid = resJson['unionid']
        # if union id exist, update the user info db
        if unionid:
            DBHelper.instance.updateUserInfoByMPOpenID(unionid, openid)

        userInfo = DBHelper.instance.getUser(openid)
        if not userInfo:
            DBHelper.instance.addUser({"openid": openid, "name": "家长"})

        if 'sharedkids' in jsonObj:
            sharedkids = jsonObj['sharedkids']
            # print("sharedkids: {0}".format(sharedkids))
            DBHelper.instance.addUserKids(openid, sharedkids)
            DBHelper.instance.addKidsRelation(sharedkids, openid)

        ret = queryByOpenid(openid)
        return ret
        

## delete all things relate with openid
@app.route("/del/<openid>")
def delete(openid):
    #     #delete cards
    DBHelper.instance.delCardsByCreater(openid)
#     #delete kids
    DBHelper.instance.delKidsByCreater(openid)
#     #delete user
    DBHelper.instance.delUserByOpenid(openid)

    return {'code':200, "msg": "delete done"}

########################
## Poetry relate APIs ##
########################
@app.route('/query/')
def queryPoet():
    query = request.args.get('query', None)
    if not query:
        return {'code': 404, 'msg': 'query is empty'}
    if query[0] == '#':
        #query tag
        return queryTag(query[1:])
    
    # Check if it's a author

    result = DBHelper.instance.queryAuthor(query)
    if result:
        result = DBHelper.instance.getPoetriesByAuthor(query)
        if result:
            return json.dumps(list(result), ensure_ascii=False)


    limit = request.args.get('limit', 10, type=int)
    # find in db
    # result1 = DBHelper.instance.queryTag(query)
    result2 = DBHelper.instance.safeGetPoetriesByTitle(query, limit)
    # if can find by title
    if result2 == 0:
        result4 = DBHelper.instance.safeQueryContent(query, limit)
        if result4 == 0:
            return {'code': 200, 'msg': 'no result'}
        else:
            return json.dumps(list(result4), ensure_ascii=False)

    else:
        return json.dumps(list(result2), ensure_ascii=False)


@app.route('/poetry', methods=['POST','PUT','DELETE'])
def poetry():
    if 'POST' == request.method:
        jsonObj = request.get_json()
        
        result = DBHelper.instance.getPoetriesByTitleAndAuthor(jsonObj['title'], jsonObj['author'])
        # print(result)
        if result:
            return {'code': 400, 'msg': 'already exist', 'data': list(result)}
        # TODO check the post data
        else:
            jsonObj['id'] = str(uuid.uuid4())
            result = DBHelper.instance.addPoetry(jsonObj)
            #TODO check the result
            # print(result)
            return {'code': 200, 'msg': 'add poetry success'}


    elif 'PUT' == request.method:
        jsonObj = request.get_json()
        id = jsonObj["id"]
        # update the poet content
        result = DBHelper.instance.updatePoetry(id, jsonObj)
        #TODO check the result
        # print(result)
        return {'code': 200, 'msg': 'update poetry success'}

    elif 'DELETE' == request.method:
        jsonObj = request.get_json()
        result = DBHelper.instance.delPoetry(jsonObj["id"])
        # print(result)
        if result:
            return {"code": 200, "msg": "删除诗歌成功"}
        else:
            return {"code": 500, "msg": "删除诗歌失败"}




@app.route('/contains/<keywords>')
def queryContent(keywords):
    result = DBHelper.instance.safeQueryContent(keywords)
    if result == 0:
        return {'code': 200, 'msg': 'no result'}
    else:
        return json.dumps(list(result), ensure_ascii=False)


@app.route('/author/<name>')
def queryAuthor(name):
    result = DBHelper.instance.queryAuthor(name)
    if result:
        return result
    else:
        return '未找名叫{0}的作者'.format(name)


@app.route('/tag/<tag>')
def queryTag(tag):
    # find in db
    result = DBHelper.instance.queryTag(tag)
    if result:
        return json.dumps(list(result), ensure_ascii=False)
    else:
        return {'code': 404, 'msg':'未找到任何含有标签 #{0}# 的内容'.format(tag)}

######################
## User relate APIs ##
######################

@app.route('/adduser', methods=['POST'])
def addUser():
    # check use exist
    # print(request.get_json())
    jsonObj = request.get_json()

    openid = jsonObj['openid']
    if openid:
        user = DBHelper.instance.getUser(openid)
        if user:
            # print(user)
            return {"code": 400, "msg": "用户已存在"}

    # get user openid
    # name    = request.form.get('name')
    # role    = request.form.get('role')
    # print("{0}:{1}:{2}".format(openid,name,role))
    result = DBHelper.instance.addUser(jsonObj)
    # print("add user with result:{0}".format(result))
    return {"code": 200, "msg": "用户已经创建"}

# 更新用户信息


@app.route('/updateuser', methods=['PUT'])
def updateUser():
    jsonObj = request.get_json()
    # print(jsonObj)
    openid = jsonObj["openid"]
    result = DBHelper.instance.updateUser(openid, jsonObj)
    # print(result)
    if result:
        if result['nModified'] > 0:
            return {"code": 200, "msg": "update user success"}
        else:
            return {"code": 200, "msg": "no users update"}

    return {"code": 500, "msg": "未知错误"}


######################
## Kids relate APIs ##
######################

# 创建 孩子 信息
@app.route('/addkid', methods=['POST'])
def addKid():
    jsonObj = request.get_json()
    if 'kidname' not in jsonObj:
        return {'code': 400, 'msg': '数据错误， kidname not exist'}
    if 'openid' not in jsonObj:
        return {'code': 400, 'msg': '数据错误， openid not exist'}

    # create Kid
    kidObj = {}
    kidObj['name'] = jsonObj['kidname']
    kidObj['creater'] = jsonObj['openid']
    kidObj['relations'] = [jsonObj['openid']]

    res = DBHelper.instance.getKid(kidObj)
    if not res:
        kidObj['kidid'] = str(uuid.uuid4())
        # kidObj['avatar'] = jsonObj['avatar']

        result = DBHelper.instance.addKid(kidObj)
        # print(result)
        # print(kidObj)
        return {"code": 200, "msg": "kid create success", "content":{"kidid":kidObj['kidid']}}
    else:
        return {"code": 400, "msg": "kid already exist", "name": jsonObj['kidname'], }

# 删除 指定 孩子


@app.route('/delkid', methods=['DELETE'])
def delKid():
    jsonObj = request.get_json()
    # jsonObj['creater']

    return DBHelper.instance.delKid(jsonObj)

# 更新 指定 孩子信息


@app.route('/updatekid', methods=['PUT'])
def updateKid():
    jsonObj = request.get_json()
    result = DBHelper.instance.updateKid(jsonObj)
    if result:
        if result['nModified'] > 0:
            return {"code": 200, "msg": "update kid success"}
        else:
            return {"code": 200, "msg": "no kids update"}

    return {"code": 500, "msg": "未知错误"}

# 获取 孩子 (cards) 信息


@app.route('/getkid/')
def getKid():
    kidid = request.args.get('kidid', None)
    page = request.args.get('page', 0, type=int)

    result = DBHelper.instance.getKid({"kidid": kidid})

    if result:
        Cards = DBHelper.instance.getCardsByKidid(kidid, page)
        if not Cards:
            result['code'] = 404003
            result['msg'] = "no cards"

            return result

        result['cardobjs'] = Cards
        return result
    else:
        ReturnErr = {}
        # ReturnErr['openid'] = openid
        ReturnErr['kidid'] = kidid
        ReturnErr['code'] = 404
        ReturnErr['msg'] = 'not found kid'
        return ReturnErr

# 获取当前待打卡信息
@app.route('/getkidactive/')
def getActiveKid():
    kidid = request.args.get('kidid', None)
    page = request.args.get('page', 0, type=int)

    result = DBHelper.instance.getKid({"kidid": kidid})

    if result:
        Cards = DBHelper.instance.getActiveCardsByKidid(kidid, page)
        if not Cards:
            result['code'] = 404003
            result['msg'] = "no cards"

            return result

        result['cardobjs'] = Cards
        return result
    else:
        ReturnErr = {}
        # ReturnErr['openid'] = openid
        ReturnErr['kidid'] = kidid
        ReturnErr['code'] = 404
        ReturnErr['msg'] = 'not found kid'
        return ReturnErr


# 添加 卡片
@app.route('/addcard', methods=['POST'])
def addCard():
    jsonObj = request.get_json()
    jsonObj['cardid'] = str(uuid.uuid4())

    DBHelper.instance.addCard(jsonObj)

    returnVal = {"code": 200, "msg": "add card success"}
    returnVal["cardid"] = jsonObj['cardid']
    return returnVal

# 删除 指定 卡片


@app.route('/delcard', methods=['DELETE'])
def delCard():
    jsonObj = request.get_json()
    # print(jsonObj)
    if "cardid" not in jsonObj:
        return {"code": 400, "msg": "输入数据错误"}

    result = DBHelper.instance.delCard(jsonObj)
    if result:
        return {"code": 200, "msg": "删除卡片成功"}
    else:
        return {"code": 500, "msg": "删除卡片失败"}


# 更新 卡片 内容
@app.route('/updatecard', methods=['PUT'])
def updateCard():
    jsonObj = request.get_json()
    result = DBHelper.instance.updateCard(jsonObj)
    if result:
        if result['nModified'] > 0:
            return {"code": 200, "msg": "update card success"}
        else:
            return {"code": 200, "msg": "no cards update"}

    return {"code": 500, "msg": "未知错误"}


@app.route('/voc', methods=['GET','POST'])
def voc():
    if 'POST' == request.method:
        jsonObj = request.get_json()
        result = DBHelper.instance.addVoC(jsonObj)
        return {"code": 200, "msg": "add voc success"}
    if 'GET' == request.method:
        result = DBHelper.instance.getVoC()
        if result:
            return json.dumps(list(result), ensure_ascii=False)
        else:
            return {"code": 404, "msg": "No VoC yet"}

@app.route('/getallusers', methods=['GET'])
def getAllUsers():
    sKey = request.args.get('key')
    if sKey == 'showmethemoney':
        wxcpt = WXBizMsgCrypt.WXBizMsgCrypt(BizMsg_Token,BizMsg_EncodingAESKey,BizMsg_Appid, BizMsg_AppSecret)
        OAAPI.get_all_users(wxcpt)
        return {"code": 200, "msg": "execute success, check server log for details"}
    else:
        return {"code": 400, "msg": "key error"}

@app.route('/apiconfig', methods=['GET','POST'])
def mptest():
    wxcpt = WXBizMsgCrypt.WXBizMsgCrypt(BizMsg_Token,BizMsg_EncodingAESKey,BizMsg_Appid, BizMsg_AppSecret)

    # 配置服务器（只调用一次）
    if "GET" == request.method:
        sMsgSignature = request.args.get('signature')
        sTimeStamp = request.args.get('timestamp')
        sNonce = request.args.get('nonce')
        sEchoStr = request.args.get('echostr')
        print(sMsgSignature,sTimeStamp,sNonce,sEchoStr)
        ret,sMsg = wxcpt.VerifyURL(sMsgSignature, sTimeStamp, sNonce, sEchoStr)
        print(ret,sMsg)
        return sMsg

    # 平台回调数据
    if "POST" == request.method:
        # get data from request XML
        sReqStr = request.data.decode('utf-8')
        print(sReqStr)
        root = ET.fromstring(sReqStr)
        sMsgType = root.find('MsgType').text
        if 'event' == sMsgType:
            # 用户订阅事件
            if 'subscribe' == root.find('Event').text:
                userOpenID = root.find('FromUserName').text
                # call save user info api
                OAAPI.get_user_info(wxcpt, userOpenID)
                # 推送小程序链接，引导用户打开小程序

                # 构建respponse XML
                sRespStr = '<xml><ToUserName><![CDATA[{0}]]></ToUserName><FromUserName><![CDATA[{1}]]></FromUserName><CreateTime>{2}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[{3}]]></Content></xml>'.format(userOpenID, root.find('ToUserName').text, int(time.time()), '嗨！热爱学习的朋友，快来一起轻松学诗词！登录小程序后可以分享给关心孩子每天学习的亲人们，每天和孩子一起学一起进步！点击下方小程序链接开始学习吧！')
                return sRespStr
            # 用户退订事件
            elif 'unsubscribe' == root.find('Event').text:
                print('got unsubscribe event')
                return "success"
            # 用户点击菜单事件，获取当前待打卡
            elif 'CLICK' == root.find('Event').text:
                sEventKey = root.find('EventKey').text
                if 'V1001_TODAY_CHECK' == sEventKey:
                    # 获取用户unionid和小程序的openid
                    userOpenID = root.find('FromUserName').text
                    userInfo = DBHelper.instance.queryUserInfoByOpenID({'openid':userOpenID})
                    if 'openid2' in userInfo:
                        user = DBHelper.instance.getUser(userInfo['openid2'])
                        if user and 'kids' in user:
                            cards = DBHelper.instance.getActiveCardsByKidid(user['kids'][0], page=0)
                            print(cards)
                            if cards and len(cards) > 0:
                                sPragraphs = ''
                                for para in cards[0]['cardobj']['paragraphs']:
                                    sPragraphs += para + '\n'
                                sRespStr = '<xml><ToUserName><![CDATA[{0}]]></ToUserName><FromUserName><![CDATA[{1}]]></FromUserName><CreateTime>{2}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[{3}]]></Content></xml>'.format(userOpenID, root.find('ToUserName').text, int(time.time()), cards[0]['cardobj']['title']+'\n'+cards[0]['cardobj']['author']+ '\n'+sPragraphs)
                                return sRespStr
                            else:
                                sRespStr = '<xml><ToUserName><![CDATA[{0}]]></ToUserName><FromUserName><![CDATA[{1}]]></FromUserName><CreateTime>{2}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[{3}]]></Content></xml>'.format(userOpenID, root.find('ToUserName').text, int(time.time()), '暂无打卡，快去添加新诗词吧！')
                                return sRespStr
                            
                    else:
                        return '<xml><ToUserName><![CDATA[{0}]]></ToUserName><FromUserName><![CDATA[{1}]]></FromUserName><CreateTime>{2}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[{3}]]></Content></xml>'.format(userOpenID, root.find('ToUserName').text, int(time.time()), '还未绑定小程序，请点击下方小程序链接绑定小程序')

                # sTicket = root.find('Ticket').text
                # print(sEventKey,sTicket)
                print(sEventKey)
                return '<xml><ToUserName><![CDATA[{0}]]></ToUserName><FromUserName><![CDATA[{1}]]></FromUserName><CreateTime>{2}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[{3}]]></Content></xml>'.format(userOpenID, root.find('ToUserName').text, int(time.time()), '弃我去者，昨日之日不可留')
            else:
                print("new event:{0}".format(root.find('Event').text))
        else:
            print("not handled sMsgType:{0}".format(sMsgType))
        return "Hello POST World!"
    # return "mptest"

if __name__ == '__main__':
    app.run(debug=True)
