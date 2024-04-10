class EffectAction extends WaveLinkAction {
    constructor(uuid) { 

        super(uuid);

        this.onKeyUp(async ({ context, payload }) => {
            const { settings } = payload;
            const { isInMultiAction } = payload;
            
            try {
                const identifier = this.getInputIdentifier(context, settings);   
                const input = this.wlc.getInput(identifier);
                        
                if (input && input.isAvailable && input.filters && input.filters.length > 0) {
                    

                    switch (settings.actionType) {
                        case ActionType.SetEffect:
                            const newState = isInMultiAction ? !payload.userDesiredState : !input.filters.find(filter => filter.filterID == settings.filterID)?.isActive;

                            this.wlc.setFilterConfig(identifier, settings.filterID, newState);
                            break;
                        case ActionType.SetEffectChain:
                            const filterBypass = isInMultiAction ? !!payload.userDesiredState : settings.mixerID == kPropertyMixerIDLocal ? !input.local.filterBypass : !input.stream.filterBypass;

                            this.wlc.setFilterBypass(identifier, settings.mixerID, filterBypass);
                            break;
                        default:
                            throw `Action not selected`;
                    }      
                } else {
                    throw "Error"
                }
            } catch (error) {
                $SD.showAlert(context);
                console.error(error);
            } 
        });

        this.wlc.onEvent(kJSONPropertyInputsChanged, () => {
            this.actions.forEach((action, context) => {
                this.setKeyIcons(context);
                this.setState(context);
                this.setTitle(context);
            });
        });

        this.wlc.onEvent(kJSONPropertyFilterChanged, (payload) => {
            
            this.actions.forEach((action, context) => {
                const settings = this.actions.get(context).settings;

                if (settings.identifier == payload.identifier && settings.filterID == payload.filterID) {
                    this.setState(context);
                    this.setTitle(context);
                }
            });
        });
        
        this.wlc.onEvent(kJSONPropertyFilterBypassStateChanged, (payload) => {
            this.actions.forEach((action, context) => {
                const settings = action.settings;

                if (settings.identifier == payload.identifier && settings.mixerID == payload.mixerID) {
                    this.setState(context);
                }
            });
        });
    }

    setKeyIcons(context) {
        if (this.isAppStateOk()) {
            const settings = this.actions.get(context).settings;

            var iconOn, iconOff;

            switch (settings.actionType) {
                case ActionType.SetEffect:
                    iconOn = 'toggleEffectOn';
                    iconOff = 'toggleEffectOff';
                    break;
                case ActionType.SetEffectChain:
                    iconOn = 'toggleEffectChainOn';
                    iconOff = 'toggleEffectChainOff';
                    break;
                default:
                    iconOn = iconOff = kPropertyDefault;
                    break;
            }

            const svgIcon = this.awl.keyIconsEffect[iconOn]; 
            const svgIcon2 = this.awl.keyIconsEffect[iconOff];

            if (settings.actionType == ActionType.SetEffect) {
                const identifier = this.getInputIdentifier(context, settings);
                const input = this.wlc.getInput(identifier);
    
                if (input && input.isAvailable) {
                    const filter = input.filters ? input.filters.find(f => f.filterID == settings.filterID) : undefined;         
                    const filterName = filter?.name || '';
    
                    svgIcon.fontSize = { lower: 26 };
                    svgIcon.text = { lower: `${this.fixName(filterName, 9)}` };
                    svgIcon2.fontSize = { lower: 26 };
                    svgIcon2.text = { lower: `${this.fixName(filterName, 9)}` };
                }
            }

            $SD.setImage(context, svgIcon.toBase64(true), 0);
            $SD.setImage(context, svgIcon2.toBase64(true), 1);
        } else {
            $SD.setImage(context, this.awl.keyIconWarning.toBase64(), 0);
            $SD.setImage(context, this.awl.keyIconWarning.toBase64(), 1);
        }
    }

    setState(context) {
        const settings = this.actions.get(context).settings;
        const identifier = this.getInputIdentifier(context, settings);
        const input = this.wlc.getInput(identifier);

        if (input && input.filters) {
            if (settings.actionType == ActionType.SetEffect) {
                const filter = input.filters ? input.filters.find(f => f.filterID == settings.filterID) : undefined;

                if (filter) {
                    $SD.setState(context, +!filter.isActive)
                }
            } else if (settings.actionType == ActionType.SetEffectChain) {
                const filterBypassState = settings.mixerID == kPropertyMixerIDLocal ? +input.local.filterBypass : +input.stream.filterBypass;
                $SD.setState(context, filterBypassState);
            }
        }
    }
};