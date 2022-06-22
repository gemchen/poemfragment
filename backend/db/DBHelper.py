
import pymongo
import re
import json
import time
import os
from dotenv import load_dotenv

class DBHelper:
    load_dotenv()
    DB_URL = os.getenv('DB_URL')
    USERNAME = os.getenv('USERNAME')
    PASSWORD = os.getenv('PASSWORD')
    PAGE_SIZE = 8
    # token update time

    def __init__(self):
        myclient = pymongo.MongoClient(
            self.DB_URL, username=self.USERNAME, password=self.PASSWORD)
        self.db = myclient['yuwensuipian']
        self.author = self.db['author']
        self.poetry = self.db['poetry_new']
        self.user   = self.db['user']
        self.kid    = self.db['kid']
        self.card   = self.db['card']
        self.voc    = self.db['voc']
        self.idmap  = self.db['idmap'] # UnionID to OpenID
        self.userInfo = self.db['userinfo'] # UserInfo from OpenAccount
        self.conf   = self.db['conf'] # Configure

        # init conf db with one single data
        if self.conf.count() == 0:
            self.conf.insert_one({'token': '', 'update_time': 0})

    def getAccessToken(self):
        return self.conf.find_one({}, {'_id': 0})

    def setAccessToken(self, token, updateTime):
        self.conf.update_one({}, update={'$set': {'token': token, 'update_time': updateTime}})

    
    def setTokenUpdateTime(self, updateTime):
        self.conf.update_one({}, update={'$set': {'update_time': updateTime}})
# poetry API

    def addPoetry(self, Poetry):
        return self.poetry.insert(Poetry)

    def delPoetry(self, id):
        return self.poetry.delete_one({'id': id})

    def updatePoetry(self, id, content):
        query = {"id": id}
        newValues = {"$set": content}
        return self.poetry.update(query, newValues)

    # get with regex wildcard and limit of 10 items
    def safeGetPoetriesByTitle(self, title, limit=10):

        result = self.poetry.find({'$text': {'$search': title}}, {
                                  '_id': 0}).limit(limit)
        if result.count() == 0:
            regex = title + '.*'
            rgx = re.compile(regex, re.IGNORECASE)
            result = self.poetry.find({"title": rgx}, {'_id': 0}).limit(limit)
            if result.count() == 0:
                return 0
            else:
                return result
        else:
            return result

    def getPoetriesByTitle(self, title, limit=0):
        # print("getPoetriesByTitle with param: {0}".format(title))
        if limit > 0:
            return self.poetry.find({"title": title}, {'_id': 0}).limit(limit)
        else:
            return self.poetry.find({"title": title}, {'_id': 0})

    def getPoetriesByAuthor(self, author):
        result = self.poetry.find({'$and': [{'author': author},{'tags':{'$regex':'年级'}}]}, {'_id': 0})
        if result.count() == 0:
            return None
        else:
            return result

    def getPoetriesByTitleAndAuthor(self, title, author):
        condition = {'$and': [{'title': title}, {'author': author}]}
        result = self.poetry.find(condition, {'_id': 0})
        if result.count() == 0:
            return None
        else:
            return result

    def safeQueryContent(self, keywords, limit=10):
        result = self.queryContent(keywords)
        if result.count() == 0:
            return 0
        else:
            return result

    def queryContent(self, keywords, limit=0):
        regex = '.*' + keywords + '.*'
        rgx = re.compile(regex, re.IGNORECASE)

        if limit > 0:
            return self.poetry.find({"paragraphs": rgx}, {'_id': 0}).limit(limit)
        else:
            return self.poetry.find({"paragraphs": rgx}, {'_id': 0})

    def queryAuthor(self, name):
        return self.author.find_one({"name": name}, {'_id': 0})

    def queryTag(self, tag):
        regex = '.*' + tag + '.*'
        rgx = re.compile(regex, re.IGNORECASE)
        result = self.poetry.find({"tags": rgx}, {'_id': 0})
        if result.count() == 0:
            return 0
        else:
            return result

