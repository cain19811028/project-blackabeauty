(function () {
  'use strict';

  const BAB = window.BAB;
  BAB.Sakura.init(
    document.querySelector('.petals--back'),
    document.querySelector('.petals--front'),
    document.querySelector('.hero'),
  );
  BAB.Motion.init();
  BAB.Schools.init();
  window.setTimeout(BAB.Sakura.openingGust, 1000);
})();
