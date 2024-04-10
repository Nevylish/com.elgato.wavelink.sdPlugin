class InputAction extends WaveLinkAction {

    feedbackBlocked = new Map();

    constructor(uuid) { 

        super(uuid);

        this.onKeyDown(async ({ context, payload }) => {
            const { settings } = payload;
            const identifier = this.getInputIdentifier(context, settings);   
            const input = this.wlc.getInput(identifier);
            
            try {
                if (input && input.isAvailable) {
                    switch (settings.actionType) {
                        case ActionType.SetVolume:
                            if (settings.mixerID == kPropertyMixerIDAll) 
                                throw `${settings.mixerID} is not available on ${ActionType.SetVolume}`;
                        
                            const isNotBlocked = settings.mixerID == kPropertyMixerIDLocal ? input.isNotBlockedLocal : input.isNotBlockedStream;
                            
                            if (isNotBlocked) {
                                this.wlc.setInputConfig(context, kPropertyVolume, false, identifier, settings.mixerID, settings.volValue, settings.fadingDelay);
                                
                                if (settings.fadingDelay > 0) {
                                    setTimeout(() => { $SD.showOk(context); }, settings.fadingDelay + 50) 
                                } 
                            }
                            break;
                        case ActionType.AdjustVolume:
                            if (settings.mixerID == kPropertyMixerIDAll)
                                throw `${settings.mixerID} is not available on ${ActionType.AdjustVolume}`;

                            this.adjustVolume(context, kPropertyVolume, true, identifier, settings.mixerID, settings.volValue);
                            break;
                    }
                } else {
                    throw "Error"
                }
            } catch (error) {
                $SD.showAlert(context);
                console.error(error);
            } 
        });

        this.onKeyUp(async ({ context, payload }) => {
            const { settings } = payload;
            const { isInMultiAction } = payload;
            const identifier = this.getInputIdentifier(context, settings);   
            const input = this.wlc.getInput(identifier);

            try {
                if (input && input.isAvailable) {
                    switch (settings.actionType) {
                        case ActionType.Mute:
                            const newValue = isInMultiAction ? !payload.userDesiredState : settings.mixerID == kPropertyMixerIDLocal ? !input.local.isMuted : !input.stream.isMuted;

                            this.wlc.setInputConfig(context, kPropertyMute, false, identifier, settings.mixerID, newValue);
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
                $SD.showAlert(context);
                console.error(error);
            }

            this.setState(context);
        });

        this.onDialRotate(({ context, payload }) => {
            const { settings } = payload;
            const { ticks } = payload;
            const identifier = this.getInputIdentifier(context, settings);
            const input = this.wlc.getInput(identifier);

            try {
                if (input && input.isAvailable && settings.actionType == ActionType.AdjustVolume) {
                    const newValue = ticks * settings.volValue;
                    this.wlc.setInputConfig(context, kPropertyVolume, true, identifier, settings.mixerID, newValue == undefined ? 1 : newValue);

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
                const settings = action.settings;

                if (settings.identifier == payload.identifier && action.isEncoder) {
                    this.setFeedback(context);
                    this.setKeyIcons(context);
                } else if (settings.identifier == payload.identifier && settings.actionType == ActionType.Mute) {
                    this.setState(context);
                } else if (settings.identifier == payload.identifier && settings.mixerID == payload.mixerID && settings.actionType == ActionType.AdjustVolume) {
                    this.setKeyIcons(context);
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputVolumeChanged, (payload) => {
            this.actions.forEach((action, actionContext) => {
                const { settings } = action;
                const { identifier } = payload;
                const { context } = payload;
                const { updateAll } = payload;

                if (actionContext != context && updateAll) {
                    if (settings.identifier == identifier && action.isEncoder) {
                        this.setFeedback(actionContext);
                    } else if (settings.identifier == identifier && settings.actionType == ActionType.Mute) {
                        this.setKeyIcons(actionContext);
                    } else if (settings.identifier == identifier && settings.actionType == ActionType.AdjustVolume) {
                        this.setKeyIcons(actionContext);
                    }
                } else if (settings.identifier == identifier && settings.actionType == ActionType.AdjustVolume) {
                    this.setKeyIcons(actionContext);
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputLevelChanged, (payload) => {
            this.actions.forEach((action, actionContext) => {
                const { settings } = action;
                const { identifier } = payload;
                const { context } = payload;
                const { updateAll } = payload;

                if (actionContext != context && updateAll) {
                    if (settings.identifier == identifier && action.isEncoder) {
                        this.setFeedback(actionContext);
                    } else if (settings.identifier == identifier && settings.actionType == ActionType.AdjustVolume) {
                        this.setKeyIcons(actionContext, kJSONPropertyInputLevelChanged);
                    }
                } else if (settings.identifier == identifier && settings.actionType == ActionType.AdjustVolume) {
                    if (!this.feedbackBlocked.get(identifier)) {
                        this.setKeyIcons(actionContext, kJSONPropertyInputLevelChanged);
                    }
                }
            });
        });

        this.wlc.onEvent(kJSONPropertyInputNameChanged, (payload) => {
            this.actions.forEach((action, context) => {
                
                if (settings.identifier == payload.identifier && settings.mixerID == payload.mixerID && action.isEncoder) {
                    this.setFeedback(context);
                } else if (action.settings.identifier == payload.identifier && action.settings.actionType == ActionType.Mute) {
                    this.setTitle(context);
                }
            });
        });
    }

    setKeyIcons(context, notificationType = undefined) {
        const settings = this.actions.get(context).settings;
        const isEncoder = this.actions.get(context).isEncoder;
        const identifier = this.getInputIdentifier(context, settings);
        const input = this.wlc.getInput(identifier);

        if (this.isAppStateOk() && !isEncoder && input && settings.actionType == ActionType.AdjustVolume && settings.actionStyle != 0) {
            const options = {
                bgColor: settings.isColored && this.wlc.UP_WINDOWS ? input?.bgColor : '',
                value: settings.mixerID == kPropertyMixerIDLocal ? -input.local.volume + 100 : -input.stream.volume + 100,
                levelLeft: input.levelLeft,
                levelRight : input.levelRight,
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
					if (this.checkIfKeyIconUpdateIsNeeded(context, settings.actionStyle, settings.identifier, options, notificationType)) {
						this.throttleUpdate(context, 50, () => {
							options.levelLeft = input?.levelLeft;
							options.levelRight = input?.levelRight;

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
            const identifier = this.getInputIdentifier(context, settings);
            const input = this.wlc.getInput(identifier);

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
            const identifier = this.getInputIdentifier(context, settings);
            const input = this.wlc.getInput(identifier);

            if (input) {
                const mixer = settings.mixerID == kPropertyMixerIDAll ? 'All' : settings.mixerID == kPropertyMixerIDLocal ? 'Monitor' : 'Stream';
                const muteState = settings.mixerID == 'all' ? input.stream.isMuted : (settings.mixerID == kPropertyMixerIDLocal ? input.local.isMuted : input.stream.isMuted);
                const muteIcon = muteState ? 'Mute' : '';

                var icon;

                if (settings?.identifier.includes('PCM_IN_01_C_00_SD1')) {
                    icon = 'wave';
                } else if (settings?.identifier.includes('PCM_OUT_01_V_00_SD2')) {
                    icon = 'system';
                } else if (settings?.identifier.includes('PCM_OUT_01_V_02_SD3')) {
                    icon = 'music';
                } else if (settings?.identifier.includes('PCM_OUT_01_V_04_SD4')) {
                    icon = 'browser';
                } else if (settings?.identifier.includes('PCM_OUT_01_V_06_SD5')) {
                    icon = 'voiceChat';
                } else if (settings?.identifier.includes('PCM_OUT_01_V_08_SD6')) {
                    icon = 'sfx';
                } else if (settings?.identifier.includes('PCM_OUT_01_V_10_SD7')) {
                    icon = 'game';
                } else if (settings?.identifier.includes('PCM_OUT_01_V_12_SD8') || identifier.includes('PCM_OUT_01_V_14_SD9')) {
                    icon = 'aux';
                } else if (input?.inputType == 4) {
                    icon = 'Game';
                } else if (input?.inputType == 1) {
                    icon = 'wave';
                } else {
                    icon = kPropertyDefault;
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

                const levelLeft = input?.levelLeft || 0;
                const levelRight = input?.levelRight || 0;

                //🎧 🔈

                const payload = {};

                payload.title = {
                    value: `${this.actions.get(context).title || this.fixName(input?.name, 20)}`
                }

                if (settings.mixerID == kPropertyMixerIDAll) {
                    const monitorMuteState = input.local.isMuted ? 'Mute' : '';
                    const streamMuteState = input.stream.isMuted ? 'Mute' : '';

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
                            value: this.getLevelmeterSVG(levelLeft, false, true)
                        }

                        payload.levelmeterBottom1 = { 
                            value: this.getLevelmeterSVG(levelRight, true, true)
                        }

                        payload.levelmeterTop2 = { 
                            value: this.getLevelmeterSVG(levelLeft, false, true)
                        }

                        payload.levelmeterBottom2 = { 
                            value: this.getLevelmeterSVG(levelRight, true, true)

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
                    payload.icon = {
                        value: this.awl.touchIconsInput[icon],
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
            const settings = this.actions.get(context).settings;
            const isEncoder = this.actions.get(context).isEncoder;
            const identifier = this.getInputIdentifier(context, settings);
            const input = this.wlc.getInput(identifier);

            const hasIconData = input && input?.iconData && (input?.iconData.length > 0);
            const useIconData = hasIconData && (settings.actionType == ActionType.Mute || settings.actionType == ActionType.SetVolume || isEncoder) ? 'macAppIcon' : 'icon';
    
            const mixer = settings.mixerID == kPropertyMixerIDLocal ? 'Monitor' : settings.mixerID == kPropertyMixerIDStream ? 'Stream' : 'All';

            var icon;

            if (settings.actionType == ActionType.AdjustVolume && !isEncoder && settings.actionStyle == 0) {
                icon = settings.volValue < 0 ? 'decrease' : 'increase';
            } else if (settings?.identifier?.includes('PCM_IN_01_C_00_SD1') || input?.identifier?.includes('Wave')) {
                icon = 'wave';
            } else if (settings?.identifier?.includes('PCM_OUT_01_V_00_SD2')) {
                icon = 'system';
            } else if (settings?.identifier?.includes('PCM_OUT_01_V_02_SD3')) {
                icon = 'music';
            } else if (settings?.identifier?.includes('PCM_OUT_01_V_04_SD4')) {
                icon = 'browser';
            } else if (settings?.identifier?.includes('PCM_OUT_01_V_06_SD5')) {
                icon = 'voiceChat';
            } else if (settings?.identifier?.includes('PCM_OUT_01_V_08_SD6')) {
                icon = 'sfx';
            } else if (settings?.identifier?.includes('PCM_OUT_01_V_10_SD7')) {
                icon = 'game';
            } else if (settings?.identifier?.includes('PCM_OUT_01_V_12_SD8') || settings?.identifier?.includes('PCM_OUT_01_V_14_SD9')) {
                icon = 'aux';
            } else if (input?.inputType == 4) {
                icon = 'game';
            } else if (input?.inputType == 1) {
                icon = 'wave';
            } else {
                icon = kPropertyDefault;
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

                        svgIcon.layerOrder = ['fill', useIconData, 'text', `${mixerOverlay}` ];
                        svgIcon2.layerOrder = [ 'fill', useIconData, 'text', settings.mixerID == kPropertyMixerIDAll ? 'mute' : 'overlayMuteMonitorStream', `${mixerOverlay}`, `${muteIndicatorOverlay}` ];
                    } else if (settings.actionType == ActionType.SetVolume) {
                        svgIcon.layerOrder = [ 'fill', useIconData, 'overlaySet' ];
                    }
                    
                    svgIcon.backgroundColor = settings.isColored && this.wlc.UP_WINDOWS ? input?.bgColor : '';
                    svgIcon2.backgroundColor = settings.isColored && this.wlc.UP_WINDOWS ? input?.bgColor : '';
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
        const identifier = this.getInputIdentifier(context, settings);   
        const input = this.wlc.getInput(identifier);

        try {
            if (input && input.isAvailable && settings.actionType == ActionType.AdjustVolume) {
                const newValue = settings.mixerID == kPropertyMixerIDLocal ? !input.local.isMuted : !input.stream.isMuted;

                this.wlc.setInputConfig(context, kPropertyMute, false, identifier, settings.mixerID, newValue);
            } else {
                throw input ? `Wrong ActionType: ${settings.actionType}.` : 'No input available.';
            }            
        } catch (error) {
            $SD.showAlert(context);
            console.error(error);
        }
    }
};