# User API

    def getUser(self, openid):
        return self.user.find_one({"openid": openid}, {'_id': 0})

    def addUser(self, User):
        return self.user.insert(User)

    def updateUser(self, openid, content):
        query = {"openid": openid}
        newValues = {"$set": content}
        return self.user.update(query, newValues)

    def addUserKids(self, openid, kididList):
        query = {"openid": openid}
        newValues = {"$addToSet": {"kids": {"$each": kididList}}}
        return self.user.update(query, newValues)

# Kids API
    def addKid(self, Kid):
        query = {'openid': Kid['creater']}
        newValues = {"$push": {'kids': Kid['kidid']}}
        self.user.update_one(query, newValues)
        return self.kid.insert(Kid)

    def getKid(self, query):
        return self.kid.find_one(query, {'_id': 0})

    def getKids(self, kididList):
        condition = ({"$or": [{"kidid": val} for val in kididList]})
        kidObjs = self.kid.find(condition, {'_id': 0})
        kidObjList = []
        for kidObj in kidObjs:
            # kid = {}
            # kid['creater'] = kidObj['creater']
            # kid['kidid'] = kidObj['kidid']
            # kid['name'] = kidObj['name']

            if 'relations' in kidObj:
                condition = {"openid": {"$in": kidObj['relations']}}
                relatives = self.user.find(condition, {'name': 1, 'openid': 1, '_id': 0})
                # for rel in relatives:
                #     print(rel)
                kidObj['relatives'] = list(relatives)
                del kidObj['relations']
            kidObjList.append(kidObj)

        return kidObjList

    def delKid(self, Kid):
        kidObj = self.kid.find_one(Kid, {'_id': 0})
        if not kidObj:
            return {"code": 404, "msg": "no kid found"}

        condition = {"openid": {"$in": kidObj['relations']}}

        # query = {'openid': Kid['creater']}
        newValues = {"$pull": {'kids': Kid['kidid']}}
        self.user.update_many(condition, newValues)
        ret = self.kid.delete_one({"kidid": Kid['kidid']})
        # print(ret.deleted_count)

        return {"code": 200, "msg": "del kid success"}

    def updateKid(self, Kid):
        query = {"kidid": Kid['kidid']}
        newValues = {"$set": Kid}
        return self.kid.update(query, newValues)

    # add relation user to kids in list
    def addKidsRelation(self, kididList, relation):
        # print(kididList)
        condition = {"kidid": {"$in": kididList}}
        newValues = {"$addToSet": {"relations": relation}}
        result = self.kid.update_many(condition, newValues)
        # print(result)
        if result.modified_count > 0:
            return {"code": 200, "msg": "update kids success"}
        else:
            return {"code": 200, "msg": "no kids update"}

# Cards API

    def addCard(self, Card):
        insertResult = self.card.insert(Card)
        # print("insert card with result{0}".format(insertResult))
        # return {'code': 1000, 'msg': 'insert success'}

    def delCard(self, Card):
        # query = {'cardid': Card['cardid']}
        # newValues = {"$pull": {'kids':Kid['kidid']}}
        # self.kid.update_one(query,newValues)
        return self.card.delete_one({"cardid": Card['cardid']})

    def getCardsByKidid(self, kidid, page):
        cards = list(self.card.find({"kidid": kidid}, {'_id': 0}).sort(
            [('addtime', -1)]).skip(page*self.PAGE_SIZE).limit(self.PAGE_SIZE))
        # cardsobj = []
        if cards:
            for card in cards:
                cardobj = self.poetry.find_one(
                    {'id': card['content']}, {'_id': 0})
                if not cardobj:
                    cardobj = self.author.find_one(
                        {'id': card['content']}, {'_id': 0})
                # cardsobj.append(cardobj)
                # print(card['creater'])
                card['cardobj'] = cardobj
                # card['createrobj'] = self.user.find_one({"openid": card['creater']}, {'_id': 0, 'kids':0, 'openid':0})
                # card['updaterobj'] = self.user.find_one({"openid": card['updater']}, {'_id': 0, 'kids':0, 'openid':0})

        return cards

    def getActiveCardsByKidid(self, kidid, page):
        now = time.time() * 1000
        condition = {'$and': [{"kidid": kidid}, {
            'reviewtime': {'$lt': now}}, {'status': {'$lt': 9}}]}
        cards = list(self.card.find(condition, {'_id': 0}).skip(
            page * self.PAGE_SIZE).limit(self.PAGE_SIZE))
        if cards:
            for card in cards:
                cardobj = self.poetry.find_one(
                    {'id': card['content']}, {'_id': 0})
                if not cardobj:
                    cardobj = self.author.find_one(
                        {'id': card['content']}, {'_id': 0})
                # cardsobj.append(cardobj)
                # print(card['creater'])
                card['cardobj'] = cardobj
                # card['createrobj'] = self.user.find_one({"openid": card['creater']}, {'_id': 0, 'kids':0, 'openid':0})
                # card['updaterobj'] = self.user.find_one({"openid": card['updater']}, {'_id': 0, 'kids':0, 'openid':0})

        return cards

    def updateCard(self, Card):
        query = {"cardid": Card['cardid']}
        newValues = {"$set": Card}
        return self.card.update(query, newValues)

