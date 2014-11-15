/**
 * Created by inoueryouta on 14/11/14.
 */

var express = require('express'),
    fs = require("fs"),
    querystring = require("querystring");

var app = express();
app.engine('.html', require('ejs').__express);
app.set('views', __dirname);
app.set('view engine', 'html');

/* MongoDB */
var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost/wfepevaldb');

var presentationData = new mongoose.Schema({
    title: String,
    page: Number,
    slideurl: [String],
    date: Date
});
presentationData = db.model('presentationData', presentationData);

var manipulationData = new mongoose.Schema({
    presentationtoken: String,
    type: String,
    userid: String,

    // nameとfromは共にユーザ名
    name: String,
    from: String,

    cslide: String,

    // ポインタ，アノテーションの座標
    left: Number,
    top: Number,

    // ポインタ，アノテーションの色
    // vote機能の色
    color: String,

    // アノテーション関係
    width: Number,
    size: Number,
    backgroundcolor: String,

    // コメントのID
    // ユーザIDとして使うこともある
    id: String,

    // アノテーション，コメントのテキスト
    text: String,

    // コメント機能関係
    commentid: String,
    val: String,
    to: String,
    topresenter: Boolean,

    // 手書き関係
    imgurl: String,

    // クライアント管理関係
    replyto: String,

    date: Date
});
manipulationData = db.model('manipulationData', manipulationData);

// ファイルを返す

app.get('/',function(req,res){
    res.status(200);
    res.setHeader('Content-Type',"text/html");
    res.render('index.html');
});

app.get('/index.html',function(req,res){
    res.status(200);
    res.setHeader('Content-Type',"text/html");
    res.render('index.html');
});

app.get('/slidestack.js',function(req,res){
    fs.readFile("./slidestack.js", function(error, file) {

        res.status(200);
        res.setHeader('Content-Type',"application/javascript");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.send(file);
    });
});

app.get('/slidestack.css',function(req,res){
    fs.readFile("./slidestack.css", function(error, file) {

        res.setHeader('Content-Type',"text/css");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.send(file);
    });
});

// 以降，プレゼンデータ関係

// SilhouetteEffectからデータを受け取る
app.get('/newpresentation',function(req,res){
    var query = req.query;
    var parsedQuery = JSON.parse(req.query);
    console.log(parsedQuery);

    parsedQuery.date = Date.now();

    presentationData.create(parsedQuery, function(err, presentationdata){
        if(!err){
            var JSONData = JSON.stringify({
                presentationid: presentationdata._id
            });

            res.setHeader('Content-Type',"application/json");
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            res.setHeader('Access-Control-Allow-Credentials', true);

            res.send(JSONData);
        }else{
            console.log(err);
        }
    });
});

app.get('/getpresentations',function(req,res){
    var query = req.query;
    var parsedQuery = JSON.parse(req.query);
    console.log(parsedQuery);

    presentationData.find({}, function(err, docs){
        var JSONData = JSON.stringify(docs);

        res.setHeader('Content-Type',"application/json");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);

        res.send(JSONData);
    });
});

app.get('/getprentationdata',function(req,res){
    var query = req.query;
    var parsedQuery = JSON.parse(req.query);
    console.log(parsedQuery);

    presentationData.find({_id: parsedQuery.presentationid}, function(err, docs){
        var JSONData = JSON.stringify(docs);

        res.setHeader('Content-Type',"application/json");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);

        res.send(JSONData);
    });
});

// 以降，操作データ関係

app.get('/saveevaluationdata',function(req,res){
    var query = req.query;
    var parsedQuery = JSON.parse(req.query.jsondata);
    console.log(parsedQuery);

    parsedQuery.date = Date.now();

    presentationData.find({presentationtoken: parsedQuery.presentationtoken},function(err, docs){
        if(docs.length<1){
            var newEvaluation = new presentationData(parsedQuery);
            newEvaluation.save();
        }

        res.setHeader('Content-Type',"application/json");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);

        res.send();
    });
});

