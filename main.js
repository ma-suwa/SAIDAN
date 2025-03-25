document.addEventListener('DOMContentLoaded', () => {

    let image;

    const alertElement = document.getElementById('alert');
    function alertMessage(message) {
        if(alertElement) {
            alertElement.style.display = 'block';
            alertElement.innerText = message;
        }
        // setTimeout(() => {
        //     alertElement.style.display = 'none';
        // }, 10000);
    }


    const errorElement = document.getElementById('error');
    function errorMessage(message) {
        if(errorElement) {
            errorElement.style.display = 'block';
            errorElement.innerText = message;
        }
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    const PARAMS = {
        split: 3
    };
    const pane = new Tweakpane.Pane();
    pane.addInput(PARAMS,
         'split', { min: 0, max: 15, step: 0.5 })
        .on('change', (ev) => {
            if (ev.last) {
                allImgRemove();
                app = []; // Reset the app array
                saidan(image, PARAMS.split);
            }
        });
    const btn = pane.addButton({
        title: 'allcopy',
        label: '全てコピー',   // optional
        });
        btn.on('click', () => {
            copyAllImagesToClipboard();
        });

    const Application = PIXI.Application;
    const Loader = PIXI.Loader.shared;
    const Texture = PIXI.Texture;
    const Sprite = PIXI.Sprite;

    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', (event) => {
        dropZone.style.backgroundColor = '#d8ddea';
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    dropZone.addEventListener('drop', (event) => {
        event.stopPropagation();
        event.preventDefault();
        const fileList = event.dataTransfer.files;
        loadLocalImage(fileList);
        dropZone.style.display = 'none';
        imgBox.style.display = 'block';
    });

    const imgBox = document.getElementById('imgBox');
    imgBox.addEventListener('dragover', (event) => { 
        console.log('dragover');
        dropZone.style.display = 'block';
        imgBox.style.display = 'none';
    });

    function loadLocalImage(files) {
        const fileData = files[0];
        if (!fileData.type.match('image.*')) {
            alert('画像を選択してください');
            return;
        }
    
        const reader = new FileReader();
        reader.onload = function () {
            alertMessage("読み込んでいます...");
    
            let imageSrc = reader.result;
            const img = new Image();

            img.onload = function() {
                const maxHeight = 15000; // Set the maximum height for the image
                let width = img.width;
                let height = img.height;


                // 画像の比率チェック (横:縦 が 1:3 未満なら警告)
                if (width / height >= 1 / 3) {
                    errorMessage("そこまで縦長じゃないから、このツールは必要ないかもね");
                }
    
                // Check if the image exceeds the maximum height
                if (height > maxHeight) {
                    errorMessage("画像サイズが大きすぎるためリサイズしています...");
    
                    const aspectRatio = width / height;
                    height = maxHeight;
                    width = height * aspectRatio;
    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = width;
                    canvas.height = height;
                    // Draw the resized image on the canvas
                    ctx.drawImage(img, 0, 0, width, height);
                    // Convert the canvas to a data URL
                    const resizedImageSrc = canvas.toDataURL('image/jpeg');
                    imageSrc = resizedImageSrc;
                }
    
                // Reset Loader to remove existing resources
                Loader.reset();
    
                Loader.add('image', imageSrc)
                    .load((loader, resources) => {
                        alertElement.style.display = 'none';
                        image = resources.image.texture;
                        allImgRemove(); // Remove existing images
                        saidan(image, PARAMS.split); // Call saidan() with the new image
                        // dropZone.style.display = 'none';
                        document.getElementById('imgBox').style.display = 'flex';
                    });
            };
            img.src = imageSrc;
        };
        reader.readAsDataURL(fileData);
    }
    

    let app = [];
    let saidanCanvasList = [];
    let buttonList = [];

    function saidan(image, split) {
        const spriteHeight = image.height / split;
        
        for (let i = 0; i < split; i++) {
            app[i] = new Application({ transparent: true });

            saidanCanvasList[i] = document.createElement('div');
            saidanCanvasList[i].classList.add('saidanCanvas');
            document.getElementById('imgBox').appendChild(saidanCanvasList[i]);

            buttonList[i] = document.createElement('button');
            buttonList[i].classList.add('copyButton');

            const texture = new Texture(image.baseTexture);
            texture.frame = new PIXI.Rectangle(0, 0, image.width, image.height);
            app[i].renderer.resize(image.width, spriteHeight);
            let sprite = new Sprite(texture);
            sprite.y = -i * spriteHeight;
            sprite.interactive = true;
            sprite.buttonMode = true;

            sprite.on('pointerdown', onDragStart);
            sprite.on('pointerup', onDragEnd);
            sprite.on('pointerupoutside', onDragEnd);
            sprite.on('pointermove', onDragMove);

            app[i].stage.addChild(sprite);
        }
        setPlusButton();
        setCopyButton();
    }

    function setCopyButton() {
        for (let i = 0; i < app.length; i++) {
            let saidanCanvas = saidanCanvasList[i];
            let button = buttonList[i];
    
            button.removeEventListener('click', buttonClickHandler);
    
            saidanCanvas.appendChild(app[i].view);
            app[i].renderer.render(app[i].stage);  
    
            saidanCanvas.addEventListener('mouseenter', () => {
                alertMessage("画像をつかんで上下にドラッグできます!");
                saidanCanvas.appendChild(button);
            });
            saidanCanvas.addEventListener('mouseleave', () => {
                if (button.parentNode === saidanCanvas) {
                    saidanCanvas.removeChild(button);
                }
            });

            button.addEventListener('mouseenter', () => {
                alertMessage("COPYボタンをクリックすると画像をコピーできます!");
            });
            button.addEventListener('click', buttonClickHandler);
        }
    }


    

    function buttonClickHandler() {
        let index = buttonList.indexOf(this);
        let imageBase64 = app[index].renderer.extract.base64();
        copyImageToClipboard(app[index], imageBase64);
    }



    function copyImageToClipboard(app, imageBase64) {
        const img = new Image();
        img.src = imageBase64;
        img.onload = function () {
            alertMessage("コピー中...");
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const width = app.renderer.width;
            const height = app.renderer.height;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
    
            canvas.toBlob((blob) => {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {                    
                    alertMessage("コピーが完了しました！");
                }).catch((error) => {
                    console.error('Failed to copy image to clipboard:', error);
                });
            });
        };
    }

    async function copyAllImagesToClipboard() {
        if (app.length === 0) {
            errorMessage("コピーする画像がありません");
            return;
        }
    
        alertMessage("コピー中...");
    
        const margin = 25; // 画像の間隔
        const totalWidth = app.reduce((sum, instance) => sum + instance.renderer.width + margin, -margin);
        const totalHeight = app[0].renderer.height;
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');
    
        let offsetX = 0;
    
        // **明示的にレンダリングを更新**
        app.forEach(instance => {
            instance.renderer.render(instance.stage);
        });
    
        const drawImages = app.map(instance => {
            return new Promise((resolve, reject) => {
                // **明示的にbase64を取得する前に描画を更新**
                instance.renderer.render(instance.stage);
    
                const img = new Image();
                img.src = instance.renderer.extract.base64();
    
                img.onload = function () {
                    ctx.drawImage(img, offsetX, 0, instance.renderer.width, instance.renderer.height);
                    offsetX += instance.renderer.width + margin;
                    resolve();
                };
    
                img.onerror = function () {
                    reject(new Error(`画像のロードに失敗しました: ${img.src}`));
                };
            });
        });
    
        try {
            await Promise.all(drawImages);
    
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("画像のBlob生成に失敗しました"));
                    }
                }, 'image/png');
            });
    
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            alertMessage("コピーが完了しました！");
        } catch (error) {
            console.error(error);
            errorMessage(error.message);
        }
    }
    
    function setPlusButton(){
        const plusButton = document.getElementsByClassName('plusButton')[0];
        if (plusButton) {
            plusButton.style.display = 'block';
            plusButton.addEventListener('mouseenter', () => {
                alertMessage("↗︎ 右上のメニューからでも分割数を増やせます!");
            });
            plusButton.addEventListener('click', plusSplit);
        }
    }

    function plusSplit(){
        PARAMS.split++;
        pane.refresh();
    }

    function onDragStart(event) {
        this.dragData = event.data;
        this.dragging = true;
        this.dragPoint = event.data.getLocalPosition(this.parent);
        const copyButtons = document.getElementsByClassName('copyButton');
        for (let i = 0; i < copyButtons.length; i++) {
            copyButtons[i].style.opacity = 0;
        }
    }

    function onDragEnd() {
        this.dragging = false;
        this.dragData = null;
        setCopyButton();
        const copyButtons = document.getElementsByClassName('copyButton');
        for (let i = 0; i < copyButtons.length; i++) {
            copyButtons[i].style.opacity = 1;
        }
    }

    function onDragMove(event) {
        if (this.dragging) {
            const newPosition = this.dragData.getLocalPosition(this.parent);
            this.position.y += (newPosition.y - this.dragPoint.y);
            this.dragPoint = newPosition;
        }
    }

    function allImgRemove() {
        const imgBox = document.getElementById('imgBox');
        while (imgBox.firstChild) {
            imgBox.removeChild(imgBox.firstChild);
        }
    }

    
});
