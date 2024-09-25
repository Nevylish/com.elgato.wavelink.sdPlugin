// Increase after interface has been changed
const kJSONPropertyMinimumSupportedAPIVersion = '6';
const kJSONPropertyMaximumSupportedAPIVersion = '7';

// Request
// Common
const kJSONPropertyGetApplicationInfo       = 'getApplicationInfo';

// Microphone
const kJSONPropertyGetMicrophoneConfig      = 'getMicrophoneConfig';
const kJSONPropertySetMicrophoneConfig      = 'setMicrophoneConfig';

// Output
const kJSONPropertyGetSwitchState           = 'getSwitchState';
const kJSONPropertySwitchOutput             = "switchOutput";
const kJSONPropertyGetOutputConfig          = 'getOutputConfig';
const kJSONPropertySetOutputConfig          = 'setOutputConfig';
const kJSONPropertyGetOutputs               = 'getOutputs';
const kJSONPropertySetSelectedOutput        = 'setSelectedOutput';

// Input
const kJSONPropertyAddInput					= 'addInput';
const kJSONPropertyGetInputConfigs          = 'getInputConfigs';
const kJSONPropertySetInputConfig           = 'setInputConfig';
const kJSONPropertySetFilterBypass          = 'setFilterBypass';
const kJSONPropertySetFilter                = 'setFilter';

// Notifications
const kPropertyUpdatePI                     = 'updatePI';
const kPropertyOutputChanged                = 'outputChanged';

// Microphone
const kJSONPropertyMicrophoneConfigChanged  = "microphoneConfigChanged";
const kJSONPropertyMicrophoneLevelChanged	= "microphoneLevelChanged";

const kJSONKeyDeviceType					= "deviceType";
const kJSONPropertyGain                     = "gain";
const kJSONKeyIsGainLocked                  = "isGainLocked"
const kJSONPropertyOutputVolume             = "outputVolume";
const kJSONPropertyBalance                  = "balance";
const kJSONKeyLowCut                        = "isLowCutOn";
const kJSONKeyClipGuard                     = "isClipGuardOn";
const kJSONKeyLowCutType                    = "lowCutType";
const kJSONKeyIsMicrophoneMuted             = "isMicMuted";

// Output
const kJSONPropertyOutputSwitched           = "outputSwitched";
const kJSONPropertySelectedOutputChanged    = "selectedOutputChanged";
const kJSONPropertyOutputMuteChanged        = "outputMuteChanged";
const kJSONPropertyOutputVolumeChanged      = "outputVolumeChanged";
const kJSONPropertyOutputLevelChanged       = "outputLevelChanged";

// Input
const kJSONPropertyInputNameChanged         = "inputNameChanged";
const kJSONPropertyInputMuteChanged         = "inputMuteChanged";
const kJSONPropertyInputVolumeChanged       = "inputVolumeChanged";
const kJSONPropertyInputLevelChanged        = "inputLevelChanged";
const kJSONPropertyInputEnabled             = "inputEnabled";
const kJSONPropertyInputDisabled            = "inputDisabled";
const kJSONPropertyFilterBypassStateChanged = "filterBypassStateChanged";
const kJSONPropertyFilterChanged            = 'filterChanged';
const kJSONPropertyFilterAdded              = 'filterAdded';
const kJSONPropertyFilterRemoved            = 'filterRemoved';
const kJSONPropertyInputsChanged            = 'inputsChanged';
const kJSONPropertyProfileChanged           = "profileChanged";
const kJSONPropertyLevelmeterValuesChanged	= "realTimeChanges";

// Keys / Properties
// Common
const kJSONKeyInputs                        = 'inputs';
const kJSONKeyIdentifier                    = 'identifier';
const kJSONKeyName                          = 'name';
const kJSONKeyProperty                      = 'property';
const kJSONKeyValue                         = 'value';
const kJSONKeyLevelLeft                     = 'levelLeft';
const kJSONKeyLevelRight                    = 'levelRight';
const kJSONKeyBoolValue                     = 'boolValue';
const kJSONKeyIsAdjustVolume                = 'isAdjustVolume';
const kJSONKeyMixerID                       = 'mixerID';
const kJSONKeyLocalMixer                    = "localMixer";
const kJSONKeyStreamMixer                   = "streamMixer";
const kJSONKeyMixerList                     = "mixerList";
const kJSONKeyMicrophoneLevel               = "microphoneLevel";

