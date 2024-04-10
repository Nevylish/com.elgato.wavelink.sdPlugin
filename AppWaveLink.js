/// <reference path="libs/js/stream-deck.js" />

debugMode = false;

class AppWaveLink {

    static instance;

    secondaryIconType = [];

    constructor() {
        if (AppWaveLink.instance)
            return AppWaveLink.instance;
        AppWaveLink.instance = this;
    }

    init() {
        this.profile = "local";

        this.actions = [];

        this.keyIconWarning = new SVGIconWL({ icons: `./images/key/warning.svg`, icon: `warning`});

        this.keyIconsInput = {
            'default': new SVGIconWL({ icons: `./images/key/inputActions/default.svg`, icon: `default`}),
            'increase': new SVGIconWL({ icons: `./images/key/increase.svg`, icon: `increase`}),
            'decrease': new SVGIconWL({ icons: `./images/key/decrease.svg`, icon: `decrease`})
        };

        this.keyIconsOutput = {
            'default': new SVGIconWL({ icons: `./images/key/outputActions/default.svg`, icon: `default`}),
            'increase': new SVGIconWL({ icons: `./images/key/increase.svg`, icon: `increase`}),
            'decrease': new SVGIconWL({ icons: `./images/key/decrease.svg`, icon: `decrease`}),
            'toggleOutputMonitor': new SVGIconWL({ icons: `./images/key/outputActions/toggleOutputMonitor.svg`, icon: `toggleOutputMonitor`}),
            'toggleOutputStream': new SVGIconWL({ icons: `./images/key/outputActions/toggleOutputStream.svg`, icon: `toggleOutputStream`}),
        };

        this.keyIconsHardware = {};
        this.loadImage(`./images/key/hardwareActions/default.svg`).then((svg) => { this.keyIconsHardware[`default`] = svg; });
        this.loadImage(`./images/key/hardwareActions/setOutputDevice.svg`).then((svg) => { this.keyIconsHardware[`setOutputDevice`] = svg; });
        this.loadImage(`./images/key/hardwareActions/toggleOutputDeviceFirst.svg`).then((svg) => { this.keyIconsHardware[`toggleOutputDeviceFirst`] = svg; });
        this.loadImage(`./images/key/hardwareActions/toggleOutputDeviceSecond.svg`).then((svg) => { this.keyIconsHardware[`toggleOutputDeviceSecond`] = svg; });

        this.keyIconsEffect = {
            'default': new SVGIconWL({ icons: `./images/key/effectActions/default.svg`, icon: `default`}),
            'toggleEffectOn': new SVGIconWL({ icons: `./images/key/effectActions/toggleEffectOn.svg`, icon: `toggleEffectOn`}),
            'toggleEffectOff': new SVGIconWL({ icons: `./images/key/effectActions/toggleEffectOff.svg`, icon: `toggleEffectOff`}),
            'toggleEffectChainOn': new SVGIconWL({ icons: `./images/key/effectActions/toggleEffectChainOn.svg`, icon: `toggleEffectChainOn`}),
            'toggleEffectChainOff': new SVGIconWL({ icons: `./images/key/effectActions/toggleEffectChainOff.svg`, icon: `toggleEffectChainOff`})
        };

        this.touchIconWarning;
        this.loadImage(`./images/touchPanel/warning.svg`).then((svg) => { this.touchIconWarning = svg; });

        this.touchIconsInput = {};
        this.loadImage(`./images/touchPanel/input/default.svg`).then((svg) => { this.touchIconsInput[`default`] = svg; });

        this.touchIconsOutput = {}
        this.loadImage(`./images/touchPanel/output/default.svg`).then((svg) => { this.touchIconsOutput[`default`] = svg; });

        this.touchIconsHardware = {}
        this.loadImage(`./images/touchPanel/hardware/adjustHardwareGain.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustGain] = svg; });
        this.loadImage(`./images/touchPanel/hardware/adjustHardwareGainMute.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustGain + kPropertySuffixMuted] = svg; });
        this.loadImage(`./images/touchPanel/hardware/adjustHardwareVolume.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustOutput] = svg; });
        this.loadImage(`./images/touchPanel/hardware/adjustHardwareVolumeMute.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustOutput + kPropertySuffixMuted] = svg; });
        this.loadImage(`./images/touchPanel/hardware/hardwareBalancePC.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustMicPcBalance + kPropertySuffixPlus] = svg; });
        this.loadImage(`./images/touchPanel/hardware/hardwareBalancePCMute.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustMicPcBalance + kPropertySuffixPlus + kPropertySuffixMuted] = svg; });
        this.loadImage(`./images/touchPanel/hardware/hardwareBalanceMic.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustMicPcBalance + kPropertySuffixMinus] = svg; });
        this.loadImage(`./images/touchPanel/hardware/hardwareBalanceMicMute.svg`).then((svg) => { this.touchIconsHardware[kPropertyAdjustMicPcBalance + kPropertySuffixMinus + kPropertySuffixMuted] = svg; });
 
        this.secondaryIconType = [ 'Monitor', 'MonitorMute', 'Stream', 'StreamMute', 'All', 'AllMute', 'Set' ];
        const primaryIconTypeInput = [ 'wave', 'system', 'music', 'browser', 'voiceChat', 'sfx', 'game', 'aux' ];
        const primaryIconTypeOutput = [ 'output' ];
        const primaryIconTypeHardware = [
            [ 'setHardwareGain',            kPropertySetGain ],
            [ 'setHardwareVolume',          kPropertySetOutput ],
            [ 'setHardwareBalance',         kPropertySetMicPcBalance ],
            [ 'adjustHardwareGain',         kPropertyAdjustGain ],
            [ 'adjustHardwareGainMute',     kPropertyAdjustGain + kPropertySuffixMuted ],
            [ 'adjustHardwareGainPlus',     kPropertyAdjustGain + kPropertySuffixPlus ],
            [ 'adjustHardwareGainMinus',    kPropertyAdjustGain + kPropertySuffixMinus ],
            [ 'adjustHardwareVolume',       kPropertyAdjustOutput ],
            [ 'adjustHardwareVolumeMute',   kPropertyAdjustOutput + kPropertySuffixMuted ],
            [ 'adjustHardwareVolumePlus',   kPropertyAdjustOutput + kPropertySuffixPlus ],
            [ 'adjustHardwareVolumeMinus',  kPropertyAdjustOutput + kPropertySuffixMinus ],
            [ 'adjustHardwareBalance',      kPropertyAdjustMicPcBalance ],
            [ 'adjustHardwareBalanceMute',  kPropertyAdjustMicPcBalance + kPropertySuffixMuted ],
            [ 'hardwareBalanceToPC',        kPropertyAdjustMicPcBalance + kPropertySuffixPlus ],
            [ 'hardwareBalanceToMic',       kPropertyAdjustMicPcBalance + kPropertySuffixMinus ],
            [ 'hardwareLowcutOn',           kPropertyToggleLowcut + kPropertySuffixOn ],
            [ 'hardwareLowcutOff',          kPropertyToggleLowcut + kPropertySuffixOff ],
            [ 'hardwareClipguardOn',        kPropertyToggleClipguard + kPropertySuffixOn ],
            [ 'hardwareClipguardOff',       kPropertyToggleClipguard + kPropertySuffixOff ],
            [ 'hardwareGainLockOn',         kPropertytoggleGainLock + kPropertySuffixOn ],
            [ 'hardwareGainLockOff',        kPropertytoggleGainLock + kPropertySuffixOff ],
            [ 'toggleHardwareOn',           kPropertyToggleHardwareMute + kPropertySuffixOn ],
            [ 'toggleHardwareOff',          kPropertyToggleHardwareMute + kPropertySuffixOff ], 
        ];

        primaryIconTypeInput.forEach ( primType => {
            this.secondaryIconType.forEach(secType => {
                const icon = `${primType}${secType}`;

                if (secType != 'Set' && !secType.includes('All')) {   
                    if (primType == 'wave') {
                        const macOSIcon = new SVGIconWL({ icons: { [primType]: `./images/touchPanel/input/${primType}All.svg` }, icon: `${primType}`, layerOrder: [ 'icon', `overlayTouch${secType}` ] });
                        macOSIcon.layerProps['icon'].transform    = 'scale(3.6, 3.6)';
                        this.touchIconsInput[`${icon}MacOS`]      = macOSIcon.toBase64(true);
                    }

                    this.touchIconsInput[`${icon}`] = new SVGIconWL({ icons: { [icon]: `./images/touchPanel/input/${icon}.svg` }, icon: `${icon}` });
                    this.touchIconsInput[`${icon}`].layerProps['icon'].transform    = 'scale(3.6, 3.6)';
                    this.touchIconsInput[`${icon}`] = this.touchIconsInput[`${icon}`].toBase64(true);
                }

                this.keyIconsInput[`${icon}`] = new SVGIconWL({ icons: `./images/key/inputActions/${icon}.svg`, icon: `${icon}`, layerOrder: [ 'background', 'icon' ] });
            });
        });

        primaryIconTypeOutput.forEach ( primType => {
            this.secondaryIconType.forEach(secType => {
                const icon = `${primType}${secType}`;
                
                if (secType != 'Set')
                    this.loadImage(`./images/touchPanel/output/${icon}.svg`).then((svg) => { this.touchIconsOutput[`${icon}`] = svg; });

                this.keyIconsOutput[`${icon}`] = new SVGIconWL({ icons: `./images/key/outputActions/${icon}.svg`, icon: `${icon}`});
            });
        });

        primaryIconTypeHardware.forEach ( icon => {
            this.loadImage(`./images/key/hardwareActions/hardwareSettings/${icon[0]}.svg`).then((svg) => { this.keyIconsHardware[`${icon[1]}`] = svg; });
        });

        $SD.onConnected(({ appInfo }) => {
            const { application } = appInfo;
            const { platform } = application;
			const { devices } = appInfo;

            new WaveLinkClient().init(platform, devices);
            
            this.initActions();

			logInfo('Connected with Stream Deck');
        });

        $SD.onApplicationDidLaunch(() => {
			logInfo('Wave Link launched');
            setTimeout(() => {
                const wlc = new WaveLinkClient();
                wlc.connect();
            }, 1000)
        });

		$SD.onSystemDidWakeUp(() => {
			logInfo('System woke up');
            setTimeout(() => {
                const wlc = new WaveLinkClient();
                wlc.connect();
            }, 1000);
        });

        $SD.onApplicationDidTerminate(() => {
			logInfo('Wave Link closed');
            const wlc = new WaveLinkClient();
            wlc.setConnectionState(false);
            wlc.disconnect();
        }); 
    }
    
    initActions() {
        this.actionClasses = [
            // New merged OutputAction
            new OutputAction("com.elgato.wavelink.outputaction"),

             // Old output actions
            new OutputAction("com.elgato.wavelink.monitormute"),
            new OutputAction("com.elgato.wavelink.setvolumemonitor"),
            new OutputAction("com.elgato.wavelink.adjustvolumemonitor"),
            new OutputAction("com.elgato.wavelink.switchmonitoring"),
            
            // New merged InputAction
            new InputAction("com.elgato.wavelink.inputaction"),

            // Old input actions
            new InputAction("com.elgato.wavelink.mixermute"),
            new InputAction("com.elgato.wavelink.setvolumemixer"),
            new InputAction("com.elgato.wavelink.adjustvolumemixer"),

            // New merged EffectAction
            new EffectAction("com.elgato.wavelink.effectaction"),

            // Old effect actions
            new EffectAction("com.elgato.wavelink.seteffect"),
            new EffectAction("com.elgato.wavelink.seteffectchain"),

            // New merged HardwareAction
            new HardwareAction("com.elgato.wavelink.hardwareaction"),

            // Old microphone and output actions      
            new HardwareAction("com.elgato.wavelink.setmonitormixoutput"),
            new HardwareAction("com.elgato.wavelink.togglemonitormixoutput"),
            new HardwareAction("com.elgato.wavelink.setmicsettings"),
            
            new SwitchProfile("com.elgato.wavelink.switchprofiles")
        ]
    }
    
    switchProfile(profile, device) 
    {
        var switchProfile = "";
        
        switch (profile) {
            case "WL1":
                switchProfile = "Wave Link 1";
                break;
            case "WL2":
                switchProfile = "Wave Link 2";
                break;
            case "WLMonitoring":
                switchProfile = "Wave Link Monitoring";
                break;
            case "WLStream":
                switchProfile = "Wave Link Stream";
                break;
            case "WLXLMonitoring":
                switchProfile = "Wave Link XL Monitoring";
                break;
            case "WLXLStream":
                switchProfile = "Wave Link XL Stream";
                break;
            default:
                break;
        }  

        $SD.switchToProfile(device, switchProfile);
    }

    // Taken from common.js (Control Center), adjusted to fit
    loadImage (inUrl, inCanvas, inFillcolor = '') {

        return new Promise((resolve, reject) => {
            /** Convert to array, so we may load multiple images at once */
            const aUrl = !Array.isArray(inUrl) ? [inUrl] : inUrl;
            const canvas = inCanvas && inCanvas instanceof HTMLCanvasElement ? inCanvas : document.createElement('canvas');
            var imgCount = aUrl.length - 1;
            const imgCache = {};

            var ctx = canvas.getContext('2d');
            ctx.globalCompositeOperation = 'source-over';
        
            for (let url of aUrl) {
                let image = new Image();
                let cnt = imgCount;
                let w = 144, h = 144;
                let resize = 0;
        
                image.onload = function() {
                    imgCache[url] = this;
                    // look at the size of the second image
                    //if (url === aUrl[0]) {
                        canvas.width = w; //this.naturalWidth; // or 'width' if you want a special/scaled size
                        canvas.height = h; //this.naturalHeight; // or 'height' if you want a special/scaled size
                    //}
                    // if (Object.keys(imgCache).length == aUrl.length) {
                    if (cnt < 1) {
                        if (inFillcolor) {
                            ctx.fillStyle = inFillcolor;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }

                        // draw in the proper sequence FIFO
                        aUrl.forEach(e => {
                            if (!imgCache[e]) {
                                debug(imgCache[e], imgCache);
                                reject('error');
                            }
                            if (e == aUrl[0]) {
                                if (imgCache[e]) {
                                    //ctx.drawImage(imgCache[e], 0 + (resize / 2), 0 +  (resize / 2), w - resize, h - resize);
                                    // Use height as 
                                    ctx.drawImage(imgCache[e], (this.naturalWidth - this.naturalHeight) / 2, 0, this.naturalHeight, this.naturalHeight, 0, 0, w - resize, h - resize);
                                    /*
                                    let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
                                    let pixels = imgData.data;
                                    for (var i = 0; i < pixels.length; i += 4) {
                                    let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2])/3);
                                    pixels[i] = lightness; 
                                    pixels[i + 1] = lightness; 
                                    pixels[i + 2] = lightness; 
                                    }
		                            ctx.putImageData(imgData, 0, 0);
                                    */
                                    //ctx.drawImage(imgCache[e], 0, (this.naturalHeight - this.naturalWidth) / 2, this.naturalWidth, this.naturalWidth, 0, 0, w - resize, h - resize);
                                    ctx.save();
                                }
                            } else {
                                if (imgCache[e]) {
                                    ctx.drawImage(imgCache[e], 0, 0, w, h);
                                    ctx.save();
                                }
                            }
                        });
        
                        //callback(canvas.toDataURL('image/png'));
                        var img = canvas.toDataURL('image/png');
                        resolve(img);
                        // or to get raw image data
                        // callback && callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
                    }
                };
                
                imgCount--;
                image.src = url;
            }
        });
    };
}

function debug(...args) {
    if (debugMode) console.log(...args)
}

function logInfo(string) {
    debug(`     Info     ${string}`);
    $SD.logMessage(`     Info     ${string}`);
}

function logError(string) {
    debug(`     Error    ${string}`);
    $SD.logMessage(`     Error    ${string}`);
}

const $AWL = new AppWaveLink().init()