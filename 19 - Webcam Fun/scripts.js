const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');
const videoFilter = document.querySelector('.videoFilter');
const greenScreenFilter = videoFilter.querySelector('#greenScreen');
const rgbButtons = document.querySelector('.rgb');

function getVideo() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false})
    .then(localMediaStream => {
      video.srcObject = localMediaStream;
      video.play();
      paintToCanvas();
  })
  .catch(err => {
      console.error('OH NO!!!', err);
  });
}

function paintToCanvas() {
  const [width, height] = [video.videoWidth, video.videoHeight];
  [canvas.width, canvas.height] = [width, height];

  setInterval(() => {
    if (!width || !height) return;

    const filter = videoFilter.querySelector('input[name="filter"]:checked');
    if (!filter) return;
    const filterFunction = window[filter.value];
    if (!typeof filterFunction === 'function') return;

    ctx.drawImage(video, 0, 0, width, height);
    let pixels = ctx.getImageData(0, 0, width, height);
    pixels = filterFunction(pixels);
    ctx.putImageData(pixels, 0, 0);
  }, 16);
}

function takePhoto() {
  // play the sound
  snap.currentTime = 0;
  snap.play();

  // take the data out of the canvas
  const data = canvas.toDataURL('image/jpeg');
  const link = document.createElement('a');
  link.href = data;
  link.setAttribute('download', 'handsome');
  link.innerHTML = `<img src="${data}" alt="Handsome Man" />`;
  strip.insertBefore(link, strip.firstChild);
}

function redEffect(pixels) {
  for (let i = 0; i < pixels.data.length; i+=4) {
      pixels.data[i + 0] = pixels.data[i + 0] + 100; // RED
      pixels.data[i + 1] = pixels.data[i + 1] - 50;  // GREEN
      pixels.data[i + 2] = pixels.data[i + 2] * 0.5; // BLUE
  }
  return pixels;
}

function rgbSplit(pixels) {
  for (let i = 0; i < pixels.data.length; i+=4) {
      pixels.data[i - 150] = pixels.data[i + 0]; // RED
      pixels.data[i + 500] = pixels.data[i + 1];  // GREEN
      pixels.data[i - 550] = pixels.data[i + 2]; // BLUE
  }
  return pixels;
}

function greenScreen(pixels) {
  const levels = {};

  rgbButtons.querySelectorAll('input').forEach((input) => {
      levels[input.name] = input.value;
  });

  for (let i = 0; i < pixels.data.length; i+=4) {
    const red = pixels.data[i + 0];
    const green = pixels.data[i + 1];
    const blue = pixels.data[i + 2];

    if (red >= levels.rmin
      && green >= levels.gmin
      && blue >= levels.bmin
      && red <= levels.rmax
      && green <= levels.gmax
      && blue <= levels.bmax) {
      // take out the alpha property (i.e. hide the pixel)
      pixels.data[i + 3] = 0;
    }
  }
  return pixels;
}

function toggleRgbButtons(e) {
  if (this === greenScreenFilter) {
    rgbButtons.style.display = 'block';
  } else {
    rgbButtons.style.display = 'none';
  }
}

getVideo();

video.addEventListener('canplay', paintToCanvas);

videoFilter.querySelectorAll('input[name="filter"]').forEach(cb => cb.addEventListener('change', toggleRgbButtons));
