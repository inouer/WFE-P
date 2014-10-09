/**
 * Created with IntelliJ IDEA.
 * User: inoueryouta
 * Date: 13/12/06
 * Time: 15:00
 * To change this template use File | Settings | File Templates.
 */

function WFEPController(){
    // スライドのURL
    this.slideURLs = new Array();
    /*
     スライドリストの構造
     {
         index: int, スライド番号
         click: int, アニメーションのインデックス
         url: str    スライド画像のURL
     }
      */
    
    // ファイル名
    this.fileName = "";

    // user id
    this.userID = "";

    // current slide
    this.cslide = 0;
    
    // current list index
    this.cListIndex = 0;

    // アノテーションの配列
    this.annotations = new Array();

    // スライドのサイズ
    this.slidesizeW;
    this.slidesizeH;
    // デフォルトのサイズ（初期値）
    this.origSlideSizeW;
    this.origSlideSizeH;

    // ウインドウサイズの違いを吸収する倍率
    this.scaleX=1;
    this.scaleY=1;

    // ポインタのサイズ
    this.pointerSize = 64;

    // アノテーションのドラッグ中か否か
    this.annotationDragging = false;

    // ポインタの番号
    this.pointerNumber = 2;

    // ポインタの画像のURL（決め打ち）
    this.pointers = {
        0:"black.png",
        1:"white.png",
        2:"red.png",
        3:"green.png",
        4:"blue.png"
    };

    // ポインタの削除タイマー
    this.pointerTimer;

    // ポインタの送信間隔タイマー
    this.pointerIntervalTimer;
    
    // アノテーションの送信間隔タイマー
    this.annotationIntervalTimer;

    // ユーザーエージェント
    this.UA;

    // 同期オンオフの状態
    this.syncState = true;
    
    // デバイスの初期状態の向き
    this.initIsLandscape;
};

WFEPController.prototype.init = function(){    
    // user id
    this.userID = window.wfepcontroller.makeRandobet(128);

    // ユーザーエージェント
    this.getUA();
    
    // モバイルの場合はアドレスバーを消す
    this.hideAddressBar();
    
    // 初期状態の向きを調べる
    this.initIsLandscape = this.isLandscape();
    
    // リサイズ時の動作のみ先に定義
    $(window)
        .on('resize',function() {
            // リサイズ操作が終わった時のみリロード
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function() {
//                $('#realtimeCanvas')
//                    .css({
//                        left:$("#slideContainer").find(":first-child").offset().left
//                    });
//                $('#slideController')
//                    .css({
//                        left:$("#slideContainer").find(":first-child").offset().left
//                    });

                // モバイルのブラウザでは無視
                if(window.wfepcontroller.isMobile()){
                }else{
                    location.reload();
                }
            }, 200);
        })
        .on('orientationchange',function(){
            if(Math.abs(window.orientation) === 90 && !window.wfepcontroller.initIsLandscape) {
                location.reload();  
                window.wfepcontroller.initIsLandscape = true; 
            }else if(Math.abs(window.orientation) === 0){
                $('#rotateDeviceWindow')
                    .modal('show');
            }else{
                $('#rotateDeviceWindow')
                    .modal('hide');
            }         
        });

    // デバイスの向きを検証
    if(!this.isLandscape()){
        $('tokenWindow')
            .modal('hide');
        
        $('#rotateDeviceWindow')
            .modal();
        
        return;
    };
    
    // ウインドウサイズを検証
    if(!this.isAppropriateBrowserSize()){
        $('tokenWindow')
            .modal('hide');
            
        $('#expandBrowserSizeWindow')
            .modal();
        
        return;
    };
    
    var timer = false;
    $(window)
        .on("beforeunload",function(e){
            // ユーザの削除処理
            var msg = {
                "type":"client_disconnect",
                "userid":window.wfepcontroller.userID
            };
            window.mickrmanager.sendMickr(msg);
            
            // サーバーから切断
            MWClient.bye();
        })
        .keydown(function(e){
            // ページめくり
            if(e.keyCode == 37){
                window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide-1);
                
                // var index = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex-1].index;
                // var click = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex-1].click;
                // window.wfepcontroller.jumpSlide2(index, click);
                
                return false;
            } else if (e.keyCode == 39){
                window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide+1);
                
                // var index = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex+1].index;
                // var click = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex+1].click;
                // window.wfepcontroller.jumpSlide2(index, click);
                
                return false;
            }
        });

    // 矢印の動作
    $('#leftArrow')
        .off()
        .on('click', function(){
            window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide-1);
            
            // var index = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex-1].index;
            // var click = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex-1].click;
            // window.wfepcontroller.jumpSlide2(index, click);
        });
    $('#rightArrow')
        .off()
        .on('click', function(){
            //window.wfepcontroller.showSlideThumbnails();
            window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide+1);
            
            // var index = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex+1].index;
            // var click = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex+1].click;
            // window.wfepcontroller.jumpSlide2(index, click);
        });

    // 同期オンオフスイッチ
    $('#syncSwitch')
        .bootstrapSwitch()
        .on('switchChange',function(e, data){
            window.wfepcontroller.syncState = data.value;
        });

    // スライドのサイズ
//    this.slidesizeH = $("#slideContainer").find(":first-child").height();
    var windowH = window.innerHeight ? window.innerHeight : $(window).height();
    this.slidesizeH = windowH - $('#bottomBar').height();
    this.slidesizeW = this.slidesizeH*4/3;
    $('#slideContainer')
        .css({
            height: this.slidesizeH,
            width: this.slidesizeW
        });
    this.origSlideSizeW = this.slidesizeW;
    this.origSlideSizeH = this.slidesizeH;

    // スライド操作のためのイベント付加
    var longClickTimer;
    var pointerFlag = false;
    $('#slideController')
        .css({
            left:$("#slideContainer").find(":first-child").offset().left,
            height:this.slidesizeH,
            width:this.slidesizeW
        })
        .off()
        .on('contextmenu',function(e, ui){
            // スライド上での右クリック
            window.wfepcontroller.openContextMenu(e, e.pageX, e.pageY);

            return false;
        })
        .on('mousedown',function(e,ui){
            // スライド上でのクリック
            $('.contextMenu')
                .hide();
                
            // voteのラベルビューを閉じる
            if(!window.wfepcontroller.isMobile()){
                window.vote.hideVoteLabels();                
            }

            if(e.which==1){
                // 長押し判定でポインタ表示
                longClickTimer = setTimeout(function(){
                    if(!window.wfepcontroller.annotationDragging){
                        pointerFlag = true;
    
                        $('#realtimeLayer')
                            .css({
                                cursor:"url('./img/pointer/"+window.wfepcontroller.pointers[window.wfepcontroller.pointerNumber]+"'), default"
                            })
                            .show();
    
                        window.wfepcontroller.pointerMove(e);
                    }
                },500);
            }

            return false;
        })
        .on('mouseup mouseout', function(e, ui){
            clearTimeout(longClickTimer);
        })
        .on('dblclick', function(e, ui){
            e.preventDefault();
            return false;
        })
        // タッチイベント系
        .on('touchstart', function(e, ui){
            event.preventDefault();

            // 長押し判定でポインタ表示
            longClickTimer = setTimeout(function(){
                if(!window.wfepcontroller.annotationDragging){
                    pointerFlag = true;

                    $('<img/>')
                        .attr({
                            id: "myPointer",
                            src:"./img/pointer/"+window.wfepcontroller.pointers[window.wfepcontroller.pointerNumber]
                        })
                        .appendTo($('body'));

                    window.wfepcontroller.pointerMove(e);
                }
            },1000);
        })
        .on('touchmove',function(e, ui){
            event.preventDefault();

            if(pointerFlag){
                $('#myPointer')
                    .css({
                        left: e.originalEvent.targetTouches[0].pageX-window.wfepcontroller.pointerSize/2,
                        top: e.originalEvent.targetTouches[0].pageY-window.wfepcontroller.pointerSize-20,
                        width:window.wfepcontroller.pointerSize,
                        height:window.wfepcontroller.pointerSize
                    });

                window.wfepcontroller.pointerMove(e);
            };
        })
        .on('touchend', function(e, ui){
            event.preventDefault();

            clearTimeout(longClickTimer);

            if(pointerFlag){
                $('#myPointer').remove();
                pointerFlag = false;

                window.wfepcontroller.pointerMove(e,true);
            };
        })
        .on('gesturechange', function(e){
            event.preventDefault();
        })
        .on('gestureend',function(e){
            event.preventDefault();
        });

    // タッチイベント関連(QUOJS利用)
    $$('#slideController')
        .tap(function(){
            window.wfepcontroller.closeContextMenu();
        })
        .swipeLeft(function(){
            if($(event.originalEvent.target).attr('id')=="slideController"){
                window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide+1);
                
                // var index = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex+1].index;
                // var click = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex+1].click;
                // window.wfepcontroller.jumpSlide2(index, click);
            }
        })
        .swipeRight(function(){
            if($(event.originalEvent.target).attr('id')=="slideController"){
                window.wfepcontroller.jumpSlide(window.wfepcontroller.cslide-1);
                
                // var index = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex-1].index;
                // var click = window.wfepcontroller.slideURLs[window.wfepcontroller.cListIndex-1].click;
                // window.wfepcontroller.jumpSlide2(index, click);
            }
        })
        .hold(function(){
//            console.log(event);
        })
        .pinching(function(){
            // ポインタを表示しない
            $('#myPointer').remove();
            pointerFlag = false;

            var scale = event.originalEvent.scale;

            //拡大縮小
            $('#slideContainer')
                .css({
                    zoom: scale
                });
            $('#slideController')
                .css({
                    zoom: scale
                });
        })
        .pinchIn(function(){
            var scale = event.originalEvent.scale;

            // 一定値より小さくなったらサムネイル表示
            if($('#slideContainer').width()*scale<window.wfepcontroller.origSlideSizeW*0.3 || $('#slideContainer').height()*scale<window.wfepcontroller.origSlideSizeH*0.3){
                // サムネイル表示
                window.thumbnailcontroller.showSlideThumbnails();                
            }

            // 最小より小さくなったらデフォルトサイズ
            if($('#slideContainer').width()*scale<window.wfepcontroller.origSlideSizeW || $('#slideContainer').height()*scale<window.wfepcontroller.origSlideSizeH){
                $('#slideContainer')
                    .css({
                        width:window.wfepcontroller.origSlideSizeW+"px",
                        height:window.wfepcontroller.origSlideSizeH+"px",
                        zoom:1
                    });
                $('#slideController')
                    .css({
                        width:window.wfepcontroller.origSlideSizeW+"px",
                        height:window.wfepcontroller.origSlideSizeH+"px",
                        left:($(window).width()-window.wfepcontroller.origSlideSizeW)/2+"px",
                        //top:($(window).height()-window.wfepcontroller.origSlideSizeH)/2+"px",
                        zoom:1
                    });
                $('#realtimeCanvas')
                    .css({
                        width:window.wfepcontroller.origSlideSizeW+"px",
                        height:window.wfepcontroller.origSlideSizeH+"px",
                        left:($(window).width()-window.wfepcontroller.origSlideSizeW)/2+"px",
                        //top:($(window).height()-window.wfepcontroller.origSlideSizeH)/2+"px",
                        zoom:1
                    });
                
                $(window).scrollTop(0);
                window.wfepcontroller.controlUnlocking();
            }else{
                $('#slideContainer')
                    .css({
                        width:$('#slideContainer').width()*scale+"px",
                        height:$('#slideContainer').height()*scale+"px",
                        zoom:1
                    });
                $('#slideController')
                    .css({
                        width:$('#slideController').width()*scale+"px",
                        height:$('#slideController').height()*scale+"px",
                        left:($(window).width()-$('#slideController').width()*scale)/2+"px",
                        //top:($(window).height()-$('#slideController').height()*scale)/2+"px",
                        zoom:1
                    });
                $('#realtimeCanvas')
                    .css({
                        width:$('#realtimeCanvas').width()*scale+"px",
                        height:$('#realtimeCanvas').height()*scale+"px",
                        left:($(window).width()-$('#realtimeCanvas').width()*scale)/2+"px",
                        //top:($(window).height()-$('#realtimeCanvas').height()*scale)/2+"px",
                        zoom:1
                    });
            }
        })
        .pinchOut(function(){
            var scale = event.originalEvent.scale;

            $('#slideContainer')
                .css({
                    width:$('#slideContainer').width()*scale+"px",
                    height:$('#slideContainer').height()*scale+"px",
                    zoom:1
                });
            $('#slideController')
                .css({
                    width:$('#slideController').width()*scale+"px",
                    height:$('#slideController').height()*scale+"px",
                    left:($(window).width()-$('#slideController').width()*scale)/2+"px",
                    //top:($(window).height()-$('#slideController').height()*scale)/2+"px",
                    zoom:1
                });
            $('#realtimeCanvas')
                .css({
                    width:$('#realtimeCanvas').width()*scale+"px",
                    height:$('#realtimeCanvas').height()*scale+"px",
                    left:($(window).width()-$('#realtimeCanvas').width()*scale)/2+"px",
                    //top:($(window).height()-$('#realtimeCanvas').height()*scale)/2+"px",
                    zoom:1
                });

            window.wfepcontroller.controlLocking();
        })
        .doubleTap(function(){
            //マウスイベント無視
            if(event.originalEvent.toString().indexOf('MouseEvent') >= 0){
                return;
            }
            if($(event.originalEvent.target).attr('id')=="slideController"){
                window.wfepcontroller.openContextMenu(event, event.originalEvent.changedTouches[0].pageX, event.originalEvent.changedTouches[0].pageY);
            }
            
        });

    // リアルタイムレイヤー
    $('#realtimeLayer')
        .css({
            left:$("#slideContainer").find(":first-child").offset().left,
            height:this.slidesizeH,
            width:this.slidesizeW
        })
        .on('mouseup mouseout', function(e, ui){
            e.preventDefault();

            clearTimeout(longClickTimer);

            if(pointerFlag){
                $(this)
                    .css({
                        cursor:"default"
                    })
                    .hide();

                pointerFlag = false;

                // 終了を通知
                window.wfepcontroller.pointerMove(e,true);
            }
        })
        .on('mousemove', function(e, ui){
            e.preventDefault();

            if(pointerFlag){
                window.wfepcontroller.pointerMove(e);
            }
        });

