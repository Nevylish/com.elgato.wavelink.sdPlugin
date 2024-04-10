/**
 * @class AppClient
 * AppClient object containing all required code to establish
 * communication with our Apps (Wave Link, Camera Hub)
 */

class AppClient {
    static instance;

    minPort;
    maxPort;
    currentPort;
    websocket = null;

    isConnected = false;

    rpc = new simple_jsonrpc();

    maxConnectionTries = 100;
    connectionTryCounter = 0;
	isConnecting = false;

    debugMode = true;

    onEvent = EventEmitter.on;
	emitEvent = EventEmitter.emit;

    on = this.rpc.on;
    call = this.rpc.call;

    constructor(minPort) {
        if (AppClient.instance)
            return AppClient.instance;

        AppClient.instance = this;

        this.setPort(minPort);
    }
    
    setPort(minPort) {
        this.currentPort = minPort;
        this.minPort = minPort;
        this.maxPort = minPort + 9;
    }

    connect() {
        if (!this.currentPort || this.isConnected || this.isConnecting)
            return;

		this.tryToConnect();
	}

    tryToConnect() {
        logInfo(`AppClient: Connecting to port ${this.currentPort}`);

		this.isConnecting = true;

		setTimeout(() => this.reconnect(), 1000);

		if (this.websocket) {
			this.websocket.close();
			this.websocket = null;
		}

        this.websocket = new WebSocket('ws://127.0.0.1:' + this.currentPort);

        this.websocket.rpc = this.rpc;

        this.websocket.onopen = () => {
			logInfo(`AppClient: Connection opened.`);
            this.isConnected = true;
			this.isConnecting = false;
            this.emitEvent("webSocketIsOpen");
        }

        this.websocket.onclose = () =>  {
            logInfo(`AppClient: Connection closed.`);
            this.isConnected = false;
        }

        this.websocket.onerror = (evt) => {
            const error = `AppClient: Connection ERROR: ${SocketErrors[evt?.code]}`;
            console.warn(error);
            logError(error)
        }

        this.websocket.onmessage = (evt) => {
            if (!evt.data.includes('realTimeChanges')) {
                if (typeof evt.data === 'string') {
                    this.debug("Incoming Message", JSON.parse(evt.data));
                } else {
                    this.debug("Incoming Message", typeof evt.data, evt.data);
                }
            }
            this.rpc.messageHandler(evt.data);
        }
    }

    reconnect() {
        this.currentPort = this.currentPort < this.maxPort ? ++this.currentPort : this.minPort;

        if (this.connectionTryCounter < this.maxConnectionTries && this.websocket.readyState != 1) {
			logInfo(`AppClient: Reconnecting.`);
            this.connectionTryCounter++;
            this.tryToConnect();
        } else {
			this.isConnecting = false;
            this.connectionTryCounter = 0;
        }
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            this.emitEvent("webSocketIsClosed");
        }

		this.connectionTryCounter = 0;
    }

    initRPC() {
        this.rpc.toStream = (msg) => {
            try {
                this.debug("Sending: " + msg);
                this.websocket.send(msg);
            } catch (error) {
                this.debug("ERROR:", error);
            }
        };
    }

    onConnection(fn) {
        this.initRPC();
        this.onEvent("webSocketIsOpen", () => fn());
    }

    onDisconnection(fn) {
        this.onEvent("webSocketIsClosed", () => fn());
    }

    debug(...args) {
        if (debugMode) console.log(...args);
    }
}