# 删除数据的 API，慎用
    # def delCard(self, Card):
    #     return self.card.delete_one(Card)

    def delKidsByCreater(self, creater):
        return self.kid.delete_many({'creater': creater})

    def delCardsByCreater(self, creater):
        return self.card.delete_many({'creater': creater})

    def delUserByOpenid(self, openid):
        return self.user.delete_many({'openid': openid})


#####
# VoC API
#####
    def addVoC(self, voc):
        return self.voc.insert(voc)

    def getVoC(self):
        return self.voc.find({},{'_id': 0})

################
# UnionID API
################

    # save UserInfo from OpenAccount API, execute once only when system boot up
    # NEED to check if user exist to prevent duplicate insert
    def addUserInfo(self, userInfo):
        ret = self.userInfo.find_one({'unionid': userInfo['unionid']})
        if not ret:
            self.userInfo.insert(userInfo)

        elif 'openid2' in ret and not ret['openid']:
            self.userInfo.update_one({'unionid': userInfo['unionid']}, {'$set': userInfo})
        else:
            print("userInfo already exist")

    # get UserInfo by openid
    def queryUserInfoByOpenID(self, userInfo):
        return self.userInfo.find_one({'openid': userInfo['openid']})

    # get UserInfo by unionid
    def queryUserInfoByUnionID(self, userInfo):
        return self.userInfo.find_one({'unionid': userInfo['unionid']})

    # update openid from mini program by union id, insert if not exist
    def updateUserInfoByMPOpenID(self, unionid, openid2):
        ret = self.userInfo.find_one({'unionid': unionid})
        if ret and 'openid' in ret and 'openid2' in ret:
            # no need to update
            print("no need to update")
            print(ret)
            return

        updateResult = self.userInfo.update_one({'unionid': unionid}, {'$set': {'openid2': openid2}})
        if updateResult.matched_count == 0:
            self.userInfo.insert_one({'unionid': unionid, 'openid2': openid2})


    # def updateMPUnionID(self, UnionID, MPOpenID):
    #     query = {"UnionID": UnionID}
    #     newValues = {"$set": {"MPOpenID": MPOpenID}}
    #     return self.idmap.update(query, newValues)

    # def updateOAUnionID(self, UnionID, OAOpenID):
    #     query = {"UnionID": UnionID}
    #     newValues = {"$set": {"OAOpenID": OAOpenID}}
    #     return self.idmap.update(query, newValues)
        
    # def getMiniProgramOpenID(self, OAOpenID):
    #     return self.idmap.find_one({'OAOpenID':OAPpenID}, {'_id': 0})

    # def getOfficialAccountOpenID(self, MPOpenID):
    #     return self.idmap.find_one({'MPOpenID':MPOpenID}, {'_id': 0})

    # # update user info by OfficialAccount OpenID
    # def update_user_unionid_oa(self, user):
    #     query = {"openid": user['openid']}
    #     newValues = {"$set": {"unionid": user['unionid']}}
    #     return self.userInfo.update(query, newValues)

    # # update user info by MiniProgram OpenID
    # def update_user_unionid_mp(self, user):
    #     query = {"openid2": user['openid']}
    #     newValues = {"$set": {"unionid": user['unionid']}}
    #     return self.userInfo.update(query, newValues)

instance = DBHelper()
# mongoHelper.read()
