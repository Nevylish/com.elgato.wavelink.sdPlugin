/// <reference path="WaveLinkConstants.js" />

// Update after interface changed
const kJSONPropertyInterfaceRevision = '3';

class WaveLinkClient extends AppClient {

    static instance;

    constructor() {
        super(1824);

        if (WaveLinkClient.instance)
            return WaveLinkClient.instance;

        WaveLinkClient.instance = this;
    }

    init(system, sdDevices) {
        debug("Init WLC...");

        this.UP_MAC = system == 'mac' ? true : false;
        this.UP_WINDOWS = system == 'windows' ? true : false;

        this.sdDevices = sdDevices;

        this.isUpToDate = false;

        this.awl = new AppWaveLink;

        this.event = EventEmitter;
        this.onEvent = this.event.on;
        this.emitEvent = this.event.emit;

        this.output = null;
        this.inputs = [];

        this.isMicrophoneConnected;
        this.microphones;
        this.outputs;
        this.selectedOutput;
        this.switchState;

        this.fadingDelay = 100;

        this.isKeyUpdated = new Map;

        this.suppressNotifications = {};
        this.suppressNotificationsTimer;

        this.localization;
        this.loadLocalization();

        this.on(kJSONPropertyMicrophoneConfigChanged, [kJSONKeyIdentifier, kJSONKeyProperty, 'value'], (identifier, property, value) => {
            if (this.microphones?.length <= 0) {
                this.getMicrophoneConfig();
            } else if (this.propertyConverter(this.suppressNotifications.property) != property) {
                switch (property) {
                    case kPropertyMicrophoneGain:
                    case kPropertyMicrophoneOutputVolume:
                        value = this.getValueConverter(property).getIndexFromFirstValue(Math.round(value * 100) / 100);
                        break;
                    case kPropertyMicrophoneBalance:
                        value = value * 100;
                        break;
                    default:
                        break;
                }

                this.setMicrophone(identifier, property, value);
                this.throttleUpdate(property, kJSONPropertyMicrophoneConfigChanged, {property: property}, 250);
            }
        });

        this.on(kJSONPropertyOutputSwitched, [kJSONKeyValue], (value) => {
            this.switchState = value;
            this.emitEvent(kJSONPropertyOutputSwitched);
        });

        this.on(kJSONPropertySelectedOutputChanged, [kJSONKeyValue], (value) => {
            this.selectedOutput = value;
            this.emitEvent(kJSONPropertySelectedOutputChanged);
        });

        this.on(kJSONPropertyOutputMuteChanged, [kJSONKeyMixerID, kJSONKeyValue], (mixerID, value) => {
            if (mixerID == kPropertyMixerIDLocal) {
                this.output.local.isMuted = value;
            } else if (mixerID == kPropertyMixerIDStream) {
                this.output.stream.isMuted = value;
            }
            this.emitEvent(kJSONPropertyOutputMuteChanged, mixerID);
        });

        this.on(kJSONPropertyOutputVolumeChanged, [kJSONKeyIdentifier, kJSONKeyMixerID, kJSONKeyValue], (identifier, mixerID, value) => {
            if (this.suppressNotifications.mixerID != mixerID || this.suppressNotifications.mixerID != kPropertyMixerIDAll) {
                const updateAll = {updateAll: true};
                if (mixerID == kPropertyMixerIDLocal) {
                    this.output.local.volume = value;
                    this.throttleUpdate(identifier + mixerID, kJSONPropertyOutputVolumeChanged, {
                        mixerID,
                        updateAll
                    }, 250);
                } else if (mixerID == kPropertyMixerIDStream) {
                    this.output.stream.volume = value;
                    this.throttleUpdate(identifier + mixerID, kJSONPropertyOutputVolumeChanged, {
                        mixerID,
                        updateAll
                    }, 250);
                }
            }
        });

        this.on(kJSONPropertyInputsChanged, [], () => {
            this.getInputConfigs();
            this.getMicrophoneConfig();
        });

        this.on(kJSONPropertyInputMuteChanged, [kJSONKeyIdentifier, kJSONKeyMixerID, kJSONKeyValue], (identifier, mixerID, value) => {
            this.inputs.forEach(input => {
                if (input.identifier == identifier) {
                    if (mixerID == kPropertyMixerIDLocal) {
                        input.local.isMuted = value;
                    } else if (mixerID == kPropertyMixerIDStream) {
                        input.stream.isMuted = value;
                    }
                    this.emitEvent(kJSONPropertyInputMuteChanged, {identifier, mixerID});
                }
            });
        });

        this.on(kJSONPropertyInputVolumeChanged, [kJSONKeyIdentifier, kJSONKeyMixerID, kJSONKeyValue], (identifier, mixerID, value) => {
            if (this.suppressNotifications.identifier != identifier || (this.suppressNotifications.identifier == identifier && this.suppressNotifications.mixerID != kPropertyMixerIDAll)) {
                const updateAll = {updateAll: true};
                this.inputs.find(input => {
                    if (input.identifier == identifier) {
                        if (mixerID == kPropertyMixerIDLocal) {
                            input.local.volume = value;
                            this.throttleUpdate(identifier + mixerID, kJSONPropertyInputVolumeChanged, {
                                identifier,
                                mixerID,
                                updateAll
                            }, 250);
                        } else if (mixerID == kPropertyMixerIDStream) {
                            input.stream.volume = value;
                            this.throttleUpdate(identifier + mixerID, kJSONPropertyInputVolumeChanged, {
                                identifier,
                                mixerID,
                                updateAll
                            }, 250);
                        }
                    }
                });
            }
        });

        this.on('realTimeChanges', ['MixerList', kJSONKeyIdentifier, kJSONKeyLocalMixer, kJSONKeyStreamMixer], (inputList, outputIdentifier, outputLocal, outputStream) => {
            inputList.forEach(inputWL => {
                const input = this.getInput(inputWL.identifier);


                if (input) {
                    if (input.levelLeft != parseInt(inputWL.levelLeft * 100) || input.levelRight != parseInt(inputWL.levelRight * 100)) {
                        input.levelLeft = parseInt(inputWL.levelLeft * 100);
                        input.levelRight = parseInt(inputWL.levelRight * 100);
                        this.emitEvent(kJSONPropertyInputLevelChanged, {identifier: input.identifier, updateAll: true});
                    }
                }
            });

            const output = this.getOutput();

            if (output) {
                if (output.local.levelLeft != parseInt(outputLocal.levelLeft * 100) || output.local.levelRight != parseInt(outputLocal.levelRight * 100) ||
                    output.stream.levelLeft != parseInt(outputStream.levelLeft * 100) || output.stream.levelRight != parseInt(outputStream.levelRight * 100)) {
                    output.local.levelLeft = parseInt(outputLocal.levelLeft * 100);
                    output.local.levelRight = parseInt(outputLocal.levelRight * 100);
                    output.stream.levelLeft = parseInt(outputStream.levelLeft * 100);
                    output.stream.levelRight = parseInt(outputStream.levelRight * 100);

                    this.emitEvent(kJSONPropertyOutputLevelChanged, {updateAll: true});
                }
            }

        });

        this.on(kJSONPropertyInputNameChanged, [kJSONKeyIdentifier, kJSONKeyValue], (identifier, value) => {
            this.inputs.forEach(input => {
                if (input.identifier == identifier) {
                    input.name = value;
                    this.emitEvent(kJSONPropertyInputNameChanged, {identifier});
                    this.emitEvent(kPropertyUpdatePI);
                }
            });
        });

        this.on(kJSONPropertyInputEnabled, [kJSONKeyIdentifier], (identifier) => {
            this.getInputConfigs();
            this.getMicrophoneConfig();
        });

        this.on(kJSONPropertyInputDisabled, [kJSONKeyIdentifier], (identifier) => {
            this.getInputConfigs();
            this.getMicrophoneConfig();
        });

        this.on(kJSONPropertyProfileChanged, [], () => {
            this.getApplicationInfo();
        });

        this.on(kJSONPropertyFilterBypassStateChanged, [kJSONKeyIdentifier, kJSONKeyMixerID, kJSONKeyValue], (identifier, mixerID, value) => {
            const input = this.inputs.find(input => input.identifier == identifier);
            if (mixerID == kPropertyMixerIDLocal) {
                input.local.filterBypass = value;
            } else if (mixerID == kPropertyMixerIDStream) {
                input.stream.filterBypass = value;
            }
            this.emitEvent(kJSONPropertyFilterBypassStateChanged, {identifier, mixerID});
        });

        this.on(kJSONPropertyFilterAdded,
            [kJSONKeyIdentifier, kJSONKeyFilterID, kJSONKeyFilterName, kJSONKeyFilterActive, kJSONKeyFilterPluginID],
            (identifier, filterID, name, isActive, pluginID) => {
                const input = this.inputs.find(input => input.identifier == identifier);

                if (!input.filters) {
                    input.filters = [];
                }

                input.filters.push({
                    [kJSONKeyFilterID]: filterID,
                    [kJSONKeyFilterName]: name,
                    [kJSONKeyFilterActive]: isActive,
                    [kJSONKeyFilterPluginID]: pluginID
                });
                this.emitEvent(kPropertyUpdatePI);
            }
        );

        this.on(kJSONPropertyFilterChanged, [kJSONKeyIdentifier, kJSONKeyFilterID, kJSONKeyValue], (identifier, filterID, value) => {
            const input = this.inputs.find(input => input.identifier == identifier);
            const filter = input.filters.find(filter => filter.filterID == filterID);
            filter.isActive = value;
            this.emitEvent(kJSONPropertyFilterChanged, {identifier, filterID});
        });

        this.on(kJSONPropertyFilterRemoved, [kJSONKeyIdentifier, kJSONKeyFilterID], (identifier, filterID) => {
            const input = this.inputs.find(input => input.identifier == identifier);
            input.filters = input.filters.filter(filter => filter.filterID != filterID);
            this.emitEvent(kPropertyUpdatePI);
        });

        this.onConnection(() => {
            this.getApplicationInfo();
        });

        this.onDisconnection(() => {
            this.isUpToDate = false;

            this.emitEvent(kPropertyUpdatePI);
            this.emitEvent(kPropertyOutputChanged);
            this.emitEvent(kJSONPropertyInputsChanged);
        });
    }

