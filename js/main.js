(function () {
  'use strict';

  const BAB = window.BAB;
  BAB.Petals.init(
    document.querySelector('.petals--back'),
    document.querySelector('.petals--front'),
    document.querySelector('.hero'),
  );
  BAB.Motion.init();
  BAB.Schools.init();
  window.setTimeout(BAB.Petals.openingGust, 1000);
})();
