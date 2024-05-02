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

    const PARAMS = {
        split: 3
    };
    const pane = new Tweakpane.Pane();
    pane.addInput(PARAMS, 'split', { min: 0, max: 15, step: 1 })
        .on('change', (ev) => {
            if (ev.last) {
                allImgRemove();
                saidan(image, PARAMS.split);
            }
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
    
                // Check if the image exceeds the maximum height
                if (height > maxHeight) {
                    alertMessage("画像サイズが大きすぎるためリサイズしています...");
    
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