    async loadLocalization() {
        await $SD.loadLocalization('');

        this.localization = $SD.localization['Actions'];
    }

    getApplicationInfo() {
        this.call(kJSONPropertyGetApplicationInfo).then((result) => {
            if (result || result == undefined) {
                if (result[kJSONKeyInterfaceRevision] >= kJSONPropertyInterfaceRevision) {
                    debug(`Minimum ${kJSONPropertyAppName} interface revision or above found.`);
                    debug(`Minumum interface revision for ${kJSONPropertyAppName} found: Current: ${result[kJSONKeyInterfaceRevision]}, Minimum: ${kJSONPropertyInterfaceRevision}`);
                    this.isUpToDate = true;
                    this.getMicrophoneConfig();
                    this.getSwitchState();
                    this.getOutputConfig();
                    this.getOutputs();
                    this.getInputConfigs();
                    this.emitEvent(kPropertyUpdatePI);
                    this.emitEvent(kPropertyOutputChanged);
                } else {
                    this.isUpToDate = false;
                    debug(`Wrong interface revision for ${kJSONPropertyAppName}: Current ${result[kJSONKeyInterfaceRevision]}, Minimum: ${kJSONPropertyInterfaceRevision}`);
                    this.emitEvent(kPropertyUpdatePI);
                    this.emitEvent(kPropertyOutputChanged);
                    this.emitEvent(kJSONPropertyInputsChanged);
                }
            }
        });
    }

