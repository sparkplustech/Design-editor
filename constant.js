const urlParams = new URLSearchParams(window.location.search);
const designCode = urlParams.get('designCode');
const ru = urlParams.get('ru');

let decryptedRU = '';
if (ru) {
  decryptedRU = atob(ru);
}
// console.log("decrypted", decryptedRU);
let apiBaseUrl = '';
let reactAppBaseUrl = '';

if (designCode && designCode.startsWith('DCL')) {
  apiBaseUrl = 'https://api.thesolo.network/api';
} else if (designCode && designCode.startsWith('DCT')) {
  apiBaseUrl = 'https://testapi.thesolo.network/api';
} else if (designCode && designCode.startsWith('LDC')) {
  apiBaseUrl = 'https://leafapi.thesolo.network/api';
}

if (decryptedRU == 'localhost') {
  reactAppBaseUrl = 'http://localhost:4900';
} else {
  reactAppBaseUrl = `https://${decryptedRU}`;
}

const API_CONSTANT = {
  REACT_APP_API_BASE_URL: apiBaseUrl,
  REACT_APP_BASE_URL: reactAppBaseUrl,
};

const JSON_CONSTANT = {
  BADGE: {
    type: 'image',
    version: '4.6.0',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width: 500,
    height: 500,
    fill: 'rgb(0,0,0)',
    stroke: null,
    strokeWidth: 0,
    strokeDashArray: null,
    strokeLineCap: 'butt',
    strokeDashOffset: 0,
    strokeLineJoin: 'miter',
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1.2,
    scaleY: 1.2,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: '#fff',
    fillRule: 'nonzero',
    paintFirst: 'fill',
    globalCompositeOperation: 'source-over',
    skewX: 0,
    skewY: 0,
    cropX: 0,
    cropY: 0,
    id: 'workarea',
    name: '',
    src: './images/sample/transparentBg.png',
    link: {},
    tooltip: {
      enabled: false,
    },
    layout: 'fixed',
    workareaWidth: 600,
    workareaHeight: 600,
    crossOrigin: 'anonymous',
    filters: [],
  },
  PORTRAIT_CERTIFICATE: {
    type: 'image',
    version: '4.6.0',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width: 618,
    height: 800,
    fill: 'rgb(0,0,0)',
    stroke: null,
    strokeWidth: 0,
    strokeDashArray: null,
    strokeLineCap: 'butt',
    strokeDashOffset: 0,
    strokeLineJoin: 'miter',
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: '#fff',
    fillRule: 'nonzero',
    paintFirst: 'fill',
    globalCompositeOperation: 'source-over',
    skewX: 0,
    skewY: 0,
    cropX: 0,
    cropY: 0,
    id: 'workarea',
    name: '',
    file: null,
    src: '',
    link: {},
    tooltip: {
      enabled: false,
    },
    layout: 'fixed',
    workareaWidth: 618,
    workareaHeight: 800,
    crossOrigin: null,
    filters: [],
  },
  LANDSCAPE_CERTIFICATE: {
    type: 'image',
    version: '4.6.0',
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    width: 800,
    height: 618,
    fill: 'rgb(0,0,0)',
    stroke: null,
    strokeWidth: 0,
    strokeDashArray: null,
    strokeLineCap: 'butt',
    strokeDashOffset: 0,
    strokeLineJoin: 'miter',
    strokeUniform: false,
    strokeMiterLimit: 4,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    flipX: false,
    flipY: false,
    opacity: 1,
    shadow: null,
    visible: true,
    backgroundColor: '#fff',
    fillRule: 'nonzero',
    paintFirst: 'fill',
    globalCompositeOperation: 'source-over',
    skewX: 0,
    skewY: 0,
    cropX: 0,
    cropY: 0,
    id: 'workarea',
    name: '',
    file: null,
    src: '',
    link: {},
    tooltip: {
      enabled: false,
    },
    layout: 'fixed',
    workareaWidth: 800,
    workareaHeight: 618,
    crossOrigin: null,
    filters: [],
  },
};

const CONSTANTS = {
  API_CONSTANT,
  JSON_CONSTANT,
};

export default CONSTANTS;