//    $('body')
//        .on('click touchend', function(){
//            window.wfepcontroller.toggleFullScreen($('body'));
//        });
};

WFEPController.prototype.controlLocking = function(){
    $('#lockLayer')
        .css({
            width:$('#slideContainer').width(),
            height:$('#slideContainer').height()
        })
        .show();
};

WFEPController.prototype.controlUnlocking = function(){
    $('#lockLayer').hide();
};

WFEPController.prototype.openContextMenu = function(e, pageX, pageY){
    this.openTextMenu(e, pageX, pageY);
};

WFEPController.prototype.closeContextMenu = function(){
    // 他のウインドウを閉じる
    $('.contextMenu')
        .hide();
};

WFEPController.prototype.openTextMenu = function(e, pageX, pageY){
    this.closeContextMenu();

    // 削除ボタンの表示非表示
    var removeButtonFlag = false;

    // 初期値
    var initVal;
    if($(e.target).hasClass("annotations")){
        // アノテーションの編集の場合
        removeButtonFlag = true;

        var fontColor = window.wfepcontroller.rgbTo16($(e.target).css('color'));
        var backgroundColor = window.wfepcontroller.rgbTo16($(e.target).css('background-color'));

        initVal = {
            id:$(e.target).attr('id'),
            text:$(e.target).html(),
            fontsize:window.wfepcontroller.getFontSize(e.target),
            fontcolor:fontColor,
            backgroundcolor:backgroundColor,
            left:$(e.target).position().left,
            top:$(e.target).position().top
        };
    }else{
        // アノテーション新規生成の場合
        initVal = {
            id:window.wfepcontroller.makeRandobet(64),
            text:"",
            fontsize:"16",
            fontcolor:"#000000",
            backgroundcolor:"#ffffff",
            left:pageX-$('#slideController').position().left,
            top:pageY-$('#slideController').position().top
        };

        console.log($('#slideController').position().left);
    }

    $("#annotationInput")
        .css({
            "font-size":initVal.fontsize+"px",
            color:initVal.fontcolor,
            "background-color":initVal.backgroundcolor
        })
        .val(initVal.text);

    $('#annotationFontSize')
        .val(initVal.fontsize)
        .off()
        .on('change',function(){
            $('#annotationInput')
                .css({
                    "font-size": $('#annotationFontSize').val()+"px"
                });
        });

    $('#annotationFontColor')
        .spectrum({
            color: initVal.fontcolor
        })
        .val(initVal.fontcolor)
        .off()
        .on('change',function(){
            $('#annotationInput')
                .css({
                    "color": $('#annotationFontColor').val()
                });
        });

    $('#annotationBackgroundColor')
        .spectrum({
            color: initVal.backgroundcolor
        })
        .val(initVal.backgroundcolor)
        .off()
        .on('change',function(){
            $('#annotationInput')
                .css({
                    "background-color": $('#annotationBackgroundColor').val()
                });
        });

    $('#annotationSubmit')
        .off()
        .on('click',function(e, ui){
            if($('#annotationInput').val()==""){
                alert('コメントを入力して下さい');
                return;
            }

            // パブリックかプライベートか
            var cmtType;
            if(window.wfepcontroller.syncState){
                cmtType = "cmt_pub";
            }else{
                cmtType = "cmt_pri";
            }

            var left = window.wfepcontroller.scaleTo(initVal.left,window.wfepcontroller.slidesizeW,1);
            var top = window.wfepcontroller.scaleTo(initVal.top,window.wfepcontroller.slidesizeH,1);
            var fontSize = window.wfepcontroller.scaleTo($('#annotationFontSize').val(),window.wfepcontroller.slidesizeW,1);

            var msg = {
                type: cmtType,
                cslide: window.wfepcontroller.cslide,
                left: left,
                top: top,
//                img_width: $('#slideController').width(),
//                img_height: $('#slideController').height(),
                size: fontSize,
                color: $('#annotationFontColor').val(),
                backgroundcolor: $('#annotationBackgroundColor').val(),
                text: $('<div>').html($('#annotationInput').val()).text(),
                id: initVal.id
            };

            // アノテーションの生成
            window.wfepcontroller.manipulateAnnotation(msg);

            // アノテーションを生成してから追加
            msg.width = window.wfepcontroller.scaleTo($('#'+initVal.id).width()+5,window.wfepcontroller.slidesizeW,1);
            
            // アノテーションの生成を通知
            window.mickrmanager.sendMickr(msg);

            // アノテーション生成メニューを閉じる
            window.wfepcontroller.closeContextMenu();
        });

    // 削除ボタンの表示非表示
//    if(removeButtonFlag){
//        $('#annotationRemove')
//            .off()
//            .on('click',function(e, ui){
//                $('#'+initVal.id)
//                    .remove();
//
//                $.each(window.wfepcontroller.annotations,function(i, v){
//                    if(this.id==initVal.id){
//                        window.wfepcontroller.annotations.splice(i,1);
//                    }
//                });
//            })
//            .show();
//    }else{
//        $('#annotationRemove')
//            .hide();
//    }

    var textMenuX = pageX;
    var textMenuY = pageY;
    if(pageX>$(window).width()/2){
        textMenuX = pageX - $('#textMenu').width();
    }
    if(pageY>$(window).height()/2-20){
        textMenuY = pageY - $('#textMenu').height();
    }
    $('#textMenu')
        .css({
            left: textMenuX,
            top: textMenuY
        })
        .show();
};