    getMicrophoneConfig() {
        this.rpc.call(kJSONPropertyGetMicrophoneConfig).then((result) => {
            if (result != null) {
                this.microphones = result;

                this.gainConverter = undefined;
                this.outputVolumeConverter = undefined;

                this.microphones.forEach(microphone => {
                    microphone.gainIndex = new LookupTableConverter(microphone.gainLookup).getIndexFromFirstValue(microphone.gain);
                    microphone.outputVolumeIndex = new LookupTableConverter(microphone.outputVolumeLookup).getIndexFromFirstValue(microphone.outputVolume);
                    microphone.balanceIndex = microphone.balance * 100;
                });

                this.emitEvent(kJSONPropertyGetMicrophoneConfig);
            }
        });
    }

    setMicrophoneConfig(context, property, value = 0) {
        this.checkAppState();

        if (this.microphones?.length < 1)
            throw `No device available`

        const microphone = this.getMicrophone();

        var isBoolValue = false;

        if (microphone) {
            switch (property) {
                case kPropertyMicrophoneLowCut:
                case kPropertyMicrophoneClipGuard:
                case kPropertyMicrophoneMute:
                    isBoolValue = true;
                    break;
                default:
                    break;
            }

            const valueKey = isBoolValue ? kJSONKeyBoolValue : kJSONKeyValue;

            this.setMicrophone(microphone.identifier, property, value);

            switch (property) {
                case kJSONPropertyGain:
                    value = new LookupTableConverter(microphone.gainLookup).getFirstValueFromIndex(microphone.gainIndex);
                    break;
                case kJSONPropertyOutputVolume:
                    value = new LookupTableConverter(microphone.outputVolumeLookup).getFirstValueFromIndex(microphone.outputVolumeIndex);
                    break;
                default:
                    break;
            }

            this.suppressNotifications.property = property;

            if (this.suppressNotificationsTimer) {
                clearTimeout(this.suppressNotificationsTimer);
            }
            this.suppressNotificationsTimer = setTimeout(() => {
                this.suppressNotifications.property = '';
            }, 250);
            this.throttleUpdate(context, kJSONPropertyMicrophoneConfigChanged, {
                property: this.propertyConverter(property),
                context: context
            }, 200);

            this.rpc.call(kJSONPropertySetMicrophoneConfig, {
                [kJSONKeyIdentifier]: microphone.identifier,
                [kJSONKeyProperty]: property,
                [valueKey]: value
            });
        }
    }

