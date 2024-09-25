class SwitchProfile extends WaveLinkAction {
    constructor(uuid) { 

        super(uuid);

        this.onKeyUp(async ({ payload, device }) => {
            const { settings } = payload;
            this.awl.switchProfile(settings.activeProfile, device);
        });
    }
};