const kPropertySuffixPlus                   = 'Plus';
const kPropertySuffixMinus                  = 'Minus';
const kPropertySuffixOn                     = 'On';
const kPropertySuffixOff                    = 'Off';
const kPropertySuffixMuted                  = 'Muted';

// Wave Link / Plugin
const kPropertyVolume                       = "Volume";
const kPropertyMute                         = "Mute";

const kPropertyOutputLevel	                = "Output Level";
const kPropertyOutputMute	                = "Output Mute";

const kPropertyMixerIDLocal                 = "com.elgato.mix.local";
const kPropertyMixerIDStream                = "com.elgato.mix.stream";
const kPropertyMixerIDAll                   = "com.elgato.mix.all";

const kJSONKeyForceLink                     = "forceLink";

// Application Info
const kJSONKeyAppID                         = 'appID';
const kJSONKeyAppName                       = 'appName';
const kJSONKeyInterfaceRevision             = 'interfaceRevision';

const kJSONPropertyAppID                    = 'egwl';
const kJSONPropertyAppName                  = 'Elgato Wave Link';

// Microphone
// Actions
const kPropertySetGain					    = "setGain";
const kPropertyAdjustGain					= "adjustGain";
const kPropertytoggleGainLock               = "toggleGainLock";
const kPropertySetOutput                    = "setOutput";
const kPropertyAdjustOutput                 = "adjustOutput"
const kPropertySetMicPcBalance              = "setMic/PcBalance";
const kPropertyAdjustMicPcBalance           = "adjustMic/PcBalance";
const kPropertyToggleLowcut                 = "setLowcut";
const kPropertyToggleClipguard              = "setClipguard";
const kPropertyToggleHardwareMute           = "toggleHardwareMute";

// WL Types
const kPropertyMicrophoneLowCut             = "Microphone LowCut";
const kPropertyMicrophoneClipGuard          = "Microphone ClipGuard";
const kPropertyMicrophoneLowCutType         = "XLR Low Cut Type";
const kPropertyMicrophoneGainLock           = "Microphone GainLock";
const kPropertyMicrophoneMute               = "Microphone Mute";
const kPropertyMicrophoneGain				= "Microphone Gain";
const kPropertyMicrophoneOutputVolume		= "Microphone Output Volume";
const kPropertyMicrophoneBalance            = "Microphone DirectMonitor Volume";

// Output
const kJSONKeySelectedOutput                = 'selectedOutput';
const kJSONKeyOutputs                       = 'outputs';

// Input
const kJSONKeyInputType                     = 'inputType';
const kJSONKeyIsWaveMicInput                = "isWaveMicInput";
const kJSONKeyIconData                      = 'iconData';
const kJSONKeyBgColor                       = 'bgColor';
const kJSONKeyIsAvailable                   = 'isAvailable';
const kJSONKeyFilters                       = 'filters';
const kJSONKeyFilterID                      = 'filterID';
const kJSONKeyFilterName                    = 'name';
const kJSONKeyFilterActive                  = 'isActive';
const kJSONKeyFilterPluginID                = 'pluginID';
const kJSONKeyFilterpluginFilePath          = 'pluginFilePath';

// Plugin
const kPropertyDefault                      = 'default';
const kPropertyWarning                      = 'warning';


const ActionType = {
	Mute:				0,
	SetVolume:			1,
	AdjustVolume:		2,
	SetEffect:			3,
	SetEffectChain:		4,
	SetDeviceSettings:	5,
	SetOutput:			6,
	ToggleOutput:		7,
	SwitchOutput:		8,
	AddInput:			9
}

const DeviceType = {
	Invalid:	-1,
	Wave1:		0,
	Wave3:		1,
	WaveXLR:	2,
	WaveNeo:	3
}