    getSwitchState() {
        this.rpc.call(kJSONPropertyGetSwitchState).then(
            (result) => {
                this.switchState = result[kJSONKeyValue];
                this.emitEvent(kJSONPropertyOutputSwitched);
            }
        );
    }

    changeSwitchState() {
        this.checkAppState();

        this.rpc.call(kJSONPropertySwitchOutput, {});
    };

    getOutputs() {
        this.rpc.call(kJSONPropertyGetOutputs).then(
            (result) => {
                this.outputs = result[kJSONKeyOutputs];
                this.selectedOutput = result[kJSONKeySelectedOutput];

                this.emitEvent(kJSONPropertySelectedOutputChanged);
            }
        );
    }

    setSelectedOutput(identifier) {
        this.checkAppState();

        const name = this.outputs.find(output => output.identifier == identifier)?.name;

        this.rpc.call(kJSONPropertySetSelectedOutput, {
            [kJSONKeyIdentifier]: identifier,
            [kJSONKeyName]: name
        });
    }

    getOutputConfig() {
        this.rpc.call(kJSONPropertyGetOutputConfig).then(
            (result) => {
                this.output = {
                    local: {
                        isMuted: result[kJSONKeyLocalMixer][0],
                        volume: result[kJSONKeyLocalMixer][1],
                        levelLeft: 0,
                        levelRight: 0
                    },
                    stream: {
                        isMuted: result[kJSONKeyStreamMixer][0],
                        volume: result[kJSONKeyStreamMixer][1],
                        levelLeft: 0,
                        levelRight: 0
                    },
                    [kJSONKeyBgColor]: '#1E183C',
                    isNotBlockedLocal: true,
                    isNotBlockedStream: true
                }
                this.emitEvent(kPropertyOutputChanged);
                this.emitEvent(kPropertyUpdatePI);
            }
        );
    }

