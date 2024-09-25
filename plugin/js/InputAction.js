class InputAction extends WaveLinkAction {
    feedbackBlocked = new Map();
    actionFailed    = false;
    actionSucceeded = false;

    mappingIDsToIcon = new Map([
        ['PCM_IN_01_C_00_SD1', 'wave'],
        ['Wave Link System', 'system'],
        ['Wave Link Music', 'music'],
        ['Wave Link Browser', 'browser'],
        ['Wave Link Voice Chat', 'voiceChat'],
        ['Wave Link SFX', 'sfx'],
        ['Wave Link Game', 'game'],
        ['Wave Link Aux', 'aux']
    ]);

    // Pre Wave Link 2.0 idetifier (API 6)
    mappingFromOldIDsToIcon = new Map([
        ['PCM_IN_01_C_00_SD1', 'wave'],
        ['PCM_OUT_01_V_00_SD2', 'system'],
        ['PCM_OUT_01_V_02_SD3', 'music'],
        ['PCM_OUT_01_V_04_SD4', 'browser'],
        ['PCM_OUT_01_V_06_SD5', 'voiceChat'],
        ['PCM_OUT_01_V_08_SD6', 'sfx'],
        ['PCM_OUT_01_V_10_SD7', 'game'],
        ['PCM_OUT_01_V_12_SD8', 'aux'],
        ['PCM_OUT_01_V_14_SD9', 'aux']
    ]);

    constructor(uuid) {
        super(uuid);

        this.onKeyDown(async ({ context, payload }) => {
            const { settings } = payload;
            const input        = this.wlc.getInput(settings.identifier);

            try {
                if (input && input.isAvailable) {
                    switch (settings.actionType) {
                        case ActionType.SetVolume:
                            const isNotBlocked = settings.mixerID == kPropertyMixerIDLocal ? input.isNotBlockedLocal : input.isNotBlockedStream;

                            if (isNotBlocked) {
                                this.wlc.setInputConfig(context, kPropertyVolume, false, input.identifier, settings.mixerID, settings.volValue, settings.fadingDelay);
                                
                                if (settings.fadingDelay > 0) {
                                    setTimeout(() => { $SD.showOk(context); }, settings.fadingDelay + 50) 
                                }
                            }
                            break;
                        case ActionType.AdjustVolume:
                            this.adjustVolume(context, kPropertyVolume, true, input.identifier, settings.mixerID, settings.volValue);
                            break;
                        case ActionType.AddInput:
                            this.actionSucceeded = await this.wlc.addInput(input.identifier);
                            if (!this.actionSucceeded)
                                throw 'Add input failed.'
                            break;
                    }
                } else {
                    throw "Error"
                }
            } catch (error) {
                this.actionFailed = true;
                console.error(error);
            }
        });

        this.onKeyUp(async ({ context, payload }) => {
            const { settings }        = payload;
            const { isInMultiAction } = payload;
            const input               = this.wlc.getInput(settings.identifier);

            try {
                if (input && input.isAvailable) {
                    switch (settings.actionType) {
                        case ActionType.Mute:
                            const newValue = isInMultiAction ? !payload.userDesiredState : settings.mixerID == kPropertyMixerIDLocal ? !input.local.isMuted : !input.stream.isMuted;

                            this.wlc.setInputConfig(context, kPropertyMute, false, input.identifier, settings.mixerID, newValue);
                            break;
                        case ActionType.AdjustVolume:
                            if (this.keyTimer.get(context)) {
                                clearTimeout(this.keyTimer.get(context));
                                this.keyTimer.delete(context);
                            }
                            break;
                    }
                } else {
                    throw "Error"
                }
            } catch (error) {
                this.actionFailed = true;
                console.error(error);
            }

            this.setState(context);

            if (this.actionFailed)
                $SD.showAlert(context);
            else if (this.actionSucceeded)
                $SD.showOk(context);
        });

        this.onDialRotate(({ context, payload }) => {
            const { settings }   = payload;
            const { ticks }      = payload;
            const input          = this.wlc.getInput(settings.identifier);

            try {
                if (input && input.isAvailable && settings.actionType == ActionType.AdjustVolume) {
                    const { identifier } = input;
                    const newValue       = ticks * settings.volValue;

                    this.wlc.setInputConfig(context, kPropertyVolume, true, input.identifier, settings.mixerID, newValue == undefined ? 1 : newValue);

                    if (this.feedbackBlocked.get(identifier)) {
                        clearTimeout(this.feedbackBlocked.get(identifier));
                        this.feedbackBlocked.delete(identifier);
                        this.feedbackBlocked.set(identifier, setTimeout(() => { this.feedbackBlocked.delete(identifier); }, 100));
                    } else {
                        this.feedbackBlocked.set(identifier, setTimeout(() => { this.feedbackBlocked.delete(identifier); }, 100));
                    }

                    if (this.feedbackBlocked.get(context)) {
                        clearTimeout(this.feedbackBlocked.get(context));
                        this.feedbackBlocked.delete(context);

                        this.feedbackBlocked.set(context, setTimeout(() => { this.feedbackBlocked.delete(context); this.setFeedbackLayout(context); this.setFeedback(context); }, 2000));
                    } else {
                        this.feedbackBlocked.set(context, setTimeout(() => { this.feedbackBlocked.delete(context); this.setFeedbackLayout(context); this.setFeedback(context); }, 2000));    

                        this.setFeedbackLayout(context);
                        this.setFeedback(context);
                    }

                    this.throttleUpdate(context, 100, () => { this.setFeedbackVolume(context); });
                } else {
                    throw input && input.isAvailable ? `Wrong ActionType: ${settings.actionType}.` : 'No input available.';
                }
            } catch (error) {
                $SD.showAlert(context);
                console.error(error);
            }
        });

        this.onDialUp(({ context, payload }) => {
            const { pressed } = payload;

            if (!pressed)
                this.muteInput(context, payload);
        });

        this.onTouchTap(({ context, payload }) => {
            this.muteInput(context, payload);
        });

        this.wlc.onEvent(kJSONPropertyInputsChanged, () => {
            this.actions.forEach((action, context) => {
                if (action.isEncoder) {
                    this.setFeedback(context);
                    this.setKeyIcons(context);
                } else {
                    this.setKeyIcons(context);
                    this.setState(context);
                    this.setTitle(context);
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputMuteChanged, (payload) => {
            this.actions.forEach((action, context) => {
                const { settings } = action;
                const input        = this.wlc.getInput(settings.identifier);

                if (input == undefined)
                    return;

                const { identifier } = input;

                if (identifier == payload.identifier && action.isEncoder) {
                    this.setFeedback(context);
                    this.setKeyIcons(context);
                } else if (identifier == payload.identifier && settings.actionType == ActionType.Mute) {
                    this.setState(context);
                } else if (identifier == payload.identifier && settings.mixerID == payload.mixerID && settings.actionType == ActionType.AdjustVolume) {
                    this.setKeyIcons(context);
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputVolumeChanged, (payload) => {
            this.actions.forEach((action, actionContext) => {
                const { settings } = action;
                const input        = this.wlc.getInput(settings.identifier);

                if (input == undefined)
                    return;

                const { identifier } = input;
                const { context }    = payload;
                const { updateAll }  = payload;

                if (actionContext != context && updateAll) {
                    if (identifier == payload.identifier && action.isEncoder) {
                        this.setFeedback(actionContext);
                    } else if (identifier == payload.identifier && settings.actionType == ActionType.Mute) {
                        this.setKeyIcons(actionContext);
                    } else if (identifier == payload.identifier && settings.actionType == ActionType.AdjustVolume) {
                        this.setKeyIcons(actionContext);
                    }
                } else if (identifier == payload.identifier && settings.actionType == ActionType.AdjustVolume) {
                    this.setKeyIcons(actionContext);
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputLevelChanged, (payload) => {
            this.actions.forEach((action, actionContext) => {
                const { settings } = action;
                const input        = this.wlc.getInput(settings.identifier);

                if (input == undefined)
                    return;

                const { identifier } = input;
                const { context }    = payload;
                const { updateAll }  = payload;

                if (actionContext != context && updateAll) {
                    if (identifier == payload.identifier && action.isEncoder) {
                        this.setFeedback(actionContext);
                    } else if (identifier == payload.identifier && settings.actionType == ActionType.AdjustVolume) {
                        this.setKeyIcons(actionContext, kJSONPropertyInputLevelChanged);
                    }
                } else if (identifier == payload.identifier && settings.actionType == ActionType.AdjustVolume) {
                    if (!this.feedbackBlocked.get(identifier)) {
                        this.setKeyIcons(actionContext, kJSONPropertyInputLevelChanged);
                    }
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputNameChanged, (payload) => {
            this.actions.forEach((action, context) => {
                const { settings } = action;
                const input        = this.wlc.getInput(settings.identifier);

                if (input == undefined)
                    return;

                const { identifier } = input;

                if (identifier == payload.identifier && settings.mixerID == payload.mixerID && action.isEncoder) {
                    this.setFeedback(context);
                } else if (identifier == payload.identifier && action.settings.actionType == ActionType.Mute) {
                    this.setTitle(context);
                }
            });
        });
    }

    setKeyIcons(context, notificationType = undefined) {
        const settings       = this.actions.get(context).settings;
        const isEncoder      = this.actions.get(context).isEncoder;
        const input         = this.wlc.getInput(settings.identifier);

        if (this.isAppStateOk() && !isEncoder && input && settings.actionType == ActionType.AdjustVolume && settings.actionStyle != 0) {
            const options = {
                bgColor: settings.isColored && this.wlc.UP_WINDOWS ? input?.bgColor : '',
                value: settings.mixerID == kPropertyMixerIDLocal ? -input.local.volume + 100 : -input.stream.volume + 100,
                levelLeft: settings.mixerID == kPropertyMixerIDLocal ? input.local.levelLeft : input.stream.levelLeft,
                levelRight : settings.mixerID == kPropertyMixerIDLocal ? input.local.levelRight : input.stream.levelRight,
                isTop: settings.volValue >= 0 ? true : false,
                orientation: settings.actionStyle
            }

            if (options.value == undefined || options.value == NaN) {
                console.error("No valid property value", input.name);
                return;
            }

            switch (settings.actionStyle) {
                case 1:
                case 2:
                    $SD.setImage(context, this.getBase64FaderSVG(context, options));
                    break;
                case 3:
                case 4:
                    if (this.checkIfKeyIconUpdateIsNeeded(context, settings.actionStyle, input.identifier, options, notificationType)) {
                        this.throttleUpdate(context, 50, () => {
                            options.levelLeft = settings.mixerID == kPropertyMixerIDLocal ? input.local.levelLeft : input.stream.levelLeft;
                            options.levelRight = settings.mixerID == kPropertyMixerIDLocal ? input.local.levelRight : input.stream.levelRight;

                            $SD.setImage(context, this.getBase64FaderAndLevelmeterSVG(context, options));
                        });
                    }
                    break;
                default:
                    break;
            } 
        } else {
            const images = this.getKeyIcon(context);

            var imgUnmuted = images[0];
            var imgMuted = images[1];

            if (typeof(imgUnmuted) == "object") {
                imgUnmuted = images[0].toBase64(true);
                imgMuted = images[1].toBase64(true);
            }

            if (isEncoder) {
                const muteState = input != undefined ? settings.mixerID == 'all' ? input.stream.isMuted : (settings.mixerID == kPropertyMixerIDLocal ? input.local.isMuted : input.stream.isMuted) : 0;
                $SD.setImage(context, muteState ? imgMuted : imgUnmuted, 0);
            } else if (settings.actionType == ActionType.Mute) {
                $SD.setImage(context, imgUnmuted, 0);
                $SD.setImage(context, imgMuted, 1);
            } else {
                $SD.setImage(context, imgUnmuted, 0);
                $SD.setImage(context, imgUnmuted, 1);
            }
        }
    }

    setState(context) {
        const settings = this.actions.get(context).settings;

        if (settings.actionType == ActionType.Mute && settings.mixerID) {
            const input = this.wlc.getInput(settings.identifier);

            if (input) {
                const muteState = settings.mixerID == 'all' ? input.stream.isMuted : (settings.mixerID == kPropertyMixerIDLocal ? input.local.isMuted : input.stream.isMuted);
                $SD.setState(context, ~~muteState);
            }
        } else {
            $SD.setState(context, 0);
        }      
    }

    async setFeedback(context) {
        if (this.isAppStateOk()) {
            const settings = this.actions.get(context).settings;
            const input = this.wlc.getInput(settings.identifier);

            if (input) {
                const mixer = settings.mixerID == kPropertyMixerIDAll ? 'All' : settings.mixerID == kPropertyMixerIDLocal ? 'Monitor' : 'Stream';
                const muteState = settings.mixerID == 'all' ? input.stream.isMuted : (settings.mixerID == kPropertyMixerIDLocal ? input.local.isMuted : input.stream.isMuted);
                const muteIcon = muteState ? 'Mute' : '';

                var icon = kPropertyDefault;

                this.mappingIDsToIcon.forEach((value, key) => {
                    if (settings?.identifier?.includes(key))
                        icon = value;
                });

                if (icon == kPropertyDefault) {
                    this.mappingFromOldIDsToIcon.forEach((value, key) => {
                        if (settings?.identifier?.includes(key))
                            icon = value;
                    });

                    if (icon == kPropertyDefault) {
                        if (input?.inputType == 4) {
                            icon = 'game';
                        } else if (input?.inputType == 1) {
                            icon = 'wave';
                        }
                    }
                }

                switch (icon) {
                    case 'wave':
                        icon = this.wlc.UP_MAC ? `${icon}${mixer}${muteIcon}MacOS` :`${icon}${mixer}${muteIcon}`;
                        break;
                    default:
                        if (this.wlc.UP_MAC)
                            icon = input?.name ? `${input?.name}${mixer}${muteIcon}` : kPropertyDefault;
                        else
                            icon = `${icon}${mixer}${muteIcon}`;
                        break;
                }
                
                const percentSign = this.wlc.localization?.mixerMute || '';

                const localVolume = input?.local.volume != undefined ? input?.local.volume : '--' ;
                const streamVolume = input?.stream.volume != undefined ? input?.stream.volume : '--';
                const volume = settings.mixerID == kPropertyMixerIDLocal ? localVolume : streamVolume;

                const titleVolume = `${percentSign?.percentFirst || ''}${volume}${percentSign?.percentLast || ''}`;

                //🎧 🔈

                const payload = {};

                payload.title = {
                    value: `${this.actions.get(context).title || this.fixName(input?.name, 20)}`
                }

                if (settings.mixerID == kPropertyMixerIDAll) {
                    const monitorMuteState = input.local.isMuted ? 'Mute' : '';
                    const streamMuteState  = input.stream.isMuted ? 'Mute' : '';

                    const monitorIcon = `outputMonitor${monitorMuteState}`
                    const streamIcon = `outputStream${streamMuteState}`

                    payload.icon1 = {
                        value: this.awl.touchIconsOutput[monitorIcon]
                    };

                    payload.icon2 = {
                        value: this.awl.touchIconsOutput[streamIcon]
                    };

                    if (this.useLevelmeter(context)) {
                        payload.levelmeterTop1 = { 
                            value: this.getLevelmeterSVG(input.local.levelLeft, false, true)
                        }

                        payload.levelmeterBottom1 = { 
                            value: this.getLevelmeterSVG(input.local.levelRight, true, true)
                        }

                        payload.levelmeterTop2 = { 
                            value: this.getLevelmeterSVG(input.stream.levelLeft, false, true)
                        }

                        payload.levelmeterBottom2 = { 
                            value: this.getLevelmeterSVG(input.stream.levelRight, true, true)

                        }
                    } else {
                        payload.indicator1 = {
                            value: localVolume || 0,
                            opacity: 1
                        }

                        payload.indicator2 = {
                            value: streamVolume || 0,
                            opacity: 1
                        }
                    }
                } else {
                    const levelLeft = settings.mixerID == kPropertyMixerIDLocal ? input.local.levelLeft : input.stream.levelLeft || 0;
                    const levelRight = settings.mixerID == kPropertyMixerIDLocal ? input.local.levelRight : input.stream.levelRight || 0;

                    payload.icon = {
                        value: this.awl.touchIconsInput[icon] || this.awl.touchIconsInput[kPropertyDefault],
                        opacity: 1
                    };

                    payload.value = {
                        value: titleVolume,
                        opacity: 1
                    }

                    if (this.useLevelmeter(context)) {
                        payload.levelmeterTop = { 
                            value: this.getLevelmeterSVG(levelLeft)
                        }

                        payload.levelmeterBottom = { 
                            value: this.getLevelmeterSVG(levelRight, true)
                        }
                    } else {
                        payload.indicator = {
                            value: volume || 0,
                            opacity: 1
                        }
                    }
                }

                $SD.send(context, "setFeedback", { payload });
            }
        } else {
            $SD.send(context, "setFeedback", { 
                payload: {
                    icon: {
                        value: this.awl.touchIconWarning
                    },
                    icon1: {
                        value: this.awl.touchIconWarning
                    },
                    icon2: {
                        value: this.awl.touchIconWarning
                    },
                    indicator: {
                        value: 0,
                        opacity: 0
                    },
                    indicator1: {
                        value: 0,
                        opacity: 0
                    },
                    indicator2: {
                        value: 0,
                        opacity: 0
                    }
                }
            });
        }
    }

    setFeedbackVolume(context) {
        this.setFeedback(context);
    }

    getKeyIcon(context) {
        if (this.isAppStateOk()) {
            const settings    = this.actions.get(context).settings;
            const isEncoder   = this.actions.get(context).isEncoder;
            const input       = this.wlc.getInput(settings.identifier);
            const hasIconData = input && input?.iconData && (input?.iconData.length > 0);
            const useIconData = hasIconData && (settings.actionType == ActionType.Mute || settings.actionType == ActionType.SetVolume || isEncoder) ? 'macAppIcon' : 'icon';
    
            const mixer = settings.mixerID == kPropertyMixerIDLocal ? 'Monitor' : settings.mixerID == kPropertyMixerIDStream ? 'Stream' : 'All';

            var icon = kPropertyDefault;

            if (settings.actionType == ActionType.AdjustVolume && !isEncoder && settings.actionStyle == 0) {
                icon = settings.volValue < 0 ? 'decrease' : 'increase';
            } else {
                this.mappingIDsToIcon.forEach((value, key) => {
                    if (settings?.identifier?.includes(key))
                        icon = value;
                });

                if (icon == kPropertyDefault) {
                    this.mappingFromOldIDsToIcon.forEach((value, key) => {
                        if (settings?.identifier?.includes(key))
                            icon = value;
                    });

                    if (icon == kPropertyDefault) {
                        if (input?.inputType == 4) {
                            icon = 'game';
                        } else if (input?.inputType == 1) {
                            icon = 'wave';
                        }
                    }
                }
            }

            var icon2 = icon, overlay = '', set = '';

            if (settings.actionType == ActionType.Mute || isEncoder) {
                switch (icon) {
                    case 'wave':
                        icon = `${icon}${mixer}`;
                        icon2 = `${icon2}${mixer}Mute`;
                        overlay = '';
                        break;
                    default:
                        if (this.wlc.UP_MAC) {
                            icon = input?.name ? `${input?.name}${mixer}` : kPropertyDefault;
                            icon2 = input?.name ? `${input?.name}${mixer}Mute` : kPropertyDefault;
                            
                        } else {
                            icon = icon == kPropertyDefault ? icon : `${icon}${mixer}`;
                            icon2 = icon2 == kPropertyDefault ? icon : `${icon2}${mixer}Mute`;
                        }
                        break;
                }
            } else if (settings.actionType == ActionType.SetVolume) {
                switch (icon) {
                    case 'wave':
                        icon = icon2 = `${icon}Set`;
                        break;
                    default:
                        if (this.wlc.UP_MAC) {
                            icon = icon2 = input?.name ? `${input?.name}Set` : kPropertyDefault;
                        } else {
                            icon = icon2 = icon == kPropertyDefault ? icon : `${icon}Set`;
                        }
                        break;
                }
            } else if (settings.actionType == ActionType.AddInput) {
                icon = icon2 = icon == kPropertyDefault ? icon : `${icon}Add`;
            }

            const svgIcon = this.awl.keyIconsInput[icon]; 
            const svgIcon2 = this.awl.keyIconsInput[icon2];

            if (typeof(svgIcon) == "object") {
                if (settings.actionType == ActionType.Mute) {
                    const percentSign = this.wlc.localization?.mixerMute || '';
                    const localVolume = input?.local.volume != undefined ? input?.local.volume : '--' ;
                    const streamVolume = input?.stream.volume != undefined ? input?.stream.volume : '--';
                    const volume = settings.mixerID == kPropertyMixerIDLocal ? localVolume : streamVolume;

                    const volumeText = settings.mixerID == kPropertyMixerIDAll ? (`${localVolume} | ${streamVolume}`) : (`${percentSign?.percentFirst || ''}${volume}${percentSign?.percentLast || ''}`);

                    svgIcon.fontSize = { lower: 26 };
                    svgIcon.text = volume != undefined ? { lower: `${volumeText}` } : '';
                    svgIcon2.fontSize = { lower: 26 };
                    svgIcon2.text = volume != undefined ? { lower: `${volumeText}` } : '';

                } else {
                    svgIcon.text = '';
                    svgIcon2.text = '';
                }

                if (this.wlc.UP_WINDOWS) {
                    const mixerOverlay = settings.mixerID == kPropertyMixerIDLocal ?  `overlayMonitor` : settings.mixerID == kPropertyMixerIDStream ? `overlayStream` : '';

                    if (settings.actionType == ActionType.Mute) {
                        const muteIndicatorOverlay = settings.mixerID != kPropertyMixerIDAll ? 'muteIndicator' : '';

                        svgIcon.layerOrder = [ 'background', useIconData, 'text', `${mixerOverlay}` ];
                        svgIcon2.layerOrder = [ 'background', useIconData, 'text', settings.mixerID == kPropertyMixerIDAll ? 'mute' : 'overlayMuteMonitorStream', `${mixerOverlay}`, `${muteIndicatorOverlay}` ];
                    } else if (settings.actionType == ActionType.SetVolume) {
                        svgIcon.layerOrder = [ 'background', useIconData, 'overlaySet' ];
                    }
                    
                    svgIcon.backgroundColor = settings.isColored && this.wlc.UP_WINDOWS ? input?.bgColor : '';
                    svgIcon2.backgroundColor = settings.isColored && this.wlc.UP_WINDOWS ? input?.bgColor : '';

                    // Icon color testing
                    if (false) {
                        settings.isColored && this.wlc.UP_WINDOWS ? svgIcon.setIconColor('black') : svgIcon.setIconColor('white');
                        settings.isColored && this.wlc.UP_WINDOWS ? svgIcon2.setIconColor('black') : svgIcon2.setIconColor('white');
                    }
                }
            }

            return [svgIcon, svgIcon2];
        } else {
            return [this.awl.keyIconWarning, this.awl.keyIconWarning];
        }
    }

    adjustVolume(context, property, methodType, identifier, mixerID, value) {
        const settings = this.actions.get(context).settings;

        this.wlc.setInputConfig(context, property, methodType, identifier, mixerID, value);
        
        // Only for slider keys: Update key icon and notify buddy key
        if (settings.actionStyle != 0) {
            if (this.feedbackBlocked.get(identifier)) {
                clearTimeout(this.feedbackBlocked.get(identifier));
                this.feedbackBlocked.delete(identifier);

                this.feedbackBlocked.set(identifier, setTimeout(() => { this.feedbackBlocked.delete(identifier); }, 100));
            } else {
                this.feedbackBlocked.set(identifier, setTimeout(() => { this.feedbackBlocked.delete(identifier); }, 100));    

                this.setKeyIcons(context);
                this.wlc.emitEvent(kJSONPropertyInputVolumeChanged, { context, identifier, mixerID });
            }
        }
        
        this.keyTimer.set(context, setTimeout(() => this.adjustVolume(context, property, methodType, identifier, mixerID, value), 200));
    }

    muteInput(context, payload) {
        const { settings } = payload;
        const identifier = settings.identifier;
        const input = this.wlc.getInput(identifier);

        try {
            if (input && input.isAvailable && settings.actionType == ActionType.AdjustVolume) {
                const newValue = settings.mixerID == kPropertyMixerIDLocal ? !input.local.isMuted : !input.stream.isMuted;

                this.wlc.setInputConfig(context, kPropertyMute, false, input.identifier, settings.mixerID, newValue);
            } else {
                throw input ? `Wrong ActionType: ${settings.actionType}.` : 'No input available.';
            }            
        } catch (error) {
            $SD.showAlert(context);
            console.error(error);
        }
    }
};