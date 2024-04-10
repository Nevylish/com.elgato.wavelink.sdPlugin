/// <reference path="../../libs/js/stream-deck.js" />

$SD.onConnected(async (jsn) => { 
    await $SD.loadLocalization('../');

    context = jsn.actionInfo?.context;
    isEncoder = jsn.actionInfo?.payload?.controller === 'Encoder';
    platform = jsn?.appInfo?.application?.platform;
    settings = jsn.actionInfo?.payload?.settings;
	deviceType = jsn.appInfo?.devices?.find(device => device.id == jsn.actionInfo?.device)?.type;
    localization = $SD.localization['PI'];

    $SD.sendToPlugin(context, { 'isReady': true });
});

const setOutputAction = (jsn) => { if (checkAppState(jsn)) { setOutputActionSelection(jsn); }}
$SD.onSendToPropertyInspector("com.elgato.wavelink.outputaction", setOutputAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.monitormute", setOutputAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.setvolumemonitor", setOutputAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.adjustvolumemonitor", setOutputAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.switchmonitoring", setOutputAction);

const setInputAction = (jsn) => { if (checkAppState(jsn)) { setInputActionSelection(jsn); }}
$SD.onSendToPropertyInspector("com.elgato.wavelink.inputaction", setInputAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.mixermute", setInputAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.setvolumemixer", setInputAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.adjustvolumemixer", setInputAction);

const setEffectAction = (jsn) => { if (checkAppState(jsn)) { setEffectActionSelection(jsn); }}
$SD.onSendToPropertyInspector("com.elgato.wavelink.effectaction", setEffectAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.seteffect", setEffectAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.seteffectchain", setEffectAction);

const setHardwareAction = (jsn) => { if (checkAppState(jsn)) { setHardwareActionSelection(jsn); }}
$SD.onSendToPropertyInspector("com.elgato.wavelink.hardwareaction", setHardwareAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.setmonitormixoutput", setHardwareAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.togglemonitormixoutput", setHardwareAction);
$SD.onSendToPropertyInspector("com.elgato.wavelink.setmicsettings", setHardwareAction);

const setSwitchProfileAction = (jsn) => { if (checkAppState(jsn)) { setProfileSelection(configureSwitchProfileAction = false); }}
$SD.onSendToPropertyInspector("com.elgato.wavelink.switchprofiles", setSwitchProfileAction);

const checkAppState = (jsn) => {
    isConnected = jsn?.payload?.isConnected ?? {};
    isUpToDate = jsn?.payload?.isUpToDate ?? {};
    
    isOK = false;

    if (false) {
        settingsMenu();
        return;
    }

    if (!isConnected)
        setAppNotConnected();
    else if (!isUpToDate)
        setAppNotUpToDate();
    else {
        const msg = document.getElementById("msg");
        msg.classList.add('hidden');

        isOK = true;

        settings = jsn?.payload?.settings || settings;
    }

    return isOK; 
}

const setAppNotConnected = () => {
    const msg = document.getElementById("msg");
    msg.innerHTML = `<details class="message caution"><summary class="error">${localization['msg_notice_toLaunchApp']}</summary></details>`;
    msg.classList.remove('hidden');
    hidePlaceholders();
}

const setAppNotUpToDate = () => {
    const msg = document.getElementById("msg");
    msg.innerHTML = `<details class="message caution"><summary class="error">${localization['msg_notice_toUpdateApp']}</summary></details>`;
    msg.classList.remove('hidden');
    hidePlaceholders();
}

const setNoMicrophoneConnected = () => {
    document.getElementById("placeholder_Top2").innerHTML =  `<details class="message caution"><summary class="error">${localization['msgNoMicrophoneConnected']}</summary></details>`;
}

const hidePlaceholders = () => {
    document.getElementById("placeholder_Top1").innerHTML = "";
    document.getElementById("placeholder_Top2").innerHTML = "";
    document.getElementById("placeholder_Middle1").innerHTML = "";
    document.getElementById("placeholder_Middle2").innerHTML = "";
    document.getElementById("placeholder_Bottom1").innerHTML = "";
    document.getElementById("placeholder_Bottom2").innerHTML = "";
}

const options = [
    'inputIndex',
    'actionType'
]

const setSettings = () => {
    options.forEach(option => {
        settings[option] = document.getElementById(option).value;
    });
    
    $SD.setSettings(context, settings);
}

const resetSettings = () => {
    settings = {};
    $SD.setSettings(context, settings);
}

const settingsMenu = () => {

    if (settings.actionType == undefined) {
        settings.actionType = ActionType.AdjustVolume;
        $SD.setSettings(context, settings);
    }

    setMixerSelection(true);
    setVolumeSelection();

    var setSettingsMenu;

    options.forEach(option => { setSettingsMenu +=  '<div class="sdpi-item" id="your_name"> \
                                                        <div class="sdpi-item-label">' + option + '</div> \
                                                        <input class="sdpi-item-value" type="text" id="' + option + '" value="value"> \
                                                    </div>' });

    setSettingsMenu += '<div class="sdpi-item" id="setSettings"> \
                            <button onclick="setSettings()" class="sdpi-item-value">Set settings</button> \
                        </div> \
                        <div class="sdpi-item" id="resetSettings"> \
                            <button onclick="resetSettings()" class="sdpi-item-value">Reset settings</button> \
                        </div>'

    document.getElementById("placeholder_Bottom2").innerHTML = setSettingsMenu;

    options.forEach(option => { document.getElementById(option).value = settings[option]; });
}

const setOutputActionSelection = (jsn) => {
    if (isEncoder) {
        if (settings.actionType == undefined) {
            settings.actionType = ActionType.AdjustVolume;
            $SD.setSettings(context, settings);
        }

        if (settings.volValue == undefined) {
            settings.volValue = 1;
            $SD.setSettings(context, settings);
        }

        setMixerSelection(true);
        setVolumeSelection();
		setActionStyle();
    } else {
        const radioButtons = [
            { value: ActionType.SetVolume, label: localization['actionSelection']['set']},
            { value: ActionType.AdjustVolume, label: localization['actionSelection']['adjust']},
            { value: ActionType.Mute, label: localization['actionSelection']['mute']},
            { value: ActionType.SwitchOutput, label: localization['actionSelection']['toggleOutputMonitoring']}
        ]

        hidePlaceholders();

        const onChangeFn = () => {
            if (settings.actionType == ActionType.SetVolume)
                settings.volValue = 50;
            else if (settings.actionType == ActionType.AdjustVolume)
                settings.volValue = isEncoder ? 1 : 5;
        }

        setRadioButtons(localization['actionSelection']['label'], radioButtons, 'placeholder_Top1', 'actionType', onChangeFn);

        switch (settings.actionType) {
            case ActionType.Mute:
                setMixerSelection();
                break;
            case ActionType.SetVolume:
                setMixerSelection();
                setVolumeRange(jsn);
                setFading();
                break;
            case ActionType.AdjustVolume:
                setMixerSelection();
                setVolumeSelection();
                setActionStyle();
                break;
            default:
                break;
        }
    }
}

const setInputActionSelection = (jsn) => {
    if (isEncoder) {
        if (settings.actionType == undefined) {
            settings.actionType = ActionType.AdjustVolume;
            $SD.setSettings(context, settings);
        }

        if (settings.volValue == undefined) {
            settings.volValue = 1;
            $SD.setSettings(context, settings);
        }

        setInputSelection(jsn);
        setMixerSelection(true);
        setVolumeSelection();
		setActionStyle();
    } else {
        const radioButtons = [
            { value: ActionType.SetVolume, label: localization['actionSelection']['set']},
            { value: ActionType.AdjustVolume, label: localization['actionSelection']['adjust']},
            { value: ActionType.Mute, label: localization['actionSelection']['mute']}
        ]
    
        hidePlaceholders();

        const onChangeFn = () => {
            if (settings.actionType == ActionType.SetVolume)
                settings.volValue = 50;
            else if (settings.actionType == ActionType.AdjustVolume)
                settings.volValue = isEncoder ? 1 : 5;
        }

        setRadioButtons(localization['actionSelection']['label'], radioButtons, 'placeholder_Top1', 'actionType', onChangeFn);
    
        switch (settings.actionType) {
            case ActionType.Mute:
                setInputSelection(jsn);
                setMixerSelection(true);
                setIsColoredCheckBox();
                break;
            case ActionType.SetVolume:
                setInputSelection(jsn);
                setMixerSelection();
                setVolumeRange(jsn);
                setFading();
                setIsColoredCheckBox();
                break;
            case ActionType.AdjustVolume:
                setInputSelection(jsn);
                setMixerSelection();
                setVolumeSelection();
                setActionStyle();
                setIsColoredCheckBox();
                break;         
            default:
                break;
        }
    }
}

const setEffectActionSelection = (jsn) => {
    const radioButtons = [
        { value: ActionType.SetEffect, label: localization['effectActions']['toggleEffect']},
        { value: ActionType.SetEffectChain, label: localization['effectActions']['toggleEffectChain']}
    ]

    hidePlaceholders();
    setRadioButtons(localization['actionSelection']['label'], radioButtons, 'placeholder_Top1', 'actionType');

    switch (settings.actionType) {
        case ActionType.SetEffect:
            setInputSelection(jsn);
            setFilterSelection(jsn);
            break;
        case ActionType.SetEffectChain:
            setInputSelection(jsn);
            setMixerSelection();
            break;          
        default:
            break;
    }
}

const setHardwareActionSelection = (jsn) => {
    if (isEncoder) {
        if (settings.actionType == undefined) {
            settings.actionType = ActionType.SetDeviceSettings;
            $SD.setSettings(context, settings);
        }

        if (settings.actionType == undefined) {
            settings.micSettingsAction = "adjustGain";
            $SD.setSettings(context, settings);
        }

        if (settings.volValue == undefined) {
            settings.volValue = 1;
            $SD.setSettings(context, settings);
        }

        setMicSettings(jsn);
    } else {
        const radioButtons = [
            { value: ActionType.SetOutput, label: localization['actionSelection']['setOutputDevice']},
            { value: ActionType.ToggleOutput, label: localization['actionSelection']['toggleOutputDevice']},
            { value: ActionType.SetDeviceSettings, label: localization['actionSelection']['hardwareSettings']}
        ]

        hidePlaceholders();
        setRadioButtons(localization['actionSelection']['label'], radioButtons, 'placeholder_Top1', 'actionType');

        switch (settings.actionType) {
            case ActionType.SetOutput:
                setOutputSelection(jsn);
                break;
            case ActionType.ToggleOutput:
                toggleOutputSelection(jsn);
                break;
            case ActionType.SetDeviceSettings:
                setMicSettings(jsn);
                break;
            default:
                break;
        }
    }
}

const setOutputSelection = (jsn) => {
    const outputSelectionLocal = localization['setOutput'];
    const outputs = jsn?.payload?.outputs;

    //if (settings.primOutput == null) { settings.primOutput = outputs[0].value; $SD.setSettings(context, settings); }

    const setOutputSelection = '<div class="sdpi-wrapper" id="action-select-div"> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">' + outputSelectionLocal['label'] + '</div> \
                                    <select class="sdpi-item-value select" id="primary-select">'
                                        + outputs.map( output => {
                                            return "<option value='" + output.identifier + "'>" + cutText(output.name, 27) + "</option>"
                                        }); +
                                    '</select> \
                                </div> \
                            </div>';

    document.getElementById("placeholder_Bottom2").innerHTML = setOutputSelection;

    document.getElementById("primary-select").value = settings.primOutput;

    document.getElementById("primary-select").addEventListener("change", sliderChanged = (inEvent) => {
        settings.primOutput = inEvent.target.value;
        $SD.setSettings(context, settings);
    })
}

const toggleOutputSelection = (jsn) => {
    const outputSelectionLocal = localization['toggleOutput'];
    const outputs = jsn?.payload?.outputs;

    var setOutputSelection = '<div class="sdpi-wrapper" id="action-select-div"> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">' + outputSelectionLocal['labelPrimary'] + '</div> \
                                    <select class="sdpi-item-value select" id="primary-select">'
                                        + outputs.map( output => {
                                            if (output.identifier == settings.secOutput)
                                                return
                                            else
                                                return "<option value='" + output.identifier + "'>" + cutText(output.name, 27) + "</option>"
                                        });
    setOutputSelection +=           '</select> \
                                    </div> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">' + outputSelectionLocal['labelSecondary'] + '</div> \
                                    <select class="sdpi-item-value select" id="secondary-select">'
                                        + outputs.map( output => {
                                            if (output.identifier == settings.primOutput)
                                                return
                                            else
                                                return "<option value='" + output.identifier + "'>" + cutText(output.name, 27) + "</option>"
                                        });
    setOutputSelection +=           '</select> \
                                </div> \
                            </div>';

    document.getElementById("placeholder_Bottom2").innerHTML = setOutputSelection;

    document.getElementById("primary-select").value = settings.primOutput;
    document.getElementById("secondary-select").value = settings.secOutput;

    document.getElementById("primary-select").addEventListener("change", sliderChanged = (inEvent) => {
        settings.primOutput = inEvent.target.value;
        $SD.setSettings(context, settings);
        toggleOutputSelection();
    })

    document.getElementById("secondary-select").addEventListener("change", sliderChanged = (inEvent) => {
        settings.secOutput = inEvent.target.value;
        $SD.setSettings(context, settings);
        toggleOutputSelection();
    })

}

const setMicSettings = (jsn) => {
	const inputs = jsn?.payload?.inputs || [];
	var micIsAvailable = false;

	jsn?.payload?.microphones.forEach(mic => {
		micIsAvailable = micIsAvailable ? micIsAvailable : inputs.find(input => input.identifier == mic.identifier).isAvailable;
	});

    if (!micIsAvailable) {
        setNoMicrophoneConnected();
        return;
    }

    const micSettingsLocal = localization['micSettings'];

    var actionSelection;
    
    if (isEncoder) {
        actionSelection =   `<div class="sdpi-wrapper" id="action-select-div"> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">${micSettingsLocal['label']}</div> \
                                        <select class="sdpi-item-value select" id="action-select"> \
                                            <option value="none">${micSettingsLocal['none']}</option> \
                                            <option value="adjustGain">${micSettingsLocal['adjustGain']}</option> \
                                            <option value="adjustOutput">${micSettingsLocal['adjustOutput']}</option> \
                                            <option value="adjustMic/PcBalance">${micSettingsLocal['adjustMic/PcBalance']}</option> \
                                        </select> \
                                    </div> \
                                </div>`;
    } else {
        actionSelection =   `<div class="sdpi-wrapper" id="action-select-div"> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">${micSettingsLocal['label']}</div> \
                                        <select class="sdpi-item-value select" id="action-select"> \
                                            <option value="none">${micSettingsLocal['none']}</option> \
                                            <option value="adjustGain">${micSettingsLocal['adjustGain']}</option> \
                                            <option value="setGain">${micSettingsLocal['setGain']}</option> \
                                            <option value="adjustOutput">${micSettingsLocal['adjustOutput']}</option> \
                                            <option value="setOutput">${micSettingsLocal['setOutput']}</option> \
                                            <option value="adjustMic/PcBalance">${micSettingsLocal['adjustMic/PcBalance']}</option> \
                                            <option value="setMic/PcBalance">${micSettingsLocal['setMic/PcBalance']}</option> \
                                            <option value="setLowcut">${micSettingsLocal['setLowcut']}</option> \
                                            <option value="setClipguard">${micSettingsLocal['setClipguard']}</option> \
                                            <option value="toggleHardwareMute">${micSettingsLocal['toggleHardwareMute']}</option> \ 
                                            <option value="toggleGainLock">${micSettingsLocal['toggleGainLock']}</option> \
                                        </select> \
                                    </div> \
                                </div>`;
    }


    document.getElementById("placeholder_Top2").innerHTML = actionSelection;

    if (settings.micSettingsAction == undefined || settings.micSettingsAction == null) {
        settings.micSettingsAction = "none";
    }

    document.getElementById("action-select").value = settings.micSettingsAction;

    document.getElementById("action-select").addEventListener("change", sliderChanged = (inEvent) => {
        settings.micSettingsAction = inEvent.target.value;

        switch (settings.micSettingsAction) {
            case "adjustGain":
            case "adjustOutput":
                settings.volValue = 1;
                break;
            case "adjustMic/PcBalance":
                settings.volValue = isEncoder ? 1 : 5;
                break;
            case "setGain":
            case "setOutput":
            case "setMic/PcBalance":
                settings.volValue = 50;
                break;
            case 'toggleHardwareMute':
            default:
                break;
        }

        $SD.setSettings(context, settings);
    })

    switch (settings.micSettingsAction) {
        case "setGain":
        case "setOutput":
        case "setMic/PcBalance":
            setVolumeRange(jsn);
            break;
        case "adjustGain":
        case "adjustOutput":
        case "adjustMic/PcBalance":
            setVolumeSelection();
            setActionStyle();
            break;
        case 'toggleHardwareMute':
        default:
            break;
    }
}

const setMixerSelection = (isInput = false) => {
    if (settings.mixerID == undefined) {
        settings.mixerID = kPropertyMixerIDLocal;
        $SD.setSettings(context, settings);
    } else {
        switch (settings.actionType) {
            case ActionType.SetVolume:
                if (settings.mixerID == kPropertyMixerIDAll) {
                    settings.mixerID = kPropertyMixerIDLocal;
                    $SD.setSettings(context, settings);
                }
            case ActionType.AdjustVolume:
                if (settings.mixerID == kPropertyMixerIDAll && !isEncoder) {
                    settings.mixerID = kPropertyMixerIDLocal;
                    $SD.setSettings(context, settings);
                }
                break;
            default:
                break;
        }
    }

    const outputLocal = localization['outputSelection'];

    const allOption = isInput ? `<option value=${kPropertyMixerIDAll}>${outputLocal['all']}</option>` : ``;

    const mixerSelection = `<div class='sdpi-item'> \
                            <div class='sdpi-item-label'>${outputLocal['label']}</div> \
                                <select class='sdpi-item-value select' id='inputmixer-select'> \
                                    <option value=${kPropertyMixerIDLocal}>${outputLocal['local']}</option> \
                                    <option value=${kPropertyMixerIDStream}>${outputLocal['stream']}</option>` +
                                    allOption +
                                `</select> \
                            </div> \
                        </div>`;

    document.getElementById('placeholder_Middle1').innerHTML = mixerSelection;

    // Update old mixer id´s
    if (settings.inputMixer == 'local') {
        delete settings.inputMixer;
        settings.mixerID = kPropertyMixerIDLocal;
    } else if (settings.inputMixer == 'stream') {
        delete settings.inputMixer;
        settings.mixerID = kPropertyMixerIDStream;
    } else if (settings.inputMixer == 'all') {
        delete settings.inputMixer;
        settings.mixerID = kPropertyMixerIDAll;
    } 

    document.getElementById("inputmixer-select").value = settings.mixerID;

    document.getElementById("inputmixer-select").addEventListener("change", sliderChanged = (inEvent) => {
        settings.mixerID = inEvent.target.value;
        $SD.setSettings(context, settings);
    })
}

const setInputSelection = (jsn) => {
    
    const inputs = jsn?.payload?.inputs || [];
    const currentInput = inputs.find(input => input.identifier == settings.identifier);
    const mixerLocal = localization['mixerSelection'];

    const label = mixerLocal?.label;
    const selectOption = localization['micSettings']['none'];

    const firstOption = settings.identifier == undefined ? `<option value=-1>${selectOption}</option>` : '';

    if (!currentInput && settings.identifier != undefined) {
        inputs.push({
            'identifier': settings.identifier,
            'name': settings?.name ? settings.name + ' (Not available)' : 'Unknown input'
        });
    }

    const inputSelection = "<div class='mixer-sdpi-wrapper' id='mixer-select-div'> \
                            <div class='sdpi-item'> \
                                <div class='sdpi-item-label'>" + label + "</div> \
                                <select class='sdpi-item-value select' id='mixer-select'>"
                                    + firstOption
                                    + inputs.map( input => {
                                            return `<option value="${input.identifier}">${input.name}</option>`
                                        });
                                    +
                                "</select> \
                            </div> \
                        </div>";

    document.getElementById("placeholder_Top2").innerHTML = inputSelection;

    if (settings.identifier && !currentInput?.isAvailable) {
        document.getElementById("mixer-select").classList.add('disabled');
    }

    document.getElementById("mixer-select").value = settings.identifier || -1;

    document.getElementById("mixer-select").addEventListener("change", mixerChanged = (inEvent) => {                          
        settings.identifier = inEvent.target.value;
        settings.name = inputs.find(input => input.identifier == settings.identifier)?.name;
        $SD.setSettings(context, settings);
    })
}

const setVolumeSelection = () => {
    const volumeSelectionLocal = localization['volumeSelection'];

    var minRange, maxRange, sliderLabelMin = '', sliderLabelMax = '', unit;

    switch (settings.micSettingsAction) {
        case "adjustGain":
        case "adjustOutput":
            if (isEncoder) {
                minRange = 1;
                maxRange = 3;
            } else {
                minRange = -3;
                maxRange = 2;
            }
            unit = ' dB';
            break;
        default:
            if (isEncoder) {
                minRange = 1;
                maxRange = 5;
            } else {
                minRange = -25;
                maxRange = 24;
            }

            unit = ' %';
            break;
    }

    if (!isEncoder) {
        const labelMic = settings.micSettingsAction == "adjustMic/PcBalance" ? volumeSelectionLocal['mic'] : minRange;
        const labelPC = settings.micSettingsAction == "adjustMic/PcBalance" ? volumeSelectionLocal['pc'] : "+" + (maxRange + 1);

        sliderLabelMin = `<span class="clickable" value=${minRange}>${labelMic}</span>`;
        sliderLabelMax = `<span class="clickable" value=${maxRange}>${labelPC}</span>`;
    }

    const volumeAdjust =   `<div type="range" class="sdpi-item" id="volume-range"> \
                                <div class="sdpi-item-label">${volumeSelectionLocal['label']}</div> \
                                <div class="sdpi-item-value"> \
                                    ${sliderLabelMin} \
                                    <input class="floating-tooltip" data-suffix="${unit}" type="range" min="${minRange}" max="${maxRange}" id="vol-range"> \
                                    ${sliderLabelMax} \
                                </div> \
                            </div>`;

    document.getElementById("placeholder_Bottom1").innerHTML = volumeAdjust;

    const adjustSlider = document.querySelector('input[type=range]');
    const tooltip = document.querySelector('.sdpi-info-label');
    const tw = tooltip.getBoundingClientRect().width;

    document.getElementById("vol-range").value = isEncoder ? settings.volValue : settings.volValue < 0 ? settings.volValue : settings.volValue - 1;

    // If rangeslider changed, save the new VolumeValue
    document.getElementById("volume-range").addEventListener("change", volumeChanged = (inEvent) => {
        const targetValue = parseInt(inEvent.target.value);
        settings.volValue = isEncoder ? targetValue : targetValue < 0 ? targetValue : targetValue + 1;
        $SD.setSettings(context, settings);
    });

    tooltip.textContent = (isEncoder ? '+/- ' +  adjustSlider.value : adjustSlider.value < 0 ? adjustSlider.value : '+' + (parseInt(adjustSlider.value) + 1)) + unit;

    const fn = () => {
        const rangeRect = adjustSlider.getBoundingClientRect();
        const w = rangeRect.width - tw / 2;
        const percnt = (adjustSlider.value - adjustSlider.min) / (adjustSlider.max - adjustSlider.min);
        if (tooltip.classList.contains('hidden')) {
            tooltip.style.top = '-1000px';
        } else {
            tooltip.style.left = `${rangeRect.left + Math.round(w * percnt) - tw / 4}px`;
            tooltip.textContent = (isEncoder ? '+/- ' + adjustSlider.value : adjustSlider.value < 0 ? adjustSlider.value : '+' + (parseInt(adjustSlider.value) + 1)) + unit;
            tooltip.style.top = `${rangeRect.top - 30}px`;
        }
    }

    if (adjustSlider) {
        adjustSlider.addEventListener(
            'mouseenter',
            function() {
                tooltip.classList.remove('hidden');
                tooltip.classList.add('shown');
                fn();
            },
            false
        );

        adjustSlider.addEventListener(
            'mouseout',
            function() {
                tooltip.classList.remove('shown');
                tooltip.classList.add('hidden');
                fn();
            },
            false
        );

        adjustSlider.addEventListener('input', fn, false);
    }
}

const setVolumeRange = (jsn) => {
    const volumeRangeLocal = localization['volumeRange'];

    const { payload } = jsn;
    const { microphones } = payload;

    var lookupTableConverter;

    switch (settings.micSettingsAction) {
        case "setGain":
            lookupTableConverter = new LookupTableConverter(microphones[0]?.gainLookup);
            break;
        case "setOutput":
            lookupTableConverter = new LookupTableConverter(microphones[0]?.outputVolumeLookup);
            break;
        default:
            break;
    }

    const minRange = 0
    const maxRange = lookupTableConverter ? lookupTableConverter.length - 1 : 100;

    const label = settings.micSettingsAction == "setGain" ? volumeRangeLocal['setGain'] : settings.micSettingsAction == "setMicPC" ? volumeRangeLocal['setMic']: volumeRangeLocal['setVol'];
    const labelMic = settings.micSettingsAction == "setMic/PcBalance" ? volumeRangeLocal['mic'] : lookupTableConverter ? lookupTableConverter.getSecondValueFromIndex(minRange) : "0";
    const labelPC = settings.micSettingsAction == "setMic/PcBalance" ? volumeRangeLocal['pc'] : lookupTableConverter ? lookupTableConverter.getSecondValueFromIndex(maxRange) : "100";

    const volumeRange =   `<div type="range" class="sdpi-item" id="volume-range"> \
                            <div class="sdpi-item-label">${label}</div> \
                            <div class="sdpi-item-value"> \
                                <span class="clickable" value=${minRange}>${labelMic}</span> \
                                <input class="floating-tooltip" data-suffix="%" type="range" min=${minRange} max=${maxRange} id="vol-range"> \
                                <span class="clickable" value=${maxRange}>${labelPC}</span> \
                            </div> \
                        </div>`;

    document.getElementById("placeholder_Bottom1").innerHTML = volumeRange;

    const sliderRange = document.querySelector('input[type=range]');
    const tooltip = document.querySelector('.sdpi-info-label');
    const tw = tooltip.getBoundingClientRect().width;

    // Select the saved VolumeValue
    if (settings.volValue >= 0) { 
        document.getElementById("vol-range").value = settings.volValue;
    } else {
        settings.volValue = 0;
        $SD.setSettings(context, settings);
    }

    tooltip.textContent = lookupTableConverter ? lookupTableConverter.getSecondValueFromIndex(sliderRange.value) + ' dB' : settings.volValue + ' %';

    // If rangeslider changed, save the new VolumeValue
    document.getElementById("volume-range").addEventListener("change", volumeChanged = (inEvent) => 
    {
        settings.volValue = parseInt(inEvent.target.value);
        $SD.setSettings(context, settings);
    })

    const fn = () => {
        const rangeRect = sliderRange.getBoundingClientRect();
        const w = rangeRect.width - tw / 2;
        const percnt = (sliderRange.value - sliderRange.min) / (sliderRange.max - sliderRange.min);
        if (tooltip.classList.contains('hidden')) {
            tooltip.style.top = '-1000px';
        } else {
            tooltip.style.left = `${rangeRect.left + Math.round(w * percnt) - tw / 4}px`;
            tooltip.textContent = lookupTableConverter ? lookupTableConverter.getSecondValueFromIndex(sliderRange.value) + ' dB' : Math.round(100 * percnt) + ' %';
            tooltip.style.top = `${rangeRect.top - 30}px`;
        }
    };

    if (sliderRange) {
        sliderRange.addEventListener(
            'mouseenter',
            function() {
                tooltip.classList.remove('hidden');
                tooltip.classList.add('shown');
                fn();
            },
            false
        );

        sliderRange.addEventListener(
            'mouseout',
            function() {
                tooltip.classList.remove('shown');
                tooltip.classList.add('hidden');
                fn();
            },
            false
        );
        sliderRange.addEventListener('input', fn, false);
    }
}

const setFading = () => {
    const fadingLocal = localization['fadingSelection'];
    const unit = fadingLocal['unit'];

    var fadingSelection =   `<div class="sdpi-wrapper" id="volume-select-div"> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">${fadingLocal['label']}</div> \
                                    <select class="sdpi-item-value select" id="fading-select"> \
                                        <option value=0>${fadingLocal['off']}</option> \
                                        <option value=500>${fadingLocal['500ms']}${unit}</option> \
                                        <option value=1000>${fadingLocal['1000ms']}${unit}</option> \
                                        <option value=1500>${fadingLocal['1500ms']}${unit}</option> \
                                        <option value=2000>${fadingLocal['2000ms']}${unit}</option> \
                                        <option value=2500>${fadingLocal['2500ms']}${unit}</option> \
                                        <option value=3000>${fadingLocal['3000ms']}${unit}</option> \
                                    </select> \
                                </div> \
                            </div>`;
                            

    document.getElementById("placeholder_Middle2").innerHTML = fadingSelection;

    if (settings.fadingDelay == undefined || settings.fadingDelay == null) {
        settings.fadingDelay = 0;
    }

    document.getElementById("fading-select").value = settings.fadingDelay;

    document.getElementById("fading-select").addEventListener("change", sliderChanged = (inEvent) => {
        settings.fadingDelay = parseInt(inEvent.target.value);
        $SD.setSettings(context, settings);
    })
}

const setActionStyle = () => {
	const localSlider = localization['actionStyle'];
	const label = isEncoder ? 'Style' : localSlider['label'];

	var options = '';

	if (isEncoder) {
		options =	`<option value=0>Level meter + Volume slider</option>
					<option value=1>Level meter</option>
					<option value=2>Volume slider</option>`
	} else {
		options =	`<option value=0>${localSlider['static']}</option>
					<option value=1>${localSlider['sliderVertical']}</option>
					<option value=2>${localSlider['sliderHorizontal']}</option>
					<option value=3>${localSlider['sliderAndLevelmeterVertical']}</option>
					<option value=4>${localSlider['sliderAndLevelmeterHorizontal']}</option>`
	}

	if (settings.actionStyle == undefined) {
		settings.actionStyle = 0;
		$SD.setSettings(context, settings);
	}

    const sliderSelection = `<div class='mixer-sdpi-wrapper' id='slider-select-div'> \
                                <div class='sdpi-item'> \
                                    <div class='sdpi-item-label'>${label}</div> \
                                    <select class='sdpi-item-value select' id='slider-select'> \
                                        ${options}
                                    </select> \
                                </div> \
                            </div>`;

    document.getElementById("placeholder_Middle2").innerHTML = sliderSelection;

	if (isEncoder && settings.micSettingsAction == kPropertyAdjustMicPcBalance) {
		document.getElementById("slider-select").value = 2;
		document.getElementById("slider-select").disabled = true;
	} else {
		document.getElementById("slider-select").value = settings.actionStyle;
	}

    document.getElementById("slider-select").addEventListener("change", (inEvent) => {
    settings.actionStyle = parseInt(inEvent.target.value);
    $SD.setSettings(context, settings);
    });
}

const setFilterSelection = (jsn) => {
    const inputs        = jsn?.payload?.inputs;
    const filterList    = inputs.find(input => input.identifier == settings.identifier).filters;
    const filterLocal   = localization['filterSelection'];
    const label         = filterLocal['label'];
    const noFilter      = filterLocal['noFilterFound'];
    
    var filterSelection = "<div class='mixer-sdpi-wrapper' id='filter-select-div'> \
                            <div class='sdpi-item'> \
                                <div class='sdpi-item-label'>" + label + "</div> \
                                <select class='sdpi-item-value select' id='filter-select'>"

    if (filterList && filterList.length > 0) { 
        filterList.map( filter => {
            filterSelection += "<option value=" + filter.filterID + ">" + filter.name + "</option>"
        });
    } else 
        filterSelection +=  "<option value=0>" + noFilter + "</option>"

    filterSelection +=          "</select> \
                            </div> \
                        </div>";
                       
    document.getElementById("placeholder_Bottom1").innerHTML = filterSelection;
   
    if (filterList && filterList.length > 0) {
        const filter = filterList.find(filter => filter.filterID == settings.filterID);
        document.getElementById("filter-select").value = filter != undefined ? filter.filterID : 0;
    }

    document.getElementById("filter-select").addEventListener("change", filterChanged = (inEvent) => {
        settings.filterID = inEvent.target.value;
        $SD.setSettings(context, settings);
    })
}

const setIsColoredCheckBox = () => {
    if (platform == "mac") {
        return;
    } 

    const label      = localization['colored']['label'];

    const isColoredCheck = `<div type="checkbox" class="sdpi-item">
                                <div class="sdpi-item-label">${label}</div>
                                <div class="sdpi-item-value ">
                                    <input id="isColoredCheck" type="checkbox" value=1>
                                    <label for="isColoredCheck"><span></span></label>

                                </div>
                            </div>`

    document.getElementById("placeholder_Bottom2").innerHTML = isColoredCheck;

    document.getElementById("isColoredCheck").checked = settings.isColored;

    document.getElementById("isColoredCheck").addEventListener("click", () => {
        settings.isColored = !settings.isColored;
        $SD.setSettings(context, settings);
    });
}

const setProfileSelection = () => {
    const profileLocal = localization['switchProfile'];
    const label = profileLocal['label'];

    var profileSelection = `<div class='mixer-sdpi-wrapper' id='profile-select-div'> \
                                <div class='sdpi-item'> \
                                    <div class='sdpi-item-label'>${label}</div> \
                                    <select class='sdpi-item-value select' id='profile-select'> \
                                        <option value='WLMonitoring'>Monitoring</option> \
                                        <option value='WLStream'>Stream</option> \
                                        <option value='WLXLMonitoring'>XL Monitoring</option> \
                                        <option value='WLXLStream'>XL Stream</option> \
                                    </select> \
                                </div> \
                            </div>`;

    document.getElementById("placeholder_Top1").innerHTML = profileSelection;

    document.getElementById("profile-select").value = settings.activeProfile;

    document.getElementById("profile-select").addEventListener("change", profileChanged = (inEvent) => {
        settings.activeProfile = inEvent.target.value;
        $SD.setSettings(context, settings);
    });
}

const setRadioButtons = (label, radioButtons, position, settingsProperty, additionalOnChangeFunction) => {
    var selection =   "<div type='radio' class='sdpi-item' id='actionType-radio-div'> \
                                    <div class='sdpi-item-label'>" + label + "</div> \
                                    <div class='sdpi-item-value'>";
    
    radioButtons.forEach(rb => {
        selection +=      `<span class='sdpi-item-child'> \
                                        <input id='${rb.label}' type='radio' value=${rb.value}> \
                                        <label for='${rb.label}' class='sdpi-item-label'><span></span>${rb.label}</label> \ 
                                    </span>`
    });

    selection +=          "</div> \
                                </div>";

    document.getElementById(position).innerHTML = selection;

    radioButtons.forEach(rb => {
        const radioButton = document.getElementById(rb.label);

        radioButton.checked = settings[settingsProperty] == radioButton.value;

        radioButton.addEventListener("change", radioButtonChanged = (inEvent) => {   
            //console.log("radioButtonChanged", settings[settingsProperty], 'to', inEvent.target.value)
            settings[settingsProperty] = parseInt(inEvent.target.value);
            if (additionalOnChangeFunction != undefined)
                additionalOnChangeFunction();
            $SD.setSettings(context, settings);
        });
    })
}

const cutText = (text, maxlen = 27, suffix = '...') => {
    upperCaseCount = 0;

    text.split('').forEach(char => {
        if (char == char.toUpperCase()) {
            upperCaseCount++;
        }
    });

    const newLength = maxlen + 21 - upperCaseCount;
    
    return text ? (text && text.length > newLength ? text.slice(0, newLength - 1) + suffix : text) : '--';
};