// 自分のポインタを通知
WFEPController.prototype.pointerMove = function(e, end){
    // 30ms毎に送信
    if(typeof window.wfepcontroller.pointerIntervalTimer == "undefined" || end){
        clearTimeout(window.wfepcontroller.pointerIntervalTimer);
        window.wfepcontroller.pointerIntervalTimer = setTimeout(function(){
            window.wfepcontroller.pointerIntervalTimer = undefined;
        },30);
    }else{
        return;
    }

    var pointerLeft;
    var pointerTop;

    if(end){
        pointerLeft = 0;
        pointerTop = 0;
    }
    else if(this.isMobile()){
        pointerLeft = e.originalEvent.targetTouches[0].pageX-e.originalEvent.targetTouches[0].target.offsetLeft;
        pointerTop = (e.originalEvent.targetTouches[0].pageY-e.originalEvent.targetTouches[0].target.offsetTop)-this.pointerSize+15;
    }else{
        pointerLeft = e.clientX-e.target.offsetLeft+this.pointerSize/2;
        pointerTop = e.clientY-e.target.offsetTop+this.pointerSize/2;
        // pointerLeft = e.offsetX+this.pointerSize/2;
        // pointerTop = e.offsetY+this.pointerSize/2;
    }

    var msg = {
        type: "pointer",
        cslide: window.wfepcontroller.cslide,
        left: window.wfepcontroller.scaleTo(pointerLeft,window.wfepcontroller.slidesizeW,1),
        top: window.wfepcontroller.scaleTo(pointerTop,window.wfepcontroller.slidesizeH,1),
//        img_width: $('#slideController').width(),
//        img_height: $('#slideController').height(),
        color: window.wfepcontroller.pointerNumber,
        id: window.wfepcontroller.userID
    };
    window.mickrmanager.sendMickr(msg);
};

// 他のクライアントからのポインタ表示
WFEPController.prototype.showPointer = function(pointerInfo){
    if(pointerInfo.id == window.wfepcontroller.userID) return;
    if(pointerInfo.cslide != window.wfepcontroller.cslide) return;

    // 調整
    pointerInfo.left = window.wfepcontroller.scaleTo(pointerInfo.left,1,window.wfepcontroller.slidesizeW);
    pointerInfo.top = window.wfepcontroller.scaleTo(pointerInfo.top,1,window.wfepcontroller.slidesizeH);

//    console.log($('#pointer-'+pointerInfo.id).length);

    if($('#pointer-'+pointerInfo.id).length==0){
        $('<img/>')
            .attr({
                id: "pointer-"+pointerInfo.id,
                class:"pointer",
                src:"./img/pointer/"+window.wfepcontroller.pointers[pointerInfo.color]
            })
            .css({
                left:pointerInfo.left-window.wfepcontroller.pointerSize/2,
                top:pointerInfo.top-window.wfepcontroller.pointerSize/2,
                width:window.wfepcontroller.pointerSize,
                height:window.wfepcontroller.pointerSize
            })
            .appendTo($('#slideController'));
    }else{
        if(pointerInfo.left<=0){
            $('#pointer-'+pointerInfo.id).remove();
        }else{
            $('#pointer-'+pointerInfo.id)
                .css({
                    left:pointerInfo.left-window.wfepcontroller.pointerSize/2,
                    top:pointerInfo.top-window.wfepcontroller.pointerSize/2
                });
        }
    }
};

WFEPController.prototype.manipulateAnnotation = function(annotationInfo){
    // 保存
    this.updateAnnotations(annotationInfo);
    
    if(annotationInfo.cslide != window.wfepcontroller.cslide) return;
    
    var left;
    var top;
    var size;
    // 調整
    if(annotationInfo.left < 1) {
        left = window.wfepcontroller.scaleTo(annotationInfo.left,1,window.wfepcontroller.slidesizeW);
        top = window.wfepcontroller.scaleTo(annotationInfo.top,1,window.wfepcontroller.slidesizeH);
        size = window.wfepcontroller.scaleTo(annotationInfo.size,1,window.wfepcontroller.slidesizeW);
    }else{
        left = annotationInfo.left;
        top = annotationInfo.top;
        size = annotationInfo.size;
    };

    if($('#'+annotationInfo.id).length==0){
        // アノテーションの生成
        var $div = $('<div/>');
        $div
            .attr({
                id:annotationInfo.id,
                class:"annotations"
            })
            .css({
                position:"absolute",
                left:left,
                top:top,
                color:annotationInfo.color,
                "background-color":annotationInfo.backgroundcolor,
                "font-size":parseInt(size)+"px",
                "date-slide":annotationInfo.slide
            })
            .html($('<div>').html(annotationInfo.text).text())
            .draggable({
                containment:"#slideController",
                start:function(e, ui){
                    window.wfepcontroller.annotationDragging = true;

                    var msg = {
                        type: "cmt_movestart",
                        left: window.wfepcontroller.scaleTo(ui.position.left+e.offsetX,window.wfepcontroller.slidesizeW,1),
                        top: window.wfepcontroller.scaleTo(ui.position.top+e.offsetY,window.wfepcontroller.slidesizeH,1),
                        id: $(e.target).attr("id")
//                        img_width: $('#slideController').width(),
//                        img_height: $('#slideController').height()
                    };
                    window.mickrmanager.sendMickr(msg);
                },
                drag:function(e,ui){
                    window.wfepcontroller.annotationDragging = true;
                                       
                    // 30ms毎に送信
                    if(typeof window.wfepcontroller.annotationIntervalTimer == "undefined"){
                        clearTimeout(window.wfepcontroller.annotationIntervalTimer);
                        window.wfepcontroller.annotationIntervalTimer = setTimeout(function(){
                            window.wfepcontroller.annotationIntervalTimer = undefined;
                        },30);
                    }else{
                        return;
                    }

                    var msg = {
                        type: "cmt_moving",
                        cslide: window.wfepcontroller.cslide,
                        left: window.wfepcontroller.scaleTo(ui.position.left,window.wfepcontroller.slidesizeW,1),
                        top: window.wfepcontroller.scaleTo(ui.position.top,window.wfepcontroller.slidesizeH,1),
//                        img_width: $('#slideController').width(),
//                        img_height: $('#slideController').height()
                        size: $(e.target).css("font-size"),
                        color: $(e.target).css("color"),
                        backgroundcolor: $(e.target).css("background-color"),
                        text: $(e.target).html(),
                        id: $(e.target).attr("id")
                    };
                    window.mickrmanager.sendMickr(msg);
                },
                stop:function(e, ui){
                    window.wfepcontroller.annotationDragging = false;

                    var msg = {
                        type: "cmt_moveend",
                        cslide: window.wfepcontroller.cslide,
                        left: window.wfepcontroller.scaleTo(ui.position.left,window.wfepcontroller.slidesizeW,1),
                        top: window.wfepcontroller.scaleTo(ui.position.top,window.wfepcontroller.slidesizeH,1),
//                        img_width: $('#slideController').width(),
//                        img_height: $('#slideController').height()
                        size: $(e.target).css("font-size"),
                        color: $(e.target).css("color"),
                        backgroundcolor: $(e.target).css("background-color"),
                        text: $(e.target).html(),
                        id: $(e.target).attr("id")
                    };
                    window.mickrmanager.sendMickr(msg);
                }
            })
            .on('contextmenu',function(e, ui){
                window.wfepcontroller.openContextMenu(e, e.pageX, e.pageY);

                return false;
            })
            .appendTo($('#slideController'));

        // タップに対応
        $$('#'+annotationInfo.id)
            .doubleTap(function(){
                window.wfepcontroller.openContextMenu(event, event.originalEvent.changedTouches[0].pageX, event.originalEvent.changedTouches[0].pageY);
            });
    }else{
        // 既存アノテーションの編集
        $('#'+annotationInfo.id)
            .css({
                position:"absolute",
                left:left,
                top:top,
                color:annotationInfo.color,
                "background-color":annotationInfo.backgroundcolor,
                "font-size":parseInt(size)+"px"
            })
            .html($('<div>').html(annotationInfo.text).text());
    }
};

// アノテーションの更新
WFEPController.prototype.updateAnnotations = function(annotation){
    var exist = -1;
    
    this.annotations
        .some(function(v, i){
            if (v.id==annotation.id) exist = i;
        });
        
    if(exist>=0){
        this.annotations[exist] = annotation;
    }else{
        this.annotations.push(annotation);
    }
};

// アノテーションの初期化
WFEPController.prototype.clearAnnotations = function(slideIndex){
    if(slideIndex == 'all'){
        this.annotations.length = 0;
    }else{
        this.annotations
            .some(function(v, i){
                if (v.cslide==slideIndex) window.wfepcontroller.annotations.splice(i,1);
            });
    }
};

// スライド遷移
WFEPController.prototype.jumpSlide = function(index){
    index = parseInt(index);

    // 異常値が指定された場合はデフォルトスライド表示
    if(isNaN(index)){
        $('#slideImage')
            .attr({
                src:"./img/demoslide.png"
            });
        return;        
    };
    
    // 範囲外の場合は何もしない
    if(index<0 || index>window.wfepcontroller.slideURLs.length) return;

    // コメント入力中，あるいは，アノテーション付加中は無視
    if($('#commentInput').is(':focus') || $(".contextMenu").css('display') != 'none') return;

    //　描画保存・削除
    window.drawcanvas.saveDrawing(this.cslide-1);

    // cslide記憶
    this.cslide = index;

    // スライダー
    $('#pageSlider')
        .slider({
            value:window.wfepcontroller.cslide
        });

    // 調整
    index -= 1;

    // アノテーション削除
    $('.annotations').remove();

    // ポインタ削除
    $('.pointer').remove();

    // 遷移
    try{
        $('#slideImage')
            .attr({
                src:window.wfepcontroller.slideURLs[index]
            });

        // アノテーションのロード
        $.each(window.wfepcontroller.annotations,function(){
            if(window.wfepcontroller.cslide==this.cslide){
                window.wfepcontroller.manipulateAnnotation(this);
            }
        });

        // 描画のロード
        window.drawcanvas.loadDrawing(index);
    }catch (e){
        console.log(e);
    }
    
    // 表示中のスライドのサムネイルを強調
    window.thumbnailcontroller.updateSelectedThumbnail(this.cslide);
};

