/// <reference path="WaveLinkAction.js" />

class HardwareAction extends WaveLinkAction {

    feedbackBlocked = new Map();

    constructor(uuid) {

        super(uuid);

        this.onKeyDown(async ({context, payload}) => {
            const {settings} = payload;

            try {
                switch (settings.actionType) {
                    case ActionType.SetOutput:
                        if (this.wlc.selectedOutput != settings.primOutput) {
                            debug("Set from", this.wlc.selectedOutput, "to", settings.primOutput)
                            this.wlc.setSelectedOutput(settings.primOutput);
                        }
                        break;
                    case ActionType.SetDeviceSettings:
                        switch (settings.micSettingsAction) {
                            case kPropertySetGain:
                                this.wlc.setMicrophoneConfig(context, kJSONPropertyGain, settings.volValue);
                                break;
                            case kPropertyAdjustGain:
                                this.adjustValue(context, kJSONPropertyGain, settings.volValue);
                                break;
                            case kPropertytoggleGainLock:
                                this.wlc.setMicrophoneConfig(context, kPropertyMicrophoneGainLock, settings.volValue);
                                break;
                            case kPropertySetOutput:
                                this.wlc.setMicrophoneConfig(context, kJSONPropertyOutputVolume, settings.volValue);
                                break;
                            case kPropertyAdjustOutput:
                                this.adjustValue(context, kJSONPropertyOutputVolume, settings.volValue);
                                break;
                            case kPropertySetOutput:
                                this.wlc.setMicrophoneConfig(context, kJSONPropertyOutputVolume, settings.volValue);
                                break;
                            case kPropertySetMicPcBalance:
                                this.wlc.setMicrophoneConfig(context, kJSONPropertyBalance, settings.volValue);
                                break;
                            case kPropertyAdjustMicPcBalance:
                                this.adjustValue(context, kJSONPropertyBalance, settings.volValue);
                                break;

                            default:
                                break;
                        }
                        break;
                    default:
                        break;
                }
            } catch (error) {
                debug("SetMicrophone", error)
                $SD.showAlert(context);
            }
        });

        this.onKeyUp(async ({context, payload}) => {
            const {settings} = payload;

            try {
                switch (settings.actionType) {
                    case ActionType.ToggleOutput:
                        if (settings.primOutput && settings.secOutput) {
                            switch (this.wlc.selectedOutput) {
                                case settings.primOutput:
                                    this.wlc.setSelectedOutput(settings.secOutput);
                                    break;
                                case settings.secOutput:
                                    this.wlc.setSelectedOutput(settings.primOutput);
                                    break;
                                default:
                                    this.wlc.setSelectedOutput(settings.primOutput);
                                    break;
                            }
                        }
                        break;
                    case ActionType.SetDeviceSettings:
                        const microphone = this.wlc.getMicrophone();

                        switch (settings.micSettingsAction) {
                            case kPropertyToggleLowcut:
                                const isWaveXLR = microphone?.isWaveXLR;
                                const newLowcutState = isWaveXLR ? this.getNextLowcutType() : !microphone?.isLowCutOn;
                                const property = isWaveXLR ? kPropertyMicrophoneLowCutType : kPropertyMicrophoneLowCut;

                                this.wlc.setMicrophoneConfig(context, property, newLowcutState);
                                break;
                            case kPropertyToggleClipguard:
                                this.wlc.setMicrophoneConfig(context, kPropertyMicrophoneClipGuard, !microphone?.isClipGuardOn);
                                break;
                            case kPropertyToggleHardwareMute:
                                this.muteHardware(context, payload);
                                break;
                            default:
                                if (this.keyTimer.get(context)) {
                                    clearTimeout(this.keyTimer.get(context));
                                    this.keyTimer.delete(context);
                                }
                                break;
                        }
                        break;
                    default:
                        break;
                }
            } catch (error) {
                $SD.showAlert(context);
            }

            this.setState(context);
        });

        this.onDialRotate(({context, payload}) => {
            const {settings} = payload;
            const {ticks} = payload;

            const deviceSetting = settings.micSettingsAction;
            const microphone = this.wlc.getMicrophone();

            try {
                var property, currentValue;

                switch (deviceSetting) {
                    case kPropertyAdjustGain:
                        property = kJSONPropertyGain;
                        currentValue = microphone.gainIndex;
                        break;
                    case kPropertyAdjustOutput:
                        property = kJSONPropertyOutputVolume;
                        currentValue = microphone.outputVolumeIndex;
                        break;
                    case kPropertyAdjustMicPcBalance:
                        property = kJSONPropertyBalance;
                        currentValue = microphone.balanceIndex;
                        break;
                    default:
                        break;
                }

                if (property) {
                    const newValue = ticks * settings.volValue + currentValue;
                    this.wlc.setMicrophoneConfig(context, property, newValue == undefined ? 1 : newValue);

                    if (this.feedbackBlocked.get(deviceSetting)) {
                        clearTimeout(this.feedbackBlocked.get(deviceSetting));
                        this.feedbackBlocked.delete(deviceSetting);
                        this.feedbackBlocked.set(deviceSetting, setTimeout(() => {
                            this.feedbackBlocked.delete(deviceSetting);
                        }, 100));
                    } else {
                        this.feedbackBlocked.set(deviceSetting, setTimeout(() => {
                            this.feedbackBlocked.delete(deviceSetting);
                        }, 100));
                    }

                    if (this.feedbackBlocked.get(context)) {
                        clearTimeout(this.feedbackBlocked.get(context));
                        this.feedbackBlocked.delete(context);

                        this.feedbackBlocked.set(context, setTimeout(() => {
                            this.feedbackBlocked.delete(context);
                            this.setFeedbackLayout(context);
                            this.setFeedback(context);
                        }, 2000));
                    } else {
                        this.feedbackBlocked.set(context, setTimeout(() => {
                            this.feedbackBlocked.delete(context);
                            this.setFeedbackLayout(context);
                            this.setFeedback(context);
                        }, 2000));

                        this.setFeedbackLayout(context);
                        this.setFeedback(context);
                    }


                    this.throttleUpdate(context, 100, () => this.setFeedbackVolume(context));
                }
            } catch (error) {
                $SD.showAlert(context);
                console.error(error);
            }
        });

        this.onDialUp(({context, payload}) => {
            const {pressed} = payload;

            if (!pressed)
                this.muteHardware(context);
        });

        this.onTouchTap(({context}) => {
            this.muteHardware(context);
        });

        this.wlc.onEvent(kJSONPropertyInputsChanged, () => {
            this.actions.forEach((action, actionContext) => {
                if (action.isEncoder) {
                    this.setFeedback(actionContext);
                    this.setKeyIcons(actionContext);
                } else {
                    this.setKeyIcons(actionContext);
                    this.setState(actionContext);
                    this.setTitle(actionContext);
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputLevelChanged, (payload) => {
            this.actions.forEach((action, actionContext) => {
                const {settings} = action;

                if (this.useLevelmeter(actionContext) && settings.micSettingsAction == kPropertyAdjustGain) {
                    if (action.isEncoder)
                        this.setFeedback(actionContext);
                    else if (!this.feedbackBlocked.get(kJSONPropertyGain)) {
                        this.setKeyIcons(actionContext, kJSONPropertyInputLevelChanged);
                    }
                }
            });
        });

        this.wlc.onEvent(kJSONPropertySelectedOutputChanged, () => {
            this.actions.forEach((action, actionContext) => {
                if (action.isEncoder) {
                    this.setFeedback(actionContext);
                } else {
                    this.setState(actionContext);
                }
                this.setState(actionContext);
            });
        });

        this.wlc.onEvent(kJSONPropertyOutputLevelChanged, (payload) => {
            this.actions.forEach((action, actionContext) => {
                const {settings} = action;

                if (this.useLevelmeter(actionContext) && settings.micSettingsAction == kPropertyAdjustOutput) {
                    if (action.isEncoder)
                        this.setFeedback(actionContext);
                    else if (!this.feedbackBlocked.get(kJSONPropertyOutputVolume)) {
                        this.setKeyIcons(actionContext, kJSONPropertyOutputLevelChanged);
                    }
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyMicrophoneConfigChanged, (payload) => {
            this.actions.forEach((action, actionContext) => {
                const settings = action.settings;
                const {property} = payload;
                const {context} = payload;

                if (actionContext != context || property == kPropertyMicrophoneMute) {
                    if (action.isEncoder && this.isActionUpdateNeeded(property, settings.micSettingsAction)) {
                        if (property == kPropertyMicrophoneMute)
                            this.setFeedback(actionContext);
                        else
                            this.setFeedbackVolume(actionContext);
                    } else if (this.isActionUpdateNeeded(property, settings.micSettingsAction)) {
                        if (this.isAdjustAction(settings.micSettingsAction))
                            this.setKeyIcons(actionContext);
                        else
                            this.setState(actionContext);
                    }
                }
            });
        });
    };

    setKeyIcons(context, notificationType = undefined) {
        if (this.isAppStateOk()) {
            const settings = this.actions.get(context).settings;
            const isEncoder = this.actions.get(context).isEncoder;
            const deviceSetting = settings.micSettingsAction;

            if (!isEncoder && this.isAdjustAction(deviceSetting) && settings.actionStyle != 0) {
                const microphone = this.wlc.getMicrophone();

                var indicatorValue = 0, levelLeft = 0, levelRight = 0;

                if (microphone != undefined) {
                    switch (deviceSetting) {
                        case kPropertyAdjustGain:
                            const [firstKey] = this.wlc.microphones.keys();
                            const input = this.wlc.inputs.find((input, index) => input.identifier.includes(firstKey));

                            levelLeft = input?.levelLeft || 0;
                            levelRight = input?.levelRight || 0;

                            indicatorValue = this.wlc.getValueConverter(deviceSetting).getFirstValueFromIndex(microphone.gainIndex) * 100;
                            break;
                        case kPropertyAdjustOutput:
                            const output = this.wlc.getOutput();

                            levelLeft = this.wlc.switchState == kPropertyMixerIDLocal ? output?.local.levelLeft : output?.stream.levelLeft;
                            levelRight = this.wlc.switchState == kPropertyMixerIDLocal ? output?.local.levelRight : output?.stream.levelRight;

                            indicatorValue = this.wlc.getValueConverter(deviceSetting).getFirstValueFromIndex(microphone.outputVolumeIndex) * 100;
                            break;
                        case kPropertyAdjustMicPcBalance:
                            indicatorValue = microphone.balanceIndex;
                            break;
                        default:
                            return;
                    }
                }

                const options = {
                    bgColor: '',
                    value: parseInt(100 - indicatorValue),
                    levelLeft: levelLeft,
                    levelRight: levelRight,
                    isTop: settings.volValue >= 0 ? true : false,
                    orientation: settings.actionStyle
                }

                if (options.value == undefined || options.value == NaN) {
                    console.error("No valid property value");
                    return;
                }

                switch (settings.actionStyle) {
                    case 1:
                    case 2:
                        $SD.setImage(context, this.getBase64FaderSVG(context, options));
                        break;
                    case 3:
                    case 4:
                        if (this.checkIfKeyIconUpdateIsNeeded(context, settings.actionStyle, deviceSetting, options, notificationType)) {
                            this.throttleUpdate(context, 50, () => {
                                switch (deviceSetting) {
                                    case kPropertyAdjustGain:
                                        const [firstKey] = this.wlc.microphones.keys();
                                        const input = this.wlc.inputs.find((input, index) => input.identifier.includes(firstKey));

                                        options.levelLeft = input?.levelLeft || 0;
                                        options.levelRight = input?.levelRight || 0;
                                        break;
                                    case kPropertyAdjustOutput:
                                        const output = this.wlc.getOutput();

                                        options.levelLeft = this.wlc.switchState == kPropertyMixerIDLocal ? output?.local.levelLeft : output?.stream.levelLeft;
                                        options.levelRight = this.wlc.switchState == kPropertyMixerIDLocal ? output?.local.levelRight : output?.stream.levelRight;
                                        break;
                                    default:
                                        break;
                                }
                                $SD.setImage(context, this.getBase64FaderAndLevelmeterSVG(context, options));
                            });
                        }
                        break;
                    default:
                        break;
                }
            } else {
                var icon = 'default';
                var icon2 = icon;

                switch (settings.actionType) {
                    case ActionType.SetOutput:
                        icon = icon2 = 'setOutputDevice';
                        break;
                    case ActionType.ToggleOutput:
                        icon = 'toggleOutputDeviceFirst';
                        icon2 = 'toggleOutputDeviceSecond';
                        break;
                    case ActionType.SetDeviceSettings:
                        //if (this.wlc.getMicrophone()) {
                        switch (deviceSetting) {
                            case kPropertySetGain:
                            case kPropertySetOutput:
                            case kPropertySetMicPcBalance:
                                icon = icon2 = deviceSetting;
                                break;
                            case kPropertyAdjustGain:
                            case kPropertyAdjustOutput:
                            case kPropertyAdjustMicPcBalance:
                                if (isEncoder)
                                    icon = icon2 = deviceSetting + (this.wlc.getMicrophone()?.isMicMuted ? kPropertySuffixMuted : '');
                                else
                                    icon = icon2 = (settings.volValue > 0) ? deviceSetting + kPropertySuffixPlus : deviceSetting + kPropertySuffixMinus;
                                break;
                            case kPropertytoggleGainLock:
                            case kPropertyToggleLowcut:
                            case kPropertyToggleClipguard:
                            case kPropertyToggleHardwareMute:
                                icon = deviceSetting + kPropertySuffixOn;
                                icon2 = deviceSetting + kPropertySuffixOff;
                                break;
                            default:
                                return;
                        }
                        //}
                        break;
                    default:
                        return;
                }

                if (!icon2)
                    icon2 = icon;

                const svgIcon = this.awl.keyIconsHardware[icon];
                const svgIcon2 = this.awl.keyIconsHardware[icon2];

                if (icon != icon2) {
                    $SD.setImage(context, svgIcon, 0);
                    $SD.setImage(context, svgIcon2, 1);
                } else {
                    $SD.setImage(context, svgIcon, 0);
                    $SD.setImage(context, svgIcon, 1);
                }
            }
        } else {
            $SD.setImage(context, this.awl.keyIconWarning.toBase64(), 0);
            $SD.setImage(context, this.awl.keyIconWarning.toBase64(), 1);
        }
    }

    setFeedbackVolume(context) {
        const payload = this.createFeedbackPayload(context, false, false, true, true);
        $SD.send(context, "setFeedback", {payload});
    }

    setFeedback(context) {
        const payload = this.createFeedbackPayload(context, true, true, true, true);
        $SD.send(context, "setFeedback", {payload});
    }

    setFeedbackLayout(context) {
        const payload = {layout: '$B1'};

        switch (this.actions.get(context).settings.micSettingsAction) {
            case kPropertyAdjustGain:
            case kPropertyAdjustOutput:
                payload.layout = this.useLevelmeter(context) ? 'plugin/js/layouts/levelmeterSplitted.json' : '$B1';
                break;
            case kPropertyAdjustMicPcBalance:
                payload.layout = 'plugin/js/layouts/micPcBalance.json';
                break;
            default:
                break;
        }

        $SD.send(context, "setFeedbackLayout", {payload});
    }

    setState(context) {
        const settings = this.actions.get(context).settings;

        switch (settings.actionType) {
            case ActionType.ToggleOutput:
                if (this.wlc.selectedOutput) {
                    if (this.wlc.selectedOutput == settings.primOutput)
                        $SD.setState(context, 0);
                    else if (this.wlc.selectedOutput == settings.secOutput)
                        $SD.setState(context, 1);
                }
                break;
            case ActionType.SetDeviceSettings:
                const microphone = this.wlc.getMicrophone();

                if (!microphone)
                    return;

                var state;

                switch (settings.micSettingsAction) {
                    case kPropertytoggleGainLock:
                        state = ~~!microphone.isGainLocked;
                        break;
                    case kPropertyToggleLowcut:
                        if (microphone.isWaveXLR)
                            state = microphone.lowCutType > 0 ? 0 : 1;
                        else
                            state = microphone.isLowCutOn ? 0 : 1;
                        break;
                    case kPropertyToggleClipguard:
                        state = ~~!microphone.isClipGuardOn;
                        break;
                    case kPropertyToggleHardwareMute:
                        state = ~~microphone.isMicMuted;
                        break;
                    default:
                        state = 0;
                        break;
                }
                $SD.setState(context, state);
                break;
            default:
                break;
        }
    }

    adjustValue(context, property, value) {
        const settings = this.actions.get(context).settings;

        var currentValue = 0;

        switch (property) {
            case kJSONPropertyGain:
                currentValue = this.wlc.getMicrophone()?.gainIndex;
                break;
            case kJSONPropertyOutputVolume:
                currentValue = this.wlc.getMicrophone()?.outputVolumeIndex;
                break;
            case kJSONPropertyBalance:
                currentValue = this.wlc.getMicrophone()?.balanceIndex;
                break;
            default:
                break;
        }

        this.wlc.setMicrophoneConfig(context, property, value + currentValue);

        // Only for slider keys: Update key icon and notify buddy key
        if (settings.actionStyle != 0) {
            this.setKeyIcons(context);
            this.wlc.emitEvent(kJSONPropertyMicrophoneConfigChanged, {
                context: context,
                property: kPropertyMicrophoneOutputVolume
            });
        }

        this.keyTimer.set(context, setTimeout(() => this.adjustValue(context, property, value), 200));
    }

    getNextLowcutType() {
        const microphone = this.wlc.getMicrophone();

        if (microphone?.lowCutType >= 2)
            return 0;
        else
            return microphone?.lowCutType + 1;
    }

    muteHardware(context, payload) {
        try {
            const isInMultiAction = payload?.isInMultiAction;
            const newValue = isInMultiAction ? !payload.userDesiredState : !this.wlc.getMicrophone()?.isMicMuted;

            this.wlc.setMicrophoneConfig(context, kPropertyMicrophoneMute, newValue);
        } catch (error) {
            $SD.showAlert(context);
            console.error(error);
        }
    }

    isActionUpdateNeeded(waveLinkPropertyID, pluginPropertyID) {
        switch (waveLinkPropertyID) {
            case kPropertyMicrophoneGain:
                return pluginPropertyID == kPropertyAdjustGain;
            case kPropertyMicrophoneOutputVolume:
                return pluginPropertyID == kPropertyAdjustOutput;
            case kPropertyMicrophoneBalance:
                return pluginPropertyID == kPropertyAdjustMicPcBalance;
            case kPropertyMicrophoneLowCut:
            case kPropertyMicrophoneLowCutType:
                return pluginPropertyID == kPropertyToggleLowcut;
            case kPropertyMicrophoneClipGuard:
                return pluginPropertyID == kPropertyToggleClipguard;
            case kPropertyMicrophoneGainLock:
                return pluginPropertyID == kPropertytoggleGainLock;
            case kPropertyMicrophoneMute:
                switch (pluginPropertyID) {
                    case kPropertyToggleHardwareMute:
                    case kPropertyAdjustGain:
                    case kPropertyAdjustOutput:
                    case kPropertyAdjustMicPcBalance:
                        return true;
                    default:
                        return false;
                }
            default:
                return false;
        }
    }

    isAdjustAction(actionType) {
        switch (actionType) {
            case kPropertyAdjustGain:
            case kPropertyAdjustOutput:
            case kPropertyAdjustMicPcBalance:
                return true;
            default:
                return false;
        }
    }

    // Creates a payload object for "SetFeedback", parameters are action context and a boolean, if a specific element should be set or not 
    createFeedbackPayload(context, setTitle, setImage, setValue, setIndicator) {
        const microphone = this.wlc.getMicrophone();
        const payload = {};

        if (!microphone || !this.isAppStateOk()) {
            const img = {
                value: this.awl.touchIconWarning
            }

            const value = {
                value: 0,
                opacity: 0
            }

            payload.icon = img;
            payload.icon1 = img;
            payload.icon2 = img;
            payload.value = value;
            payload.indicator = value;
            payload.indicator1 = value;
            payload.indicator2 = value;
        } else {
            const settings = this.actions.get(context).settings;
            const deviceSetting = settings.micSettingsAction;

            if (setTitle) {
                payload.title = {
                    value: `${this.wlc.localization?.micSettingsTouch?.[deviceSetting]}`
                }
            }

            if (setImage) {
                const muteState = ~~microphone.isMicMuted ? kPropertySuffixMuted : '';

                if (deviceSetting == kPropertyAdjustMicPcBalance) {
                    payload.icon1 = {
                        value: this.awl.touchIconsHardware[kPropertyAdjustMicPcBalance + kPropertySuffixMinus + muteState]
                    };

                    payload.icon2 = {
                        value: this.awl.touchIconsHardware[kPropertyAdjustMicPcBalance + kPropertySuffixPlus + muteState]
                    };
                } else {
                    payload.icon = {
                        value: this.awl.touchIconsHardware[deviceSetting + muteState],
                        opacity: 1
                    };
                }
            }

            if (setValue || setIndicator) {
                var value = 0;
                var indicatorValue = 0;

                const isMuted = ~~microphone.isMicMuted;

                switch (deviceSetting) {
                    case kPropertyAdjustGain:
                        if (this.useLevelmeter(context)) {
                            const [firstKey] = this.wlc.microphones.keys();
                            const input = this.wlc.inputs.find((input, index) => input.identifier.includes(firstKey));

                            const levelLeft = input?.levelLeft || 0;
                            const levelRight = input?.levelRight || 0;

                            setIndicator = false;

                            payload.levelmeterTop = {
                                value: this.getLevelmeterSVG(levelLeft)
                            }

                            payload.levelmeterBottom = {
                                value: this.getLevelmeterSVG(levelRight, true)
                            }
                        } else {
                            indicatorValue = this.wlc.getValueConverter(deviceSetting).getFirstValueFromIndex(microphone.gainIndex) * 100;
                        }
                        value = this.wlc.getValueConverter(deviceSetting).getSecondValueFromIndex(microphone.gainIndex);
                        break;
                    case kPropertyAdjustOutput:
                        if (this.useLevelmeter(context)) {
                            const output = this.wlc.getOutput();

                            const levelLeft = this.wlc.switchState == kPropertyMixerIDLocal ? output?.local.levelLeft : output?.stream.levelLeft;
                            const levelRight = this.wlc.switchState == kPropertyMixerIDLocal ? output?.local.levelRight : output?.stream.levelRight;

                            setIndicator = false;

                            payload.levelmeterTop = {
                                value: this.getLevelmeterSVG(levelLeft)
                            }

                            payload.levelmeterBottom = {
                                value: this.getLevelmeterSVG(levelRight, true)
                            }
                        } else {
                            indicatorValue = this.wlc.getValueConverter(deviceSetting).getFirstValueFromIndex(microphone.outputVolumeIndex) * 100;
                        }
                        value = this.wlc.getValueConverter(deviceSetting).getSecondValueFromIndex(microphone.outputVolumeIndex);
                        break;
                    case kPropertyAdjustMicPcBalance:
                        indicatorValue = microphone.balanceIndex;
                        break;
                    default:
                        return;
                }

                if (setValue && deviceSetting != kPropertyAdjustMicPcBalance) {
                    const unit = ' dB';//this.wlc.localization?.mixerMute || '';
                    const titleVolume = isMuted ? 'Muted' : `${value}${unit || ''}`;

                    payload.value = {
                        value: titleVolume,
                        color: isMuted ? '#E12A40' : 'white',
                        opacity: 1
                    }
                }

                if (setIndicator) {
                    payload.indicator = {
                        value: indicatorValue,
                        opacity: 1
                    }
                }
            }
        }

        return payload;
    }
}