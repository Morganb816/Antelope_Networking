/**
 * Client Network Value
 *  - A living value that at any point if the server decides was incorrect will re adjust to be correct with the last received correct network value.
 * @property {number}   local         - local value of this variable.
 * @property {number}   remote        - remote value of this variable.
 * @property {any}      ws            - Socket.io client instance.
 * @property {string}   messageID     - a unique identifier for this value (used for networking).
 * @property {number}   lerpTime      - amount of time to lerp back to correct value.
 * @property {number}   lerpAmount    - amount to move while lerping.
 * @property {number}   lerpAccuracy  - lower bound of threshold preventing value from lerping (Just ignores any difference smaller than this).
 * @property {number}   lerpThreshold - higher bound of threshold that will imediately set local value to remote if they become to far apart.
 * @property {function} cancelLerp    - function that cancels any lerp interval running currently.
 * @property {object}   steps         - object containing a list of unvalidated steps the client has taken.
 * @property {number}   currentID     - number representing a unique id for the next message we will send to the server.
 */
class ClientNetworkValue {
    /**
     * Create a Client Network Value
     * @param {number} initialValue  - initial value that should be set.
     * @param {string} id            - a unique identifier for this value (used for networking).
     * @param {any}    ws            - Socket.io client instance.
     * @param {number} lerpTime      - amount of time to lerp back to correct value.
     * @param {number} lerpAmount    - amount to move while lerping.
     * @param {number} lerpAccuracy  - lower bound of threshold preventing value from lerping (Just ignores any difference smaller than this).
     * @param {number} lerpThreshold - higher bound of threshold that will imediately set local value to remote if they become to far apart.
     */
    constructor(initialValue, id, ws, lerpTime = 0, lerpAmount = 0, lerpAccuracy = 1, lerpThreshold = 5) {
        this.local = initialValue;
        this.remote = initialValue;

        this.messageID = `value-${id}`;
        this.ws = ws;

        this.lerpTime = lerpTime;
        this.lerpAmount = lerpAmount;
        this.lerpAccuracy = lerpAccuracy;
        this.lerpThreshold = lerpThreshold;
        this.cancelLerp = null;
        this.steps = {};
        this.currentID = 1;
        ws.on(this.messageID, data => this.handleMessage(data));
    }
    /**
     * Get
     * @returns {number} local value of this variable
     */
    get() {
        return this.local;
    }

    /**
     * Resets the variables value and steps. Mostly used when the server found a incorrect value sent.
     * @param {*} value - Value to reset this variable to. defaults to 0.
     */
    reset(value = 0) {
        this.steps = {};
        this.local = value;
        this.remote = value;
    }

    /**
     * Get Remote
     * @returns {number} local value of this variable
     */
    getRemote() {
        return this.remote;
    }
    
    /**
     * Set - sets a new value to this variable and emits a message telling the server to update as well.
     * @param {number} value - new value for this variable.
     */
    set(value, other) {
        this.local = value;
        this.steps[this.currentID] = value;
        this.ws.emit(this.messageID, {step: this.currentID, value: value, other: other});
        this.currentID ++;
    }
    
    /**
     * Handle Message - Runs when the client receives a validation response from the server about a given step.
     * If the response is valid then nothing happens. if the response is not valid we restore this variable to
     * he value responded by the server and forget any updates after that point.
     * @param {object} step - object containing a step number and value relayed from the server
     */
    handleMessage({step, value}) {
        if (this.steps[step]) {
            if (this.steps[step] === value) {
                delete this.steps[step];
                this.remote = value;
            } else {
                this.reset(value);
            };
        }
    };
};

module.exports = {
    ClientNetworkValue
}