// スライド遷移(WFE-P3用)
WFEPController.prototype.jumpSlide2 = function(index, click){
    var listIndex = this.getListIndex(index, click);
    
    index = parseInt(index);
    click = parseInt(click);

    // 異常値が指定された場合はデフォルトスライド表示
    if(isNaN(index)){
        $('#slideImage')
            .attr({
                src:"./img/demoslide.png"
            });
        return;        
    };
    
    // 範囲外の場合は何もしない
    if(listIndex<0 || listIndex>window.wfepcontroller.slideURLs.length) return;

    // コメント入力中，あるいは，アノテーション付加中は無視
    if($('#commentInput').is(':focus') || $(".contextMenu").css('display') != 'none') return;

    //　描画保存・削除
    window.drawcanvas.saveDrawing(this.cslide-1);

    // cslide記憶
    this.cslide = index;
    
    // 今のリストのインデックスを記憶
    this.cListIndex = listIndex;

    // スライダー
    $('#pageSlider')
        .slider({
            value:listIndex+1
        });

    // 調整
    index -= 1;

    // アノテーション削除
    $('.annotations').remove();

    // ポインタ削除
    $('.pointer').remove();

    // 遷移
    try{
        $('#slideImage')
            .attr({
                src:window.wfepcontroller.slideURLs[listIndex].url
            });

        // アノテーションのロード
        $.each(window.wfepcontroller.annotations,function(){
            if(window.wfepcontroller.cslide==this.cslide){
                window.wfepcontroller.manipulateAnnotation(this);
            }
        });

        // 描画のロード
        window.drawcanvas.loadDrawing(this.cslide-1);
    }catch (e){
        console.log(e);
    }
    
    // 表示中のスライドのサムネイルを強調
    window.thumbnailcontroller.updateSelectedThumbnail(this.cslide);
};

// スライドリストのインデックスを取得(WFE-P3)
WFEPController.prototype.getListIndex = function(index, click){
    var slideList = this.slideURLs;
    var listIndex=-1;
    
    $.each(slideList,function(i){
        if(this.index==index && this.click==click){
            listIndex=i;
            return;
        }
    });
    
    return listIndex;
};

// スライドリストを更新(WFE-P3)
WFEPController.prototype.updateList = function(index, click, url){
    var slideList = this.slideURLs;
    var exist = false;
    
    var listIndex = this.getListIndex(index, click);
        
    if(listIndex<0){
        var newSlide = {
            index:index,
            click:click,
            url:url
        };
        
        window.wfepcontroller.slideURLs.push(newSlide);
    }else{
        window.wfepcontroller.slideURLs[listIndex].url = url;
    }
};

//ランダム文字列生成
WFEPController.prototype.makeRandobet = function(n, b) {
    b = b || '';
    var a = 'abcdefghijklmnopqrstuvwxyz'
        + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        + '0123456789'
        + b;
    a = a.split('');
    var s = '';
    for (var i = 0; i < n; i++) {
        s += a[Math.floor(Math.random() * a.length)];
    }
    return s;
};

// フォントサイズを計測する関数
WFEPController.prototype.getFontSize = function(target){
    var div = $('<div style="display:none;font-size:1em;margin:0;padding:0;height:auto;line-height:1;border:0;">&nbsp;</div>');
    var size = div.appendTo(target).height();
    div.remove();
    return size;
};

// 座標の調整
WFEPController.prototype.scaleTo = function(value, source, dest){
    return ((value*dest)/source);
};

WFEPController.prototype.getUA = function(){
    var uaName = 'unknown';
    var userAgent = window.navigator.userAgent.toLowerCase();
    var appVersion = window.navigator.appVersion.toLowerCase();

    if (userAgent.indexOf('msie') != -1) {
        uaName = 'ie';
        if (appVersion.indexOf('msie 6.') != -1) {
            uaName = 'ie6';
        } else if (appVersion.indexOf('msie 7.') != -1) {
            uaName = 'ie7';
        } else if (appVersion.indexOf('msie 8.') != -1) {
            uaName = 'ie8';
        } else if (appVersion.indexOf('msie 9.') != -1) {
            uaName = 'ie9';
        } else if (appVersion.indexOf('msie 10.') != -1) {
            uaName = 'ie10';
        }
    } else if (userAgent.indexOf('android') != -1) {
        uaName = 'android';
    } else if (userAgent.indexOf('ipad') != -1) {
        uaName = 'ipad';
    } else if (userAgent.indexOf('ipod') != -1) {
        uaName = 'ipod';
    } else if (userAgent.indexOf('iphone') != -1) {
        uaName = 'iphone';
//        var ios = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
//        uaName = [parseInt(ios[1], 10), parseInt(ios[2], 10), parseInt(ios[3] || 0, 10)];
    } else if (userAgent.indexOf('safari') != -1) {
        uaName = 'safari';
    } else if (userAgent.indexOf('chrome') != -1) {
        uaName = 'chrome';
    } else if (userAgent.indexOf('gecko') != -1) {
        uaName = 'gecko';
    } else if (userAgent.indexOf('opera') != -1) {
        uaName = 'opera';
    } else if (userAgent.indexOf('mobile') != -1) {
        uaName = 'mobile';
    };

    window.wfepcontroller.UA = uaName;
};

WFEPController.prototype.isMobile = function(){
    if(window.wfepcontroller.UA == "iphone" || window.wfepcontroller.UA == "ipad" || window.wfepcontroller.UA == "android" || window.wfepcontroller.UA == "ipod"){
        return true;
    }else{
        return false;
    }
};