    setOutputConfig(context, property, isAdjustVolume, mixerID, value, fadingTime) {
        this.checkAppState();

        const output = this.getOutput();
        const updateAll = {updateAll: true}

        if (output && fadingTime) {
            const isAlreadyFading = mixerID == kPropertyMixerIDLocal ? !output.isNotBlockedLocal : !output.isNotBlockedStream;

            if (isAlreadyFading) {
                return;
            }

            var timeLeft = fadingTime;
            var newValue = 0;

            const intervalTimer = setInterval(() => {
                if (timeLeft > 0) {
                    const currentValue = mixerID == kPropertyMixerIDLocal ? output.local.volume : output.stream.volume;
                    const volumeSteps = (value - currentValue) / (timeLeft / this.fadingDelay);

                    newValue = currentValue + Math.round(volumeSteps, 2);
                    mixerID == kPropertyMixerIDLocal ? output.isNotBlockedLocal = false : output.isNotBlockedStream = false;

                    timeLeft -= this.fadingDelay;

                    mixerID == kPropertyMixerIDLocal ? output.local.volume = newValue : output.stream.volume = newValue;
                } else {
                    mixerID == kPropertyMixerIDLocal ? output.isNotBlockedLocal = true : output.isNotBlockedStream = true;
                    clearInterval(intervalTimer);
                }

                this.suppressNotifications.mixerID = mixerID;

                if (this.suppressNotificationsTimer) {
                    clearTimeout(this.suppressNotificationsTimer);
                }
                this.suppressNotificationsTimer = setTimeout(() => {
                    this.suppressNotifications.mixerID = '';
                }, 250);
                this.throttleUpdate(context, kJSONPropertyOutputVolumeChanged, {context, mixerID, updateAll}, 100);

                this.rpc.call(kJSONPropertySetOutputConfig, {
                    [kJSONKeyProperty]: property,
                    [kJSONKeyMixerID]: mixerID,
                    [kJSONKeyValue]: newValue,
                    [kJSONKeyForceLink]: false
                });

            }, this.fadingDelay)
        } else {
            const forceLink = mixerID == kPropertyMixerIDAll;
            var newValue = 0;
            var newMixerID = mixerID;

            if (isAdjustVolume) {
                if (forceLink) {
                    if (value < 0) {
                        newMixerID = output.local.volume > output.stream.volume ? kPropertyMixerIDLocal : kPropertyMixerIDStream;
                    } else {
                        newMixerID = output.local.volume < output.stream.volume ? kPropertyMixerIDLocal : kPropertyMixerIDStream;
                    }

                    output.local.volume = output.local.volume + value < 0 ? 0 : output.local.volume + value > 100 ? 100 : output.local.volume + value;
                    output.stream.volume = output.stream.volume + value < 0 ? 0 : output.stream.volume + value > 100 ? 100 : output.stream.volume + value;

                    newValue = newMixerID == kPropertyMixerIDLocal ? output.local.volume : output.stream.volume;
                } else {
                    newValue = newMixerID == kPropertyMixerIDLocal ? output.local.volume + value : output.stream.volume + value;

                    newValue = newValue < 0 ? 0 : newValue > 100 ? 100 : newValue;

                    newMixerID == kPropertyMixerIDLocal ? output.local.volume = newValue : output.stream.volume = newValue;
                }
            } else {
                newValue = value;
            }

            this.suppressNotifications.mixerID = newMixerID;

            if (this.suppressNotificationsTimer) {
                clearTimeout(this.suppressNotificationsTimer);
            }
            this.suppressNotificationsTimer = setTimeout(() => {
                this.suppressNotifications.mixerID = '';
            }, 250);
            this.throttleUpdate(context, kJSONPropertyOutputVolumeChanged, {context, mixerID, updateAll}, 100);

            this.rpc.call(kJSONPropertySetOutputConfig, {
                [kJSONKeyProperty]: property,
                [kJSONKeyMixerID]: newMixerID,
                [kJSONKeyValue]: newValue,
                [kJSONKeyForceLink]: forceLink
            });
        }
    }

