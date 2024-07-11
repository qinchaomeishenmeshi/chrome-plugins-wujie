
//  Simulate click on the upload button

function simulateClick() {
  const button = document.querySelector('#douyin-creator-master-side-upload-wrap .semi-button');
  console.log('button', button);
  if (button) {
    button.click();
  } else {
    console.error('Button not found');
  }
}

simulateClick()