WFEPController.prototype.toggleFullScreen = function(target){
    $(target)
        .css({
            width:"100%",
            height:"100%"
        });

    var elem = $(target)[0];
    if((document.fullScreenElement && document.fullScreenElement !== null) || (!document.mozFullScreen && !document.webkitIsFullScreen)){
        if (elem.requestFullScreen) {
            elem.requestFullScreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen();
        }
    }else{
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
};

WFEPController.prototype.setPointerColor = function(pointerIndex){
    window.wfepcontroller.pointerNumber = pointerIndex;
    
    $('#drawButton')
        .attr('src','img/pointer/'+window.wfepcontroller.pointers[window.wfepcontroller.pointerNumber]);

};

WFEPController.prototype.rgbTo16 = function(col){
  return "#" + col.match(/\d+/g).map(function(a){return ("0" + parseInt(a).toString(16)).slice(-2)}).join("");
};

// 向きを判定
WFEPController.prototype.isLandscape = function(){
    if (this.isMobile()) {
        var orientation = window.orientation;
        if(orientation == 0){
            return false;
        }else{
            return true;
        }
    }else{
        return true;
    }
};

// ブラウザのサイズ
WFEPController.prototype.isAppropriateBrowserSize = function(){
    if(!this.isMobile()){
        var windowH = window.innerHeight ? window.innerHeight : $(window).height();
        var windowW = window.innerWidth ? window.innerWidth : $(window).width();
        
        if(windowW<770 || (windowW < windowH*4/3)){
            return false;
        }else{
            return true;
        };
    }else{
        return true;
    }
};

WFEPController.prototype.hideAddressBar = function(){
    if(this.isMobile()){
        setTimeout(scrollTo( 0, $('body').scrollHeight), 0);        
    }
};

// サムネイルビューア関係
function ThumbnailController(){
    this.isShown = false;
};

ThumbnailController.prototype.init = function(){
    $('#thumbnailButton')
        .off()
        .on('click',function(){
            if(window.thumbnailcontroller.isShown){
                window.thumbnailcontroller.hideSlideThumbnails();
            }else{
                window.thumbnailcontroller.showSlideThumbnails();
            }
        });
        
    $('#thumbnailLayer')
        .off()
        .on('click',function(){
            window.thumbnailcontroller.hideSlideThumbnails();
        });
};

// サムネイル一覧表示
ThumbnailController.prototype.showSlideThumbnails = function(){
    this.isShown = true;
    
    $('#thumbnailLayer').html('');
    $.each(window.wfepcontroller.slideURLs,function(index){
        var imgsrc = this;
        var $img = $('<img/>');
        $img
            .attr({
                'class':"slideThumbnail",
                'src':imgsrc,
                'data-slideIndex':index+1
            })
            .appendTo('#thumbnailLayer');
    });
    
    this.updateSelectedThumbnail(window.wfepcontroller.cslide);
    
    $('.slideThumbnail')
            .on('click',function(e, ui){
                window.thumbnailcontroller.hideSlideThumbnails();
                window.wfepcontroller.jumpSlide($(e.target).attr('data-slideIndex'));                
            });
    
    // サムネイル間のマージンを表示幅に合わせて動的に計算
    var minMargin = 20;
    var thumbBorder = 3;
    var numOfLine = Math.floor(($(window).width()-thumbBorder*2)/($('.slideThumbnail').width()+minMargin*2));
    var marginWidth = Math.floor(($(window).width()-thumbBorder*2)%($('.slideThumbnail').width()+minMargin*2));
    var margin = Math.floor(marginWidth / (numOfLine*2) + minMargin);
    $('.slideThumbnail')
        .css({
           "margin-left":margin-thumbBorder,
           "margin-right":margin-thumbBorder 
        });
    $('.selectedThumbnail')
        .css({
           "margin-left":margin-thumbBorder,
           "margin-right":margin-thumbBorder             
        });
    
    $('#thumbnailLayer')
        .css({
            height: window.wfepcontroller.slidesizeH,
            width: "100%",
            "margin-bottom":$('#bottomBar').height()
        })
        .fadeIn("slow");
};

// サムネイル一覧非表示
ThumbnailController.prototype.hideSlideThumbnails = function(){
    this.isShown = false;
    
    $('#thumbnailLayer')
        .fadeOut("fast");
};

// 選択中のスライドのサムネイルを強調
ThumbnailController.prototype.updateSelectedThumbnail = function(index){
    $('.slideThumbnail').each(function(){
        $(this).removeClass('selectedThumbnail');
        var thumbIndex = parseInt($(this).attr('data-slideIndex'));
        if(thumbIndex == index){
            $(this).addClass('selectedThumbnail');
        }
    });
};

// コメント送信関係
function CommentController(){};

CommentController.prototype.init = function(){
    $('#commentSubmit')
        .on('click',function(){
            // コメントが入力されていない時
            if($('#commentInput').val()==""){
                alert("no text");
                return;
            };

            var msg = {
                type: "cmt_embed",
                cslide: window.wfepcontroller.cslide,
                text: $('#commentInput').val()
            };
            window.mickrmanager.sendMickr(msg);

            window.commentcontroller.clearComment();

            $('#commentWindow')
                .modal('hide');
        });

    $('#commentButton')
        .on('click',function(){
            $('#commentWindow')
                .modal();
        });
};

CommentController.prototype.clearComment = function(){
    $('#commentInput').val('');
};

// 手描き関連
function DrawCanvas(){
    // キャンバス
    this.e_canvas;

    // バルーンのトグル表示非表示
    this.toggleFlag = true;

    // モードの画像
    this.penIcon = "img/draw/pen.png";
    this.eraserIcon = "img/draw/eraser.png";

    // 初期太さと色
    this.state = {
        thickness:5,
        color:"#000000"
    };

    // 手描きの配列
    this.drawings = new Array();
};

DrawCanvas.prototype.init = function(){
    $('#realtimeCanvas')
        .css({
            left:$("#slideContainer").find(":first-child").offset().left,
            height:window.wfepcontroller.slidesizeH,
            width:window.wfepcontroller.slidesizeW
        });

    this.e_canvas = new EasyCanvas($('#realtimeCanvas'));

    this.e_canvas.onDrawEnd = function(canvas){
        // Mickrサーバに画像アップロード
        var url = "http://apps.wisdomweb.net:19282/";
        var file_data = window.drawcanvas.getBlob(this.getPngDataURL());
        var fd = new FormData();
        fd.append("file", file_data);

        $.ajax({
            url: url,
            type: "POST",
            data: fd,
            success: function(url) {
                // 成功時
                console.log(url); // ファイルの URL

                var msg = {
                    type: "handwrite",
                    cslide: window.wfepcontroller.cslide,
                    from: window.mickrmanager.name,
                    imgurl:url
                };
                window.mickrmanager.sendMickr(msg);
            },
            error: function() {
                // エラー処理
            },
            processData: false,  // jQuery がデータを処理しないよう指定
            contentType: false   // jQuery が contentType を設定しないよう指定
        });
    };

    $('#drawButton')
        .on('click',function(){
            window.drawcanvas.toggleDrawMenu();
        });
};

DrawCanvas.prototype.toggleDrawMenu = function(){
    if(this.toggleFlag){
        $('#drawButton')
            .showBalloon({
                position:"top",
                tipSize:10,
                css: {
                    opacity: '1.0',
                    boxShadow: '0px 0px 0px #000'
                },
                contents: '<img class="pointerMode" src="img/pointer/red.png"/ data-pointerindex="2">'+
                    '<img class="pointerMode" src="img/pointer/black.png"/ data-pointerindex="0">'+
                    '<img class="pointerMode" src="img/pointer/white.png"/ data-pointerindex="1">'+
                    '<img class="pointerMode" src="img/pointer/green.png"/ data-pointerindex="3">'+
                    '<img class="pointerMode" src="img/pointer/blue.png"/ data-pointerindex="4">'+
                    '<hr id="modeHR">'+
                    '<img id="penMode" class="drawIcon" src="img/draw/pen.png"/><img id="eraserMode" class="drawIcon" src="img/draw/eraser.png"/><br>' +
                    'thickness: <input id="drawThickness" type="number" min="1" max="20" value="'+window.drawcanvas.state.thickness+'"/> color: <input id="drawColor" type="text">',
                showDuration: "show",
                showAnimation: function(d){
                    this.fadeIn(d);

                    window.drawcanvas.e_canvas.setLineWidth(window.drawcanvas.state.thickness);
                    $('#drawThickness')
                        .off()
                        .on('change',function(){
                            window.drawcanvas.state.thickness = $('#drawThickness').val();
                            window.drawcanvas.e_canvas.setLineWidth($('#drawThickness').val());
                        });

                    $('#drawColor')
                        .spectrum({
                            color: window.drawcanvas.state.color
                        })
                        .val(window.drawcanvas.state.color)
                        .off()
                        .on('change',function(){
                            window.drawcanvas.state.color = $('#drawColor').val();
                            window.drawcanvas.e_canvas.setStrokeColor($('#drawColor').val());
                        });

                    $('.pointerMode')
                        .on('click',function(){
                            window.drawcanvas.activeDrawMode("pointer");
                            var pointerIndex = $(this).attr('data-pointerindex');
                            
                            window.wfepcontroller.setPointerColor(pointerIndex);
                        });
                    $('#penMode')
                        .on('click', function(){
                            window.drawcanvas.activeDrawMode(EasyCanvasDrawMode.FreeHand);
                        });
                    $('#eraserMode')
                        .on('click', function(){
                            window.drawcanvas.activeDrawMode(EasyCanvasDrawMode.Eraser);
                        });
                }
            });
    }else{
        $('#drawButton')
            .hideBalloon();
    }
    this.toggleFlag = !this.toggleFlag;
};

DrawCanvas.prototype.activeDrawMode = function(mode){
    switch (mode) {
        case EasyCanvasDrawMode.FreeHand:
            this.e_canvas.changeDrawMode(mode);

            $('#drawButton')
                .attr({
                    'src': window.drawcanvas.penIcon
                });

            $('#realtimeCanvas')
                .css({
                    "z-index":100
                });
            break;
        case EasyCanvasDrawMode.Eraser:
            this.e_canvas.changeDrawMode(mode);

            $('#drawButton')
                .attr({
                    'src': window.drawcanvas.eraserIcon
                });

            $('#realtimeCanvas')
                .css({
                    "z-index":100
                });
            break;
        case "pointer":
            $('#realtimeCanvas')
                .css({
                    "z-index":2
                });
            break;
    }

    this.toggleDrawMenu();
};

DrawCanvas.prototype.saveDrawing = function(index){
    this.drawings[index] = this.e_canvas.getPngDataURL();
    this.e_canvas.clearDrawing();
};

DrawCanvas.prototype.loadDrawing = function(index){
    if(typeof this.drawings[index] != "undefined"){
        this.e_canvas.setDataURL(this.drawings[index]);
    }
};

DrawCanvas.prototype.syncDrawing = function(url, cslide){    
    if(window.wfepcontroller.cslide == cslide){
        window.drawcanvas.e_canvas.setDataURL(url);
    }else{
        window.drawcanvas.drawings[cslide-1] = url;
    }
};

DrawCanvas.prototype.getBlob = function(base64Image) {
    var barr, bin, i, len;
    bin = atob(base64Image.split("base64,")[1]);
    len = bin.length;
    barr = new Uint8Array(len);
    i = 0;
    while (i < len) {
        barr[i] = bin.charCodeAt(i);
        i++;
    }
    return new Blob([barr], {
        type: 'image/png'
    });
};

// Vote関連
function Vote(){
    this.voteState = false;

    this.colorList = {
        blue:2,
        red:3,
        green:4,
        yellow:5
    };

    this.voteSlide = 0;
    
    this.labels = new Array;
    
    this.isLabelsShown = false;

    this.mouseOverTimer;
    
    this.labelText = "label1;;label2;;label3;;label4;;";
};

Vote.prototype.init = function(){    
    $('#voteBlue')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.blue);
        })
        .on('mouseover', function() { 
            clearTimeout(window.vote.mouseOverTimer); 
        });

    $('#voteRed')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.red);
        })
        .on('mouseover', function() { 
            clearTimeout(window.vote.mouseOverTimer); 
        });

    $('#voteGreen')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.green);
        })
        .on('mouseover', function() { 
            clearTimeout(window.vote.mouseOverTimer); 
        });

    $('#voteYellow')
        .on('click',function(){
            window.vote.doVote(window.vote.colorList.yellow);
        })
        .on('mouseover', function() { 
            clearTimeout(window.vote.mouseOverTimer); 
        });
        
    $('#voteButtonContainer')
        .on('mouseover',function(){
            if(!window.wfepcontroller.isMobile()){
                clearTimeout(window.vote.mouseOverTimer);
                window.vote.showVoteLabels();                  
            }    
        })
        .on('mouseout',function(){
            if(!window.wfepcontroller.isMobile()){
                window.vote.mouseOverTimer = setTimeout(function(){
                    window.vote.hideVoteLabels();
                },100);
            } 
        });
};

Vote.prototype.activeVote = function(cslide){
    this.voteState = true;
    this.voteSlide = cslide;
};

Vote.prototype.closeVote = function(){
    this.voteState = false;
};

Vote.prototype.doVote = function(color){
    if(this.voteState && window.wfepcontroller.cslide == this.voteSlide){
        var msg = {
            type:"vote",
            cslide:this.voteSlide,
            color:color
        };
        window.mickrmanager.sendMickr(msg);
    }
};