    getInputConfigs() {
        this.rpc.call(kJSONPropertyGetInputConfigs).then((result) => {
            this.inputs = [];
            result.forEach(async input => {
                this.inputs.push({
                    [kJSONKeyIdentifier]: input[kJSONKeyIdentifier],
                    [kJSONKeyName]: input[kJSONKeyName],
                    [kJSONKeyInputType]: input[kJSONKeyInputType],
                    [kJSONKeyIsAvailable]: input[kJSONKeyIsAvailable],
                    [kJSONKeyBgColor]: input[kJSONKeyBgColor],
                    [kJSONKeyIconData]: input[kJSONKeyIconData],
                    [kJSONKeyFilters]: input[kJSONKeyFilters],

                    local: {
                        isMuted: input[kJSONKeyLocalMixer][0],
                        volume: input[kJSONKeyLocalMixer][1],
                        filterBypass: input[kJSONKeyLocalMixer][2]
                    },
                    stream: {
                        isMuted: input[kJSONKeyStreamMixer][0],
                        volume: input[kJSONKeyStreamMixer][1],
                        filterBypass: input[kJSONKeyStreamMixer][2]
                    },

                    isNotBlockedLocal: true,
                    isNotBlockedStream: true
                });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                if (input.iconData) {
                    const testImage = new Image();

                    testImage.src = 'data:image/png;base64,' + input.iconData;

                    await new Promise((resolve) => {
                        testImage.onload = function () {
                            context.filter = 'grayscale(100%)';
                            context.drawImage(this, 0, 0, 300, 150);

                            var img = canvas.toDataURL('image/png');
                            resolve(img);
                        }
                    }).then((img) => {
                        const macIcon = '<image id="appIcon" width="144" height="144" x="0" y="0" xlink:href="data:image/png;base64,' + input.iconData + '"/>';
                        const macIconGray = '<image id="appIcon" width="144" height="144" x="0" y="0" xlink:href="' + img + '"/>';

                        const awl = new AppWaveLink();

                        const lastItem = awl.secondaryIconType[awl.secondaryIconType.length - 1];

                        awl.secondaryIconType.forEach(secType => {
                            const icon = `${input.name}${secType}`;

                            if (secType != 'Set') {
                                const scaleFactorTouch = 1.10;
                                const offsetTouch = -144 * (scaleFactorTouch - 1) / 2;
                                const transformTouch = `matrix(${scaleFactorTouch},0,0,${scaleFactorTouch},${offsetTouch},${offsetTouch})`;

                                awl.touchIconsInput[icon] = new SVGIconWL({
                                    icons: `./images/touchPanel/input/default.svg`,
                                    icon: `default`,
                                    layerOrder: ['macAppIcon', `overlayTouch${secType}`]
                                });
                                awl.touchIconsInput[icon].layers.macAppIcon = secType.includes('Mute') ? macIconGray : macIcon;
                                awl.touchIconsInput[icon].layerProps['macAppIcon'].transform = transformTouch;
                                awl.touchIconsInput[icon] = awl.touchIconsInput[icon].toBase64(true);
                            }

                            const scaleFactor = 0.58;
                            const offset = -144 * (scaleFactor - 1) / 2;
                            const transform = `matrix(${scaleFactor},0,0,${scaleFactor},${offset},${offset})`;

                            const mixerOverlay = secType.includes('Monitor') ? `overlayMonitor` : secType.includes('Stream') ? `overlayStream` : '';
                            const muteOverlay = secType == 'AllMute' ? 'mute' : secType == 'MonitorMute' || secType == 'StreamMute' ? 'overlayMuteMonitorStream' : '';
                            const muteIndicatorOverlay = secType == 'MonitorMute' && secType == 'StreamMute' ? 'muteIndicator' : '';
                            const textOrSetIndicator = secType == 'Set' ? 'overlaySet' : 'text';

                            awl.keyIconsInput[icon] = new SVGIconWL({
                                icons: `./images/key/inputActions/default.svg`,
                                icon: `default`,
                                backgroundColor: '#000',
                                layerOrder: ['macAppIcon', `${textOrSetIndicator}`, `${muteOverlay}`, `${mixerOverlay}`, `${muteIndicatorOverlay}`]
                            });
                            awl.keyIconsInput[icon].layers.macAppIcon = secType.includes('Mute') ? macIconGray : macIcon;
                            awl.keyIconsInput[icon].layerProps['macAppIcon'].transform = transform;

                            if (secType == lastItem) {
                                this.emitEvent(kJSONPropertyInputsChanged);
                                this.emitEvent(kPropertyUpdatePI);
                            }
                        });
                    });
                }
            });
            this.emitEvent(kJSONPropertyInputsChanged);
            this.emitEvent(kPropertyUpdatePI);

        });
    }

