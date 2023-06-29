const buttonOpen = document.getElementById('modalOpen');
const modal = document.getElementById('easyModal');
const modalContent =document.getElementsByClassName('modal-content')[0];
const buttonClose = document.getElementsByClassName('modalClose')[0];

//ボタンがクリックされた時
buttonOpen.addEventListener('click', modalOpen);
function modalOpen() {
  modal.classList.add('isOpen');
  modal.classList.remove('isClose');
};

//バツ印がクリックされた時
buttonClose.addEventListener('click', modalClose);
function modalClose() {
  modal.classList.add('isClose');
  modal.classList.remove('isOpen');
};

//モーダルコンテンツ以外がクリックされた時
addEventListener('click', outsideClose);
function outsideClose(e) {
  if (e.target == modal) {
  modal.classList.add('isClose');
  modal.classList.remove('isOpen');
  };
};