Vote.prototype.setVoteLabels = function(labels){ 
    if(labels){
        window.vote.labels.length = 0;
        window.vote.labels = labels.split(/;;/);
        window.vote.labels.pop();        
    }
                
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

Vote.prototype.showVoteLabels = function(){
    if(!this.isLabelsShown && this.voteState){
        $('#voteButtonContainer')
                .showBalloon({
                    position:"top",
                    tipSize:10,
                    css: {
                        opacity: '1.0',
                        boxShadow: '0px 0px 0px #000'
                    },
                    contents: '<div class="container" id="voteLabelWindow">'+
                                '<div class="row-fluid text-center top10">'+
                                    '<div class="span6 margin-zero">'+
                                        '<div class="btn btn-custom-blue btn-vote">　</div>'+
                                        '<div class="voteLabel" id="voteBlueLabel">　　　　　　　　　　</div>'+
                                    '</div>'+
                                    '<div class="span6 margin-zero">'+
                                        '<div class="btn btn-custom-red btn-vote">　</div>'+
                                        '<div class="voteLabel" id="voteRedLabel">　　　　　　　　　　</div>'+
                                    '</div>'+
                                '</div>'+
        
                                '<div class="row-fluid text-center top10">'+
                                    '<div class="span6 margin-zero">'+
                                        '<div class="btn btn-custom-green btn-vote">　</div>'+
                                        '<div class="voteLabel" id="voteGreenLabel">　　　　　　　　　　</div>'+
                                    '</div>'+
                                    '<div class="span6 margin-zero">'+
                                        '<div class="btn btn-custom-yellow btn-vote">　</div>'+
                                        '<div class="voteLabel" id="voteYellowLabel">　　　　　　　　　　</div>'+
                                    '</div>'+
                                '</div>'+
                              '</div>',
                    showDuration: "show",
                    showAnimation: function(d){
                        this.fadeIn(d);
                        
                        window.vote.setVoteLabels();
                    }
                });
        
        this.isLabelsShown = true;
    }
};

Vote.prototype.hideVoteLabels = function(){
    if(this.isLabelsShown){        
        $('#voteButtonContainer')
            .hideBalloon();
            
        this.isLabelsShown = false;            
    }
};

// コミュニケーションのインターフェース
function ComController(){
    // コミュニケーション画面を表示しているかどうか
    this.isShown = false;
    
    // コメントを送る相手
    this.toUser = "";
    
    // コメントを送るスライド
    this.cslide = "";
    
    // 送るコメントの内容
    this.commentText = "";
    
    // コミュニケーション画面で選択されている部屋
    this.selectedRoomIndex = 0;
    
    // コメントを保持
    this.comments = new Array();
    /*
     comments = {
         slideindex: 対象のスライド,
         text: コメント内容,
         from: 誰からのか,
         to: 誰へのか,
         timestamp: タイムスタンプ
     }
     */
    
    // ユーザを保持
    this.users = new Array();
    /*
     users = {
         id: 識別子,
         name: ユーザ名,
         timestamp: タイムスタンプ
     }
     */
     
     // コメントの送り先 true=presenter, false=audience only
     this.toPresenter = false;
     
     // プレゼンターにコメントを送信するボーダー
     this.goodCountBorder = 1;
};

ComController.prototype.init = function (){
    // コメントの送り先選択スイッチ
    $('#commentToSwitch')
        .bootstrapSwitch()
        .on('switchChange',function(e, data){
            window.comcontroller.toPresenter = data.value;
        });
    
    $('#commentSubmit')
        .on('click',function(){
            window.comcontroller.analyzeCommentText($('#commentInput').val());
            
            if(window.comcontroller.commentText=="") return;
            
            if(window.comcontroller.toUser=="" && window.comcontroller.toPresenter){
                window.comcontroller.sendCommentToPresenter(window.comcontroller.commentText);    
            }else{            
                window.comcontroller.sendCommentToAudience(window.comcontroller.commentText);
            };
        });
        
    $('#commentInput')
        .keypress( function ( e ) {
            // window.comcontroller.analyzeCommentText($('#commentInput').val());
            
            if ( e.which == 13 ) {
                    $('#commentSubmit').trigger('click');
                return false;
            }
        } );
        
    $('#commentButton')
        .on('click',function(){
            if(window.comcontroller.isShown){
                window.comcontroller.hideComViewer();
            }else{
                window.comcontroller.showComViewer();                
            }
        });
        
    $('#commentRooms').menu();
    $('#commentUsers').menu();
};

ComController.prototype.showComViewer = function(){
    this.isShown = true;
    
    $('#commentInput').val('');
    
    $('#comLayer')
        .css({
            height: window.wfepcontroller.slidesizeH,
            width: "100%",
            "margin-bottom":$('#bottomBar').height()
        })
        .fadeIn("slow");  
        
    this.settingRoomList();
    this.updateRoomList(0);
    this.updateCommentView();
    
    this.settingUserList();
};

ComController.prototype.hideComViewer = function(){
    this.isShown = false;
    
    $('#comLayer')
        .fadeOut('fast');
};

ComController.prototype.settingRoomList = function(){
    $('#commentRooms')
        .html('<li class="room" data-index="0">all</li>');
    
    $.each(window.wfepcontroller.slideURLs, function(index){
        var $li = $('<li/>');
        var $img = $('<img/>');
        $img
            .attr('src',this)
            .css({
                width:"70px",
                height:"auto"
            })
            .appendTo($li);
            
        var incIndex = parseInt(index)+1;
        $li
            .addClass('top7 room')
            .attr('data-index',incIndex)
            .html($li.html()+"slide"+incIndex)
            .appendTo($('#commentRooms'));
    });
    
    $('.room')
        .on('click',function(){
            window.comcontroller.updateRoomList($(this).attr('data-index'));
            window.comcontroller.updateCommentView();
            window.comcontroller.updateCommentInputWithSelectedSlide($(this).attr('data-index'));
        });
};

ComController.prototype.updateRoomList = function(selectedIndex){
    window.comcontroller.selectedRoomIndex = parseInt(selectedIndex);
    
    var rooms = $('#commentRooms').children();
    $(rooms).removeClass('selectedRoom');
    $(rooms[window.comcontroller.selectedRoomIndex]).addClass('selectedRoom');
};

ComController.prototype.settingUserList = function(){
    $('#commentUsers')
        .html('');
    
    $.each(window.comcontroller.users, function(){
        var userID = this.id;
        var userName = this.name;
        
        var $li = $('<li/>');
        $li
            .addClass('commentUser')
            .attr('data-userid',userID)
            .html('<img src="img/user.png" class="commentUserIcon">'+userName)
            .appendTo($('#commentUsers'));
    });    
    
    $('.commentUser')
        .on('click',function(){
            window.comcontroller.updateCommentInputWithSelectedUser($(this).attr('data-userid'));
        });    
};

ComController.prototype.addCommentToList = function(msg,timestamp){
    this.comments
        .push({
            "commentid":msg.commentid,
            "slideindex":msg.cslide,
            "text":msg.text,
            "from":msg.from,
            "to":msg.to,
            "topresenter":msg.topresenter,
            "goodcount":0,
            "isgood":false,
            "timestamp":timestamp
        });
};

ComController.prototype.removeCommentFromList = function(msg){
    var targetID = msg.commentid;
    this.comments
        .some(function(v, i){
            if (v.commentid==targetID) window.comcontroller.comments.splice(i,1);
        });   
};

ComController.prototype.addUserToList = function(msg,timestamp){
    // 重複確認
    var targetID = msg.userid;
    var duplicateIndex = -1;
        
    this.users
        .some(function(v, i){
            if (v.id==targetID){
                duplicateIndex = i;
            };
        });   
        
    if(duplicateIndex==-1){
        this.users
            .push({
                "id":msg.userid,
                "name":msg.name,
                "timestamp":timestamp
            });        
    }else{
        this.users[duplicateIndex].name = msg.name;        
    };    
};

ComController.prototype.removeUserFromList = function(msg){    
    var targetID = msg.userid;
    this.users
        .some(function(v, i){
            if (v.id==targetID) window.comcontroller.users.splice(i,1);
        });
};

ComController.prototype.usernameIsDuplicated = function(targetName){
    var duplicateIndex = -1;
    this.users
        .some(function(v, i){
            if (v.name==targetName){
                duplicateIndex = i;
            };
        });    
        
    return duplicateIndex;
};

ComController.prototype.initializeUserList = function(){
    this.users.length = 0;
};

ComController.prototype.updateCommentView = function(){
    var slideIndex = this.selectedRoomIndex;
    
    $('#commentView').html('');
    
    $.each(window.comcontroller.comments, function() {
        if(this.slideindex == slideIndex || slideIndex == 0){
            var toList = this.to.split(',');
                        
            if(this.to == "" || $.inArray(window.mickrmanager.name, toList) >= 0 || this.from == window.mickrmanager.name){
                var $TR = $('<tr/>');
                var $userTD = $('<td/>');
                var $textTD = $('<td/>');
                var $dateTD = $('<td/>');
                var $goodTD = $('<td/>');
                
                if(this.to != ""){
                    // プライベートコメント
                    $userTD
                        .addClass('commentViewToMe')
                        .html(this.from+"<br> -> "+this.to.replace(/,/g," "));
                        
                    $textTD
                        .addClass('commentViewToMe');
                        
                    $dateTD
                        .addClass('commentViewToMe');
                        
                    $goodTD
                        .addClass('commentViewToMe');   
                }
                else if(this.topresenter){
                    // プレゼンターへのコメント
                    $userTD
                        .addClass('commentViewToPresenter')
                        .html(this.from+"<br> -> <em>Presenter</em>");   
                        
                    $textTD
                        .addClass('commentViewToPresenter');
                        
                    $dateTD
                        .addClass('commentViewToPresenter');       
                            
                    $goodTD
                        .addClass('commentViewToPresenter');         
                }
                else{
                    // 聴衆全体へのコメント
                    $userTD
                        .addClass('commentView')
                        .html(this.from);   
                        
                    $textTD
                        .addClass('commentView');
                        
                    $dateTD
                        .addClass('commentView');   
                        
                    $goodTD
                        .attr('data-commentid',this.commentid)
                        .addClass('commentView')  
                        .html('<button class="btn btn-small commentGoodButton"><i class="icon-thumbs-up icon-large goodCommentIcon"></i><p class="goodCount">'+this.goodcount+'</p></button>')
                        .on('click',function(e,ui){
                            var commentID = $(this).attr('data-commentid');
                            var $goodButton = $($(this).find('.commentGoodButton')[0]);
                            
                            var targetCommentIndex;                            
                            // コメントを取得
                            window.comcontroller.comments
                                .some(function(v, i){
                                    if (v.commentid==commentID){
                                        targetCommentIndex = i;
                                    };
                                });  
                            
                            if(window.comcontroller.comments[targetCommentIndex].isgood){
                                // コメントを未Goodにする
                                window.comcontroller.comments[targetCommentIndex].isgood = false;
                                
                                window.comcontroller.sendGoodCount("decrement", commentID); 
                            }else{                       
                                // コメントをGood済みにする
                                window.comcontroller.comments[targetCommentIndex].isgood = true;
                                
                                window.comcontroller.sendGoodCount("increment", commentID);
                            }
                        });  
                     
                     if(this.isgood){
                         $($goodTD.find('.commentGoodButton')[0])
                            .addClass('btn-primary');
                     }                
                }
                
                $userTD
                    .addClass('userTD');
                $textTD
                    .addClass('textTD')
                    .html(this.text);
                var date = window.comcontroller.timestampToDate(this.timestamp);
                $dateTD
                    .addClass('fontsize5 dateTD')
                    .html(date);
                $goodTD
                    .addClass('goodTD');
                
                $TR
                    .append($userTD)
                    .append($textTD)
                    .append($dateTD)
                    .append($goodTD)
                    .prependTo($('#commentView'));                
            }
        }
    });
};

ComController.prototype.sendCommentToPresenter = function(commentText){
    var msg = {
        type: "cmt_embed",
        commentid: window.wfepcontroller.makeRandobet(128),
        from: window.mickrmanager.name,
        to: window.comcontroller.toUser,
        cslide: window.comcontroller.cslide,
        text: commentText,
        topresenter: true
    };
    window.mickrmanager.sendMickr(msg);

    $('#commentInput').val('');
};

ComController.prototype.sendCommentToAudience = function(commentText){
    var msg = {
        type: "cmt_audience",
        commentid: window.wfepcontroller.makeRandobet(128),
        from: window.mickrmanager.name,
        to: window.comcontroller.toUser,
        cslide: window.comcontroller.cslide,
        text: commentText,
        topresenter: false
    };
    window.mickrmanager.sendMickr(msg);

    $('#commentInput').val('');
};

ComController.prototype.analyzeCommentText = function(text){
    window.comcontroller.toUser = "";
    window.comcontroller.commentText = "";
    window.comcontroller.cslide = "";
    
    var textPiece = text.split(' ');
    $.each(textPiece, function() {
        if(this=="") return;
        
        var fastChar = this.charAt(0);
          
        switch(fastChar){
            case "@":
                var toUsers = this.split('@');
                $.each(toUsers, function() {
                    if(this=="") return;
                    
                    if(window.comcontroller.usernameIsDuplicated(this)>=0){
                        window.comcontroller.toUser += this+",";                        
                    }
                });
                        
                break;
            case "#":
                var slideNumbers = this.split('#');
                $.each(slideNumbers, function() {
                    var literal = this.toString();
                    
                    // 数字文字列じゃなかったら終了
                    if(literal=="" || isNaN(literal)) return;
                    
                    var num = parseInt(literal);
                    // スライド枚数を超えてたら終了
                    if(literal>window.wfepcontroller.slideURLs.length) return;
                    window.comcontroller.cslide = num;
                });
                
                break;
            default:
                window.comcontroller.commentText += this+" ";
                
                break;
        };
    });
    
    if(window.comcontroller.cslide==""){
        window.comcontroller.cslide = window.wfepcontroller.cslide;
    }
    
    console.log(window.comcontroller.toUser);
    console.log(window.comcontroller.commentText);
    console.log(window.comcontroller.cslide);
};

ComController.prototype.updateCommentInputWithSelectedSlide = function(slideIndex){    
    // "#"で始まる部分を削除
    var oldText = $('#commentInput').val();
    var oldTextList = oldText.split(" ");
    var newText = "";
    $.each(oldTextList, function() {
        if(this.charAt(0)!="#" && this!=""){
            newText += this + " ";
        }
    });
    
    if(slideIndex==0){
        $('#commentInput')
            .val(newText);        
    }else{
        $('#commentInput')
            .val('#'+slideIndex+' '+newText);        
    }
    
};

ComController.prototype.updateCommentInputWithSelectedUser = function(userID){    
    var oldText = $('#commentInput').val();
    var targetName = "";
    $.each(window.comcontroller.users, function() {
        if(this.id == userID){
            targetName = this.name;
            return;
        }
    });
    
    if(oldText.indexOf('@'+targetName+' ')==-1){
        $('#commentInput')
            .val('@'+targetName+' '+oldText);        
    }      
    $('#commentInput')
        .focus();  
};

// 受信した情報に基づきGood数を更新
ComController.prototype.updateCommentGoodCount = function(msg){
    var val = msg.val;
    var commentID = msg.commentid;
    var userID = msg.id;
    
    this.comments
        .some(function(v, i){
            if (v.commentid==commentID){
                if(val=="increment"){
                    v.goodcount+=1;
                    
                    // Good数が一定値を超えたらプレゼンターに送信
                    if(v.goodcount>=window.comcontroller.users.length*window.comcontroller.goodCountBorder && !v.topresenter){
                        v.topresenter = true;
                        
                        if(userID==window.wfepcontroller.userID){
                            window.comcontroller.cslide = v.slideindex;
                            window.comcontroller.sendCommentToPresenter(v.text);         
                            
                            // コメントの削除処理
                            var msg = {
                                "type":"cmt_remove",
                                "commentid":v.commentid
                            };
                            window.mickrmanager.sendMickr(msg);     
                        }
                    }
                }else{
                    v.goodcount-=1;
                }
            };
        });  
    
    this.updateCommentView(); 
};

ComController.prototype.sendGoodCount = function(val, commentID){
    var msg = {
        type: "cmt_goodcount",
        id: window.wfepcontroller.userID,
        commentid: commentID,
        val: val
    };
    window.mickrmanager.sendMickr(msg);
};

ComController.prototype.timestampToDate = function(timestamp){
    var ts = parseInt(timestamp);
    var d = new Date( ts );
    var year  = d.getFullYear();
    var month = d.getMonth() + 1;
    var day  = d.getDate();
    var hour = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
    var min  = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
    var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
    var result = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    
    return result;
};

// Mickrサーバの利用
function MickrManager(){
    this.name = "default";
    //評価用
    //this.token = "demo";

    this.token = "default";
    
    // モーダルが表示されているかどうか
    this.duplicateModalIsOpen = false;
};

MickrManager.prototype.init = function(){
    $('#tokenWindow')
        .modal()
        .on('shown',function(){
            if(window.wfepcontroller.UA == "iphone" || window.wfepcontroller.UA == "ipad" || window.wfepcontroller.UA == "android" || window.wfepcontroller.UA == "ipod"){
            }else{
                $('#nameInput').focus();
            }
        });
    // window.mickrmanager.clientInit();

    $('#tokenSubmit')
        .on('click',function(){
            if($('#nameInput').val() == ""){
                $('#tokenMessage').html("Name is requred.");
                $('#nameInput').focus();
                return;
            }else{
                window.mickrmanager.name = $('#nameInput').val();
            }
            
            // デモ用にトークン入力省略
            if($('#tokenInput').val() == ""){
                $('#tokenMessage').html("Token is requred.");
                $('#tokenInput').focus();
                return;
            }else{
                window.mickrmanager.token = $('#tokenInput').val();
            }

            $('#tokenWindow')
                .modal('hide');

            window.mickrmanager.clientInit();
        });

    $('#nameInput')
        .keypress( function ( e ) {
            if ( e.which == 13 ) {
                    $('#tokenSubmit').trigger('click');
                return false;
            }
        } )
        .focus(function() {
            $(this).select();
            return false;    
        });

    $('#tokenInput')
        .keypress( function ( e ) {
            if ( e.which == 13 ) {
                    $('#tokenSubmit').trigger('click');
                return false;
            }
        } )
        .focus(function() {
            $(this).select();
            return false;    
        });
    
    // 以降ユーザ名重複時のインターフェース    
    $('#duplicateWindow')
        .on('shown',function(){
            window.mickrmanager.duplicateModalIsOpen = true;
            
            $('#usedName')
                .html('"'+window.mickrmanager.name+'"');
            var dynamicFontSize = $('#usedName').width()/$('#usedName').html().length;
            $('#usedName')
                .css({
                    "font-size":dynamicFontSize+"px"
                });
            
            $('#duplicateNameInput')
                .val(window.mickrmanager.name);
            $('#duplicateNameInput').focus();
        })
        .on('hide',function(){
            window.mickrmanager.duplicateModalIsOpen = false;
        });
        
    $('#usernameSubmit')
        .on('click',function(){
            if($('#duplicateNameInput').val() == ""){
                $('#tokenMessage').html("Name is requred.");
                $('#duplicateNameInput').focus();
                return;
            }else{
                window.mickrmanager.name = $('#duplicateNameInput').val();
            };

            $('#duplicateWindow')
                .modal('hide');
            
            // ユーザリストの初期化
            window.comcontroller.initializeUserList();
            
            var msg = {
                type: "client_connect",
                userid: window.wfepcontroller.userID,
                name: window.mickrmanager.name
            };
            window.mickrmanager.sendMickr(msg);
        });
        
    $('#duplicateNameInput')
        .keypress( function ( e ) {
            if ( e.which == 13 ) {
                $('#usernameSubmit').trigger('click');
                
                return false;
            }
        } )
        .focus(function() {
            $(this).select();
            
            return false;    
        });
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

        // 接続したことを他のクライアントに通知，接続中のクライアントの情報を収集
        var msg = {
            type: "client_connect",
            userid: window.wfepcontroller.userID,
            name: window.mickrmanager.name
        };
        window.mickrmanager.sendMickr(msg);

        // スライド画像のURL取得
        var msg = {
            type: "get_imgurls"
        };
        window.mickrmanager.sendMickr(msg);
        
        // 投票中ならば選択肢のラベル取得
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

        // 評価用
        if(typeof msg._msg != "undefined"){
            console.log(msg._msg);
            var voteMessage = msg._msg.body.message;

            if(typeof voteMessage.myts != "undefined" && voteMessage.from == window.mickrmanager.name){
                var now = new Date();
                var time = now*1 - voteMessage.myts;

                console.log("res:"+time);
                console.log("count:"+voteMessage.from+" "+voteMessage.testcount);
            }

            return;
        }

        switch(msg.type){
            /* プレゼン画像取得 */
            case "post_imgurls":
                // スライドのURL群
                window.wfepcontroller.slideURLs.length = 0;
                window.wfepcontroller.slideURLs = msg.url.split(/;;/);
                window.wfepcontroller.slideURLs.pop();

                // スライダーの設定
                $('#pageSlider')
                    .slider({
                        range:"min",
                        value: msg.cslide,
                        min: 1,
                        max: window.wfepcontroller.slideURLs.length,
                        step: 1,
                        slide: function(e, ui) {
                            window.wfepcontroller.jumpSlide(ui.value);
                        }
                    });
                    
                window.wfepcontroller.jumpSlide(msg.cslide);
                
                // 評価用
                window.doevaluation.getEvaluationToken();

                break;
                
            /* アノテーション */
            case "cmt_pub":
                window.wfepcontroller.manipulateAnnotation(msg);
                
                break;
            case "cmt_moveend":
                window.wfepcontroller.manipulateAnnotation(msg);
                
                break;
            case "cmt_moving":
                window.wfepcontroller.manipulateAnnotation(msg);
                
                break;
                
            /* 埋め込みコメント */                    
            case "cmt_embed":
                window.comcontroller.addCommentToList(msg,date);
                window.comcontroller.updateCommentView();
                
                break;
            case "cmt_audience":
                window.comcontroller.addCommentToList(msg,date);
                window.comcontroller.updateCommentView();
            
                break;
            case "cmt_goodcount":
                window.comcontroller.updateCommentGoodCount(msg);
                
                break;
            case "cmt_remove":
                window.comcontroller.removeCommentFromList(msg);
                window.comcontroller.updateCommentView();
                
                break;
            
            /* ページめくり */    
            case "ssbegin":
                // スライドのURL群
                window.wfepcontroller.slideURLs = msg.url.split(/;;/);
                
                // アノテーションのクリア
                window.wfepcontroller.clearAnnotations('all');

                // コミュニケーションインターフェースのスライド一覧の更新
                window.comcontroller.settingRoomList();
                
                window.wfepcontroller.jumpSlide(msg.cslide);

                break;
            case "ssnext":
                // 同期オフのときは無視
                if(window.wfepcontroller.syncState){
                    window.wfepcontroller.jumpSlide(msg.cslide);
                }

                break;
            case "ssend":
                // デフォルトスライド表示
                $('#slideImage')
                    .attr({
                        src:"./img/demoslide.png"
                    });

                // スライダーの初期化
                $('#pageSlider')
                    .slider({
                        range:"min",
                        value: 0,
                        min: 0,
                        max: 0,
                        step: 1,
                        slide: function(e, ui) {
                        }
                    });
                    
                break;
            case "updateimg":
                window.wfepcontroller.slideURLs[msg.cslide-1] = msg.url;
                
                // 対象のスライドのアノテーションが画像化されてしまうためアノテーションを削除
                window.wfepcontroller.clearAnnotations(msg.cslide);                
                
                window.wfepcontroller.jumpSlide(msg.cslide);

                break;
                
            /* ポインタ */    
            case "pointer":
                clearTimeout(window.wfepcontroller.pointerTimer);
                window.wfepcontroller.pointerTimer = setTimeout(function(){
                    $('.pointer').remove();
                },1000);

                // 同期オフのときは無視
                if(window.wfepcontroller.syncState){
                    window.wfepcontroller.showPointer(msg);
                }

                break;
            
            /* 手書きメモ */
            case "handwrite":
                window.drawcanvas.syncDrawing(msg.imgurl,msg.cslide);

                break;
                
            /* 投票 */    
            case "vote_start":
                window.vote.activeVote(msg.cslide);
                window.vote.setVoteLabels(msg.items);
                window.vote.showVoteLabels();

                break;
            case "vote_end":
                window.vote.closeVote();
                window.vote.hideVoteLabels();

                break;
            case "vote_active":
                window.vote.activeVote(msg.cslide);
                window.vote.setVoteLabels(msg.items);
                window.vote.showVoteLabels();

                break;
            
            /* Webアプリケーションでのユーザ管理 */    
            case "client_connect":
                // 重複確認
                var duplicateIndex = window.comcontroller.usernameIsDuplicated(msg.name);
                if(msg.userid!=window.wfepcontroller.userID && duplicateIndex==-1){
                    window.comcontroller.addUserToList(msg,date);
                    window.comcontroller.settingUserList();
                };                
                
                // 返答
                var resmsg = {
                    type: "client_connect_reply",
                    userid: window.wfepcontroller.userID,
                    name: window.mickrmanager.name,
                    replyto: msg.userid
                };
                window.mickrmanager.sendMickr(resmsg);

                break;
            case "client_connect_reply":
                if(msg.replyto==window.wfepcontroller.userID){
                    if(msg.userid != window.wfepcontroller.userID && msg.name == window.mickrmanager.name){
                        window.mickrmanager.duplicateUsername();
                    }else{
                        window.comcontroller.addUserToList(msg,date);                        
                    };           
                };                    
                
                break;
            case "client_disconnect":
                window.comcontroller.removeUserFromList(msg);   
                window.comcontroller.settingUserList();             
                
                break;
                
            // 以下WFE-P3
            case "show":
                // 同期オフのときは無視
                if(window.wfepcontroller.syncState){
                    if(msg.file!=window.wfepcontroller.fileName){
                        window.wfepcontroller.fileName = msg.file;
                        window.wfepcontroller.slideURLs.length = 0;
                    }
                    
                    // スライダー設定
                    $('#pageSlider')
                        .slider({
                            range:"min",
                            min: 1,
                            max: window.wfepcontroller.slideURLs.length,
                            step: 1,
                            slide: function(e, ui) {
                                var index = window.wfepcontroller.slideURLs[ui.value].index;
                                var click = window.wfepcontroller.slideURLs[ui.value].click;
                                
                                window.wfepcontroller.jumpSlide2(index, click);
                            }
                        });
                    
                    window.wfepcontroller.updateList(msg.slide,msg.click,msg.url);
                    window.wfepcontroller.jumpSlide2(msg.slide, msg.click);
                }
                
                break;
            case "post_evaluation_token":
                window.doevaluation.setEvaluationToken(msg);
                
                break;
            case "post_evaluation":
                window.doevaluation.sendEvaluationInfoToSever(msg);
                
                break;
            default : break;
        };
    };
};