    setInputConfig(context, property, isAdjustVolume, identifier, mixerID, value, fadingTime) {
        this.checkAppState();

        const input = this.getInput(identifier);
        const updateAll = {updateAll: true}

        if (input && fadingTime) {
            const isAlreadyFading = mixerID == kPropertyMixerIDLocal ? !input.isNotBlockedLocal : !input.isNotBlockedStream;

            if (isAlreadyFading) {
                return;
            }

            var timeLeft = fadingTime;
            var newValue = 0;

            const intervalTimer = setInterval(() => {
                if (timeLeft > 0) {
                    const currentValue = mixerID == kPropertyMixerIDLocal ? input.local.volume : input.stream.volume;
                    const volumeSteps = (value - currentValue) / (timeLeft / this.fadingDelay);

                    newValue = currentValue + Math.round(volumeSteps, 2);
                    mixerID == kPropertyMixerIDLocal ? input.isNotBlockedLocal = false : input.isNotBlockedStream = false;

                    timeLeft -= this.fadingDelay;

                    mixerID == kPropertyMixerIDLocal ? input.local.volume = newValue : input.stream.volume = newValue;
                } else {
                    mixerID == kPropertyMixerIDLocal ? input.isNotBlockedLocal = true : input.isNotBlockedStream = true;
                    clearInterval(intervalTimer);
                }

                this.suppressNotifications.identifier = identifier;
                this.suppressNotifications.mixerID = mixerID;

                if (this.suppressNotificationsTimer) {
                    clearTimeout(this.suppressNotificationsTimer);
                }

                this.suppressNotificationsTimer = setTimeout(() => {
                    this.suppressNotifications.identifier = '';
                    this.suppressNotifications.mixerID = '';
                }, 250);
                this.throttleUpdate(context, kJSONPropertyInputVolumeChanged, {
                    context,
                    identifier,
                    mixerID,
                    updateAll
                }, 100);

                this.rpc.call(kJSONPropertySetInputConfig, {
                    [kJSONKeyProperty]: property,
                    [kJSONKeyIdentifier]: identifier,
                    [kJSONKeyMixerID]: mixerID,
                    [kJSONKeyValue]: newValue,
                    [kJSONKeyForceLink]: false
                });

            }, this.fadingDelay)
        } else {
            const forceLink = mixerID == kPropertyMixerIDAll;
            var newValue = 0;
            var newMixerID = mixerID;

            if (isAdjustVolume) {
                if (forceLink) {
                    if (value < 0) {
                        newMixerID = input.local.volume > input.stream.volume ? kPropertyMixerIDLocal : kPropertyMixerIDStream;
                    } else {
                        newMixerID = input.local.volume < input.stream.volume ? kPropertyMixerIDLocal : kPropertyMixerIDStream;
                    }

                    input.local.volume = input.local.volume + value < 0 ? 0 : input.local.volume + value > 100 ? 100 : input.local.volume + value;
                    input.stream.volume = input.stream.volume + value < 0 ? 0 : input.stream.volume + value > 100 ? 100 : input.stream.volume + value;

                    newValue = newMixerID == kPropertyMixerIDLocal ? input.local.volume : input.stream.volume;
                } else {
                    newValue = newMixerID == kPropertyMixerIDLocal ? input.local.volume + value : input.stream.volume + value;

                    newValue = newValue < 0 ? 0 : newValue > 100 ? 100 : newValue;

                    newMixerID == kPropertyMixerIDLocal ? input.local.volume = newValue : input.stream.volume = newValue;
                }
            } else {
                newValue = value;
            }

            this.suppressNotifications.identifier = identifier;
            this.suppressNotifications.mixerID = mixerID;

            if (this.suppressNotificationsTimer) {
                clearTimeout(this.suppressNotificationsTimer);
            }

            this.suppressNotificationsTimer = setTimeout(() => {
                this.suppressNotifications.identifier = '';
                this.suppressNotifications.mixerID = '';
            }, 250);
            this.throttleUpdate(context, kJSONPropertyInputVolumeChanged, {
                context,
                identifier,
                mixerID,
                updateAll
            }, 100);

            this.rpc.call(kJSONPropertySetInputConfig, {
                [kJSONKeyProperty]: property,
                [kJSONKeyIdentifier]: identifier,
                [kJSONKeyMixerID]: newMixerID,
                [kJSONKeyValue]: newValue,
                [kJSONKeyForceLink]: forceLink
            });
        }
    }

    setFilterBypass(identifier, mixerID, value) {
        this.checkAppState();

        this.rpc.call(kJSONPropertySetFilterBypass, {
            [kJSONKeyIdentifier]: identifier,
            [kJSONKeyMixerID]: mixerID,
            [kJSONKeyValue]: value
        });
    }

    setFilterConfig(identifier, filterID, value) {
        this.checkAppState();

        this.rpc.call(kJSONPropertySetFilter, {
            [kJSONKeyIdentifier]: identifier,
            [kJSONKeyFilterID]: filterID,
            [kJSONKeyValue]: value
        });
    }

    getMicrophone(identifier) {
        var microphoneConfig = undefined;

        if (this.UP_WINDOWS) {
            this.microphones?.forEach(micConfig => {
                if (this.inputs.find(input => input.identifier == micConfig.identifier)?.isAvailable)
                    microphoneConfig = micConfig;
            });
        } else if (this.UP_MAC) {
            microphoneConfig = this.microphones[0];
        }
        return microphoneConfig;
    }