app.get('/savemanipulationdata',function(req,res){
    var query = req.query;
    console.log(query);
    var parsedQuery = JSON.parse(req.query.jsondata);

    if(parsedQuery.presentationtoken != ""){
        parsedQuery.date = Date.now();

        var newManipulation = new manipulationData(parsedQuery);
        newManipulation.save();
    }

    res.setHeader('Content-Type',"application/json");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    res.send();
});

app.get('/getevaluationlist',function(req,res){
    var query = req.query;
    console.log(query);
    var parsedQuery = JSON.parse(req.query.jsondata);
    var callback = req.query.jsoncallback;

    presentationData.find({}, function(err, docs) {
        var evaluationMap = new Array;

        var JSONData = JSON.stringify(docs);

        res.setHeader('Content-Type',"application/javascript");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);

        if (callback) {
            // コールバックが指定されていたら JSONP をレスポンス
            res.send(callback + '(' + JSONData + ');');
        } else {
            // コールバックが指定されていなければ JSON をレスポンス
            res.send(JSONData);
        }
    });
});

app.get('/getdatafunctions', function(req, res){
    var query = req.query;
    console.log(query);
    var parsedQuery = JSON.parse(req.query.jsondata);
    var callback = req.query.jsoncallback;

    var functionCount = new Object;
    var userCount = new Object;
    var pages = new Object;

    manipulationData.find({presentationtoken: parsedQuery.presentationtoken}, function(err, docs) {
        docs.forEach(function(doc, index) {
            if(doc.type == "client_connect" || doc.type == "client_connect_reply" || doc.type == "client_disconnect" || doc.type == "get_evaluation_token"){}
            else{
                // 機能ごとの利用数のカウント
                if(typeof functionCount[doc.type] == "undefined"){
                    functionCount[doc.type] = 0;
                }else{
                    functionCount[doc.type]++;
                }

                // ユーザごとの操作数のカウント
                if(typeof userCount[doc.name] == "undefined"){
                    userCount[doc.name] = 0;
                }else{
                    userCount[doc.name]++;
                }

                // ページごとの分析
                if(typeof pages[doc.cslide] == "undefined"){
                    pages[doc.cslide] = new Object;

                    pages[doc.cslide].count = new Object;
                    pages[doc.cslide].count.all = 0;
                    pages[doc.cslide].count.cmt = 0;
                    pages[doc.cslide].count.annotation = 0;
                    pages[doc.cslide].count.pointer = 0;
                    pages[doc.cslide].count.handwrite = 0;

                    pages[doc.cslide].comments = new Array;

                    pages[doc.cslide].annotations = new Array;

                    pages[doc.cslide].handwrite = new Array;

                    pages[doc.cslide].pointer = new Array;
                }
                pages[doc.cslide].count.all++;

                if(doc.type == "cmt_embed"){
                    pages[doc.cslide].count.cmt++;
                    pages[doc.cslide].comments.push(doc.text + " by " + doc.name);
                }else if(doc.type == "cmt_pub"){
                    pages[doc.cslide].count.annotation++;
                    pages[doc.cslide].annotations.push(doc.text + " by " + doc.name);
                }else if(doc.type == "handwrite"){
                    pages[doc.cslide].count.handwrite++;
                    if(pages[doc.cslide].handwrite.indexOf(doc.name)==-1){
                        pages[doc.cslide].handwrite.push(doc.name);
                    }
                }else if(doc.type == "pointer"){
                    pages[doc.cslide].count.pointer++;
                    if(pages[doc.cslide].pointer.indexOf(doc.name)==-1){
                        pages[doc.cslide].pointer.push(doc.name);
                    }
                }
            }
        });

        var data = {
            functioncount:functionCount,
            usercount: userCount,
            pages: pages
        };

        var JSONData = JSON.stringify(data);

        res.setHeader('Content-Type',"application/javascript");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);

        if (callback) {
            // コールバックが指定されていたら JSONP をレスポンス
            res.send(callback + '(' + JSONData + ');');
        } else {
            // コールバックが指定されていなければ JSON をレスポンス
            res.send(JSONData);
        }
    });
});

app.get('/storeresult', function(req, res){


    res.send('hello world');
});

app.listen(60000);