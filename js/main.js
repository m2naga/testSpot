//実行装置
var viewer,camera,defaultPanorama,roofPanorama;
//情報
var information,roof,spots;
//現在の状態
var currentIndex,currentMode,currentRoof,currentLookAt;
//連想配列
var dictionarySpotIndex = {};
//情報一覧
var infospots = [];
//マップ上のアイコン一覧
var mapIcons = [];
//初期化
currentIndex = -1;
currentMode = 0;
currentRoof = 0;
/// information.jsonを読み込む
$.getJSON("src/information.json",function(data){
	//information.jsonの内容を取得
	information = data;
	roof = data.roof;
	//初期化を実行
	viewer = new PANOLENS.Viewer( { output: 'console', container: document.querySelector( '#container' ) } );
	createDefaultPanorama();
	createRoofPanorama();
	//spotsを取得
	spots = [Object.keys(information.spots).length];
	//タイトルの設定
	document.title = information.name;
	//Map画像の生成
	createMap();
	//各パノラマの情報を設定
	for(let i=0;i<spots.length;++i)
	{
		var index = i;
		var spotId = information.spots[i];
		//データを取得
		$.getJSON("src/spots/" + spotId+".json",function(spot) {
			spots[index] = spot;
			//連想配列に設定
			dictionarySpotIndex[spot.spot_id] = i;
			//マップのアイコンを追加
			AddMapIcon(spot);
			//最後のデータであるか判定
			if(index +1 < spots.length)
			{
				return;
			}
			//特に何もなければ最初のspotを設定する
			setSpotIndex(0);
		});
	}	
});

//基本のパノラマを生成
function createDefaultPanorama()
{
	defaultPanorama = new PANOLENS.ImagePanorama();
	viewer.add(defaultPanorama);

	//infoSpotテスト
	/*
	PANOLENS.Infospot()の引数が.svg形式の画像場合表示されず、スケール分の白い四角が表示される。
	.png形式であれば表示された。
	src/spots/id.jsonの"icon": "go_to_roof.svg"部分も.png形式であれば表示された。
	.svgでは表示されない？

	スマホ表示の場合、PANOLENSを使用すると作成済みの閉じるボタンが反応しない。
	ブラウザの場合は、閉じるボタンでダイアログを終了することができる。
	*/
	var sampleInfoSpot = new PANOLENS.Infospot(500, '../src/icons/info.png');
	sampleInfoSpot.position.set(4700, 450, 1300);
	$(sampleInfoSpot).addClass('js-sample-open');
	$(sampleInfoSpot).data('target','sample01');
	sampleInfoSpot.addEventListener('click',function(){
		var target = $(this).data('target');
		var sampleName = document.getElementById(target);
		//leftの値 = (ウィンドウ幅 -コンテンツ幅) ÷ 2
		var leftPosition = (($(window).width() - $(sampleName).outerWidth(true)) / 2);
		//CSSを変更
		$(sampleName).css({"left": leftPosition + "px"});
		var heightPosition = (($(window).height()) / 1.8);
		$('.dialog-content img').css({"height": heightPosition});
		$('.dialog-content video').css({"height": heightPosition});
		//ダイアログを表示する
		$(sampleName).show();
	});
	//ここまで

	defaultPanorama.add(sampleInfoSpot);
}

//屋根からのパノラマを生成
function createRoofPanorama()
{
	//新規作成
	roofPanorama = new PANOLENS.ImagePanorama("src/pictures/"+roof.picture_off);
	//表示情報の追加
	for(let i = 0;i < roof.infos.length;++i)
	{
		roofPanorama.add(createInfospot(roof.infos[i]));
	}
	
	viewer.add(roofPanorama)
}

//マップを生成
function createMap()
{
	
}

//マップアイコンの追加
function AddMapIcon(spot)
{
	
}



//引数に指定したインデックスのspotを表示する
function setSpotIndex(index)
{
	//範囲外の対処
	if(index < 0 || index >= spots.length)
	{
		index = 0;
	}
	//処理対象外の設定
	if(currentIndex === index || index >= spots.length)
	{
		return;
	}
	//Spotを取得
	var spot = spots[index];
	//初期値を設定
	setSpotStatus(index,spot.initial_fov,spot.initial_x,spot.initial_y,spot.initial_z,currentMode,0);
}

// 引数に指定したindexのspotを表示する。その際に視点とfovと表示モードを指定する
function setSpotStatus(index,fov,x,y,z,mode,roofValue)
{
	//範囲外の対処
	if(index < 0 || index >= spots.length)
	{
		index = 0;
	}
	//処理対象外の設定
	if(index >= spots.length)
	{
		return;
	}
	//TODO 表示名称を更新
	
	//置き換え
	currentIndex = index;
	//地図表示を更新
	updateMap();
	//情報表示を更新
	updateInfospot();
	//パノラマの切り替え
	if(currentRoof != roofValue)
	{
		currentRoof = roofValue;
		updatePanorama();
	}
	//モードの切り替え
	if(currentMode === mode)
	{
		//切り替えがない場合は画像を更新
		updatePicture();
	}
	else
	{
		//モード切替を実行
		switchMode();
	}
	//カメラ表示を変更
	setView(fov,x,y,z);	
}