MickrManager.prototype.sendMickr = function(msg){
    msg.from = this.name;

    // 評価実験時には時間を記録
    if(window.doevaluation.evaluationMode){
        var date = new Date();
        msg.starttime = date.getTime();
        msg.evaluationtoken = window.doevaluation.evaluationToken;
    }else if(window.doevaluation.getDataMode){
        window.doevaluation.getData(msg);
    }

    var to = "*";
    var group = this.token;
    MWClient.send(msg, to, group);
};

// モーダル再表示
MickrManager.prototype.duplicateUsername = function(){
    // モーダルの再表示が上手くいかないので遅延を挟む
    setTimeout(function(){
        $('.modal-backdrop').remove();
        while(true){
            if(!this.duplicateModalIsOpen){
                $('#duplicateWindow')
                    .modal();
                    
                break;            
            }    
        };
    },500);
};

// デモ用
function DemoSlide(){};

DemoSlide.prototype.init = function(){
    // デモ用
    
    for(i=1;i<=5;i++){
        window.wfepcontroller.slideURLs.push("./img/test/0"+i+".jpg");
    };
    window.wfepcontroller.jumpSlide(1);
    
    // WFE-P3
    //for(i=1;i<=5;i++){
    //    var obj = {
    //        index: i,
    //        click: 0,
    //        url: "./img/test/0"+i+".jpg"
    //    };
    //    window.wfepcontroller.slideURLs.push(obj);
    //};
    //window.wfepcontroller.jumpSlide2(1,0);
    
    // スライダー
    $('#pageSlider')
        .slider({
            range:"min",
            value: 1,
            min: 1,
            max: window.wfepcontroller.slideURLs.length,
            step: 1,
            slide: function(e, ui) {
                window.wfepcontroller.jumpSlide2(ui.value,0);
            }
        });
};

