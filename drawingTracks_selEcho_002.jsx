/**

* @@@BUILDINFO@@@ drawingTracks_selEcho_002.jsx !Version! Sat Sep 24 2011 13:27:00 GMT+0900
選択したアイテムにエコーエフェクトを適用
EchoFxレイヤーを作成
addFootageNewComp関数の接尾辞機能を自動的に＿を付加する
*/

{
    function addEchoToSelItems(){
        var selectedItems = app.project.selection;   
        if (selectedItems != null) {
            for (i = 0; i < selectedItems.length; i++) {
                var item = selectedItems[i];
                if (item instanceof FootageItem) {
                    if (item.hasVideo) {
                        var agreeAddEchoFx = confirm (item.name + "にエコーエフェクトを適用しますか？", false, "Add Echo Fx");
                        if (agreeAddEchoFx) {
                            difTWtoDrawTracks (item);
                        }
                    }
                } else {
                    alert (item.name + "は " + item.typeName + "です");
                }
            }
        } else {
            alert ("アイテムを選択してください");
        }
    
        //difイメージからエコーエフェクト適用素材の作成
        function difTWtoDrawTracks (footage) {
            var compBgColor = [1,1,1];
            var footageFolder = app.project.items.addFolder(footage.name);
            var ntscFps = 30000/1001;

            footage.parentFolder = footageFolder;
            
            var drawTracksComp = addFootageNewComp (footage, "drawTracks", 0);
            drawTracksComp.bgColor = compBgColor;
            drawTracksComp.frameRate = ntscFps;
            drawTracksComp.layer(1).duplicate();
            var echoPastLayer = drawTracksComp.layer(1);
            var echoFutureLayer = drawTracksComp.layer(2);
            
            echoPastDur = prompt ("過去方向エコーの時間（秒）を入力してください", 4, "Echo PAST Duration");
            echoPastDur = eval (echoPastDur);
            addEchoFx (echoPastLayer, -1, echoPastDur);
            
            echoFutureDur = prompt ("未来方向エコーする時間（秒）を入力してください", 2, "Echo FUTURE Duration");
            echoFutureDur = eval (echoFutureDur);
            addEchoFx (echoFutureLayer, 1, echoFutureDur);
            
            echoPastLayer.startTime = - oneFrame (footage); //エコーインとアウトの最初のフレームが重ならないように、echoInを1フレーム分ずらす
            
//~             setLayersInPoint (drawTracksComp, echoPastDur);
//~             setLayersOutPoint (drawTracksComp, echoFutureDur);
            setLayersIOPoint (drawTracksComp, echoPastDur, echoFutureDur);
            setWorkArea (drawTracksComp, echoPastDur, echoFutureDur);
            
            drawTracksComp.time = drawTracksComp.workAreaStart;
            
            //ファイル名の文字列から拡張子を削除
            function fileExtRemove(fileName){
                var nameDotArray = fileName.split(".");
                nameDotArray.splice((nameDotArray.length -1), 1);
                return nameDotArray.join (".");
            }
            
            //フッテージの1フレームの時間(単位：秒)を返す
            function oneFrame(footage){
                var oneFrame = footage.frameDuration;
                return oneFrame;
            }            
       
            //フッテージから新しいコンポジションを作成+接尾辞を追加
            function addFootageNewComp(footage, suffix, setupIndex){
                //引数が未入力の場合のデフォルト値
                switch (arguments.length){
                    case 0: 
                        footage = footage;
                    case 1:
                        suffix = "";
                    case 2:
                        setupIndex = 0;
                }
            
                function newComp(footage, suffix){
                    //フッテージの名前に接尾辞を付加
                    function ftgNameAddSuffix(footage, suffix){
                        var footageName;
                        //footageがフッテージの場合、footage.nameから拡張子を削除
                        if (footage instanceof FootageItem) {
                            footageName = fileExtRemove (footage.name);
                        } else {
                            footageName = footage.name;
                        }
                        if (suffix.length > 0){
                            footageName = footageName + "_" + suffix;
                        }
                        return footageName; 
                    } 
                    var footageComp = app.project.items.addComp(
                        ftgNameAddSuffix (footage, suffix),
                        footage.width,
                        footage.height,
                        footage.pixelAspect,
                        footage.duration,
                        footage.frameRate
                    );
                    footageComp.parentFolder = footageFolder;
                    
                    return footageComp;
                }
                //フッテージ数による条件分け
                if (footage instanceof Array) { //footageが配列の場合
                    var setupFootage = footage[setupIndex];
                    var footageComp = newComp (setupFootage, suffix);
                    for (var i = 0;  i < footage.length; i++) {
                         footageComp.layers.add(footage[i]);
                    }
                } else {
                    var footageComp = newComp (footage, suffix);
                    footageComp.layers.add(footage);
                }
     
                return footageComp;
            }
            
            //レイヤーにDrawingTracksエコーエフェクトを適用
            function addEchoFx (layer, echoDirection, echoDuration){
                var numEchoesSliderFx = layer.effect.addProperty("ADBE Slider Control");
                var numEchoesName = "numEchoes";
                numEchoesSliderFx.name = numEchoesName;
                numEchoesSliderFx.property("ADBE Slider Control-0001").setValue(echoDuration);
                 
                var echoFx = layer.effect.addProperty("ADBE Echo");
                var echoFxName;
                if (echoDirection < 0){
                    var echoName = "echo Past";
                    layer.name = echoName + " " + layer.name;
                    echoFxName = echoName;
                    echoFx.property("ADBE Echo-0005").setValue(5); //後ろに合成
                } else if (echoDirection >= 0){
                    var echoName = "echo Future";
                    layer.name = echoName + " " + layer.name;
                    echoFxName = echoName;
                    echoFx.property("ADBE Echo-0005").setValue(6); //前に合成
                }
                echoFx.name = echoFxName;
                echoFx.property("ADBE Echo-0001").expression = "" + (oneFrame (footage)*echoDirection) + "*1"; 
                echoFx.property("ADBE Echo-0002").expression = "fps = 1.0 / Math.abs(effect(\"" + echoFxName + "\")(\"ADBE Echo-0001\"));\n"+"echoDuration = effect(\"" + numEchoesName + "\")(\"ADBE Slider Control-0001\");\n"+"echoFrames = timeToFrames(t = echoDuration, fps, isDuration = false);";
                echoFx.property("ADBE Echo-0003").expression = "effect(\"" + echoFxName + "\")(\"ADBE Echo-0004\");";
                echoFx.property("ADBE Echo-0004").expression = "opacityMin = 0.001;\n"+"numEchoes = effect(\"" + echoFxName + "\")(\"ADBE Echo-0002\");\n"+"attenuation = Math.pow(opacityMin, (1 / numEchoes));";
            }
 
            //ワークエリアを設定
            function setWorkArea(comp, startTime, endTimeOffset){
                comp.workAreaStart = startTime;
                var endTime = comp.duration - endTimeOffset;
                comp.workAreaDuration = endTime - startTime;
            }
            //コンポジション内のレイヤーのイン・アウトポイントを設定
            function setLayersIOPoint(comp, layersInPoint, layersOutPointOffset){
                for (var i = 1; i <= comp.numLayers; i++) {
                        comp.layer(i).inPoint = layersInPoint;
                        comp.layer(i).outPoint = comp.duration - layersOutPointOffset;
                }
            }
        }   
    }
    addEchoToSelItems ();
}