    setMicrophone(identifier, property, value) {
        const microphone = this.getMicrophone(identifier);

        if (microphone != undefined) {
            switch (this.propertyConverter(property)) {
                case kPropertyMicrophoneGain:
                    const gainConverter = new LookupTableConverter(microphone.gainLookup);
                    microphone.gainIndex = this.checkValueIsInRange(value, 0, gainConverter?.length - 1);
                    microphone.gain = gainConverter.getFirstValueFromIndex(microphone.gainIndex);
                    break;
                case kPropertyMicrophoneOutputVolume:
                    const outputVolumenConverter = new LookupTableConverter(microphone.outputVolumeLookup);
                    microphone.outputVolumeIndex = this.checkValueIsInRange(value, 0, outputVolumenConverter?.length - 1);
                    microphone.outputVolume = outputVolumenConverter.getFirstValueFromIndex(microphone.outputVolumeIndex);
                    break;
                case kPropertyMicrophoneBalance:
                    microphone.balanceIndex = this.checkValueIsInRange(value, 0, 100);
                    microphone.balance = this.checkValueIsInRange(microphone.balanceIndex / 100, 0, 1);
                    break;
                case kPropertyMicrophoneLowCut:
                    microphone.isLowCutOn = value;
                    break;
                case kPropertyMicrophoneClipGuard:
                    microphone.isClipGuardOn = value;
                    break;
                case kPropertyMicrophoneLowCutType:
                    microphone.lowCutType = value;
                    break;
                case kPropertyMicrophoneGainLock:
                    microphone.isGainLocked = value;
                    break;
                case kPropertyMicrophoneMute:
                    microphone.isMicMuted = value;
                    break;
                default:
                    break;
            }
        }
    }

    // TODO: Change WebSocketInterface
    propertyConverter(property) {
        var waveLinkProperty = property;
        switch (property) {
            case kJSONPropertyGain:
                waveLinkProperty = kPropertyMicrophoneGain
                break;
            case kJSONPropertyOutputVolume:
                waveLinkProperty = kPropertyMicrophoneOutputVolume;
                break;
            case kJSONPropertyBalance:
                waveLinkProperty = kPropertyMicrophoneBalance;
                break;
            case kJSONKeyClipGuard:
                waveLinkProperty = kPropertyMicrophoneClipGuard;
                break;
            case kJSONKeyLowCut:
                waveLinkProperty = kPropertyMicrophoneLowCut;
                break;
            case kJSONKeyLowCutType:
                waveLinkProperty = kPropertyMicrophoneLowCutType;
                break;
            default:
                break;
        }
        return waveLinkProperty;
    }

    getValueConverter(property) {
        switch (property) {
            case kPropertySetGain:
            case kPropertyAdjustGain:
            case kPropertyMicrophoneGain:
                if (this.gainConverter == undefined)
                    this.gainConverter = new LookupTableConverter(this.getMicrophone()?.gainLookup)

                return this.gainConverter;
            case kPropertySetOutput:
            case kPropertyAdjustOutput:
            case kPropertyMicrophoneOutputVolume:
                if (this.outputVolumeConverter == undefined)
                    this.outputVolumeConverter = new LookupTableConverter(this.getMicrophone()?.outputVolumeLookup)

                return this.outputVolumeConverter;
            default:
                return;
        }
    }

    getOutput() {
        return this.output;
    }

    getInput(identifier) {
        return this.inputs.find(input => input.identifier == identifier);
    }

    // Helper methods
    throttleUpdate(context, event, payload, time) {
        if (!this.isKeyUpdated.get(context)) {
            this.isKeyUpdated.set(context, true);
            _setTimeoutESD(() => {
                this.emitEvent(event, payload);
                this.isKeyUpdated.delete(context);
            }, time);
        }
    }

    fixNames = (name, maxlen = 27, suffix = ' &hellip;') => {
        return (name && name.length > maxlen ? name.slice(0, maxlen - 1) + suffix : name);
    };

    setConnectionState(state) {
        this.isConnected = state;
        this.emitEvent(kPropertyUpdatePI);
    }

    setAppIsRunning(state) {
        this.appIsRunning = state;
    }

    isAppStateOk() {
        return this.isConnected && this.isUpToDate;
    }

    checkAppState() {
        if (!this.isConnected || !this.isUpToDate) {
            throw `App not connected or update needed`
        }
    }

    checkValueIsInRange(value, minValue, maxValue) {
        return value = value < minValue ? minValue : value > maxValue ? maxValue : value;
    }
};