// 評価用
function DoEvaluation(){
    this.evaluationMode = false;
    
    // プレゼンテーションを識別するためのランダムトークン
    this.evaluationToken = "";
    
    // evaluationディレクトリのindex.jsを実行しているサーバ
    this.evaluationSeverURL = "http://133.68.14.167:3333"; // inouerのiMac
    
    this.getDataMode = false;
};

DoEvaluation.prototype.init = function(){    
    this.getDataMode = true;
};

// テストケース構築のための操作データの収集
DoEvaluation.prototype.getData = function(msg){
    msg.evaluationtoken = window.doevaluation.evaluationToken;
    msg.userid = window.wfepcontroller.userID;
    msg.name = window.mickrmanager.name;
    
    console.log(msg);
    
    var successHandler = function(){};
    this.sendEvaluationServer("/savemanipulationdata", msg, successHandler);
};

DoEvaluation.prototype.getEvaluationToken = function(){
    // 実験識別用のトークンを生成(Silhouette Effect側で)
    var msg = {
        type: "get_evaluation_token"
    };
    window.mickrmanager.sendMickr(msg);
};

DoEvaluation.prototype.setEvaluationToken = function(msg){
    // this. testCaseMode();
    
    this.evaluationToken = msg.evaluationtoken;
    
    console.log("evaluationToken: "+this.evaluationToken);
};

DoEvaluation.prototype.testCaseMode = function(){
    this.evaluationMode = true;    
    this.getDataMode = false;
};

DoEvaluation.prototype.storeData = function(msg){
    // 経過時間計算
    var date = new Date();
    date = parseInt(date.getTime());
    var time = date - parseInt(msg.starttime);
    
    // メッセージ作成
    msg.time = time;
    msg.starttime = parseInt(msg.starttime);
    msg.endtime = date;

    console.log(msg);
    
    var successHandler = function(){};
    this.sendEvaluationServer("/storeresult", msg, successHandler);
};

// mode(String): "/savemanipulationdata"→操作情報の記録，"/storeresult"→実験結果の保存
// data(Object): 送信するデータ
// successHandler(function): 成功時の処理
DoEvaluation.prototype.sendEvaluationServer = function(mode, data, successHandler){
    if(this.resultSeverURL!=""){
        var jsonData = JSON.stringify(data);
        
        $.ajax({
            url: window.doevaluation.evaluationSeverURL+mode,
            type: "POST",
            dataType: 'jsonp',
            crossDomain: true,
            data: {jsondata: jsonData}
        })
        .then(
            successHandler,
            function(xhr, status, error) {
                // 通信失敗時の処理
            }
        );
    }    
};

DoEvaluation.prototype.getExpRand = function(avg){
    return Math.floor(-avg*(1.0/1.0)*Math.log(1.0-Math.random()));
};

$(function() {
    window.mickrmanager = new MickrManager;
    window.mickrmanager.init();

    window.wfepcontroller = new WFEPController;
    window.wfepcontroller.init();

    window.thumbnailcontroller = new ThumbnailController;
    window.thumbnailcontroller.init();

    //window.commentcontroller = new CommentController;
    //window.commentcontroller.init();
    
    window.comcontroller = new ComController;
    window.comcontroller.init();

    window.drawcanvas = new DrawCanvas;
    window.drawcanvas.init();

    window.vote = new Vote;
    window.vote.init();

    window.doevaluation = new DoEvaluation;
    window.doevaluation.init();

    //window.demoslide = new DemoSlide;
    //window.demoslide.init();
});