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

var evaluationData = new mongoose.Schema({
    evaluationtoken: String,
    title: String,
    date: Date   
});
evaluationData = db.model('evaluationData', evaluationData);

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
    
    date: Date
});
manipulationData = db.model('manipulationData', manipulationData);

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

app.get('/evaluation.js',function(req,res){
    fs.readFile("./evaluation.js", function(error, file) {
        
        res.status(200);
        res.setHeader('Content-Type',"application/javascript");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.send(file);
    });
});

app.get('/evaluation.css',function(req,res){
    fs.readFile("./evaluation.css", function(error, file) {
        
        res.setHeader('Content-Type',"text/css");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.send(file);
    });
});

app.get('/saveevaluationdata',function(req,res){
    var query = req.query;
    var parsedQuery = JSON.parse(req.query.jsondata);
    console.log(parsedQuery);
    
    parsedQuery.date = Date.now();
    
    evaluationData.find({evaluationtoken: parsedQuery.evaluationtoken},function(err, docs){
        if(docs.length<1){
            var newEvaluation = new evaluationData(parsedQuery);
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
    
    if(parsedQuery.evaluationtoken != ""){
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
 
    evaluationData.find({}, function(err, docs) {
        var evaluationMap = new Array;
        
        docs.forEach(function(doc, index) {
          evaluationMap.push(doc.evaluationtoken);
        });
    
        var JSONData = JSON.stringify(evaluationMap);
    
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
    
    var functionCount = {};
    var userCount = {};
    
    manipulationData.find({evaluationtoken: parsedQuery.evaluationtoken}, function(err, docs) { 
        docs.forEach(function(doc, index) {
            if(doc.type == "pointer" || doc.type == "client_connect" || doc.type == "client_connect_reply" || doc.type == "client_disconnect" || doc.type == "get_evaluation_token"){}
            else{
                if(typeof functionCount[doc.type] == "undefined"){
                    functionCount[doc.type] = 0;
                }else{
                    functionCount[doc.type]++;
                }
                
                if(typeof userCount[doc.name] == "undefined"){
                    userCount[doc.name] = 0;
                }else{
                    userCount[doc.name]++;
                }
            }
        });
        
        var data = {
            functioncount:functionCount,
            usercount: userCount
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

app.listen(3333);