//表示モードを変更する。ボタンからの変更用
function switchMode()
{
	if(currentMode === 0)
	{
		setMode(1);
	}
	else
	{
		setMode(0);
	}
}

//表示モードを切り替える 0=通常。1=メジャー
function setMode(mode)
{
	if(currentMode === mode)
	{
		return;
	}
	//モード変更を実行
	currentMode = mode;	
	//TODO アイコンの表示を切り替え
	
	//画面の更新
	updatePicture();
}

//画像の更新
function updatePicture()
{
	var fileName,panorama;
	//屋根であるか判定
	if(currentRoof === 0)
	{
		var spot = spots[currentIndex];
		//ファイル名を取得	
		if(currentMode === 1)
		{
			fileName = spot.picture_on;
		}
		else
		{		
			fileName = spot.picture_off;
		}
		panorama = defaultPanorama;
	}
	//屋根
	else
	{
		//ファイル名を取得	
		if(currentMode === 1)
		{
			fileName = roof.picture_on;
		}
		else
		{		
			fileName = roof.picture_off;
		}
		panorama = roofPanorama;		
	}
	//ファイルパスを取得
	var filePath = "src/pictures/" + fileName;
	//画像を更新する
	panorama.load(filePath);
	console.log("load:"+filePath);
}

//パノラマの更新
function updatePanorama()
{
	var panorama, fov,x,y,z,minFov,maxFov;
	if(currentRoof === 0 || !roofPanorama)
	{
		//パノラマの切り替え
		panorama = defaultPanorama;
		//データを設定
		var spot = spots[currentIndex];
		fov = spot.initial_fov;
		x = spot.initial_x;
		y = spot.initial_y;
		z = spot.initial_z;		
		minFov = spot.min_fov;
		maxFov = spot.max_fov;
	}
	else
	{
		//パノラマの切り替え
		panorama = roofPanorama;
		//データを設定
		fov = roof.fov;
		x = roof.x;
		y = roof.y;
		z = roof.z;		
		minFov = roof.min_fov;
		maxFov = roof.max_fov;
	}
	//設定を実行
	viewer.setPanorama(panorama);
	viewer.OrbitControls.minFov = minFov;
	viewer.OrbitControls.maxFov = maxFov;
	setView(fov,x,y,z);
}

//マップの表示を更新
function updateMap()
{
	//情報を取得
	var spot = spots[currentIndex];
	//TODO 各アイコンの画像を更新する
	//TODO disablesになっているアイコンは非表示にする
	
}

//infospotの更新
function updateInfospot()
{
	//既存のものを全て削除する
	for(let i = 0;i < infospots.length;++i)
	{
		infospots[i].dispose();
	}
	//情報を取得
	var spot = spots[currentIndex];
	var infos = spot.infos;
	//新規追加
	infospots = [Object.keys(infos).length];
	for(let i = 0;i < infospots.length;++i)
	{
		//生成
		infospots[i] = createInfospot(spot.infos[i]);
		//追加
		defaultPanorama.add(infospots[i]);
	}
}

//infospotの作成
function createInfospot(info)
{
	//初期値を設定
	var icon =  PANOLENS.DataImage.Info;
	//アイコンを設定
	if(info.icon)
	{
		//TODO アイコンの設定が可能であるかを確認
		icon = "src/icons/" + info.icon;
	}
	//スケールを設定
	var scale = 300;
	if(info.scale)
	{
		scale = info.scale;
	}
	//spotを生成
	var infospot = new PANOLENS.Infospot( scale, icon );
	//座標をセット
	infospot.position.set(info.x,info.y,info.z);
	//イベントを設定
	if(info.kind === "roof")
	{
		//roofとsideの切り替え
		infospot.addEventListener( 'click', function(){
			//切り替えを実行
			if(currentRoof === 1)
			{
				currentRoof = 0;
			}else
			{
				currentRoof = 1;
			}
			updatePanorama();
		});
	}
	//spotの場合
	else if(info.kind === "spot")
	{
		//対象となるidのindexを取得
		var index = dictionarySpotIndex[info.info_id];
		//表示を変更
		infospot.addEventListener( 'click', function(){
			setSpotIndex(index);
		});			
	}
	//それ以外の場合
	else
	{
		var kind = info.kind;
		var id = info.info_id;
		//ダイアログを表示
		infospot.addEventListener( 'click', function(){
			showDialog(kind,id);
		});		
	}
	return infospot;
}

//カメラ表示を修正
function setView(fov,x,y,z)
{
	//FOVを指定
	viewer.setCameraFov(fov);	
	//初期の角度を設定
	viewer.tweenControlCenter(new THREE.Vector3(x, y, z),0);
}

//ダイアログの表示
function showDialog(kind,id)
{
	$.getJSON("src/" + kind + "/" + id+".json",function(data){
		var title = data.title;
		var url = data.url;
		var desc = data.description;
		//TODO ダイアログの表示を実行
	});
}

//ダイアログ閉じるボタンで非表示
$(".dialog-close").on("click", function(){
	$(this).parents(".dialog").hide();
});
