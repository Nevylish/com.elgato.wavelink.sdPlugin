/// <reference path="../../libs/js/stream-deck.js" />
/// <reference path="../../plugin/js/WaveLinkConstants.js" />

$SD.onConnected(async (jsn) => { 
	await $SD.loadLocalization('../');

	context = jsn.actionInfo?.context;
	isEncoder = jsn.actionInfo?.payload?.controller === 'Encoder';
	platform = jsn?.appInfo?.application?.platform;
	settings = jsn.actionInfo?.payload?.settings;
	deviceType = jsn.appInfo?.devices?.find(device => device.id == jsn.actionInfo?.device)?.type;
	localization = $SD.localization['PI'];

    currentAPIVersion = 0;

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
    isConnected       = jsn?.payload?.isConnected ?? {};
    currentAPIVersion = jsn.payload.apiVersion;
    isOK              = false;

    if (!isConnected) {
        showErrorMessage('msgLaunchApp');
        hidePlaceholders();
    } else if (currentAPIVersion > kJSONPropertyMaximumSupportedAPIVersion) {
        showErrorMessage('msgUpdatePlugin');
        hidePlaceholders();
    } else if (currentAPIVersion < kJSONPropertyMinimumSupportedAPIVersion) {
        showErrorMessageWithLink('msgUpdateApp', 'msgUpdateAppLink');
        hidePlaceholders();
    } else {
        const msg = document.getElementById("msg");
        msg.classList.add('hidden');

        isOK = true;

        settings = jsn?.payload?.settings || settings;
    }

    return isOK;
}

const showErrorMessage = (message) => {
	const msg = document.getElementById("msg");
	msg.innerHTML = `<details class="message caution"><summary class="error" style="list-style:none">${localization[message]}</summary></details>`;
	msg.classList.remove('hidden');
}

const showErrorMessageWithLink = (message, linkMessage) => {
	const msg = document.getElementById("msg");
	msg.innerHTML = `<details class="message caution"><summary class="error" style="list-style:none">${localization[message]} <a target="_blank" style="font-size:10pt;font-weight: 600;min-height: 18px;" href="https://links.elgato.com/l/camera_hub_help_download_page">${localization[linkMessage]}.</a></summary></details>`;
	msg.classList.remove('hidden');

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

		setMixerSelection();
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
		setMixerSelection();
		setVolumeSelection();
		setActionStyle();
	} else {
		const radioButtons = [
			{ value: ActionType.SetVolume, label: localization['actionSelection']['set']},
			{ value: ActionType.AdjustVolume, label: localization['actionSelection']['adjust']},
			{ value: ActionType.Mute, label: localization['actionSelection']['mute']},
			{ value: ActionType.AddInput, label: 'Add'}//localization['actionSelection']['mute']}
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
                setMixerSelection();
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
            case ActionType.AddInput:
                if (isAPIVersionOlderAs(7)) {
                    showErrorMessageWithLink('msgUpdateAppForFeature', 'msgUpdateAppLink')
                    return;
                } if (platform == 'mac') {
                    showErrorMessage('msgPlatformNotSupported');
                    return;
                } else {
                    setInputSelection(jsn, true);
                    setIsColoredCheckBox();
                }
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

		const onChangeMixerID = () => {
            settings.primOutput = undefined;
            settings.secOutput = undefined;
		}

		hidePlaceholders();
		setRadioButtons(localization['actionSelection']['label'], radioButtons, 'placeholder_Top1', 'actionType', onChangeMixerID);

		switch (settings.actionType) {
			case ActionType.SetOutput:
			case ActionType.ToggleOutput:
				if (!isAPIVersionOlderAs(7))
                    setMixerSelection(true, onChangeMixerID);
				setOutputSelection(jsn);
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
    const outputSelectionLocal = localization['toggleOutput'];
    const outputs              = settings.mixerID == kPropertyMixerIDStream ? jsn?.payload?.outputs.stream : jsn?.payload?.outputs.local;
    const selectedOutput       = settings.mixerID == kPropertyMixerIDStream ? jsn?.payload?.outputs.selectedLocalOutput : jsn?.payload?.outputs.selectedStreamOutput;

    if (settings.primOutput == undefined) {
        outputs.forEach(output => {
            if (settings.primOutput == undefined && output.identifier != selectedOutput) {
                settings.primOutput = output.identifier;
            }

            if (settings.actionType == ActionType.ToggleOutput) {
                if (settings.secOutput == undefined && output.identifier != selectedOutput && settings.primOutput != output.identifier) {
                    settings.secOutput = output.identifier;
                }
            }
        });

        $SD.setSettings(context, settings);
    }

    const systemDefaultStream = outputs.find(output => output.identifier == 'PCM_IN_01_V_00_SD2');

    if (systemDefaultStream != undefined)
        systemDefaultStream.name = localization['outputSelection']['streamOut'];

    let setOutputSelection = '<div class="sdpi-wrapper" id="action-select-div"> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">' + outputSelectionLocal['labelPrimary'] + '</div> \
                                    <select class="sdpi-item-value select" id="primary-select">'
                                        + outputs.map(output => {
                                            return `<option ${(output.identifier == selectedOutput || output.identifier == settings.secOutput) ? ' selected disabled' : ''} value="${output.identifier}">${cutText(output.name, 27)}</option>`
                                        });

    if (settings.actionType == ActionType.ToggleOutput) {
        setOutputSelection +=       '</select> \
                                </div> \
                                <div class="sdpi-item"> \
                                    <div class="sdpi-item-label">' + outputSelectionLocal['labelSecondary'] + '</div> \
                                    <select class="sdpi-item-value select" id="secondary-select">'
                                        + outputs.map(output => {
                                            return `<option ${(output.identifier == selectedOutput || output.identifier == settings.primOutput) ? ' selected disabled' : ''} value="${output.identifier}">${cutText(output.name, 27)}</option>`
                                        });
    }

    setOutputSelection +=           '</select> \
                                </div> \
                            </div>';

	document.getElementById("placeholder_Bottom2").innerHTML = setOutputSelection;

	document.getElementById("primary-select").value = settings.primOutput;

    if (settings.actionType == ActionType.ToggleOutput) {
        document.getElementById("secondary-select").value = settings.secOutput;
    }

    if (settings.secOutput == selectedOutput)
		document.getElementById("secondary-select").classList.add('disabled');

	document.getElementById("primary-select").addEventListener("change", sliderChanged = (inEvent) => {
		settings.primOutput = inEvent.target.value;
		$SD.setSettings(context, settings);
	});

    if (settings.actionType == ActionType.ToggleOutput) {
        document.getElementById("secondary-select").addEventListener("change", sliderChanged = (inEvent) => {
            settings.secOutput = inEvent.target.value;
            $SD.setSettings(context, settings);
        });
    }
}

const setMicSettings = (jsn) => {
    const { microphones } = jsn.payload;
    const { inputs }      = jsn.payload;
    const inputGroup      = inputs?.find(inputGroup => inputGroup.isWaveMicInput);

    let deviceType = -1;
    let micIsAvailableTemp = false;

    if (isAPIVersionOlderAs(7)) {
        microphones.forEach(mic => {
            micIsAvailableTemp = inputs.find(input => input.identifier == mic.identifier)?.isAvailable || false;
            deviceType = mic.deviceType;
        });
    }

    const micIsAvailable = inputGroup?.isAvailable || micIsAvailableTemp;

    microphones.forEach(micConfig => {
        if (micConfig.identifier == inputGroup?.inputs[0]?.identifier)
            deviceType = micConfig.deviceType;
    });

	if (!micIsAvailable) {
		showErrorMessage('msgNoMicrophoneConnected');
		return;
	}

	const micSettingsLocal = localization['micSettings'];

	var actionSelection;
	var isSupportedByDevice = deviceType != DeviceType.WaveNeo;
	var isSettingSupported = true;

	if (deviceType == DeviceType.WaveNeo) {
		switch (settings.micSettingsAction) {
			case 'setMic/PcBalance':
			case 'adjustMic/PcBalance':
			case 'setLowcut':
			case 'setClipguard':
				isSettingSupported = false;
				break;
			default:
				break;
		}
	}

	if (isEncoder) {
		actionSelection =	`<div class="sdpi-wrapper" id="action-select-div"> \
								<div class="sdpi-item"> \
									<div class="sdpi-item-label">${micSettingsLocal['label']}</div> \
										<select class="sdpi-item-value select" id="action-select"> \
											<option value="none">${micSettingsLocal['none']}</option> \
											<option value="adjustGain">${micSettingsLocal['adjustGain']}</option> \
											<option value="adjustOutput">${micSettingsLocal['adjustOutput']}</option> \
											${isSupportedByDevice ? `<option value="adjustMic/PcBalance">${micSettingsLocal['adjustMic/PcBalance']}</option>` : ''} \
											${isSettingSupported ? '' : `<option value="${settings.micSettingsAction}">${micSettingsLocal[settings.micSettingsAction]}</option>`}
										</select> \
									</div> \
								</div>`;
	} else {
		actionSelection =	`<div class="sdpi-wrapper" id="action-select-div"> \
								<div class="sdpi-item"> \
									<div class="sdpi-item-label">${micSettingsLocal['label']}</div> \
									<select class="sdpi-item-value select" id="action-select"> \
										<option value="none">${micSettingsLocal['none']}</option> \
										<option value="adjustGain">${micSettingsLocal['adjustGain']}</option> \
										<option value="setGain">${micSettingsLocal['setGain']}</option> \
										<option value="adjustOutput">${micSettingsLocal['adjustOutput']}</option> \
										<option value="setOutput">${micSettingsLocal['setOutput']}</option> \
										${isSupportedByDevice ? `<option value="adjustMic/PcBalance">${micSettingsLocal['adjustMic/PcBalance']}</option>` : ''} \
										${isSupportedByDevice ? `<option value="setMic/PcBalance">${micSettingsLocal['setMic/PcBalance']}</option>` : ''} \
										${isSupportedByDevice ? `<option value="setLowcut">${micSettingsLocal['setLowcut']}</option>` : ''} \
										${isSupportedByDevice ? `<option value="setClipguard">${micSettingsLocal['setClipguard']}</option>` : ''} \
										<option value="toggleHardwareMute">${micSettingsLocal['toggleHardwareMute']}</option> \ 
										<option value="toggleGainLock">${micSettingsLocal['toggleGainLock']}</option> \ 
										${isSettingSupported ? '' : `<option value="${settings.micSettingsAction}">${micSettingsLocal[settings.micSettingsAction]}</option>`} \
									</select> \
								</div> \
							</div>`;
	}

	document.getElementById("placeholder_Top2").innerHTML = actionSelection;

	if (!isSettingSupported)
		document.getElementById("action-select").classList.add('disabled');

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
		case "setMic/PcBalance":
			if (deviceType == DeviceType.WaveNeo) {
				showErrorMessage('msgDeviceNotSupported');
				return;
			}
		case "setGain":
		case "setOutput":
			setVolumeRange(jsn);
			break;
		case "adjustMic/PcBalance":
			if (deviceType == DeviceType.WaveNeo) {
				showErrorMessage('msgDeviceNotSupported');
				return;
			}
		case "adjustGain":
		case "adjustOutput":
			setVolumeSelection();
			setActionStyle();
			break;
		case 'toggleHardwareMute':
		default:
			break;
	}
}

const setMixerSelection = (disableAllOption = false, additionalOnChangeFunction = undefined) => {
	if (settings.mixerID == undefined) {
		settings.mixerID = kPropertyMixerIDLocal;
		$SD.setSettings(context, settings);
	}

	const outputLocal = localization['outputSelection'];

	const mixerSelection = `<div class='sdpi-item'> \
							<div class='sdpi-item-label'>${outputLocal['label']}</div> \
								<select class='sdpi-item-value select' id='inputmixer-select'> \
									<option value=${kPropertyMixerIDLocal}>${outputLocal['local']}</option> \
									<option value=${kPropertyMixerIDStream}>${outputLocal['stream']}</option> \
									${disableAllOption ? `` : `<option value=${kPropertyMixerIDAll}>${outputLocal['all']}</option>`}  \
								</select> \
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

        if (additionalOnChangeFunction != undefined)
            additionalOnChangeFunction();

		$SD.setSettings(context, settings);
	})
}

const setInputSelection = (jsn, excludeHardwareInputs = false) => {
	const inputs = jsn?.payload?.inputs || [];
	const currentInput = getInput(inputs, settings.identifier);

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

	var excludedIdentifier = [];

	if (excludeHardwareInputs) {
		inputs.forEach(groupInput => {
			groupInput.inputs?.forEach(input => {
				if (input.inputType == 1 || input.inputType == 4)
					excludedIdentifier.push(groupInput.identifier);
			});
		});
	}

	const inputSelection = "<div class='mixer-sdpi-wrapper' id='mixer-select-div'> \
							<div class='sdpi-item'> \
								<div class='sdpi-item-label'>" + label + "</div> \
								<select class='sdpi-item-value select' id='mixer-select'>"
									+ firstOption
                                    // For Add Input we want to filter out all input groups with an hardware or physical input
									+ inputs.filter(input => excludedIdentifier.find(exInput => exInput == input.identifier) == undefined).map( input => {
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

	document.getElementById("mixer-select").value = settings.identifier != undefined ? settings.identifier != currentInput?.identifier ? currentInput?.identifier : settings.identifier : -1;

	document.getElementById("mixer-select").addEventListener("change", mixerChanged = (inEvent) => {
		settings.identifier = inEvent.target.value;
		settings.name = getInput(inputs, settings.identifier)?.name;
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
	const label = isEncoder ? localSlider['labelEncoder'] : localSlider['label'];

	var options = '';
	var overrideUserSettings = false;

	if (isEncoder) {
		options =	`<option value=0>${localSlider['sliderAndLevelmeterEncoder']}</option>
					<option value=1>${localSlider['levelMeterEncoder']}</option>
					<option value=2>${localSlider['sliderEncoder']}</option>`
	} else if (settings.mixerID != kPropertyMixerIDAll) {
		if (settings.micSettingsAction == kPropertyAdjustMicPcBalance) {
			options =	`<option value=0>${localSlider['static']}</option>
						<option value=1>${localSlider['sliderVertical']}</option>
						<option value=2>${localSlider['sliderHorizontal']}</option>`
			overrideUserSettings = settings.actionStyle > 2;
		} else {
			options =	`<option value=0>${localSlider['static']}</option>
						<option value=1>${localSlider['sliderVertical']}</option>
						<option value=2>${localSlider['sliderHorizontal']}</option>
						<option value=3>${localSlider['sliderAndLevelmeterVertical']}</option>
						<option value=4>${localSlider['sliderAndLevelmeterHorizontal']}</option>`
		}
	} else {
		options =	`<option value=0>${localSlider['static']}</option>`
		overrideUserSettings = true;
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

	if (settings.actionStyle == undefined || (overrideUserSettings && settings.actionStyle > 0)) {
		settings.actionStyle = 0;
		$SD.setSettings(context, settings);
	}

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
	const filterList    = getInput(inputs, settings.identifier)?.filters;
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

const isAPIVersionOlderAs = (apiVersion) => {
    return currentAPIVersion < apiVersion;
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

const getInput = (inputs, identifier) => {
	var input = inputs.find(input => input.identifier == identifier);

	if (input == undefined) {
		inputs.every(groupInput => {
			if (groupInput.inputs?.find(oldIdentifier => oldIdentifier.identifier == identifier) != undefined)
				input = groupInput;
			
			return input == undefined;
		});
	}

	return input;
}