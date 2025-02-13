function _0x1e7f() {
  const _0x82e1c3 = ['loading', 'textContent', '9SlnMOW', '683469WPsDzf', 'width', 'target', '21pkqBfJ', '14894kFREfe', 'add', 'toggleFollow', 'createElement', 'style', 'remove', '71726gmBErt', 'preventDefault', '2485tuZTQC', '\n\n  @keyframes nano-spin {\n    to { transform: rotate(360deg); }\n  }\n\n  .follow-btn.loading {\n    position: relative;\n    padding-right: 32px !important;\n    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  }\n\n  .follow-btn.loading span {\n    visibility: hidden;\n  }\n\n  .follow-btn.loading::after {\n    content: \'\';\n    position: absolute;\n    right: 8px;\n    top: 50%;\n    transform: translateY(-50%);\n    width: 18px;\n    height: 18px;\n    border-radius: 50%;\n    border: 2px solid rgba(0, 0, 0, 0.1);\n    border-top: 2px solid red; /* Change this to any color you want */\n    animation: nano-spin 0.8s linear infinite;\n    background: transparent;\n    box-shadow: none; /* Removed unnecessary shadows */\n  }\n\n  .follow-btn.followed.loading::after {\n    border-top-color: red; /* Change this to match the color above */\n  }\n', 'classList', 'match', 'span', '3488xjEMyf', 'appendChild', '12348216GcUFHA', 'getBoundingClientRect', 'Follow', '1004808kSNGhW', 'followed', 'innerHTML', 'height', 'closest', 'contains', '5876848oUCtlI', 'Unfollow', '2kllrNp', 'onclick', 'head', '4330PInCgo', 'getAttribute'];
  _0x1e7f = function () {
    return _0x82e1c3;
  };
  return _0x1e7f();
}
function _0x4206(_0x13260e, _0x5bb9ca) {
  const _0x1e7f1b = _0x1e7f();
  return _0x4206 = function (_0x4206aa, _0x5ecd36) {
    _0x4206aa = _0x4206aa - 0xe2;
    let _0x36d78e = _0x1e7f1b[_0x4206aa];
    return _0x36d78e;
  }, _0x4206(_0x13260e, _0x5bb9ca);
}
const _0xcdf5c2 = _0x4206;
(function (_0x463be6, _0x5f216d) {
  const _0x1a7bd9 = _0x4206, _0x5d0f8f = _0x463be6();
  while (!![]) {
    try {
      const _0x14e431 = -parseInt(_0x1a7bd9(0xea)) / 0x1 + -parseInt(_0x1a7bd9(0xfe)) / 0x2 * (-parseInt(_0x1a7bd9(0x106)) / 0x3) + parseInt(_0x1a7bd9(0xf1)) / 0x4 * (-parseInt(_0x1a7bd9(0xec)) / 0x5) + -parseInt(_0x1a7bd9(0xf6)) / 0x6 * (parseInt(_0x1a7bd9(0xe3)) / 0x7) + parseInt(_0x1a7bd9(0xfc)) / 0x8 * (parseInt(_0x1a7bd9(0x105)) / 0x9) + -parseInt(_0x1a7bd9(0x101)) / 0xa * (parseInt(_0x1a7bd9(0xe4)) / 0xb) + parseInt(_0x1a7bd9(0xf3)) / 0xc;
      if (_0x14e431 === _0x5f216d) break;
      else _0x5d0f8f['push'](_0x5d0f8f['shift']());
    } catch (_0x312856) {
      _0x5d0f8f['push'](_0x5d0f8f['shift']());
    }
  }
}(_0x1e7f, 0x61153));
const followLoaderStyle = document['createElement'](_0xcdf5c2(0xe8));
followLoaderStyle[_0xcdf5c2(0x104)] = _0xcdf5c2(0xed), document[_0xcdf5c2(0x100)][_0xcdf5c2(0xf2)](followLoaderStyle), document['addEventListener']('click', async _0x438d59 => {
  const _0x13ca4c = _0xcdf5c2, _0x3f9d36 = _0x438d59[_0x13ca4c(0xe2)][_0x13ca4c(0xfa)]('.follow-btn');
  if (!_0x3f9d36) return;
  _0x438d59[_0x13ca4c(0xeb)](), _0x438d59['stopImmediatePropagation']();
  const _0x4c82b2 = _0x3f9d36[_0x13ca4c(0xf4)]();
  _0x3f9d36['style']['width'] = _0x4c82b2[_0x13ca4c(0x107)] + 'px', _0x3f9d36[_0x13ca4c(0xe8)][_0x13ca4c(0xf9)] = _0x4c82b2['height'] + 'px', _0x3f9d36[_0x13ca4c(0xee)][_0x13ca4c(0xe5)](_0x13ca4c(0x103));
  const _0x11b7da = document[_0x13ca4c(0xe7)](_0x13ca4c(0xf0));
  _0x11b7da[_0x13ca4c(0x104)] = _0x3f9d36[_0x13ca4c(0x104)], _0x3f9d36[_0x13ca4c(0xf8)] = '', _0x3f9d36[_0x13ca4c(0xf2)](_0x11b7da);
  try {
    const _0x258f32 = _0x3f9d36[_0x13ca4c(0x102)](_0x13ca4c(0xff)), _0x510f9e = _0x258f32[_0x13ca4c(0xef)](/toggleFollow\('(.+)', '(.+)'\)/);
    if (_0x510f9e) {
      const [_0x21b1f6, _0x18cc9a, _0x2bfff2] = _0x510f9e;
      await window[_0x13ca4c(0xe6)](_0x18cc9a, _0x2bfff2);
    }
  } catch (_0xcee651) {
    alert('Operation failed: ' + _0xcee651['message']);
  } finally {
    _0x3f9d36[_0x13ca4c(0xee)][_0x13ca4c(0xe9)](_0x13ca4c(0x103)), _0x3f9d36['style'][_0x13ca4c(0x107)] = '', _0x3f9d36[_0x13ca4c(0xe8)][_0x13ca4c(0xf9)] = '', _0x3f9d36[_0x13ca4c(0xf8)] = _0x3f9d36[_0x13ca4c(0xee)][_0x13ca4c(0xfb)](_0x13ca4c(0xf7)) ? _0x13ca4c(0xfd) : _0x13ca4c(0xf5);
  }
}, !![]);