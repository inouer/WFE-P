var express = require('express'),
    querystring = require("querystring");
    
var app = express();

/* MongoDB */
var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost/wfepevaldb');
var manipulationData = new mongoose.Schema({
    evaluationtoken: String,
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
});
manipulationData = db.model('manipulationData', manipulationData);

app.get('/',function(req,res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    res.send('Evaluation Server for WFE-P.');
});

app.get('/savemanipulationdata',function(req,res){
    var query = req.query;
    var parsedQuery = JSON.parse(req.query.jsondata);
    console.log(parsedQuery);
    
    var newManipulation = new manipulationData(parsedQuery);
    newManipulation.save();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    res.send();
});

app.get('/storeresult', function(req, res){
    
    
    res.send('hello world');
});

app.listen(3333);