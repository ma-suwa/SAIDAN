
let image;

window.addEventListener('load', init);
function init(){

  //分割パラメーター
  const PARAMS = {
    split: 3,
    offset: 0
  };
  const pane = new Tweakpane.Pane();

  pane.addInput(PARAMS, 'split',{min: 0, max: 10, step: 1})
  .on('change', (ev) => {
    if(ev.last){
      //img全削除
      allImgRemove();
      saidan(image,PARAMS.split,PARAMS.offset);
    }
  });

  pane.addInput(PARAMS, 'offset',{min: -2000, max: 2000, step: 1})
  .on('change', (ev) => {
    if(ev.last){
      //img全削除
      allImgRemove();
      saidan(image,PARAMS.split,PARAMS.offset);
    }
  });

  //ドラッグオンドロップ
  let container = document.getElementById('imgBox');
	let dropZone = document.getElementById('drop-zone');
  container.addEventListener('dragover', () => {
    dropZone.style.zIndex =99;
    container.style.zIndex = 1;
	});
	dropZone.addEventListener('dragover', (event) => {
    console.log("dragover");
		event.stopPropagation();
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
    dropZone.style.opacity = 0.8;
	});
	dropZone.addEventListener('drop', (event) => {
    console.log("drop");
		event.stopPropagation();
		event.preventDefault();
		const fileList = event.dataTransfer.files;
		loadLocalImage(fileList, PARAMS);
    
    dropZone.style.opacity = 0;
    dropZone.style.zIndex =-1;
    container.style.zIndex = 1;
    console.log( container.style.zIndex, dropZone.style.zIndex)
	});


}

function loadLocalImage(e, PARAMS) {

  //img全削除
  allImgRemove();

	let fileData = e[0];

	// 画像ファイル以外は処理を止める
	if(!fileData.type.match('image.*')) {
		alert('画像を選択してください');
		return;
	}

	// FileReaderオブジェクトを使ってファイル読み込み
	var reader = new FileReader();
	// ファイル読み込みに成功したときの処理
	reader.onload = function() {
    image = new Image();
    image.crossOrigin= 'Anonymous';
    image.src= reader.result;
    
    //画像読み込んだら裁断
    image.onload= function(){
        saidan(image,PARAMS.split,PARAMS.offset);
    }
	}
	// ファイル読み込みを実行
	reader.readAsDataURL(fileData);

}


//裁断処理
function saidan(image,split,offset){
    const sprite= {
        width:image.width,
        height:image.height/split
      }
    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
  
    const context= canvas.getContext('2d')
      //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    for(let i=0; i*sprite.height < image.height; i++){
      for(let j=0; j*sprite.width < image.width; j++){

            context.drawImage(
              image,
              j*sprite.width,
              i*sprite.height-offset*split,
              sprite.width,
              sprite.height,
              0,
              0,
              sprite.width,
              sprite.height
            )

        let spriteElement = new Image();
        spriteElement.src = canvas.toDataURL('jpg');
        spriteElement.download = "sample.jpg";

  
        document.querySelector('#imgBox').appendChild(spriteElement)
      }
    }
      
}

function allImgRemove(){
    //img全削除
    const parent = document.getElementById('imgBox');
    while(parent.firstChild){
      parent.removeChild(parent.firstChild);
    }
}


