// Vote関連
function Vote(){
    this.colorList = {
        blue:2,
        red:3,
        green:4,
        yellow:5
    };
    
    this.labels = new Array;
    
    this.voteState = true;
    this.voteSlide = 0;
};

Vote.prototype.init = function(){
    $('#voteBlue')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.blue);
        });

    $('#voteRed')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.red);
        });

    $('#voteGreen')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.green);
        });

    $('#voteYellow')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.yellow);
        });
};

Vote.prototype.setLabels = function(labels){
    window.vote.labels.length = 0;
    window.vote.labels = labels.split(/;;/);
    window.vote.labels.pop();
                
    $.each(window.vote.labels, function(index) {
        switch(index){
            case 0:
                $('#voteBlueLabel')
                    .html(this);
                break;
            case 1:
                $('#voteRedLabel')
                    .html(this);
                break;
            case 2:
                $('#voteGreenLabel')
                    .html(this);
                break;
            case 3:
                $('#voteYellowLabel')
                    .html(this);
                break;
            default: break;
        }
    });
};

Vote.prototype.clearLabels = function(){
    $('.btn-labels')
        .html('');    
};

Vote.prototype.activeVote = function(cslide){
    this.voteState = true;
    this.voteSlide = cslide;
};

Vote.prototype.closeVote = function(){
    this.voteState = false;
};

Vote.prototype.doVote = function(color){
    var msg = {
        type:"vote",
        cslide:this.voteSlide,
        color:color
    };
    window.mickrmanager.sendMickr(msg);
};

// Mickrサーバの利用
function MickrManager(){
    this.name = "default";
    //評価用
    //this.token = "demo";

    this.token = "default";
};

MickrManager.prototype.init = function(){
    window.mickrmanager.clientInit();
};

MickrManager.prototype.clientInit = function(){
    // optional
    MWClient.application = "wfep3"; // アプリケーション名
    MWClient.group = this.token; // クライアントのグループ名

    // サーバーへ接続
    // MWClient.hello("ws://labs.wisdomweb.net:19281/");
    MWClient.hello("ws://apps.wisdomweb.net:19281/");

    // メッセージを受け取った時のリスナ
    MWClient.onHello = function(res) {
        // Hello が完了した後に実行される

        // ラベル取得
        var msg = {
            type: "get_voteitems"
        };
        window.mickrmanager.sendMickr(msg);
    };
    MWClient.onBye = function(res) {
        // Bye が完了した後に実行される
    };
    MWClient.onSendEnd = function(res) {
        // こちらからのメッセージの送信が成功したら実行される
    };
    MWClient.onReceiveMsg = function(res) {
        // 他のクライアントからメッセージを受信したら実行される
        // res.body.message に、上記の msg が入る

        var msg = res.body.message;
        var date = res.date;
//        console.log(msg);

        switch(msg.type){
            case "vote_start":
                window.vote.activeVote(msg.cslide);
                window.vote.setLabels(msg.items);

                break;
            case "vote_end":
                window.vote.closeVote();
                window.vote.clearLabels(msg.items);

                break;
            case "vote_active":
                window.vote.activeVote(msg.cslide);
                window.vote.setLabels(msg.items);

                break;
            default : break;
        };
    };
};

MickrManager.prototype.sendMickr = function(msg){
    msg.from = this.name;

    var to = "*";
    var group = this.token;
    MWClient.send(msg, to, group);
};

$(function() {
    window.mickrmanager = new MickrManager;
    window.mickrmanager.init();
    
    window.vote = new Vote;
    window.vote.init();
});