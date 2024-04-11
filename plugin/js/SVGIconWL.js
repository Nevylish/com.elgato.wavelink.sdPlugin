/* WaveLink subclass */
class SVGIconWL extends SVGIcon {
    constructor(settings, inOptions, inDebug = false) {

        super(Object.assign(settings, inOptions, inDebug));

        // Without updateLock the change event will be triggert with default settings / icon
        this.updateLock = true;
        this.underlay_local_svg = `<path id="local" transform="translate(-36 36)" opacity=".5" fill="#000" d="M52,79 L52,111 L45,111 L44.6874023,110.987965 C42.6909133,110.833637 41.1052541,109.213575 41.0050311,107.202383 L41,107 L41,83 L41.0120345,82.6874023 C41.1663624,80.6909133 42.7864253,79.1052541 44.7976169,79.0050311 L45,79 L52,79 Z M99,79 L99.3125976,79.0120348 C101.309087,79.1663628 102.894746,80.7864255 102.994969,82.7976169 L103,83 L103,107 L102.987966,107.312598 C102.841691,109.204902 101.378666,110.728135 99.5138906,110.967296 L99.3125976,110.987965 L99,111 L92,111 L92,79 L99,79 Z M90.0004086,79.1259124 L90.0000933,110.874006 C88.3376411,110.446164 87.0934371,108.976439 87.0050311,107.202383 L87,107 L87,83 L87.0120348,82.6874023 C87.1453452,80.9628059 88.3723518,79.5447608 90.0004086,79.1259124 Z M56.9949689,82.7976169 L57,83 L57,107 L56.9879652,107.312598 C56.8546828,109.036831 55.628165,110.454642 54.0006199,110.873823 L54.0009091,79.1262519 C55.6628591,79.5544273 56.9065807,81.0239172 56.9949689,82.7976169 Z M72,32 C92.9622954,32 110.061881,48.4322088 110.962691,69.0396356 L110.985017,69.6653685 L111,70.7499999 L111,92.0625 L110.986881,92.2884531 C110.88902,93.1256027 110.254086,93.7999912 109.433384,93.9625652 L109.277411,93.9869647 L109.05,94 L108.814305,93.9859912 C108.017512,93.8906096 107.368628,93.3177869 107.165921,92.5638765 L107.131417,92.4107677 L107.1,92.0625 L107.1,70.7499999 L107.09393,70.0948078 C106.742372,51.1362203 91.1649083,35.875 72,35.875 C53.1513595,35.875 37.7727386,50.636681 36.9358621,69.15929 L36.9149647,69.721721 L36.9,70.7499999 L36.9,92.0625 L36.8868809,92.2884531 C36.7890201,93.1256027 36.1540856,93.7999912 35.3333839,93.9625652 L35.1774112,93.9869647 L34.95,94 L34.7143052,93.9859912 C33.9175119,93.8906096 33.2686286,93.3177869 33.0659212,92.5638765 L33.0314171,92.4107677 L33,92.0625 L33,70.7499999 L33.0059122,70.06838 C33.3719699,48.9818022 50.6900343,32 72,32 Z"/>`;
        this.underlay_stream_svg = `<path id="stream" transform="translate(12 -29)" opacity=".5" d="M119.3762 24.4345c26.165 26.1651 26.165 68.5871 0 94.7523-1.246 1.246-3.2661 1.246-4.512 0-1.246-1.246-1.246-3.266 0-4.512 23.6732-23.6732 23.6732-62.0551 0-85.7283-1.246-1.246-1.246-3.266 0-4.512 1.2459-1.246 3.266-1.246 4.512 0zm-90.2403 0c1.246 1.246 1.246 3.266 0 4.512-23.6733 23.6732-23.6733 62.055 0 85.7283 1.246 1.246 1.246 3.266 0 4.512-1.246 1.246-3.2661 1.246-4.512 0-26.1652-26.1652-26.1652-68.5872 0-94.7523 1.2459-1.246 3.266-1.246 4.512 0zm73.5626 18.6776c16.402 16.402 16.402 42.995 0 59.397-1.2617 1.2617-3.3073 1.2617-4.569 0-1.2617-1.2617-1.2617-3.3073 0-4.569 13.8786-13.8786 13.8786-36.3803 0-50.259-1.2617-1.2617-1.2617-3.3073 0-4.569 1.2617-1.2617 3.3073-1.2617 4.569 0zm-54.828 0c1.2617 1.2617 1.2617 3.3073 0 4.569-13.8786 13.8787-13.8786 36.3804 0 50.259 1.2617 1.2617 1.2617 3.3073 0 4.569-1.2617 1.2617-3.3073 1.2617-4.569 0-16.402-16.402-16.402-42.995 0-59.397 1.2617-1.2617 3.3073-1.2617 4.569 0zM74 60.8106c7.1797 0 13 5.8203 13 13s-5.8203 13-13 13-13-5.8203-13-13 5.8203-13 13-13z"/>`;

        //  
        this.colorMute = /*isRed = */ false ? '#E12A40' : 'white';
        this.colorMuteShadow = /*isBlack = */ true ? '#000' : `${this._options.backgroundColor}`;
        this.opacityMuteShadow = /*withoutOverlay = */ true ? 0 : 0.5;

        this.addLayer('overlayMonitor', (o) => `<circle cx="88.5" cy="88.5" r="19.5" fill="${this._options.backgroundColor}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M105 88.5C105 97.6127 97.6127 105 88.5 105C79.3873 105 72 97.6127 72 88.5C72 79.3873 79.3873 72 88.5 72C97.6127 72 105 79.3873 105 88.5ZM88.5 80.6344C84.1559 80.6344 80.6344 84.1559 80.6344 88.5V93.8156C80.6344 94.6441 79.9628 95.3156 79.1344 95.3156C78.3059 95.3156 77.6344 94.6441 77.6344 93.8156V88.5C77.6344 82.4991 82.4991 77.6344 88.5 77.6344C94.5009 77.6344 99.3656 82.4991 99.3656 88.5V93.8156C99.3656 94.6441 98.6941 95.3156 97.8656 95.3156C97.0372 95.3156 96.3656 94.6441 96.3656 93.8156V88.5C96.3656 84.1559 92.8441 80.6344 88.5 80.6344ZM83.9437 89.5125C82.5458 89.5125 81.4125 90.6458 81.4125 92.0437V96.0938C81.4125 97.4917 82.5458 98.625 83.9437 98.625C85.3417 98.625 86.475 97.4917 86.475 96.0938V92.0437C86.475 90.6458 85.3417 89.5125 83.9437 89.5125ZM90.525 92.0437C90.525 90.6458 91.6583 89.5125 93.0562 89.5125C94.4542 89.5125 95.5875 90.6458 95.5875 92.0437V96.0938C95.5875 97.4917 94.4542 98.625 93.0562 98.625C91.6583 98.625 90.525 97.4917 90.525 96.0938V92.0437Z" fill="#000"/>`, {visible: true});
        this.addLayer('overlayStream', (o) => `<circle cx="88.5" cy="88.5" r="19.5" fill="${this._options.backgroundColor}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M105 88.5C105 97.6127 97.6127 105 88.5 105C79.3873 105 72 97.6127 72 88.5C72 79.3873 79.3873 72 88.5 72C97.6127 72 105 79.3873 105 88.5ZM81.8709 79.7496C82.4567 80.3354 82.4567 81.2851 81.8709 81.8709C80.1127 83.629 79.125 86.0136 79.125 88.5C79.125 90.9864 80.1127 93.371 81.8709 95.1291C82.4567 95.7149 82.4567 96.6647 81.8709 97.2505C81.2851 97.8363 80.3353 97.8363 79.7496 97.2505C77.4288 94.9297 76.125 91.7821 76.125 88.5C76.125 85.218 77.4288 82.0703 79.7496 79.7496C80.3353 79.1638 81.2851 79.1638 81.8709 79.7496ZM85.0529 82.9316C85.6386 83.5173 85.6386 84.4671 85.0529 85.0529C84.1386 85.9671 83.625 87.2071 83.625 88.5C83.625 89.793 84.1386 91.0329 85.0529 91.9472C85.6386 92.533 85.6386 93.4827 85.0529 94.0685C84.4671 94.6543 83.5173 94.6543 82.9315 94.0685C81.4547 92.5916 80.625 90.5886 80.625 88.5C80.625 86.4114 81.4547 84.4084 82.9315 82.9316C83.5173 82.3458 84.4671 82.3458 85.0529 82.9316ZM91.9471 91.9472C91.3614 92.533 91.3614 93.4827 91.9471 94.0685C92.5329 94.6543 93.4827 94.6543 94.0685 94.0685C95.5453 92.5916 96.375 90.5886 96.375 88.5C96.375 86.4114 95.5453 84.4084 94.0685 82.9316C93.4827 82.3458 92.5329 82.3458 91.9471 82.9316C91.3614 83.5173 91.3614 84.4671 91.9471 85.0529C92.8614 85.9671 93.375 87.2071 93.375 88.5C93.375 89.793 92.8614 91.0329 91.9471 91.9472ZM95.1291 97.2505C94.5433 96.6647 94.5433 95.7149 95.1291 95.1291C96.8873 93.371 97.875 90.9864 97.875 88.5C97.875 86.0136 96.8873 83.629 95.1291 81.8709C94.5433 81.2851 94.5433 80.3354 95.1291 79.7496C95.7149 79.1638 96.6647 79.1638 97.2505 79.7496C99.5712 82.0703 100.875 85.218 100.875 88.5C100.875 91.7821 99.5712 94.9297 97.2505 97.2505C96.6647 97.8363 95.7149 97.8363 95.1291 97.2505ZM88.5 91.875C90.364 91.875 91.875 90.364 91.875 88.5C91.875 86.6361 90.364 85.125 88.5 85.125C86.636 85.125 85.125 86.6361 85.125 88.5C85.125 90.364 86.636 91.875 88.5 91.875Z" fill="#000"/>`, {visible: true});
        this.addLayer('muteIndicator', (o) => `<circle cx="88.5" cy="88.5" r="19.5" fill="#000" opacity=".5" />`, {visible: true});
        this.addLayer('overlayMuteMonitorStream', (o) => `<path fill-rule="evenodd" clip-rule="evenodd" d="M40.0909 33.0909C41.1453 32.0364 42.8548 32.0364 43.9092 33.0909L103.909 93.0909C104.964 94.1453 104.964 95.8548 103.909 96.9092C102.855 97.9636 101.145 97.9636 100.091 96.9092L40.0909 36.9092C39.0364 35.8548 39.0364 34.1453 40.0909 33.0909Z" fill="${this._options.backgroundColor}"/>
        <path id="mask" fill="#000" fill-rule="nonzero" d="M144,0 L144,144 L0,144 L0,0 L144,0 Z M114,9 L28,9 C15.9712381,9 8.19722475,16.6537257 8.00294735,28.6361897 L8,31 L8,117 C8,129.028762 15.6537257,136.802775 27.6361897,136.997052 L30,137 L116,137 C128.028762,137 135.802775,129.346274 135.997052,117.36381 L136,115 L136,29 C136,16.9712381 128.346274,9.19722475 116.36381,9.00294735 L114,9 Z"/><rect ${this._props(o)} opacity=".5" width="128" height="128" x="8" y="8" fill="#0E0B1DCC" rx="20"/> 
        <path fill-rule="evenodd" clip-rule="evenodd" d="M37.6909 37.6908C38.7453 36.6364 40.4548 36.6364 41.5092 37.6908L100.909 97.0908C101.964 98.1452 101.964 99.8548 100.909 100.909C99.8548 101.964 98.1453 101.964 97.0909 100.909L37.6909 41.5092C36.6364 40.4548 36.6364 38.7452 37.6909 37.6908Z" fill="#E12A40"/>`, {visible: true});

        this.touchScale = 'transform="scale(3.6, 3.6)"';
        this.overlayTouchMonitor = `<circle cx="27" cy="27" r="13" fill="#151515"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M38 27C38 33.0751 33.0751 38 27 38C20.9249 38 16 33.0751 16 27C16 20.9249 20.9249 16 27 16C33.0751 16 38 20.9249 38 27ZM27 21.7563C24.104 21.7563 21.7563 24.104 21.7563 27V30.5438C21.7563 31.096 21.3085 31.5438 20.7563 31.5438C20.204 31.5438 19.7563 31.096 19.7563 30.5438V27C19.7563 22.9994 22.9994 19.7563 27 19.7563C31.0006 19.7563 34.2438 22.9994 34.2438 27V30.5438C34.2438 31.096 33.796 31.5438 33.2438 31.5438C32.6915 31.5438 32.2438 31.096 32.2438 30.5438V27C32.2438 24.104 29.896 21.7563 27 21.7563ZM23.9625 27.675C23.0305 27.675 22.275 28.4305 22.275 29.3625V32.0625C22.275 32.9945 23.0305 33.75 23.9625 33.75C24.8945 33.75 25.65 32.9945 25.65 32.0625V29.3625C25.65 28.4305 24.8945 27.675 23.9625 27.675ZM28.35 29.3625C28.35 28.4305 29.1055 27.675 30.0375 27.675C30.9695 27.675 31.725 28.4305 31.725 29.3625V32.0625C31.725 32.9945 30.9695 33.75 30.0375 33.75C29.1055 33.75 28.35 32.9945 28.35 32.0625V29.3625Z" fill="white"/>`
        this.overlayTouchStream = `<circle cx="27" cy="27" r="13" fill="#151515"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M38 27C38 33.0751 33.0751 38 27 38C20.9249 38 16 33.0751 16 27C16 20.9249 20.9249 16 27 16C33.0751 16 38 20.9249 38 27ZM22.5806 21.1664C22.9711 21.5569 22.9711 22.1901 22.5806 22.5806C21.4085 23.7527 20.75 25.3424 20.75 27C20.75 28.6576 21.4085 30.2473 22.5806 31.4194C22.9711 31.81 22.9711 32.4431 22.5806 32.8336C22.1901 33.2242 21.5569 33.2242 21.1664 32.8336C19.6192 31.2865 18.75 29.188 18.75 27C18.75 24.812 19.6192 22.7136 21.1664 21.1664C21.5569 20.7759 22.1901 20.7759 22.5806 21.1664ZM24.7019 23.2877C25.0924 23.6782 25.0924 24.3114 24.7019 24.7019C24.0924 25.3114 23.75 26.1381 23.75 27C23.75 27.862 24.0924 28.6886 24.7019 29.2981C25.0924 29.6886 25.0924 30.3218 24.7019 30.7123C24.3114 31.1028 23.6782 31.1028 23.2877 30.7123C22.3031 29.7278 21.75 28.3924 21.75 27C21.75 25.6076 22.3031 24.2723 23.2877 23.2877C23.6782 22.8972 24.3114 22.8972 24.7019 23.2877ZM29.2981 29.2981C28.9076 29.6886 28.9076 30.3218 29.2981 30.7123C29.6886 31.1028 30.3218 31.1028 30.7123 30.7123C31.6969 29.7278 32.25 28.3924 32.25 27C32.25 25.6076 31.6969 24.2723 30.7123 23.2877C30.3218 22.8972 29.6886 22.8972 29.2981 23.2877C28.9076 23.6782 28.9076 24.3114 29.2981 24.7019C29.9076 25.3114 30.25 26.1381 30.25 27C30.25 27.862 29.9076 28.6886 29.2981 29.2981ZM31.4194 32.8336C31.0289 32.4431 31.0289 31.81 31.4194 31.4194C32.5915 30.2473 33.25 28.6576 33.25 27C33.25 25.3424 32.5915 23.7527 31.4194 22.5806C31.0289 22.1901 31.0289 21.5569 31.4194 21.1664C31.8099 20.7759 32.4431 20.7759 32.8336 21.1664C34.3808 22.7136 35.25 24.812 35.25 27C35.25 29.1881 34.3808 31.2865 32.8336 32.8336C32.4431 33.2242 31.8099 33.2242 31.4194 32.8336ZM27 29.25C28.2426 29.25 29.25 28.2427 29.25 27C29.25 25.7574 28.2426 24.75 27 24.75C25.7574 24.75 24.75 25.7574 24.75 27C24.75 28.2427 25.7574 29.25 27 29.25Z" fill="white"/>`;
        this.overlayTouchMonitorMute = `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.93934 2.93934C3.52513 2.35355 4.47487 2.35355 5.06066 2.93934L34.0607 31.9393C34.6464 32.5251 34.6464 33.4749 34.0607 34.0607C33.4749 34.6464 32.5251 34.6464 31.9393 34.0607L2.93934 5.06066C2.35355 4.47487 2.35355 3.52513 2.93934 2.93934Z" fill="#E12A40"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.93934 0.93934C5.52513 0.353553 6.47487 0.353553 7.06066 0.93934L36.0607 29.9393C36.6464 30.5251 36.6464 31.4749 36.0607 32.0607C35.4749 32.6464 34.5251 32.6464 33.9393 32.0607L4.93934 3.06066C4.35355 2.47487 4.35355 1.52513 4.93934 0.93934Z" fill="#151515"/>
        <circle cx="27" cy="27" r="13" fill="#151515"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M38 27C38 33.0751 33.0751 38 27 38C20.9249 38 16 33.0751 16 27C16 20.9249 20.9249 16 27 16C33.0751 16 38 20.9249 38 27ZM27 21.7563C24.104 21.7563 21.7563 24.104 21.7563 27V30.5438C21.7563 31.096 21.3085 31.5438 20.7563 31.5438C20.204 31.5438 19.7563 31.096 19.7563 30.5438V27C19.7563 22.9994 22.9994 19.7563 27 19.7563C31.0006 19.7563 34.2438 22.9994 34.2438 27V30.5438C34.2438 31.096 33.796 31.5438 33.2438 31.5438C32.6915 31.5438 32.2438 31.096 32.2438 30.5438V27C32.2438 24.104 29.896 21.7563 27 21.7563ZM23.9625 27.675C23.0305 27.675 22.275 28.4305 22.275 29.3625V32.0625C22.275 32.9945 23.0305 33.75 23.9625 33.75C24.8945 33.75 25.65 32.9945 25.65 32.0625V29.3625C25.65 28.4305 24.8945 27.675 23.9625 27.675ZM28.35 29.3625C28.35 28.4305 29.1055 27.675 30.0375 27.675C30.9695 27.675 31.725 28.4305 31.725 29.3625V32.0625C31.725 32.9945 30.9695 33.75 30.0375 33.75C29.1055 33.75 28.35 32.9945 28.35 32.0625V29.3625Z" fill="white"/>`
        this.overlayTouchStreamMute = `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.93934 2.93934C3.52513 2.35355 4.47487 2.35355 5.06066 2.93934L34.0607 31.9393C34.6464 32.5251 34.6464 33.4749 34.0607 34.0607C33.4749 34.6464 32.5251 34.6464 31.9393 34.0607L2.93934 5.06066C2.35355 4.47487 2.35355 3.52513 2.93934 2.93934Z" fill="#E12A40"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.93934 0.93934C5.52513 0.353553 6.47487 0.353553 7.06066 0.93934L36.0607 29.9393C36.6464 30.5251 36.6464 31.4749 36.0607 32.0607C35.4749 32.6464 34.5251 32.6464 33.9393 32.0607L4.93934 3.06066C4.35355 2.47487 4.35355 1.52513 4.93934 0.93934Z" fill="#151515"/>
        <circle cx="27" cy="27" r="13" fill="#151515"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M38 27C38 33.0751 33.0751 38 27 38C20.9249 38 16 33.0751 16 27C16 20.9249 20.9249 16 27 16C33.0751 16 38 20.9249 38 27ZM22.5806 21.1664C22.9711 21.5569 22.9711 22.1901 22.5806 22.5806C21.4085 23.7527 20.75 25.3424 20.75 27C20.75 28.6576 21.4085 30.2473 22.5806 31.4194C22.9711 31.81 22.9711 32.4431 22.5806 32.8336C22.1901 33.2242 21.5569 33.2242 21.1664 32.8336C19.6192 31.2865 18.75 29.188 18.75 27C18.75 24.812 19.6192 22.7136 21.1664 21.1664C21.5569 20.7759 22.1901 20.7759 22.5806 21.1664ZM24.7019 23.2877C25.0924 23.6782 25.0924 24.3114 24.7019 24.7019C24.0924 25.3114 23.75 26.1381 23.75 27C23.75 27.862 24.0924 28.6886 24.7019 29.2981C25.0924 29.6886 25.0924 30.3218 24.7019 30.7123C24.3114 31.1028 23.6782 31.1028 23.2877 30.7123C22.3031 29.7278 21.75 28.3924 21.75 27C21.75 25.6076 22.3031 24.2723 23.2877 23.2877C23.6782 22.8972 24.3114 22.8972 24.7019 23.2877ZM29.2981 29.2981C28.9076 29.6886 28.9076 30.3218 29.2981 30.7123C29.6886 31.1028 30.3218 31.1028 30.7123 30.7123C31.6969 29.7278 32.25 28.3924 32.25 27C32.25 25.6076 31.6969 24.2723 30.7123 23.2877C30.3218 22.8972 29.6886 22.8972 29.2981 23.2877C28.9076 23.6782 28.9076 24.3114 29.2981 24.7019C29.9076 25.3114 30.25 26.1381 30.25 27C30.25 27.862 29.9076 28.6886 29.2981 29.2981ZM31.4194 32.8336C31.0289 32.4431 31.0289 31.81 31.4194 31.4194C32.5915 30.2473 33.25 28.6576 33.25 27C33.25 25.3424 32.5915 23.7527 31.4194 22.5806C31.0289 22.1901 31.0289 21.5569 31.4194 21.1664C31.8099 20.7759 32.4431 20.7759 32.8336 21.1664C34.3808 22.7136 35.25 24.812 35.25 27C35.25 29.1881 34.3808 31.2865 32.8336 32.8336C32.4431 33.2242 31.8099 33.2242 31.4194 32.8336ZM27 29.25C28.2426 29.25 29.25 28.2427 29.25 27C29.25 25.7574 28.2426 24.75 27 24.75C25.7574 24.75 24.75 25.7574 24.75 27C24.75 28.2427 25.7574 29.25 27 29.25Z" fill="white"/>`;
        this.overlayTouchMuteMonitorStream = `<path fill-rule="evenodd" clip-rule="evenodd" d="M-1.06066 -5.06066C-0.474874 -5.64645 0.474874 -5.64645 1.06066 -5.06066L38.0607 31.9393C38.6464 32.5251 38.6464 33.4749 38.0607 34.0607C37.4749 34.6464 36.5251 34.6464 35.9393 34.0607L-1.06066 -2.93934C-1.64645 -3.52513 -1.64645 -4.47487 -1.06066 -5.06066Z" fill="000"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.93934 0.93934C1.52513 0.353553 2.47487 0.353553 3.06066 0.93934L36.0607 33.9393C36.6464 34.5251 36.6464 35.4749 36.0607 36.0607C35.4749 36.6464 34.5251 36.6464 33.9393 36.0607L0.93934 3.06066C0.353553 2.47487 0.353553 1.52513 0.93934 0.93934Z" fill="#E12A40"/>`;

        this.fontSize = {upper: 31, lower: 31};

        this.addLayer('overlayTouchMonitor', (o) => `<g ${this.touchScale}>${this.overlayTouchMonitor}</g>`, {visible: true});
        this.addLayer('overlayTouchStream', (o) => `<g ${this.touchScale}>${this.overlayTouchStream}</g>`, {visible: true});
        this.addLayer('overlayTouchMonitorMute', (o) => `<g ${this.touchScale}>${this.overlayTouchMonitorMute}</g>`, {visible: true});
        this.addLayer('overlayTouchStreamMute', (o) => `<g ${this.touchScale}>${this.overlayTouchStreamMute}</g>`, {visible: true});
        this.addLayer('macAppIcon', (o) => `<image id="img" width="144" height="144" x="0" y="0" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="/>`);
        this.addLayer('mute', (o) => `
            <path fill-rule="evenodd" clip-rule="evenodd" d="M40.0908 33.0909C41.1452 32.0364 42.8548 32.0364 43.9092 33.0909L110.909 100.091C111.964 101.145 111.964 102.855 110.909 103.909C109.855 104.964 108.145 104.964 107.091 103.909L40.0908 36.9092C39.0364 35.8548 39.0364 34.1453 40.0908 33.0909Z" fill="${this._options.backgroundColor}"/>    
            <path id="mask" fill="${this._options.backgroundColor}" fill-rule="nonzero" d="M144,0 L144,144 L0,144 L0,0 L144,0 Z M114,9 L28,9 C15.9712381,9 8.19722475,16.6537257 8.00294735,28.6361897 L8,31 L8,117 C8,129.028762 15.6537257,136.802775 27.6361897,136.997052 L30,137 L116,137 C128.028762,137 135.802775,129.346274 135.997052,117.36381 L136,115 L136,29 C136,16.9712381 128.346274,9.19722475 116.36381,9.00294735 L114,9 Z"/><rect ${this._props(o)} opacity=".5" width="128" height="128" x="8" y="8" fill="#0E0B1DCC" rx="20"/> 
            <path fill-rule="evenodd" clip-rule="evenodd" d="M36.8357 36.8356C37.8901 35.7812 39.5996 35.7812 40.654 36.8356L106.947 103.129C108.002 104.183 108.002 105.893 106.947 106.947C105.893 108.002 104.183 108.002 103.129 106.947L36.8357 40.654C35.7812 39.5996 35.7812 37.8901 36.8357 36.8356Z" fill="#E12A40"/>`, {visible: true}, ['mute']);
        this.addLayer('muteTouch', (o) => `<rect ${this._props(o)} width="144" height="144" x="0" y="0" fill="#0E0B1DCC" rx="20"/>`, {
            visible: true,
            opacity: .5
        }, ['muteTouch']);
        this.addLayer('overlaySet', (o) => `<circle cx="88.5" cy="88.5" r="19.5" fill="${this._options.backgroundColor}"/><path fill-rule="evenodd" clip-rule="evenodd" d="M88.5 105C97.6127 105 105 97.6127 105 88.5C105 79.3873 97.6127 72 88.5 72C79.3873 72 72 79.3873 72 88.5C72 97.6127 79.3873 105 88.5 105ZM84 80.25C82.7574 80.25 81.75 81.2574 81.75 82.5C81.75 83.7426 82.7574 84.75 84 84.75H89.068L80.909 92.909C80.0303 93.7877 80.0303 95.2123 80.909 96.091C81.7877 96.9697 83.2123 96.9697 84.091 96.091L92.25 87.932V93C92.25 94.2426 93.2574 95.25 94.5 95.25C95.7426 95.25 96.75 94.2426 96.75 93V82.5C96.75 81.2574 95.7426 80.25 94.5 80.25H84Z" fill="white"/>`, {
            visible: true,
            opacity: 1
        }, ['set']);
    }

}